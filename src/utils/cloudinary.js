// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// })

// const uploadOnCloudinary = async(localFilePath) => {
// try {
//     if(!localFilePath) return null
//     //next upload the file in the cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//         resource_type: "auto",
//     })
//     // console.log("file uploaded on cloudinary successfully", response.url)
//     fs.unlinkSync(localFilePath)
//     return response

// } catch (error) {
//     fs.unlinkSync(localFilePath) //remove the locally saved temporary file if the upload operation get failed.
//     return null
// }
// }

// export {uploadOnCloudinary}


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// ✅ Add this function to extract public_id from a URL
const getCloudinaryPublicId = (url) => {
  if (!url) return null;

  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return path.parse(filename).name;
};

// ✅ Add this function to delete by public_id
const deleteCloudinaryPublicId = async (publicId, resource_type = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, getCloudinaryPublicId, deleteCloudinaryPublicId };
