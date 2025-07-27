import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import fs from "fs" 
import path from "path" 

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    // Content is required for tweets
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required");
    }
    let tweetImageUrl = "";
    // Handle optional image upload
    if (req.files?.image?.[0]?.path) {
        const imageLocalPath = req.files.image[0].path;
        const tweetImage = await uploadOnCloudinary(imageLocalPath);
        
        if (!tweetImage?.url) {
            throw new ApiError(400, "Error while uploading image to Cloudinary");
        }
        
        tweetImageUrl = tweetImage.url;
    }
    // Create the tweet
    const tweet = await Tweet.create({
        content: content.trim(),
        tweetImage: tweetImageUrl,
        owner: req.user._id
    });
    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet");
    }
    // Populate owner details for response
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");
    return res
        .status(201)
        .json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
  const filter = {};

  // Search tweets by content (or other fields if needed)
  if (query.trim() !== "") {
    filter.content = { $regex: query, $options: "i" };
  }

  // Filter by userId if provided
  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
    filter.owner = userId;
  }

  // Count total matching tweets
  const totalTweets = await Tweet.countDocuments(filter);

  // Fetch tweets with pagination, sorting, and owner details
  const tweets = await Tweet.find(filter)
    .populate("owner", "username avatar") // Assuming tweets have an "owner" field
    .sort({ [sortBy]: sortOrder })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const totalPages = Math.ceil(totalTweets / limitNum);

  // Return paginated tweets
  return res.status(200).json(
    new ApiResponse(200, {
      tweets,
      pagination: {
        totalTweets,
        totalPages,
        currentPage: pageNum,
        pageSize: limitNum,
      },
    }, "Tweets fetched successfully")
  );
});


const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // ✅ Log the incoming body for debugging
  console.log("DEBUG: req.body =", req.body);

  // ✅ Safe destructuring with fallback
  const { content } = req.body;

  // ✅ Validation for missing or invalid content
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Invalid or missing 'content' in request body.");
  }

  // ✅ Find the tweet by ID and populate owner
  const tweet = await Tweet.findById(tweetId).populate("owner");

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  // ✅ Check if the logged-in user is the tweet owner
  if (tweet.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request.");
  }

  // ✅ Update the tweet content and save  
  tweet.content = content.trim();
  await tweet.save();

  // ✅ Send a successful response
  return res
  .status(200)
  .json(
    new ApiResponse(200, tweet, "Tweet updated successfully.")
  );
});



const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // ✅ Find the tweet
  const tweet = await Tweet.findById(tweetId).populate("owner");

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  // ✅ Check ownership
  if (tweet.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized: You can only delete your own tweets.");
  }

  // ✅ If tweet has an image, delete it from storage
  if (tweet.image) {
    const imagePath = path.join(__dirname, "..", "public", tweet.image); // Adjust path if needed

    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Failed to delete image:", err.message);
      } else {
        console.log("Image deleted:", imagePath);
      }
    });
  }

  // ✅ Delete tweet from database
  await tweet.deleteOne();

  // ✅ Send response
  return res.status(200).json(
    new ApiResponse(200, null, "Tweet and associated image deleted successfully.")
  );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
