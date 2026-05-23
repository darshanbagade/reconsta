import mongoose from 'mongoose'
import Anomaly from '../models/Anomaly.model.js'
import Exception from '../models/Exception.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'
import { generateAnomalyInsight } from '../services/gemini.service.js'

const canAccessAnomalyInsight = async ({ user, anomalyId }) => {
    if (!user) {
        return false
    }

    // Admin and supervisor can view all anomaly insights
    if (['admin', 'supervisor'].includes(user.role)) {
        return true
    }

    // Analyst can view only assigned exception's anomaly insight
    if (user.role !== 'analyst') {
        return false
    }

    const assignedException = await Exception.exists({
        anomalyId,
        assignedTo: user._id
    })

    return Boolean(assignedException)
}

const getAnomalyAiInsight = async (req, res, next) => {
    try {
        const { anomalyId } = req.params

        if (!mongoose.isValidObjectId(anomalyId)) {
            throw new ApiError(400, 'Invalid anomaly id')
        }

        const anomaly = await Anomaly.findById(anomalyId)
            .populate('bankTxnId')
            .populate('posTxnId')

        if (!anomaly) {
            throw new ApiError(404, 'Anomaly not found')
        }

        const hasAccess = await canAccessAnomalyInsight({
            user: req.user,
            anomalyId: anomaly._id
        })

        if (!hasAccess) {
            throw new ApiError(403, 'You are not allowed to access AI insight for this anomaly')
        }

        const exception = await Exception.findOne({
            anomalyId: anomaly._id
        })
            .populate('assignedTo', 'role')
            .populate('escalatedTo', 'role')

        const aiResult = await generateAnomalyInsight({
            anomaly,
            bankTransaction: anomaly.bankTxnId,
            posTransaction: anomaly.posTxnId,
            exception
        })

        return sendSuccess(res, 200, 'AI anomaly insight generated successfully', {
            anomalyId: anomaly._id,
            sessionId: anomaly.sessionId,
            type: anomaly.type,
            riskScore: anomaly.riskScore,
            ...aiResult
        })
    } catch (error) {
        next(error)
    }
}

export {
    getAnomalyAiInsight
}