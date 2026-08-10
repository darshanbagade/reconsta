import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import connectDB from '../src/config/db.js'
import { env } from '../src/config/env.js'
import User from '../src/models/User.model.js'

const seedDemo = async () => {
    try {
        await connectDB()

        const {
            SEED_DEMO_NAME,
            SEED_DEMO_EMAIL,
            SEED_DEMO_PASSWORD
        } = env

        if (!SEED_DEMO_NAME || !SEED_DEMO_EMAIL || !SEED_DEMO_PASSWORD) {
            console.log('Demo seed variables not provided; skipping demo seed')
            return
        }

        const existingDemo = await User.findOne({ email: SEED_DEMO_EMAIL })

        if (existingDemo) {
            console.log('Demo user already exists')
            return
        }

        const hashedPassword = await bcrypt.hash(SEED_DEMO_PASSWORD, 10)

        await User.create({
            name: SEED_DEMO_NAME,
            email: SEED_DEMO_EMAIL,
            password: hashedPassword,
            role: 'demo'
        })

        console.log('Demo user seeded successfully')
    } catch (error) {
        console.error('Seed demo failed:', error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
        console.log('MongoDB disconnected')
    }
}

seedDemo()
