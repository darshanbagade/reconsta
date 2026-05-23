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
        const sessionEmitSuccess = emitToSession(
            sessionId,
            SOCKET_EVENTS.RECONCILIATION_COMPLETED,
            {
                sessionId,
                result
            }
        )

        const dashboardEmitSuccess = emitToOperationsDashboard(
            SOCKET_EVENTS.DASHBOARD_UPDATED,
            {
                sessionId,
                reason: 'reconciliation_completed',
                result
            }
        )

        // Socket failure should not fail the API, but we log it for debugging
        if (!sessionEmitSuccess) {
            console.warn(`Socket emit failed: ${SOCKET_EVENTS.RECONCILIATION_COMPLETED}`)
        }

        if (!dashboardEmitSuccess) {
            console.warn(`Socket emit failed: ${SOCKET_EVENTS.DASHBOARD_UPDATED}`)
        }

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