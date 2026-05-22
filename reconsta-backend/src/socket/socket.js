import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.model.js'

let io = null

const SOCKET_EVENTS = Object.freeze({
    DASHBOARD_UPDATED: 'dashboard:updated',

    RECONCILIATION_COMPLETED: 'reconciliation:completed',

    ANOMALY_CREATED: 'anomaly:created',

    EXCEPTION_CREATED: 'exception:created',
    EXCEPTION_ASSIGNED: 'exception:assigned',
    EXCEPTION_RESOLVED: 'exception:resolved',
    EXCEPTION_ESCALATED: 'exception:escalated',

    SLA_UPDATED: 'sla:updated',
    SLA_BREACHED: 'sla:breached'
})

const parseCookies = (cookieHeader = '') => {
    return cookieHeader
        .split(';')
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .reduce((acc, cookie) => {
            const separatorIndex = cookie.indexOf('=')

            if (separatorIndex === -1) {
                return acc
            }

            const key = cookie.slice(0, separatorIndex)
            const value = cookie.slice(separatorIndex + 1)

            acc[key] = decodeURIComponent(value)
            return acc
        }, {})
}

const getTokenFromSocket = (socket) => {
    const cookies = parseCookies(socket.handshake.headers.cookie || '')

    if (cookies.accessToken) {
        return cookies.accessToken
    }

    const authToken = socket.handshake.auth?.token

    if (authToken) {
        return authToken
    }

    const authorizationHeader = socket.handshake.headers.authorization

    if (
        authorizationHeader &&
        authorizationHeader.startsWith('Bearer ')
    ) {
        return authorizationHeader.split(' ')[1]
    }

    return null
}

const authenticateSocket = async (socket, next) => {
    try {
        const token = getTokenFromSocket(socket)

        if (!token) {
            return next(new Error('Unauthorized socket connection'))
        }

        const tokenSecret = env.JWT_ACCESS_SECRET || env.JWT_SECRET

        if (!tokenSecret) {
            return next(new Error('Socket JWT secret is missing'))
        }

        const decodedToken = jwt.verify(token, tokenSecret)

        const userId = decodedToken?._id || decodedToken?.id

        if (!userId) {
            return next(new Error('Invalid socket token'))
        }

        const user = await User.findById(userId).select('name email role isActive')

        if (!user || !user.isActive) {
            return next(new Error('Unauthorized socket user'))
        }

        socket.data.user = {
            _id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role
        }

        return next()
    } catch (error) {
        return next(new Error('Unauthorized socket connection'))
    }
}

const isValidSessionId = (sessionId) => {
    return (
        typeof sessionId === 'string' &&
        sessionId.trim().length > 0 &&
        sessionId.trim().length <= 150
    )
}

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.CLIENT_URL,
            credentials: true
        },
        transports: ['websocket', 'polling']
    })

    io.use(authenticateSocket)

    io.on('connection', (socket) => {
        const user = socket.data.user

        // Every connected user joins role and user-specific rooms
        socket.join(`user:${user._id}`)
        socket.join(`role:${user.role}`)

        // Admin and supervisor dashboard can listen to this shared room
        if (['admin', 'supervisor'].includes(user.role)) {
            socket.join('dashboard:operations')
        }

        // Frontend can join a specific reconciliation session room
        socket.on('session:join', (sessionId, callback) => {
            if (!isValidSessionId(sessionId)) {
                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        message: 'Invalid sessionId'
                    })
                }

                return
            }

            socket.join(`session:${sessionId.trim()}`)

            if (typeof callback === 'function') {
                callback({
                    success: true,
                    message: 'Joined session room'
                })
            }
        })

        socket.on('session:leave', (sessionId, callback) => {
            if (!isValidSessionId(sessionId)) {
                if (typeof callback === 'function') {
                    callback({
                        success: false,
                        message: 'Invalid sessionId'
                    })
                }

                return
            }

            socket.leave(`session:${sessionId.trim()}`)

            if (typeof callback === 'function') {
                callback({
                    success: true,
                    message: 'Left session room'
                })
            }
        })
    })

    return io
}

const getIO = () => {
    return io
}

const emitToRoom = (room, eventName, payload = {}) => {
    if (!io || !room || !eventName) {
        return false
    }

    io.to(room).emit(eventName, {
        ...payload,
        emittedAt: new Date().toISOString()
    })

    return true
}

const emitToSession = (sessionId, eventName, payload = {}) => {
    if (!isValidSessionId(sessionId)) {
        return false
    }

    return emitToRoom(`session:${sessionId.trim()}`, eventName, payload)
}

const emitToUser = (userId, eventName, payload = {}) => {
    if (!userId) {
        return false
    }

    return emitToRoom(`user:${String(userId)}`, eventName, payload)
}

const emitToRoles = (roles = [], eventName, payload = {}) => {
    if (!Array.isArray(roles) || !roles.length || !io || !eventName) {
        return false
    }

    for (const role of roles) {
        io.to(`role:${role}`).emit(eventName, {
            ...payload,
            emittedAt: new Date().toISOString()
        })
    }

    return true
}

const emitToOperationsDashboard = (eventName, payload = {}) => {
    return emitToRoom('dashboard:operations', eventName, payload)
}

export {
    SOCKET_EVENTS,
    initializeSocket,
    getIO,
    emitToRoom,
    emitToSession,
    emitToUser,
    emitToRoles,
    emitToOperationsDashboard
}