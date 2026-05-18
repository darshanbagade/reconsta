import {Router} from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import{
    getExceptions,
    getExceptionById,
    assignException,
    resolveException,
    escalateException
} from '../controllers/exception.controller.js'
import authorizeRoles from '../middleware/role.middleware.js'

const exceptionRouter = Router()

exceptionRouter.get('/', verifyJWT, getExceptions)

exceptionRouter.patch(
    '/:id/assign',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    assignException
)

exceptionRouter.patch(
    '/:id/resolve',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'analyst'),
    resolveException
)

exceptionRouter.patch(
    '/:id/escalate',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    escalateException
)

exceptionRouter.get('/:id', verifyJWT, getExceptionById)

export default exceptionRouter;