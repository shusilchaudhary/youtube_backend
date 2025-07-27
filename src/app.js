import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
))

app.use(express.json())
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("pulic"))
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"
//routes declaration
app.use("/api/v1/users", userRouter)


// Route import and mount
import videoRoutes from './routes/video.routes.js';
app.use('/api/v1/video', videoRoutes);

//tweet route declaration 
import tweetRoutes from "./routes/tweet.routes.js"
app.use("/api/v1/tweet", tweetRoutes)


//playist route declaration 
import playlistRoutes from "./routes/playlist.routes.js"
app.use("/api/v1/playlist", playlistRoutes)

//subscription route decleration 

import subscriptionRoutes from "./routes/subscription.routes.js" 
app.use("/api/v1/subscription", subscriptionRoutes) 

//like routes decleration 
import likeRoutes from "./routes/like.routes.js"
app.use("/api/v1/like", likeRoutes)


//comment routes decleration 
import commentRoutes from "./routes/comment.routes.js"
app.use("/api/v1/comment", commentRoutes) 


//dashboard rotes decleration 
import dashboardRoutes from "./routes/dashboard.routes.js"  
app.use("/api/v1/dashboard", dashboardRoutes) 


//healthcheck route decleration 
import healthcheckRoutes from "./routes/healthcheck.routes.js" 
app.use("/api/v1/healthcheck", healthcheckRoutes)

export {app}
