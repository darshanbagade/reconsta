import mongoose from 'mongoose'
import User from '../models/User.model.js'
import ApiError from '../utils/ApiError.js'
import sendSuccess from '../utils/responseFormatter.js'

const ALLOWED_ROLES = ['analyst', 'supervisor', 'admin']

const escapeRegex = (value = '') => {
    return String(value)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const validateUserId = (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid user id')
    }
}

const validatePagination = (page, limit) => {
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    if (
        !Number.isFinite(pageNumber) ||
        !Number.isFinite(limitNumber) ||
        !Number.isInteger(pageNumber) ||
        !Number.isInteger(limitNumber) ||
        pageNumber < 1 ||
        limitNumber < 1
    ) {
        throw new ApiError(400, 'Page and limit must be valid positive integers')
    }

    return {
        pageNumber,
        limitNumber: Math.min(limitNumber, 100)
    }
}

const getUsers = async (req, res, next) => {
    try {
        const {
            role,
            isActive,
            search,
            page = 1,
            limit = 20
        } = req.query

        const filter = {}

        if (role) {
            if (!ALLOWED_ROLES.includes(role)) {
                throw new ApiError(400, 'Invalid user role filter')
            }

            filter.role = role
        }

        const currentUserRole = req.user.role

        //show only analyst and supervisor user accounts to the supervisor
        if (currentUserRole === 'supervisor') {
            if (role === 'admin') {
                throw new ApiError(403, 'Supervisor cannot view admin users')
            }

            //if current user is supervisor and roles that to be fetched is not mentioned then only search analyst and supervisor roles
            if (!role) {
                filter.role = { $in: ['analyst', 'supervisor'] }
            }
        }

        if (isActive !== undefined) {
            if (!['true', 'false'].includes(String(isActive))) {
                throw new ApiError(400, 'isActive must be true or false')
            }

            filter.isActive = String(isActive) === 'true'
        }

        if (search) {
            const escapedSearch = escapeRegex(search)

            if (escapedSearch) {
                filter.$or = [
                    { name: { $regex: escapedSearch, $options: 'i' } },
                    { email: { $regex: escapedSearch, $options: 'i' } }
                ]
            }
        }

        const { pageNumber, limitNumber } = validatePagination(page, limit)
        const skip = (pageNumber - 1) * limitNumber      

        const users = await User.find(filter)
        .select('_id name email role isActive createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()


        const totalUsers = await User.countDocuments(filter)

        return sendSuccess(res, 200, 'Users fetched successfully', {
            users,
            pagination: {
                totalUsers,
                currentPage: pageNumber,
                totalPages: Math.max(1, Math.ceil(totalUsers / limitNumber)),
                limit: limitNumber
            }
        })
    } catch (error) {
        next(error)
    }
}

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params

        validateUserId(id)

        const requesterRole = String(req.user?.role || '').trim().toLowerCase()

        const user = await User.findById(id)
            .select('_id name email role isActive createdAt updatedAt')
            .lean()

        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        const targetRole = String(user.role || '').trim().toLowerCase()

        if (requesterRole === 'supervisor' && targetRole === 'admin') {
            throw new ApiError(403, 'Supervisor cannot view admin users')
        }

        return sendSuccess(res, 200, 'User fetched successfully', {
            user
        })
    } catch (error) {
        next(error)
    }
}

const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params
        const { isActive } = req.body
        
        validateUserId(id)
        
        if (typeof isActive !== 'boolean') {
            throw new ApiError(400, 'isActive must be a boolean value')
        }

        if (String(req.user._id) === String(id) && isActive === false) {
            throw new ApiError(400, 'You cannot deactivate your own account')
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            {
                returnDocument: 'after',
                runValidators: true
            }
        ).select('_id name email role isActive createdAt updatedAt')

        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        return sendSuccess(res, 200, 'User status updated successfully', {
            user
        })
    } catch (error) {
        next(error)
    }
}

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params
        const { role } = req.body
        
        validateUserId(id)
        
        if (!ALLOWED_ROLES.includes(role)) {
            throw new ApiError(400, 'Invalid user role')
        }

        if (String(req.user._id) === String(id) && role !== 'admin') {
            throw new ApiError(400, 'You cannot remove your own admin role')
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            {
                returnDocument: 'after',
                runValidators: true
            }
        ).select('_id name email role isActive createdAt updatedAt')

        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        return sendSuccess(res, 200, 'User role updated successfully', {
            user
        })
    } catch (error) {
        next(error)
    }
}

export {
    getUsers,
    getUserById,
    updateUserStatus,
    updateUserRole
}