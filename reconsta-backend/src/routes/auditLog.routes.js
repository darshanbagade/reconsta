import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import {
    getAuditLogs,
    getExceptionAuditLogs
} from '../controllers/auditLog.controller.js'

const auditLogRouter = Router()

// admin/supervisor only, because it shows full system activity
auditLogRouter.get(
    '/',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getAuditLogs
)

// logged-in users can see history of a specific exception detail page
auditLogRouter.get(
    '/exception/:exceptionId',
    verifyJWT,
    getExceptionAuditLogs
)

export default auditLogRouter