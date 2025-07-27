// import mongoose, {isValidObjectId} from "mongoose"
// import {Like} from "../models/like.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const toggleVideoLike = asyncHandler(async (req, res) => {
//     const {videoId} = req.params
//     //TODO: toggle like on video
// })

// const toggleCommentLike = asyncHandler(async (req, res) => {
//     const {commentId} = req.params
//     //TODO: toggle like on comment

// })

// const toggleTweetLike = asyncHandler(async (req, res) => {
//     const {tweetId} = req.params
//     //TODO: toggle like on tweet
// }
// )

// const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO: get all liked videos
// })

// export {
//     toggleCommentLike,
//     toggleTweetLike,
//     toggleVideoLike,
//     getLikedVideos
// } 


import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// This function handles liking or unliking any item (video, comment, tweet)
const toggleLike = async (req, res, itemId, modelName) => {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        throw new ApiError(400, "Invalid ID");
    }

    // Check if like already exists
    const existingLike = await Like.findOne({
        user: userId,
        likeable: itemId,
        onModel: modelName
    });

    if (existingLike) {
        // Unlike it
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, `${modelName} unliked successfully`));
    } else {
        // Like it
        const newLike = await Like.create({
            user: userId,
            likeable: itemId,
            onModel: modelName
        });
        return res.status(201).json(new ApiResponse(201, newLike, `${modelName} liked successfully`));
    }
};

// Like or unlike a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, req.params.videoId, "Video");
});

// Like or unlike a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, req.params.commentId, "Comment");
});

// Like or unlike a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, req.params.tweetId, "Tweet");
});

// Get all videos liked by the user
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.find({
        user: userId,
        onModel: "Video"
    }).populate("likeable"); // So we get video details

    res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

// Export all functions
export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
};
