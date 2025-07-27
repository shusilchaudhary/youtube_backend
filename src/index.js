import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`server is running in the PORT ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("MongoDb connection failed", error)
})


