import { Router } from 'express'
import {
    register,
    login,
    getMe,
    logout,
    refreshAccessToken
} from '../controllers/auth.controller.js'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'

const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/refresh-token', refreshAccessToken)

authRouter.get('/me', verifyJWT, getMe)
authRouter.post('/logout', verifyJWT, logout)
authRouter.post('/register', verifyJWT, authorizeRoles('admin'), register)

export default authRouter