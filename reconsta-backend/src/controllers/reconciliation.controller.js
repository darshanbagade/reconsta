import { runReconciliation } from '../services/reconciliation.service.js'
import sendSuccess from '../utils/responseFormatter.js'
import {
    SOCKET_EVENTS,
    emitToSession
} from '../socket/socket.js'
import { emitDashboardUpdate } from '../services/realtime.service.js'

const runReconciliationController = async (req, res, next) => {
    try {
        const { sessionId } = req.body || {}

        const result = await runReconciliation(sessionId)

        // Notify users watching this specific reconciliation session
        const sessionEmitSuccess = emitToSession(
            sessionId,
            SOCKET_EVENTS.RECONCILIATION_COMPLETED,
            {
                sessionId,
                result
            }
        )

        // Notify admin/supervisor dashboard that data has changed
        emitDashboardUpdate({
            sessionId,
            reason: 'reconciliation_completed',
            entityType: 'reconciliation',
            entityId: sessionId
        })

        // Socket failure should not break API response
        if (!sessionEmitSuccess) {
            console.warn(`Socket emit failed: ${SOCKET_EVENTS.RECONCILIATION_COMPLETED}`)
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