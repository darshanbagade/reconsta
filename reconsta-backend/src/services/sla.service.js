import Exception from '../models/Exception.model.js'
import ApiError from '../utils/ApiError.js'
import { emitSlaUpdated } from './realtime.service.js'

const ACTIVE_EXCEPTION_STATUSES = ['open', 'escalated']

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
    const remainingHours = remainingTimeMs / (1000 * 60 * 60)

    if (remainingTimeMs <= 0) {
        return 'breached'
    }

    if (remainingHours <= 2) {
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

    let checked = 0
    let updated = 0

    for (const exception of exceptions) {
        checked++

        const calculatedSlaStatus = calculateSlaStatus(exception.slaDeadline)

        // Update and emit event only when SLA status actually changes
        if (calculatedSlaStatus !== exception.slaStatus) {
            exception.slaStatus = calculatedSlaStatus
            await exception.save()

            const populatedException = await Exception.findById(exception._id)
                .populate('anomalyId')
                .populate('assignedTo', 'name email role')
                .populate('escalatedTo', 'name email role')

            emitSlaUpdated({
                exception: populatedException
            })

            updated++
        }
    }

    return {
        checked,
        updated
    }
}

// Alias for future readability if we want to call it runSlaCheck
const runSlaCheck = updateExceptionSlaStatuses

export {
    updateExceptionSlaStatuses,
    runSlaCheck,
    calculateSlaStatus
}