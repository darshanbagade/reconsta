import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import { runSlaCheck } from '../controllers/sla.controller.js'

const slaRouter = Router()

slaRouter.post(
    '/run',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    runSlaCheck
)

export default slaRouter