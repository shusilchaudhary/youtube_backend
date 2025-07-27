import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryPublicId, deleteCloudinaryPublicId } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
  const filter = {};

  if (query.trim() !== "") {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
    filter.owner = userId;
  }

  const totalVideos = await Video.countDocuments(filter);
  const videos = await Video.find(filter)
    .populate("owner", "username avatar")
    .sort({ [sortBy]: sortOrder })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const totalPages = Math.ceil(totalVideos / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: {
        totalVideos,
        totalPages,
        currentPage: pageNum,
        pageSize: limitNum,
      },
    }, "Videos fetched successfully")
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Title and description are required.");
  }

  const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;
  const videoFilePath = req.files?.videoFile?.[0]?.path;

  if (!thumbnailFilePath) throw new ApiError(400, "Thumbnail is required.");
  if (!videoFilePath) throw new ApiError(400, "Video file is required.");

  const thumbnail = await uploadOnCloudinary(thumbnailFilePath);
  const video = await uploadOnCloudinary(videoFilePath);

  if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");
  if (!video?.url) throw new ApiError(400, "Video upload failed");

  const createdVideo = await Video.create({
    thumbnail: thumbnail.url,
    title,
    description,
    videoFile: video.url,
    duration: video.duration,
    owner: req.user._id
  });

  return res.status(200)
  .json(
    new ApiResponse(200, createdVideo, "Video uploaded successfully")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId).populate("owner", "username avatar");
  if (!video) throw new ApiError(404, "Video not found");

  return res.status(200)
  .json(
    new ApiResponse(200, video, "Video fetched successfully")
  );
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  console.log("req.body =", req.body)

  if (!title && !description) {
    throw new ApiError(400, "At least one field (title or description) is required");
  }

  const video = await Video.findById(videoId).populate("owner");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to update video");
  }

  // Update fields only if they are provided
  if (title) video.title = title;
  if (description) video.description = description;

  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Video details updated successfully")
  );
});


// const updateThumbnail = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   const thumbnailPath = req.file?.path;

//   const video = await Video.findById(videoId);
//   if (!video) throw new ApiError(404, "Video not found");

//   if (!thumbnailPath) throw new ApiError(400, "Thumbnail is missing");

//   const thumbnail = await uploadOnCloudinary(thumbnailPath);
//   if (!thumbnail?.url) throw new ApiError(400, "Cloudinary upload failed");

//   if (video.thumbnail) {
//     const publicId = getCloudinaryPublicId(video.thumbnail);
//     if (publicId) await deleteCloudinaryPublicId(publicId);
//   }

//   video.thumbnail = thumbnail.url;
//   await video.save();

//   return res.status(200).json(
//     new ApiResponse(200, video, "Thumbnail updated successfully")
//   );
// });

const updateThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const thumbnailPath = req.file?.path;

  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnail?.url) {
    throw new ApiError(400, "Error while uploading the thumbnail");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Delete the old thumbnail from Cloudinary if it exists
  if (video.thumbnail) {
    const publicId = getCloudinaryPublicId(video.thumbnail);
    if (publicId) await deleteCloudinaryPublicId(publicId);
  }

  video.thumbnail = thumbnail.url;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Video thumbnail updated successfully")
  );
});




// const deleteVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;

//   const video = await Video.findById(videoId).populate('owner');
//   if (!video) throw new ApiError(404, "Video not found");

//   if (!video.owner || !video.owner._id || !req.user || !req.user._id) {
//     throw new ApiError(403, "Unauthorized or missing user info");
//   }

//   if (video.owner._id.toString() !== req.user._id.toString()) {
//     throw new ApiError(403, "Unauthorized to delete video");
//   }

//   const publicId = getCloudinaryPublicId(video.videoFile);
//   if (publicId) await deleteCloudinaryPublicId(publicId, 'video');

//   await Video.findByIdAndDelete(videoId);

//   return res.status(200).json(
//     new ApiResponse(200, null, "Video deleted successfully")
//   );
// });

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId).populate('owner');
  if (!video) throw new ApiError(404, "Video not found");

  console.log("Video owner:", video.owner);
  console.log("Req user:", req.user);

  if (!video.owner || !video.owner._id || !req.user || !req.user._id) {
    throw new ApiError(403, "Unauthorized or missing user info");
  }

  if (video.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete video");
  }

  const publicId = getCloudinaryPublicId(video.videoFile);
  if (publicId) await deleteCloudinaryPublicId(publicId, 'video');

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse(200, null, "Video deleted successfully")
  );
});



const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to toggle publish status");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200)
  .json(
    new ApiResponse(200, video, `Video successfully ${video.isPublished ? "published" : "unpublished"}`)
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
  togglePublishStatus,
};
