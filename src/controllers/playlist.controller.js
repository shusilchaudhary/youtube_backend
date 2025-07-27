import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!(name || description)) {
    throw new ApiError(400, "Name is required");
  }

  const existingPlaylist = await Playlist.findOne({ name, owner: req.user._id });

  if (existingPlaylist) {
    throw new ApiError(400, "Playlist already exists. Please choose a different name.");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id
  });

  return res.status(200).json(
    new ApiResponse(200, playlist, "Playlist created successfully")
  );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid or missing userId");
  }

  const playlists = await Playlist.find({ owner: userId }).populate("videos");

  // Optional: if you want to return a 404 when user has no playlists
  if (!playlists || playlists.length === 0) {
    throw new ApiError(404, "User does not have any playlists");
  }

  return res.status(200).json(
    new ApiResponse(200, playlists, "Playlists fetched successfully.")
  );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id 
    if(!isValidObjectId(playlistId)){
      throw new ApiError(400, "playlist wasn't found")
    }
    
    const playlist = await Playlist.findById(playlistId).populate("videos")

    return res 
    .status(200) 
    .json(
      new ApiResponse(200, playlist, "playlists fetched successfully.")
    )


})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params 
    
    const playlist = await Playlist.findById(playlistId)

    if(!playlistId){
      throw new ApiError(400, "playlist wasn't found")
    }

    //if playlist was found then check if the video already exists. 

    const video = playlist.videos.find((video) => video.toString() === videoId)

    if(video){
      throw new ApiError(400, "video was already in playlist")
    }
  
    playlist.videos.push(videoId) 

    await playlist.save() 

    return res 
    .status(200) 
    .json(
      new ApiResponse(200, playlist, "video added in a playlist successfully.")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist 

    if(!(isValidObjectId(playlistId))){
      throw new ApiError(400, "playlist id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
      throw new ApiError(400, "playlist is not found")
    }

    if(!isValidObjectId(videoId)){
      throw new ApiError(400, "video id is invalid")
    }

    const video = await playlist.videos.find((video) => video.toString() === videoId) 
    
    if(!video) {
      throw new ApiError(400, "video doesn't exist in playlist")
    }

    await playlist.videos.pull(videoId) 

    return res 
    .status(200) 
    .json(
      new ApiResponse(200, playlist, "video deleted successfully from the playlist.")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist 

    if(!isValidObjectId(playlistId)){
      throw new ApiError(400, "playlist id is invalid")
    }

    const playlist = Playlist.findById(playlistId)

    if(!playlist){
      throw new ApiError(400, "playlist not found")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res 
    .status(200) 
    .json(
      new ApiResponse(200, "playlist deleted successfully.")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
      throw new ApiError(400, "playlist id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
      throw new ApiError(400, "playlist id wasn't found")
    }

    if(!(name || description)){
      throw new ApiError(400, "both name and description is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
      {
        $set: {
          name,
          description
        }
      },
      {
        new: true
      }
    )
    
    return res 
    .status(200) 
    .json(
      new ApiResponse(200, updatedPlaylist, "title and description of the playlist updated successfully.")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
