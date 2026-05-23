import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import { runReconciliationController } from '../controllers/reconciliation.controller.js'

const reconciliationRouter = Router()

// Run reconciliation and emit real-time dashboard updates after success
reconciliationRouter.post(
    '/run',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    runReconciliationController
)

export default reconciliationRouter