import Exception from '../models/Exception.model.js'
import ApiError from '../utils/ApiError.js'
import { emitSlaUpdated } from './realtime.service.js'

const ACTIVE_EXCEPTION_STATUSES = ['open', 'escalated']
const AT_RISK_WINDOW_HOURS = 2
const AT_RISK_WINDOW_MS = AT_RISK_WINDOW_HOURS * 60 * 60 * 1000

const calculateSlaStatus = (slaDeadline) => {
    if (!slaDeadline) {
        throw new ApiError(400, 'SLA deadline is missing')
    }

    const now = new Date()
    const deadline = new Date(slaDeadline)

    if (Number.isNaN(deadline.getTime())) {
        throw new ApiError(400, 'Invalid SLA deadline')
    }

    const remainingTimeMs = deadline.getTime() - now.getTime()

    if (remainingTimeMs <= 0) {
        return 'breached'
    }

    const atRiskTime = new Date(deadline.getTime() - AT_RISK_WINDOW_MS)

    if (now >= atRiskTime) {
        return 'at_risk'
    }

    return 'on_track'
}

const updateExceptionSlaStatuses = async () => {
    const exceptions = await Exception.find({
        status: {
            $in: ACTIVE_EXCEPTION_STATUSES
        }
    })
        .select('_id slaDeadline slaStatus')
        .lean()

    let checked = 0
    let updated = 0

    for (const exception of exceptions) {
        checked++

        const calculatedSlaStatus = calculateSlaStatus(exception.slaDeadline)

        if (calculatedSlaStatus !== exception.slaStatus) {
            const updatedException = await Exception.findByIdAndUpdate(
                exception._id,
                {
                    slaStatus: calculatedSlaStatus
                },
                {
                    returnDocument: 'after',
                    runValidators: true
                }
            )
                .populate('anomalyId')
                .populate('assignedTo', 'name email role')
                .populate('escalatedTo', 'name email role')

            if (updatedException) {
                emitSlaUpdated({
                    exception: updatedException
                })
            }

            updated++
        }
    }

    return {
        checked,
        updated
    }
}

const runSlaCheck = updateExceptionSlaStatuses

export {
    updateExceptionSlaStatuses,
    runSlaCheck,
    calculateSlaStatus
}