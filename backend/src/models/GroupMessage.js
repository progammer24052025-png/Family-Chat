// ========================================
// GROUP MESSAGE MODEL — GroupMessage.js
// ========================================
// This file defines what a "Group Message" looks like in our MongoDB database.
// It's similar to the Message model (for 1:1 chats) but with key differences:
//   - Instead of `receiverId`, it has `groupId` (messages go to a group, not a person)
//   - `senderId` is still the user who sent the message
//   - `readBy` tracks which members have seen the message (used for unread counts)
//
// Why separate from Message model?
//   - 1:1 messages: queried by (senderId + receiverId) pair
//   - Group messages: queried by groupId
//   Mixing them would make queries messy and inefficient.
// ========================================

// mongoose: Imported for Schema definition and ObjectId type (for referencing Groups/Users).
import mongoose from "mongoose";

// groupMessageSchema: The blueprint for a GroupMessage document.
const groupMessageSchema = new mongoose.Schema(
  {
    // groupId: The group/broadcast this message belongs to.
    // - type: ObjectId — references a Group document
    // - ref: "Group" — enables .populate("groupId") to get full group details (name, type, members)
    // - required: true — every group message must belong to a group
    //
    // This replaces `receiverId` from the 1:1 Message model.
    // Instead of sending to one person, the message goes to everyone in the group.
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    // senderId: The user who SENT this message.
    // - type: ObjectId — references a User document
    // - ref: "User" — enables .populate("senderId") to get sender's name and profilePic
    // - required: true — every message must have a sender
    //
    // IMPORTANT: In broadcasts, only the admin can be the sender.
    // The controller enforces this before saving the message.
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // text: The actual message content (what the user typed).
    // - type: String — stores the message text
    // - trim: true — removes leading/trailing whitespace
    // - maxlength: 2000 — limits messages to 2000 characters
    // Same validation as 1:1 messages.
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // image: URL to an image attached to the message (stored on Cloudinary).
    // - type: String — stores the image URL
    // - Optional — not every message has an image
    image: {
      type: String,
      default: "",
    },

    // readBy: An array of User ObjectIds who have READ this message.
    // Used to track unread messages for each group member.
    //
    // How it works:
    //   1. When a message is sent, readBy is initialized with [senderId]
    //   2. When a member opens the group chat, their ID is added to readBy
    //   3. To count unread messages for a user in a group, we query:
    //      "messages where groupId=X AND readBy does NOT include me"
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    // isDeleted: Soft delete flag for group messages
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // editedAt: Timestamp of last edit
    editedAt: {
      type: Date,
    },

    // isForwarded: Whether this message was forwarded from another chat or group.
    // Shows "Forwarded" label in the UI (WhatsApp-style).
    // - type: Boolean — defaults to false
    isForwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    // timestamps: true — Mongoose auto-adds createdAt and updatedAt.
    // createdAt is used to order messages chronologically in the group chat.
    timestamps: true,
  }
);

// Database indexes for faster query performance
// Compound index: Optimize group message retrieval (most common query)
groupMessageSchema.index({ groupId: 1, createdAt: -1 });
// Index: Optimize unread message queries in groups
groupMessageSchema.index({ groupId: 1, readBy: 1 });
// Index: Optimize message search within groups
groupMessageSchema.index({ text: "text" });

// mongoose.model("GroupMessage", groupMessageSchema): Creates the GroupMessage model.
// This model is used to:
//   - GroupMessage.create({ groupId, senderId, text }) — send a message to a group
//   - GroupMessage.find({ groupId }) — get all messages in a group
//   - GroupMessage.updateMany({ groupId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } })
//     — mark all unread messages in a group as read
const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

// Export the model so other files can use it:
//   - group.controller.js uses it for sending/receiving group messages
//   - The readBy logic is identical to 1:1 messages, just scoped to a group instead of a user
export default GroupMessage;
