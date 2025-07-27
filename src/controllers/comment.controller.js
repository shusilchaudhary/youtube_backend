// import mongoose from "mongoose"
// import {Comment} from "../models/comment.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getVideoComments = asyncHandler(async (req, res) => {
//     //TODO: get all comments for a video
//     const {videoId} = req.params
//     const {page = 1, limit = 10} = req.query

// })

// const addComment = asyncHandler(async (req, res) => {
//     // TODO: add a comment to a video
// })

// const updateComment = asyncHandler(async (req, res) => {
//     // TODO: update a comment
// })

// const deleteComment = asyncHandler(async (req, res) => {
//     // TODO: delete a comment
// })

// export {
//     getVideoComments, 
//     addComment, 
//     updateComment,
//      deleteComment
//     }



import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        { $sort: { createdAt: -1 } }
    ]).facet({
        data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
        total: [{ $count: "count" }]
    });

    const response = {
        comments: comments[0].data,
        total: comments[0].total[0]?.count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
    };

    res.status(200).json(new ApiResponse(200, response, "Video comments fetched successfully"));
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    res.status(201).json(new ApiResponse(201, newComment, "Comment added successfully"));
});

// Update a comment (only by the owner)
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(userId)) {
        throw new ApiError(403, "You can only update your own comment");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    comment.content = content;
    await comment.save();

    res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// Delete a comment (only by the owner)
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(userId)) {
        throw new ApiError(403, "You can only delete your own comment");
    }

    await comment.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
