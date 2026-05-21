import AuditLog from '../models/AuditLog.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'
import mongoose from 'mongoose'
import Exception from '../models/Exception.model.js'

// all audit logs with filters + pagination
const getAuditLogs = async (req, res, next) => {
    try {
        const {
            action,
            performedBy,
            exceptionId,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query
        
        const filter = {}

        if (performedBy) {
            if (!mongoose.isValidObjectId(performedBy)) {
                throw new ApiError(400, 'Invalid performedBy id')
            }

            filter.performedBy = performedBy
        }

        if (exceptionId) {
            if (!mongoose.isValidObjectId(exceptionId)) {
                throw new ApiError(400, 'Invalid exceptionId')
            }

            filter.exceptionId = exceptionId
        }


        if (action) {
            const allowedActions = ['assigned', 'resolved', 'escalated', 'note_added']

            if (!allowedActions.includes(action)) {
                throw new ApiError(400, 'Invalid audit log action')
            }

            filter.action = action
        }

        if (performedBy) {
            filter.performedBy = performedBy
        }

        if (exceptionId) {
            filter.exceptionId = exceptionId
        }

        if (startDate || endDate) {
            filter.timestamp = {}

            if (startDate) {
                const parsedStartDate = new Date(startDate)

                if (Number.isNaN(parsedStartDate.getTime())) {
                    throw new ApiError(400, 'Invalid startDate')
                }

                filter.timestamp.$gte = parsedStartDate
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate)

                if (Number.isNaN(parsedEndDate.getTime())) {
                    throw new ApiError(400, 'Invalid endDate')
                }

                filter.timestamp.$lte = parsedEndDate
            }
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

        const logs = await AuditLog.find(filter)
            .populate('performedBy', 'name email role')
            .populate('exceptionId')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNumber)

        const totalLogs = await AuditLog.countDocuments(filter)

        return sendSuccess(res, 200, 'Audit logs fetched successfully', {
            logs,
            pagination: {
                totalLogs,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalLogs / limitNumber),
                limit: limitNumber
            }
        })
    } catch (error) {
        next(error)
    }
}


// audit log history of specific exception, latest log first
const getExceptionAuditLogs = async (req, res, next) => {
    try {
        const { exceptionId } = req.params

        if (!mongoose.isValidObjectId(exceptionId)) {
            throw new ApiError(400, 'Invalid exceptionId')
        }

        const exception = await Exception.findById(exceptionId)

        if (!exception) {
            throw new ApiError(404, 'Exception not found')
        }

        // 2nd condition is to restrict the analyst to see others history
        if (
            req.user.role === 'analyst' &&
            String(exception.assignedTo) !== String(req.user._id)
        ) {
            throw new ApiError(403, 'You can view audit history only for your assigned exceptions')
        }

        const logs = await AuditLog.find({ exceptionId })
            .populate('performedBy', 'name email role')
            .sort({ timestamp: -1 })

        return sendSuccess(res, 200, 'Exception audit logs fetched successfully', {
            logs
        })
    } catch (error) {
        next(error)
    }
}

export {
    getAuditLogs,
    getExceptionAuditLogs
}