import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  getUnreadCounts,
  markAsRead,
  editMessage,
  deleteMessage,
  toggleStarMessage,
  getStarredMessages,
  forwardMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/unread-counts", getUnreadCounts);
router.put("/read/:id", markAsRead);
router.get("/starred", getStarredMessages); // Get all starred messages
router.post("/forward", forwardMessage); // Forward message to multiple users
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.put("/:id", editMessage); // Edit message
router.delete("/:id", deleteMessage); // Delete message
router.put("/star/:messageId", toggleStarMessage); // Star/unstar message

export default router;
