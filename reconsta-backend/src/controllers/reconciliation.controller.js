import { runReconciliation } from '../services/reconciliation.service.js'
import sendSuccess from '../utils/responseFormatter.js'

const runReconciliationController = async (req, res, next) => {


    try {
        const { sessionId } = req.body || {}

        const result = await runReconciliation(sessionId)

        return sendSuccess(res, 200, 'Reconciliation completed successfully', {
            result
        })
    } catch (error) {
        next(error)
    }
}

export {
    runReconciliationController
}