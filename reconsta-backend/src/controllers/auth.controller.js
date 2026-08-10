import User from '../models/User.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'
import bcrypt from 'bcryptjs'
import { env } from './../config/env.js'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

const register = async (req, res, next) => {
    try {

        const { name, email, password, role } = req.body
        
        const allowedRoles = ['admin', 'supervisor', 'analyst']

        if (role && !allowedRoles.includes(role)) {
            throw new ApiError(400, 'Invalid user role')
        }


        const missingFields = [name, email, password].some(
            (field) => typeof field !== 'string' || field.trim() === ''
        )

        if (missingFields) {
            throw new ApiError(400, 'All fields are required')
        }

        const existedUser = await User.findOne({ email })

        if (existedUser) {
            throw new ApiError(409, 'User with this email already exists')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        })

        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }

        return sendSuccess(res, 201, 'User registered successfully', {
            user: safeUser
        })
    } catch (error) {
        next(error)
    }
}

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        env.JWT_ACCESS_SECRET,
        {
            expiresIn : env.JWT_ACCESS_EXPIRE || '15m'
        }
        
    )
}

const generateRefreshToken = (user) => {
        return jwt.sign(
        {
            id: user._id
        },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn : env.JWT_REFRESH_EXPIRE  || '1d'
        }
    )
}

const login = async (req, res, next) => {
    try {

        const {email, password} = req.body;

        const missingFields = [email, password].some(
            (field) => typeof field !== 'string' || field.trim() === ''
        )

        if (missingFields) {
            throw new ApiError(400, 'Email and password are required')
        }

        const user  =  await User.findOne({ email }).select('+password')

        if(!user){
            throw new ApiError(401, 'Invalid email or password')
        }

        if(!user.isActive){
            throw new ApiError(403, 'Your account is inactive' )
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if(!isValidPassword){
            throw new ApiError(401, 'Invalid email or password')
        }


        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })
        // validateBeforeSave:false -> skips schema validation while saving refreshToken

        const safeUser = {  
            id : user._id,
            name : user.name,
            email : user.email,
            role : user.role,
            isActive : user.isActive
        }

        // Cookies configuration for cross-domain production environment
        const options = {
            httpOnly : true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
        }

        res.cookie('accessToken', accessToken, options)
        res.cookie('refreshToken', refreshToken, options)

        
        return sendSuccess(res, 200, 'User logged in successfully',{
            user : safeUser
        })

        
    } catch (error) {
        next(error)
    }
}


const getMe = async (req, res, next) =>{
    try {
        const user = req.user;

        if(!user){
            throw new ApiError(401,'Unauthorized access')
        }

         const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }

        return sendSuccess(res, 200, 'User data fetched successfully', {
            user: safeUser
        })
    } catch (error) {
        next(error)
    }
}

const refreshAccessToken = async (req, res, next) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, 'Refresh token missing')
        }

        const decodedToken = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET)

        const user = await User.findById(decodedToken.id).select('+refreshToken')

        if (!user || !user.isActive) {
            throw new ApiError(401, 'Invalid refresh token')
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, 'Refresh token expired or reused')
        }

        const accessToken = generateAccessToken(user)

        const options = {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
        }

        res.cookie('accessToken', accessToken, options)

        return sendSuccess(res, 200, 'Access token refreshed successfully', {
            accessToken
        })
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Invalid or expired refresh token'))
        }

        next(error)
    }
}

const logout = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: null
                }
            }
        )

        const options = {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
        }

        res.clearCookie('accessToken', options)
        res.clearCookie('refreshToken', options)

        return sendSuccess(res, 200, 'User logged out successfully')
    } catch (error) {
        next(error)
    }
}

export { 
    register,
    login,
    getMe,
    logout,
    refreshAccessToken
}

export { demoLogin }

// Simple demo-login handler: returns tokens for the demo user when enabled.
// Rate-limited to avoid abuse.
const demoLogin = async (req, res, next) => {
    try {
        if (!env.ENABLE_PUBLIC_DEMO) {
            throw new ApiError(403, 'Demo login is disabled on this server')
        }

        // Basic per-IP rate limiting (6 requests per minute)
        // Use express-rate-limit for robust handling
        // We'll create a small limiter instance here and run it.
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            max: 6,
            standardHeaders: true,
            legacyHeaders: false
        })

        // Promisify limiter middleware usage
        await new Promise((resolve, reject) => {
            limiter(req, res, (err) => {
                if (err) return reject(err)
                resolve()
            })
        })

        const demoEmail = env.SEED_DEMO_EMAIL

        if (!demoEmail) {
            throw new ApiError(500, 'Demo user not configured on server')
        }

        const user = await User.findOne({ email: demoEmail }).select('+password')

        if (!user) {
            throw new ApiError(500, 'Demo user not found')
        }

        if (!user.isActive) {
            throw new ApiError(403, 'Demo account is inactive')
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }

        const options = {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
        }

        res.cookie('accessToken', accessToken, options)
        res.cookie('refreshToken', refreshToken, options)

        return sendSuccess(res, 200, 'Demo login successful', {
            user: safeUser
        })
    } catch (error) {
        next(error)
    }
}