// import mongoose from "mongoose"
// import {Video} from "../models/video.model.js"
// import {Subscription} from "../models/subscription.model.js"
// import {Like} from "../models/like.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getChannelStats = asyncHandler(async (req, res) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
// })

// const getChannelVideos = asyncHandler(async (req, res) => {
//     // TODO: Get all the videos uploaded by the channel
// })

// export {
//     getChannelStats, 
//     getChannelVideos
//     }




import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Get stats for a channel
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user?._id;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid or missing channel ID.");
    }

    // Get all videos by the channel
    const videos = await Video.find({ owner: channelId }, "_id views");

    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Get total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Get total likes on channel's videos
    const videoIds = videos.map(video => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched successfully")
    );
});



// Get all videos uploaded by a channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user?._id;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid or missing channel ID.");
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 }) // latest videos first
        .select("-__v") // remove version field
        .populate("owner", "username avatar") // optional: include channel info

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

export {
    getChannelStats,
    getChannelVideos
}





    