import { Router } from 'express';
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideoDetails,
  updateThumbnail,
} from '../controllers/video.controller.js';
import  {verifyJWT}  from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

//Apply JWT auth to all routes
router.use(verifyJWT);

// Upload a New Video
// POST /api/v1/video/

router.post(
  '/',
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  publishAVideo
);

//  Get All Videos
// GET /api/v1/video/
router.get('/', getAllVideos);

//  Toggle Publish Status
// PATCH /api/v1/video/toggle/publish/:videoId

router
.patch('/toggle-publish/:videoId', togglePublishStatus);

//  Get, Delete by ID
// GET /api/v1/video/:videoId
// DELETE /api/v1/video/:videoId

router
  .route('/:videoId')
  .get(getVideoById)
  .delete(verifyJWT, deleteVideo);

// Update Video Details
// PATCH /api/v1/video/details/:videoId

router.patch('/details/:videoId', updateVideoDetails);

//  Update Thumbnail
// PATCH /api/v1/video/thumbnail/:videoId

router.patch(
  '/thumbnail/:videoId',
  upload.single('thumbnail'),
  updateThumbnail
);

export default router;


