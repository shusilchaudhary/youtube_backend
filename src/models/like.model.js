import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likeable: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "onModel", // Dynamically refers to Video, Comment, or Tweet
  },
  onModel: {
    type: String,
    required: true,
    enum: ["Video", "Comment", "Tweet"],
  }
}, {
  timestamps: true,
});


export const Like = mongoose.model("Like", likeSchema)