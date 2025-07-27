import mongoose from "mongoose";
import dotenv from "dotenv"
import { DB_NAME } from "../constant.js";

dotenv.config()


const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/{DB_NAME}`)
        console.log(`MongoDB connected successfully!! host name: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Database connection error", error)
        process.exit(1)
    }
}

export default connectDB


