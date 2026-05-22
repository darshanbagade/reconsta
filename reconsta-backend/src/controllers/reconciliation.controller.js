import { runReconciliation } from '../services/reconciliation.service.js'
import sendSuccess from '../utils/responseFormatter.js'
import {
    SOCKET_EVENTS,
    emitToSession,
    emitToOperationsDashboard
} from '../socket/socket.js'

const runReconciliationController = async (req, res, next) => {
    try {
        const { sessionId } = req.body || {}

        const result = await runReconciliation(sessionId)

        // Emit only after reconciliation service completes successfully
        emitToSession(
            sessionId,
            SOCKET_EVENTS.RECONCILIATION_COMPLETED,
            {
                sessionId,
                result
            }
        )

        emitToOperationsDashboard(
            SOCKET_EVENTS.DASHBOARD_UPDATED,
            {
                sessionId,
                reason: 'reconciliation_completed',
                result
            }
        )

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