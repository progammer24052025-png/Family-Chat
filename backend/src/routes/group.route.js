import express from "express";
import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessagesAsRead,
  getGroupUnreadCounts,
  editGroupMessage,
  deleteGroupMessage,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/unread-counts", getGroupUnreadCounts);  // before /:id to avoid catching "unread-counts" as an id
router.get("/:id", getGroupDetails);
router.put("/:id", updateGroup);
router.put("/:id/members/add", addMembers);
router.put("/:id/members/remove", removeMember);
router.post("/:id/leave", leaveGroup);
router.get("/:id/messages", getGroupMessages);
router.post("/:id/send", sendGroupMessage);
router.put("/:id/read", markGroupMessagesAsRead);
router.put("/messages/:id", editGroupMessage); // Edit group message
router.delete("/messages/:id", deleteGroupMessage); // Delete group message

export default router;
