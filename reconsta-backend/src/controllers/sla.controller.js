import { updateExceptionSlaStatuses } from '../services/sla.service.js'
import sendSuccess from '../utils/responseFormatter.js'

const runSlaCheck = async (req, res, next) => {
    try {
        const result = await updateExceptionSlaStatuses()

        return sendSuccess(res, 200, 'SLA check completed successfully', {
            result
        })
    } catch (error) {
        next(error)
    }
}

export {
    runSlaCheck
}