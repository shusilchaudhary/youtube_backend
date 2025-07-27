import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateCoverImage, updateUserAvatar } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    upload.fields([
   {
    name: "avatar", maxCount: 1
   },
   {
    name: "coverImage", maxCount: 1
   }
    ]),
    registerUser
)

//login route
router.route("/login").post(loginUser)

//secured logout routes
router.route("/logout").post(verifyJWT, logoutUser)

//refresh-access-token
router.route("/refresh-token").post(refreshAccessToken)

//change-password-route
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

//get-current-user route
router.route("/get-current-user").post(verifyJWT, getCurrentUser)

//update-account-details route
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)

//update-user-avatar route
router.route("/update-user-avatar").patch(verifyJWT,upload.single('avatar'), updateUserAvatar)

//update-user-coverImage route
router.route("/update-user-coverImage").patch(verifyJWT, upload.single('coverImage'), updateCoverImage)

//get-user-channel-profile route
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

//get-watchHistory-route
router.route("/get-watch-history").get(verifyJWT, getWatchHistory)

export default router

//req.body access by the express
//req.files access given by the multer







