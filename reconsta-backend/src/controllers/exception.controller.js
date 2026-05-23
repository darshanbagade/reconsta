import ApiError from '../utils/ApiError.js'
import sendSuccess from '../utils/responseFormatter.js'
import Exception from '../models/Exception.model.js'
import User from '../models/User.model.js'
import Anomaly from '../models/Anomaly.model.js'
import mongoose from 'mongoose'
import AuditLog from '../models/AuditLog.model.js'
import {
    emitExceptionAssigned,
    emitExceptionResolved,
    emitExceptionEscalated
} from '../services/realtime.service.js'

const getExceptions = async (req, res, next) => {
    try {
        const {
            assignedTo,
            status,
            slaStatus,
            priority,
            page = 1,
            limit = 20
        } = req.query

        const filter = {}

        if (status) filter.status = status
        if (slaStatus) filter.slaStatus = slaStatus
        if (priority) filter.priority = priority

        // Analyst should see only their assigned exceptions
        if (req.user.role === 'analyst') {
            filter.assignedTo = req.user._id
        } else if (assignedTo) {
            // Admin/Supervisor can filter by any analyst
            filter.assignedTo = assignedTo
        }

        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        if (
            !Number.isFinite(pageNumber) ||
            !Number.isFinite(limitNumber) ||
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(limitNumber) ||
            pageNumber < 1 ||
            limitNumber < 1
        ) {
            throw new ApiError(400, 'Page and limit must be valid positive integers')
        }

        const skip = (pageNumber - 1) * limitNumber

        const exceptions = await Exception.find(filter)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')
            .sort({ slaDeadline: 1, createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)

        const totalExceptions = await Exception.countDocuments(filter)

        return sendSuccess(res, 200, 'Exceptions fetched successfully', {
            exceptions,
            pagination: {
                totalExceptions,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalExceptions / limitNumber),
                limit: limitNumber
            }
        })
    } catch (error) {
        next(error)
    }
}

const getExceptionById = async (req, res, next) => {
    try {
        const { id } = req.params

        const exception = await Exception.findById(id)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        if (!exception) {
            throw new ApiError(404, 'Exception not found')
        }

        return sendSuccess(res, 200, 'Exception fetched successfully', {
            exception
        })
    } catch (error) {
        next(error)
    }
}

// Exception assignment can be done by Admin + Supervisor
const assignException = async (req, res, next) => {
    const mongoSession = await mongoose.startSession()

    try {
        const { id } = req.params
        const { assignedTo } = req.body || {}

        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, 'Invalid exception id')
        }

        if (!assignedTo || !mongoose.isValidObjectId(assignedTo)) {
            throw new ApiError(400, 'Valid assigned user is required')
        }

        let assignedExceptionId

        await mongoSession.withTransaction(async () => {
            const existingException = await Exception.findById(id).session(mongoSession)

            if (!existingException) {
                throw new ApiError(404, 'Exception not found')
            }

            if (existingException.status !== 'open') {
                throw new ApiError(400, 'Only open exceptions can be assigned')
            }

            const analyst = await User.findById(assignedTo).session(mongoSession)

            if (!analyst || analyst.role !== 'analyst') {
                throw new ApiError(400, 'Assigned user must be a valid analyst')
            }

            if (!analyst.isActive) {
                throw new ApiError(400, 'Assigned analyst account is inactive')
            }

            const updatedException = await Exception.findByIdAndUpdate(
                id,
                {
                    assignedTo,
                    status: 'open'
                },
                {
                    returnDocument: 'after',
                    runValidators: true,
                    session: mongoSession
                }
            )

            if (!updatedException) {
                throw new ApiError(404, 'Exception not found')
            }

            await createExceptionAuditLog({
                exceptionId: updatedException._id,
                performedBy: req.user._id,
                action: 'assigned',
                previousValue: {
                    assignedTo: existingException.assignedTo,
                    status: existingException.status
                },
                newValue: {
                    assignedTo: updatedException.assignedTo,
                    status: updatedException.status
                },
                session: mongoSession
            })

            assignedExceptionId = updatedException._id
        })

        const populatedException = await Exception.findById(assignedExceptionId)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        emitExceptionAssigned({
            exception: populatedException
        })

        return sendSuccess(res, 200, 'Exception assigned successfully', {
            exception: populatedException
        })
    } catch (error) {
        next(error)
    } finally {
        await mongoSession.endSession()
    }
}

// Resolve exception will be done by Assigned Analyst + Admin/Supervisor
const resolveException = async (req, res, next) => {
    const mongoSession = await mongoose.startSession()

    try {
        const { id } = req.params
        const { resolution } = req.body || {}

        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, 'Invalid exception id')
        }

        if (!resolution || resolution.trim() === '') {
            throw new ApiError(400, 'Resolution note is required')
        }

        let resolvedExceptionId

        await mongoSession.withTransaction(async () => {
            const existingException = await Exception.findById(id).session(mongoSession)

            if (!existingException) {
                throw new ApiError(404, 'Exception not found')
            }

            if (!existingException.anomalyId) {
                throw new ApiError(400, 'Exception is not linked to any anomaly')
            }

            if (existingException.status === 'resolved') {
                throw new ApiError(400, 'Exception is already resolved')
            }

            if (
                req.user.role === 'analyst' &&
                String(existingException.assignedTo) !== String(req.user._id)
            ) {
                throw new ApiError(403, 'You can resolve only your assigned exceptions')
            }

            const updatedException = await Exception.findByIdAndUpdate(
                id,
                {
                    status: 'resolved',
                    resolution: resolution.trim(),
                    resolvedAt: new Date()
                },
                {
                    returnDocument: 'after',
                    runValidators: true,
                    session: mongoSession
                }
            )

            if (!updatedException) {
                throw new ApiError(404, 'Exception not found')
            }

            const hasOtherActiveExceptions = await Exception.exists({
                anomalyId: existingException.anomalyId,
                _id: { $ne: existingException._id },
                status: { $in: ['open', 'escalated'] }
            }).session(mongoSession)

            if (!hasOtherActiveExceptions) {
                const updatedAnomaly = await Anomaly.findByIdAndUpdate(
                    existingException.anomalyId,
                    { status: 'resolved' },
                    {
                        returnDocument: 'after',
                        runValidators: true,
                        session: mongoSession
                    }
                )

                if (!updatedAnomaly) {
                    throw new ApiError(404, 'Linked anomaly not found')
                }
            }

            await createExceptionAuditLog({
                exceptionId: updatedException._id,
                performedBy: req.user._id,
                action: 'resolved',
                previousValue: {
                    status: existingException.status,
                    resolution: existingException.resolution,
                    resolvedAt: existingException.resolvedAt
                },
                newValue: {
                    status: updatedException.status,
                    resolution: updatedException.resolution,
                    resolvedAt: updatedException.resolvedAt
                },
                session: mongoSession
            })

            resolvedExceptionId = updatedException._id
        })

        const populatedException = await Exception.findById(resolvedExceptionId)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        emitExceptionResolved({
            exception: populatedException
        })

        return sendSuccess(res, 200, 'Exception resolved successfully', {
            exception: populatedException
        })
    } catch (error) {
        next(error)
    } finally {
        await mongoSession.endSession()
    }
}

// Exception escalation can be done by Admin + Supervisor
const escalateException = async (req, res, next) => {
    const mongoSession = await mongoose.startSession()

    try {
        const { id } = req.params
        const { escalatedTo, slaStatus } = req.body || {}

        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, 'Invalid exception id')
        }

        if (!escalatedTo || !mongoose.isValidObjectId(escalatedTo)) {
            throw new ApiError(400, 'Valid escalated user is required')
        }

        const allowedSlaStatuses = ['on_track', 'at_risk', 'breached']

        if (slaStatus && !allowedSlaStatuses.includes(slaStatus)) {
            throw new ApiError(400, 'Invalid SLA status')
        }

        let updatedExceptionId

        await mongoSession.withTransaction(async () => {
            const escalationUser = await User.findById(escalatedTo).session(mongoSession)

            if (
                !escalationUser ||
                !['admin', 'supervisor'].includes(escalationUser.role)
            ) {
                throw new ApiError(400, 'Escalated user must be a valid admin or supervisor')
            }

            if (!escalationUser.isActive) {
                throw new ApiError(400, 'Escalated user account is inactive')
            }

            const existingException = await Exception.findById(id).session(mongoSession)

            if (!existingException) {
                throw new ApiError(404, 'Exception not found')
            }

            if (existingException.status !== 'open') {
                throw new ApiError(400, 'Only open exceptions can be escalated')
            }

            const finalSlaStatus =
                slaStatus || (new Date() > existingException.slaDeadline ? 'breached' : 'at_risk')

            const updatedException = await Exception.findByIdAndUpdate(
                id,
                {
                    escalatedTo,
                    status: 'escalated',
                    slaStatus: finalSlaStatus
                },
                {
                    returnDocument: 'after',
                    runValidators: true,
                    session: mongoSession
                }
            )

            if (!updatedException) {
                throw new ApiError(404, 'Exception not found')
            }

            await createExceptionAuditLog({
                exceptionId: updatedException._id,
                performedBy: req.user._id,
                action: 'escalated',
                previousValue: {
                    status: existingException.status,
                    slaStatus: existingException.slaStatus,
                    escalatedTo: existingException.escalatedTo
                },
                newValue: {
                    status: updatedException.status,
                    slaStatus: updatedException.slaStatus,
                    escalatedTo: updatedException.escalatedTo
                },
                session: mongoSession
            })

            updatedExceptionId = updatedException._id
        })

        const populatedException = await Exception.findById(updatedExceptionId)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        emitExceptionEscalated({
            exception: populatedException
        })

        return sendSuccess(res, 200, 'Exception escalated successfully', {
            exception: populatedException
        })
    } catch (error) {
        next(error)
    } finally {
        await mongoSession.endSession()
    }
}


// Audit log helper function
// session is a MongoDB transaction object.
// It ensures related updates and audit logs are saved together
// or rolled back if any error occurs.
const createExceptionAuditLog = async ({
    exceptionId,
    performedBy,
    action,
    previousValue = {},
    newValue = {},
    session = null
}) => {
    const auditPayload = {
        exceptionId,
        performedBy,
        action,
        previousValue,
        newValue
    }

    if (session) {
        const [auditLog] = await AuditLog.create([auditPayload], { session })
        return auditLog
    }

    return AuditLog.create(auditPayload)
}

export {
    getExceptions,
    getExceptionById,
    assignException,
    resolveException,
    escalateException
}