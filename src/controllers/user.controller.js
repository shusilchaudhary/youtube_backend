import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId) => {
try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}
} catch (error) {
    console.log("token generation error", error)
    throw new ApiError(404, "something went wrong while generating the access and refresh tokens.")
}
}

const registerUser = asyncHandler(async (req, res) => {
//before register
//get users details from the frontend
//validation for checking empty field
//check if users already exist : username/email
//check for images , check for the avatar
//if every field is filled then uplaod them in cloudinary  //also check that the avatar is uplaoded in the cloudinary or not 
//create user object - create entry in db
//remove password and refresh token field from the response.
//check for the user creation
//return response 

const {fullName, email, password, username} = req.body
// console.log("email", email)

if(
    [fullName, email, username, password].some((field) => 
    field?.trim() === "")
){
throw new ApiError(400, "all field are required")
}

const existedUser = await User.findOne({
    $or: [{username}, {email}]
})

if(existedUser){
    throw new ApiError(400, "User already exists")
}

const avatarLocalPath = req.files?.avatar?.[0]?.path
const coverImageLocation = req.files?.coverImage?.[0]?.path
//console.log("req.files : ",req.files)

// const avatarFile = req.files?.avatar;
// const coverImageFile = req.files?.coverImage;

// const avatarLocalPath = avatarFile?.[0]?.path;
// const coverImageLocalPath = coverImageFile?.[0]?.path;
//console.log(req.files)

//let coverImageLocalPath;
// if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//     coverImageLocalPath = req.files.coverImage[0].path
// }

if(!avatarLocalPath){
    throw new ApiError(400, "avatar is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocation)


if(!avatar.url) {
    throw new ApiError(400, "avatar not uploaded on cloudinary")
}

const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(400, "something went wrong while registering user")
}

return res
.status(201)
.json(
    new ApiResponse(201, createdUser, "user registered successfully")
)

})

const loginUser = asyncHandler(async(req, res) => {
//get the data from the frontend
//check the username and email field
//check if the user exist
//check the password
//access and refresh token
//send cookies
const {username, email, password} = req.body;

if(!(username || email)){
    throw new ApiError(400, "username or email is required")
}

const user = await User.findOne({
    $or: [{email}, {username}]
})

if(!user){
    throw new ApiError(404, "user doesn't exist")
}

const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid){
    throw new ApiError(401, "Invalid password")
}

const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

const options = {
    httpOnly: true,
    secure: true,
}

return res.status(201)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    },
    "user loggedin successfully"
)
)
})

const logoutUser = asyncHandler(async(req, res) => {
await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
)

const options = {
    httpOnly: true,
    secure: true,
}

return res
.status(201)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(
    new ApiResponse(200, "user logout successfully")
)
})

const refreshAccessToken = asyncHandler(async(req, res) => {
const inComingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

if(!inComingRefreshToken){
    throw new ApiError(400, "unauthorized requests")
}

try {
    const decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    console.log(decodedToken)
    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(400, "Invalid refresh token")
    }
    
    if(inComingRefreshToken !== user.refreshToken){
        throw new ApiError(400, "user refreshtoken expires")
    }
    
    const options = {
        httpOnly: true, 
        secure: true,
    }
    
    const {accessToken, refreshToken : newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
       new ApiResponse(
        200,
        {
            newRefreshToken, accessToken
        },
        "access token refreshed successfully"
       )
    )
    
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body 
    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(404, "user doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordValid){
        throw new ApiError(400, "password is incorrect")
    }

    if(oldPassword === newPassword){
        throw new ApiError(400, "old and new password are same")
    }

    user.password = newPassword
    await user.save({
        validateBeforeSave: false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {email, fullName} = req.body
   
    if((!fullName || !email)){
        throw new ApiError(400, "at least one field is required")
    }

    if (email) {
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            throw new ApiError(400, "Email is already used by another user");
        }
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
       {
        $set: {
            fullName,
            email
        }
       },
{
    new: true
}).select("-password")

return res
.status(200)
.json(new ApiResponse(200, user, "accountDetails updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uplaoding the avatar")
    }

    //delete the old image avatar

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user avatar changed successfully."))
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "problem occour while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user coverImage changed successfully."))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
const {username} = req.query

if(!username?.trim()){
    throw new ApiError(400, "username is missing")
}

const channel = await User.aggregate([
    {
        $match: {
            username: username.toLowerCase()
        },
    },
    {
        $lookup: {
            from: "subscriptions", // target collection to join
            localField: "_id",     // the field from the input collection (e.g., user or channel)
            foreignField: "channel",   // field in the subscriptions collection that references the channel
            as: "subscribers"    // the result will be stored in this array field
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo" 
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]}, //$in is a MongoDB query operator that checks whether a value exists in an array.
                    then: true,
                    else: false,
                }
            }
        }

},
    {
        $project: {   //$project used to include or exclude the new fields
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
        }
    }
])

if(!channel?.length){
    throw new ApiError(404, "channel doesn't exists")
}
console.log(channel)

return res
.status(200)
.json(new ApiResponse(200, channel[0], "user channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async(req, res) => {
const user = await User.aggregate([
{
    $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
    },
},
{
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
      ]
    }
}
])
return res
.status(200)
.json(
    new ApiResponse(
        200, 
        user[0].watchHistory, 
        "watchHistory fetched successfully"
    )
)
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}






