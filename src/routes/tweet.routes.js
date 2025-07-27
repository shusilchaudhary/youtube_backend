import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router
  .route("/")
  .post(
    upload.fields([{ name: "image", maxCount: 1 }]), // image is optional
    createTweet
  );

router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId")
.patch(updateTweet)
.delete(deleteTweet);

export default router 



