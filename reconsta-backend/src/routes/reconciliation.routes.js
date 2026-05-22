import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import { runReconciliationController } from '../controllers/reconciliation.controller.js'

const reconciliationRouter = Router()
reconciliationRouter.post(
    '/run',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    runReconciliationController
)

export default reconciliationRouter