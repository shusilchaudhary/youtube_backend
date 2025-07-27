// import { Router } from 'express';
// import {
//     addComment,
//     deleteComment,
//     getVideoComments,
//     updateComment,
// } from "../controllers/comment.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/:videoId").get(getVideoComments).post(addComment);
// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

// export default router 



import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Protect all comment routes
router.use(verifyJWT);

// GET all comments for a video & POST a new comment
// GET /api/comments/videos/:videoId
// POST /api/comments/videos/:videoId
router
  .route("/videos/:videoId")
  .get(getVideoComments)
  .post(addComment);

// PATCH (update) or DELETE a specific comment
// PATCH /api/comments/:commentId
// DELETE /api/comments/:commentId
router
  .route("/:commentId")
  .patch(updateComment)
  .delete(deleteComment);

export default router;


