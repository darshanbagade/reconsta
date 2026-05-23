import http from 'http'
import app from './app.js'
import { env } from './config/env.js'
import connectDB from './config/db.js'
import { initializeSocket } from './socket/socket.js'

const startServer = async () => {
    try {
        await connectDB()

        // Socket.io needs raw HTTP server, so Express app is wrapped here
        const httpServer = http.createServer(app)

        // Initialize Socket.io before server starts accepting requests
        initializeSocket(httpServer)

        httpServer.on('error', (error) => {
            console.log('Server error:', error)
            throw error
        })

        httpServer.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT}`)
        })
    } catch (error) {
        console.log('Server startup failed:', error.message)
        process.exit(1)
    }
}

startServer()