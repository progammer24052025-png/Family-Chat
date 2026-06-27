import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingFriendRequests,
  getFriends,
  removeFriend,
  cancelFriendRequest,
} from "../controllers/friend.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(arcjetProtection, protectRoute);

// Friend request management
router.post("/request/:userId", sendFriendRequest);
router.put("/request/:requestId/accept", acceptFriendRequest);
router.put("/request/:requestId/reject", rejectFriendRequest);
router.delete("/request/:userId", cancelFriendRequest);

// Friends list
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);

// Get pending requests
router.get("/requests/pending", getPendingFriendRequests);

export default router;
