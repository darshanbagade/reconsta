import ApiError from '../utils/ApiError.js'
import sendSuccess from '../utils/responseFormatter.js'
import Exception from '../models/Exception.model.js'
import User from '../models/User.model.js'
import Anomaly from '../models/Anomaly.model.js'
import mongoose from 'mongoose'

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

const assignException = async (req, res, next) => {
    try {
        const { id } = req.params
        const { assignedTo } = req.body || {}

        if (!assignedTo) {
            throw new ApiError(400, 'Assigned user is required')
        }

        const existingException = await Exception.findById(id)

        if (!existingException) {
            throw new ApiError(404, 'Exception not found')
        }

        if (existingException.status === 'resolved') {
            throw new ApiError(400, 'Resolved exception cannot be reassigned')
        }

        const analyst = await User.findById(assignedTo)

        if (!analyst || analyst.role !== 'analyst') {
            throw new ApiError(400, 'Assigned user must be a valid analyst')
        }

        if (!analyst.isActive) {
            throw new ApiError(400, 'Assigned analyst account is inactive')
        }

        const exception = await Exception.findByIdAndUpdate(
            id,
            {
                assignedTo,
                status: 'open'
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        )
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        return sendSuccess(res, 200, 'Exception assigned successfully', {
            exception
        })
    } catch (error) {
        next(error)
    }
}

const resolveException = async (req, res, next) => {
    const mongoSession = await mongoose.startSession()

    try {
        const { id } = req.params
        const { resolution } = req.body || {}

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

            resolvedExceptionId = updatedException._id
        })

        const exception = await Exception.findById(resolvedExceptionId)
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        return sendSuccess(res, 200, 'Exception resolved successfully', {
            exception
        })
    } catch (error) {
        next(error)
    } finally {
        await mongoSession.endSession()
    }
}

const escalateException = async (req, res, next) => {
    try {
        const { id } = req.params
        const { escalatedTo, slaStatus = 'breached' } = req.body || {}

        if (!escalatedTo) {
            throw new ApiError(400, 'Escalated user is required')
        }

        const allowedSlaStatuses = ['on_track', 'at_risk', 'breached']

        if (!allowedSlaStatuses.includes(slaStatus)) {
            throw new ApiError(400, 'Invalid SLA status')
        }

        const escalationUser = await User.findById(escalatedTo)

        if (
            !escalationUser ||
            !['admin', 'supervisor'].includes(escalationUser.role)
        ) {
            throw new ApiError(400, 'Escalated user must be a valid admin or supervisor')
        }

        if (!escalationUser.isActive) {
            throw new ApiError(400, 'Escalated user account is inactive')
        }

        const existingException = await Exception.findById(id)

        if (!existingException) {
            throw new ApiError(404, 'Exception not found')
        }

        if (existingException.status !== 'open') {
            throw new ApiError(400, 'Only open exceptions can be escalated')
        }

        const exception = await Exception.findByIdAndUpdate(
            id,
            {
                escalatedTo,
                status: 'escalated',
                slaStatus
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        )
            .populate('anomalyId')
            .populate('assignedTo', 'name email role')
            .populate('escalatedTo', 'name email role')

        return sendSuccess(res, 200, 'Exception escalated successfully', {
            exception
        })
    } catch (error) {
        next(error)
    }
}

export {
    getExceptions,
    getExceptionById,
    assignException,
    resolveException,
    escalateException
}