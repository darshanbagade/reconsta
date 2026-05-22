import mongoose from 'mongoose'
import Anomaly from '../models/Anomaly.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'

// API to show anomalies in dashboard
const getAnomalies = async (req, res, next) => {
    try {
        const {
            status,
            type,
            sessionId,
            page = 1,
            limit = 20
        } = req.query

        const filter = {}

        if (status) filter.status = status
        if (type) filter.type = type
        if (sessionId) filter.sessionId = sessionId

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

        const anomalies = await Anomaly.find(filter)
            .populate('bankTxnId')
            .populate('posTxnId')
            .sort({ riskScore: -1, detectedAt: -1 })
            .skip(skip)
            .limit(limitNumber)

        const totalAnomalies = await Anomaly.countDocuments(filter)

        return sendSuccess(res, 200, 'Anomalies fetched successfully', {
            anomalies,
            pagination: {
                totalAnomalies,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalAnomalies / limitNumber),
                limit: limitNumber
            }
        })
    } catch (error) {
        next(error)
    }
}

const getAnomalyById = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, 'Invalid anomaly id')
        }

        const anomaly = await Anomaly.findById(id)
            .populate('bankTxnId')
            .populate('posTxnId')

        if (!anomaly) {
            throw new ApiError(404, 'Anomaly not found')
        }

        return sendSuccess(res, 200, 'Anomaly fetched successfully', {
            anomaly
        })
    } catch (error) {
        next(error)
    }
}

const updateAnomalyStatus = async (req, res, next) => {
    try {
        const { id } = req.params
        const { status } = req.body || {}

        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, 'Invalid anomaly id')
        }

        const allowedStatuses = ['open', 'in_review', 'resolved']

        if (!status || !allowedStatuses.includes(status)) {
            throw new ApiError(400, 'Invalid anomaly status')
        }

        const anomaly = await Anomaly.findById(id)

        if (!anomaly) {
            throw new ApiError(404, 'Anomaly not found')
        }

        anomaly.status = status
        await anomaly.save()

        return sendSuccess(res, 200, 'Anomaly status updated successfully', {
            anomaly
        })
    } catch (error) {
        next(error)
    }
}

export {
    getAnomalies,
    getAnomalyById,
    updateAnomalyStatus
}