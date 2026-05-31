import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import {
    getUsers,
    getUserById,
    updateUserRole,
    updateUserStatus
} from '../controllers/user.controller.js'

const userRouter = Router()

userRouter.get(
    '/',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getUsers
)

userRouter.get(
    '/:id',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getUserById
)

userRouter.patch(
    '/:id/status',
    verifyJWT,
    authorizeRoles('admin'),
    updateUserStatus
)

userRouter.patch(
    '/:id/role',
    verifyJWT,
    authorizeRoles('admin'),
    updateUserRole
)

export default userRouter