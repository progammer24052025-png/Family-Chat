import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import sanitizeHtml from "sanitize-html";
import logger from "../lib/logger.js";
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";

// POST /api/groups — create a group or broadcast
export const createGroup = async (req, res) => {
  try {
    const { name, type, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "At least one member is required." });
    }

    // Ensure admin is always in the members list
    const uniqueMembers = [...new Set([adminId.toString(), ...memberIds.map(String)])];

    const group = new Group({
      name: name.trim(),
      admin: adminId,
      members: uniqueMembers,
      type: type === "broadcast" ? "broadcast" : "group",
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    logger.error("Error in createGroup", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups — list all groups/broadcasts the logged-in user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const myId = req.user._id;

    const groups = await Group.find({ members: myId })
      .populate("admin", "fullName profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/:id — get group details (name, avatar, members, type)
export const getGroupDetails = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Only members can view group details
    const isMember = group.members.some((m) => m._id.toString() === myId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id — update group name/avatar (admin only)
export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, avatar } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.admin.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Only the admin can update the group." });
    }

    if (name) group.name = name.trim();

    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      group.avatar = uploadResponse.secure_url;
    }

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/members/add — add members (admin only, groups only)
export const addMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberIds } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.admin.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Only the admin can add members." });
    }

    if (group.type === "broadcast") {
      return res.status(400).json({ message: "Cannot add members to a broadcast after creation." });
    }

    // Add unique members
    const newMembers = memberIds.filter(
      (id) => !group.members.some((m) => m.toString() === id.toString())
    );
    group.members.push(...newMembers);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addMembers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/members/remove — remove a member (admin only, groups only)
export const removeMember = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberId } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.admin.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Only the admin can remove members." });
    }

    if (memberId.toString() === group.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove the admin from the group." });
    }

    group.members = group.members.filter((m) => m.toString() !== memberId.toString());
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in removeMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/groups/:id/leave — leave a group (non-admin members only)
export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.admin.toString() === myId.toString()) {
      return res.status(400).json({ message: "Admin cannot leave the group. Delete it instead." });
    }

    group.members = group.members.filter((m) => m.toString() !== myId.toString());
    await group.save();

    res.status(200).json({ message: "You left the group." });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/:id/messages — fetch message history for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === myId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    // Build query
    const query = { groupId };
    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    // Fetch messages with pagination
    const messages = await GroupMessage.find(query)
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(limit)
      .then((msgs) => msgs.reverse());

    const hasMore = messages.length === limit;
    const nextCursor = hasMore && messages.length > 0 
      ? messages[0].createdAt.toISOString() 
      : null;

    res.status(200).json({
      messages,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    logger.error("Error in getGroupMessages", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/groups/:id/send — send a message to the group
export const sendGroupMessage = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === senderId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    // Broadcasts: only admin can send
    if (group.type === "broadcast" && group.admin.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Only the admin can send messages in a broadcast." });
    }

    // Sanitize text input: Strip all HTML tags to prevent XSS attacks
    const sanitizedText = text ? sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }) : "";

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text: sanitizedText,
      image: imageUrl,
      readBy: [senderId],
    });

    await newMessage.save();

    // Populate sender for the response and socket emit
    await newMessage.populate("senderId", "fullName profilePic");

    // Emit to all group members' sockets (except sender)
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", {
            ...newMessage.toObject(),
            groupId: groupId.toString(),
          });
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/read — mark all group messages as read
export const markGroupMessagesAsRead = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    await GroupMessage.updateMany(
      { groupId, readBy: { $ne: myId } },
      { $addToSet: { readBy: myId } }
    );

    res.status(200).json({ message: "Marked as read." });
  } catch (error) {
    console.error("Error in markGroupMessagesAsRead:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/unread-counts — unread message counts per group
export const getGroupUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    const unreadCounts = await GroupMessage.aggregate([
      {
        $match: {
          readBy: { $ne: myId },
        },
      },
      {
        $group: {
          _id: "$groupId",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(unreadCounts);
  } catch (error) {
    logger.error("Error in getGroupUnreadCounts", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/messages/:id — Edit a group message (sender only)
export const editGroupMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const myId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty." });
    }

    const sanitizedText = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    if (message.senderId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted message." });
    }

    message.text = sanitizedText;
    message.editedAt = new Date();
    await message.save();

    // Notify group members about the edit
    const group = await Group.findById(message.groupId);
    group.members.forEach((memberId) => {
      if (memberId.toString() !== myId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("groupMessageEdited", message);
        }
      }
    });

    res.status(200).json(message);
  } catch (error) {
    logger.error("Error in editGroupMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/groups/messages/:id — Soft delete a group message (sender only)
export const deleteGroupMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    if (message.senderId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    message.isDeleted = true;
    message.text = "";
    message.image = "";
    await message.save();

    // Notify group members about the deletion
    const group = await Group.findById(message.groupId);
    group.members.forEach((memberId) => {
      if (memberId.toString() !== myId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("groupMessageDeleted", {
            messageId: message._id,
            isDeleted: true,
          });
        }
      }
    });

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    logger.error("Error in deleteGroupMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};
