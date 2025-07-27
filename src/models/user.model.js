import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
username: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true,
    index: true,
},
email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
},
fullName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
},
avatar: {
    type: String,
    required: true,
},
coverImage: {
    type: String,
},
watchHistory: [
   {
    type: Schema.Types.ObjectId,
    ref: "video"
   }
],
password: {
    type: String,
    required: [true, "password is required"]
},
refreshToken: {
    type: String,
}
},
{
 timestamps: true,
}
)

userSchema.pre("save", async function(next){ //pre is mongoose hook used to run function before a particular function.
if(!this.isModified("password")) return next();
this.password = await bcrypt.hash(this.password, 10)
next()
})

userSchema.methods.isPasswordCorrect = async function(password){
return await bcrypt.compare(password, this.password)
}
//compare method said password is correct/incorrect with boolean value.

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY ,
        }

    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY ,
        }

    )
}
//both are same token . they only have difference in their usage.

export const User = mongoose.model("User", userSchema)