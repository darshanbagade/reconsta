import Exception from '../models/Exception.model.js'
import ApiError from '../utils/ApiError.js'

const AT_RISK_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const calculateSlaStatus = (slaDeadline) => {
    if (!slaDeadline) {
        throw new ApiError(400, 'SLA deadline is missing')
    }

    const now = new Date()
    const deadline = new Date(slaDeadline)

    if (Number.isNaN(deadline.getTime())) {
        throw new ApiError(400, 'Invalid SLA deadline')
    }

    if (now > deadline) {
        return 'breached'
    }

    const atRiskTime = new Date(deadline.getTime() - AT_RISK_WINDOW_MS)

    if (now >= atRiskTime) {
        return 'at_risk'
    }

    return 'on_track'
}

const updateExceptionSlaStatuses = async () => {
    const activeExceptions = await Exception.find({
        status: {
            $in: ['open', 'escalated']
        }
    }).select('slaDeadline slaStatus status')

    let updatedCount = 0

    for (const exception of activeExceptions) {
        const newSlaStatus = calculateSlaStatus(exception.slaDeadline)

        if (exception.slaStatus !== newSlaStatus) {
            await Exception.findByIdAndUpdate(
                exception._id,
                {
                    slaStatus: newSlaStatus
                },
                {
                    runValidators: true
                }
            )

            updatedCount++
        }
    }

    return {
        checked: activeExceptions.length,
        updated: updatedCount
    }
}

export {
    calculateSlaStatus,
    updateExceptionSlaStatuses
}