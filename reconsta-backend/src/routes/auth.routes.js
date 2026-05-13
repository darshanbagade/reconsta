import {Router} from 'express'
import { register, login, getMe, logout, refreshAccessToken } from '../controllers/auth.controller.js';
import verifyJWT from '../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register',verifyJWT, register)
authRouter.post('/login',login)
authRouter.get('/me', verifyJWT, getMe)
authRouter.post('/logout',verifyJWT, logout)
authRouter.post('/refresh-token', refreshAccessToken)

export default authRouter