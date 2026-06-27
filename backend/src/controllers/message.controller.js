import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { sendPushToUser } from "../lib/pushService.js";
import sanitizeHtml from "sanitize-html";
import logger from "../lib/logger.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    logger.error("Error in getAllContacts", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    
    // Pagination parameters
    // limit: Number of messages to return (default 50, max 100)
    // cursor: Timestamp of the oldest message loaded (for loading older messages)
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    // Build query for conversation messages
    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    // If cursor provided, only fetch messages older than cursor (for pagination)
    if (cursor) {
      query.createdAt = { $lt: cursor };
    }

    // Fetch messages sorted by newest first, then reverse for chronological order
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first for efficient cursor pagination
      .limit(limit)
      .then((msgs) => msgs.reverse()); // Reverse to chronological order (oldest first)

    // Check if there are more messages to load
    const hasMore = messages.length === limit;
    
    // Get the oldest message timestamp for next cursor
    const nextCursor = hasMore && messages.length > 0 
      ? messages[0].createdAt.toISOString() 
      : null;

    res.status(200).json({
      messages,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    logger.error("Error in getMessages controller", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Sanitize text input: Strip all HTML tags to prevent XSS attacks
    // sanitize-html removes <script>, <iframe>, and other potentially dangerous tags
    // while preserving plain text content
    const sanitizedText = text ? sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }) : "";

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Build message data
    const messageData = {
      senderId,
      receiverId,
      text: sanitizedText,
      image: imageUrl,
      readBy: [senderId], // sender has implicitly read their own message
    };

    // Handle reply data if provided
    if (replyTo && replyTo.messageId) {
      // Fetch the original message to get sender info
      const originalMessage = await Message.findById(replyTo.messageId);
      if (originalMessage) {
        const originalSender = await User.findById(originalMessage.senderId).select("fullName");
        messageData.replyTo = {
          messageId: originalMessage._id,
          senderId: originalMessage.senderId,
          senderName: originalSender?.fullName || "Unknown",
          text: originalMessage.text ? originalMessage.text.substring(0, 100) : "",
          hasImage: !!originalMessage.image,
        };
      }
    }

    const newMessage = new Message(messageData);

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      // Receiver is offline — send push notification
      const sender = await User.findById(senderId).select("fullName profilePic");
      await sendPushToUser(receiverId, {
        title: sender.fullName,
        body: text || "Sent an image",
        icon: sender.profilePic || "/avatar.png",
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    logger.error("Error in sendMessage controller", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    logger.error("Error in getChatPartners", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    // Count unread messages grouped by sender:
    // messages where I am the receiver AND my ID is NOT in readBy
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: myId,
          readBy: { $ne: myId },
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(unreadCounts);
  } catch (error) {
    logger.error("Error in getUnreadCounts", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: partnerId } = req.params;

    // Add my ID to readBy for all unread messages from this partner
    const result = await Message.updateMany(
      {
        senderId: partnerId,
        receiverId: myId,
        readBy: { $ne: myId },
      },
      { $addToSet: { readBy: myId } }
    );

    // Notify the partner (sender) that their messages have been read
    const partnerSocketId = getReceiverSocketId(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("messagesRead", {
        readBy: myId,
        partnerId: partnerId,
      });
    }

    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    logger.error("Error in markAsRead", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/messages/:id — Edit a message (sender only)
export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const myId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty." });
    }

    // Sanitize the edited text
    const sanitizedText = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Only the sender can edit their message
    if (message.senderId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }

    // Cannot edit deleted messages
    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted message." });
    }

    // Update message text and set editedAt timestamp
    message.text = sanitizedText;
    message.editedAt = new Date();
    await message.save();

    // Notify receiver about the edit
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    logger.error("Error in editMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/messages/:id — Soft delete a message (sender only)
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Only the sender can delete their message
    if (message.senderId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    // Soft delete: Mark as deleted instead of removing from database
    message.isDeleted = true;
    message.text = ""; // Clear text content
    message.image = ""; // Clear image
    await message.save();

    // Notify receiver about the deletion
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId: message._id,
        isDeleted: true,
      });
    }

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    logger.error("Error in deleteMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Star or unstar a message
export const toggleStarMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Verify user is part of the conversation
    if (!message.senderId.equals(userId) && !message.receiverId.equals(userId)) {
      return res.status(403).json({ message: "Not authorized to star this message." });
    }

    // Toggle star status
    message.isStarred = !message.isStarred;
    await message.save();

    res.status(200).json({ 
      message: "Message star toggled successfully.",
      isStarred: message.isStarred 
    });
  } catch (error) {
    logger.error("Error in toggleStarMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all starred messages for the current user
export const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages starred by this user
    const starredMessages = await Message.find({
      isStarred: true,
      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    })
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .sort({ createdAt: -1 }); // Newest starred messages first

    res.status(200).json(starredMessages);
  } catch (error) {
    logger.error("Error in getStarredMessages", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward a message to one or more users
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, receiverIds } = req.body;
    const senderId = req.user._id;

    if (!messageId || !receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ message: "Message ID and receiver IDs are required." });
    }

    // WhatsApp allows forwarding to max 5 chats at once
    if (receiverIds.length > 5) {
      return res.status(400).json({ message: "You can forward to a maximum of 5 chats at once." });
    }

    // Find the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Verify user is part of the original conversation
    if (!originalMessage.senderId.equals(senderId) && !originalMessage.receiverId.equals(senderId)) {
      return res.status(403).json({ message: "Not authorized to forward this message." });
    }

    // Create forwarded messages for each receiver
    const forwardedMessages = [];
    for (const receiverId of receiverIds) {
      // Verify receiver exists
      const receiverExists = await User.exists({ _id: receiverId });
      if (!receiverExists) {
        continue; // Skip invalid receivers
      }

      // Verify receiver is a friend
      const sender = await User.findById(senderId);
      if (!sender.friends.includes(receiverId)) {
        continue; // Skip non-friends
      }

      // Create forwarded message (copy of original)
      const forwardedMessage = new Message({
        senderId,
        receiverId,
        text: originalMessage.text,
        image: originalMessage.image,
        isForwarded: true, // Mark as forwarded
        readBy: [senderId],
      });

      await forwardedMessage.save();
      forwardedMessages.push(forwardedMessage);

      // Notify receiver
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", forwardedMessage);
      }

      // Send push notification
      await sendPushToUser(receiverId, {
        title: originalMessage.senderId.equals(senderId) ? "You" : (await User.findById(senderId).select("fullName"))?.fullName,
        body: originalMessage.text || "📷 Photo",
        data: { type: "message", senderId: senderId.toString() },
      });
    }

    res.status(200).json({ 
      message: `Message forwarded to ${forwardedMessages.length} chat(s)`,
      forwardedMessages 
    });
  } catch (error) {
    logger.error("Error in forwardMessage", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

