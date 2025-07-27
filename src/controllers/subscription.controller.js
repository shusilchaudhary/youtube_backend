import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription 
     const subscriberId = req.user._id; // assuming you're using auth middleware

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed from channel"));
    } else {
        await Subscription.create({
            channel: channelId,
            subscriber: subscriberId
        });

        return res
            .status(201)
            .json(new ApiResponse(201, {}, "Subscribed to channel"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        console.log("invalid channelId received", channelId)

        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate(
        "subscriber",
        "username email avatar"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Channel subscribers fetched"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id;

    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate(
        "channel",
        "username email avatar"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "Subscribed channels fetched"));
});



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}