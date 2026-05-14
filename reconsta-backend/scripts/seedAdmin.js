import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import connectDB from '../src/config/db.js'
import { env } from '../src/config/env.js'
import User from '../src/models/User.model.js'

const seedAdmin = async () => {
    try {
        await connectDB()

        const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = env

        if (!SEED_ADMIN_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
            throw new Error('Seed admin environment variables are missing')
        }

        const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL })

        if (existingAdmin) {
            console.log('Admin user already exists')
            return
        }

        const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10)

        await User.create({
            name: SEED_ADMIN_NAME,
            email: SEED_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin'
        })

        console.log('Admin user seeded successfully')
    } catch (error) {
        console.error('Seed admin failed:', error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
        console.log('MongoDB disconnected')
    }
}

// The /register route is protected and can be used only by an admin.
// Since no admin exists when the app starts for the first time,
// this seed script creates the first admin user directly in the database.
seedAdmin()