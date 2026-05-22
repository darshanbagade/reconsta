import Transaction from '../models/Transaction.model.js'
import Anomaly from '../models/Anomaly.model.js'
import Exception from '../models/Exception.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'

const ACTIVE_EXCEPTION_STATUSES = ['open', 'escalated']

const formatGroupCounts = (items) => {
    return items.reduce((acc, item) => {
        const key = item._id || 'unknown'
        acc[key] = item.count
        return acc
    }, {})
}

// Used to filter exceptions of a specific reconciliation session
const getSessionExceptionFilter = async (sessionId) => {
    if (!sessionId) {
        return {}
    }

    const anomalyIds = await Anomaly.distinct('_id', { sessionId })

    return {
        anomalyId: {
            $in: anomalyIds
        }
    }
}

// Used for current SLA health only.
// Resolved exceptions are not counted in active SLA state.
const getActiveExceptionFilter = (exceptionFilter = {}) => {
    return {
        ...exceptionFilter,
        status: {
            $in: ACTIVE_EXCEPTION_STATUSES
        }
    }
}

// Dashboard summary cards
const getDashboardOverview = async (req, res, next) => {
    try {
        const { sessionId } = req.query

        const transactionFilter = sessionId ? { sessionId } : {}
        const anomalyFilter = sessionId ? { sessionId } : {}
        const exceptionFilter = await getSessionExceptionFilter(sessionId)
        const activeExceptionFilter = getActiveExceptionFilter(exceptionFilter)

        const [
            totalTransactions,
            matchedTransactions,
            fuzzyTransactions,
            unmatchedTransactions,
            unprocessedTransactions,

            totalAnomalies,
            openAnomalies,
            highRiskAnomalies,

            totalExceptions,
            openExceptions,
            escalatedExceptions,
            resolvedExceptions,
            breachedExceptions,
            atRiskExceptions
        ] = await Promise.all([
            Transaction.countDocuments(transactionFilter),
            Transaction.countDocuments({ ...transactionFilter, status: 'matched' }),
            Transaction.countDocuments({ ...transactionFilter, status: 'fuzzy' }),
            Transaction.countDocuments({ ...transactionFilter, status: 'unmatched' }),
            Transaction.countDocuments({ ...transactionFilter, status: 'unprocessed' }),

            Anomaly.countDocuments(anomalyFilter),
            Anomaly.countDocuments({ ...anomalyFilter, status: 'open' }),
            Anomaly.countDocuments({ ...anomalyFilter, riskScore: { $gte: 70 } }),

            Exception.countDocuments(exceptionFilter),
            Exception.countDocuments({ ...exceptionFilter, status: 'open' }),
            Exception.countDocuments({ ...exceptionFilter, status: 'escalated' }),
            Exception.countDocuments({ ...exceptionFilter, status: 'resolved' }),

            // Active SLA issues only
            Exception.countDocuments({
                ...activeExceptionFilter,
                slaStatus: 'breached'
            }),
            Exception.countDocuments({
                ...activeExceptionFilter,
                slaStatus: 'at_risk'
            })
        ])

        return sendSuccess(res, 200, 'Dashboard overview fetched successfully', {
            sessionId: sessionId || 'all',
            transactions: {
                total: totalTransactions,
                matched: matchedTransactions,
                fuzzy: fuzzyTransactions,
                unmatched: unmatchedTransactions,
                unprocessed: unprocessedTransactions
            },
            anomalies: {
                total: totalAnomalies,
                open: openAnomalies,
                highRisk: highRiskAnomalies
            },
            exceptions: {
                total: totalExceptions,
                open: openExceptions,
                escalated: escalatedExceptions,
                resolved: resolvedExceptions,
                breached: breachedExceptions,
                atRisk: atRiskExceptions
            }
        })
    } catch (error) {
        next(error)
    }
}

// Dashboard charts and grouped metrics
const getDashboardMetrics = async (req, res, next) => {
    try {
        const { sessionId } = req.query

        const transactionFilter = sessionId ? { sessionId } : {}
        const anomalyFilter = sessionId ? { sessionId } : {}
        const exceptionFilter = await getSessionExceptionFilter(sessionId)

        const [
            transactionsByStatus,
            transactionsBySource,
            anomaliesByType,
            anomaliesByStatus,
            exceptionsByStatus,
            exceptionsBySlaStatus,
            exceptionsByPriority
        ] = await Promise.all([
            Transaction.aggregate([
                { $match: transactionFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Transaction.aggregate([
                { $match: transactionFilter },
                { $group: { _id: '$source', count: { $sum: 1 } } }
            ]),

            Anomaly.aggregate([
                { $match: anomalyFilter },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),

            Anomaly.aggregate([
                { $match: anomalyFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Exception.aggregate([
                { $match: exceptionFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Exception.aggregate([
                { $match: exceptionFilter },
                { $group: { _id: '$slaStatus', count: { $sum: 1 } } }
            ]),

            Exception.aggregate([
                { $match: exceptionFilter },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ])
        ])

        return sendSuccess(res, 200, 'Dashboard metrics fetched successfully', {
            sessionId: sessionId || 'all',
            transactionsByStatus: formatGroupCounts(transactionsByStatus),
            transactionsBySource: formatGroupCounts(transactionsBySource),
            anomaliesByType: formatGroupCounts(anomaliesByType),
            anomaliesByStatus: formatGroupCounts(anomaliesByStatus),
            exceptionsByStatus: formatGroupCounts(exceptionsByStatus),
            exceptionsBySlaStatus: formatGroupCounts(exceptionsBySlaStatus),
            exceptionsByPriority: formatGroupCounts(exceptionsByPriority)
        })
    } catch (error) {
        next(error)
    }
}

// Risk distribution and top risky anomalies
const getRiskDashboard = async (req, res, next) => {
    try {
        const { sessionId } = req.query

        const anomalyFilter = sessionId ? { sessionId } : {}

        const [
            criticalRisk,
            highRisk,
            mediumRisk,
            lowRisk,
            topRiskAnomalies
        ] = await Promise.all([
            Anomaly.countDocuments({
                ...anomalyFilter,
                riskScore: { $gte: 90 }
            }),

            Anomaly.countDocuments({
                ...anomalyFilter,
                riskScore: { $gte: 70, $lt: 90 }
            }),

            Anomaly.countDocuments({
                ...anomalyFilter,
                riskScore: { $gte: 40, $lt: 70 }
            }),

            Anomaly.countDocuments({
                ...anomalyFilter,
                riskScore: { $lt: 40 }
            }),

            Anomaly.find(anomalyFilter)
                .populate('bankTxnId')
                .populate('posTxnId')
                .sort({ riskScore: -1, detectedAt: -1 })
                .limit(5)
        ])

        return sendSuccess(res, 200, 'Risk dashboard fetched successfully', {
            sessionId: sessionId || 'all',
            riskBuckets: {
                critical: criticalRisk,
                high: highRisk,
                medium: mediumRisk,
                low: lowRisk
            },
            topRiskAnomalies
        })
    } catch (error) {
        next(error)
    }
}

// Recent anomalies and exceptions activity feed
const getRecentDashboardActivity = async (req, res, next) => {
    try {
        const {
            sessionId,
            limit = 10
        } = req.query

        const limitNumber = Number(limit)

        if (
            !Number.isFinite(limitNumber) ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 50
        ) {
            throw new ApiError(400, 'Limit must be a positive integer between 1 and 50')
        }

        const anomalyFilter = sessionId ? { sessionId } : {}
        const exceptionFilter = await getSessionExceptionFilter(sessionId)

        const [recentAnomalies, recentExceptions] = await Promise.all([
            Anomaly.find(anomalyFilter)
                .populate('bankTxnId')
                .populate('posTxnId')
                .sort({ createdAt: -1 })
                .limit(limitNumber),

            Exception.find(exceptionFilter)
                .populate({
                    path: 'anomalyId',
                    populate: [
                        { path: 'bankTxnId' },
                        { path: 'posTxnId' }
                    ]
                })
                .populate('assignedTo', 'name email role')
                .populate('escalatedTo', 'name email role')
                .sort({ createdAt: -1 })
                .limit(limitNumber)
        ])

        return sendSuccess(res, 200, 'Recent dashboard activity fetched successfully', {
            sessionId: sessionId || 'all',
            recentAnomalies,
            recentExceptions
        })
    } catch (error) {
        next(error)
    }
}

// SLA summary with breached and at-risk exception lists
const getSlaDashboard = async (req, res, next) => {
    try {
        const { sessionId } = req.query

        const exceptionFilter = await getSessionExceptionFilter(sessionId)
        const activeExceptionFilter = getActiveExceptionFilter(exceptionFilter)

        const [
            onTrack,
            atRisk,
            breached,
            escalated,
            breachedExceptions,
            atRiskExceptions
        ] = await Promise.all([
            Exception.countDocuments({
                ...activeExceptionFilter,
                slaStatus: 'on_track'
            }),
            Exception.countDocuments({
                ...activeExceptionFilter,
                slaStatus: 'at_risk'
            }),
            Exception.countDocuments({
                ...activeExceptionFilter,
                slaStatus: 'breached'
            }),
            Exception.countDocuments({
                ...exceptionFilter,
                status: 'escalated'
            }),

            Exception.find({
                ...activeExceptionFilter,
                slaStatus: 'breached'
            })
                .populate({
                    path: 'anomalyId',
                    populate: [
                        { path: 'bankTxnId' },
                        { path: 'posTxnId' }
                    ]
                })
                .populate('assignedTo', 'name email role')
                .populate('escalatedTo', 'name email role')
                .sort({ slaDeadline: 1 })
                .limit(10),

            Exception.find({
                ...activeExceptionFilter,
                slaStatus: 'at_risk'
            })
                .populate({
                    path: 'anomalyId',
                    populate: [
                        { path: 'bankTxnId' },
                        { path: 'posTxnId' }
                    ]
                })
                .populate('assignedTo', 'name email role')
                .populate('escalatedTo', 'name email role')
                .sort({ slaDeadline: 1 })
                .limit(10)
        ])

        return sendSuccess(res, 200, 'SLA dashboard fetched successfully', {
            sessionId: sessionId || 'all',
            summary: {
                onTrack,
                atRisk,
                breached,
                escalated
            },
            breachedExceptions,
            atRiskExceptions
        })
    } catch (error) {
        next(error)
    }
}

export {
    getDashboardOverview,
    getDashboardMetrics,
    getRiskDashboard,
    getRecentDashboardActivity,
    getSlaDashboard
}