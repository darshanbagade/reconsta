import mongoose from 'mongoose'
import {env} from './env.js'
const connectDB = async ()=>{

    try {
        const connectionInstance = await mongoose.connect(env.MONGODB_URI)
        console.log(`MongoDB connected : Connection Host:  ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("\nMongoDB connection Error: " , error.message);
        process.exit(1);
        // 1 -> error occured 
        // 0 -> successful
    }
}

export default connectDB ;