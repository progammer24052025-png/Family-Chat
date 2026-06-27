// ========================================
// MESSAGE MODEL — Message.js
// ========================================
// This file defines what a "Message" looks like in our MongoDB database.
// Every message sent between two users creates one document in the "messages" collection.
//
// Key design decisions:
//   - Messages are NOT stored inside a "chat" or "conversation" object.
//     Instead, each message stores senderId and receiverId directly.
//     To get a conversation, we query: "all messages where (sender=A AND receiver=B)
//     OR (sender=B AND receiver=A)" — simple and efficient.
//   - A message can have text, an image, or both.
//   - `readBy` tracks who has seen the message (used for unread counts and read receipts).
// ========================================

// mongoose: Imported for Schema definition and ObjectId type (for referencing Users).
import mongoose from "mongoose";

// messageSchema: The blueprint for a Message document.
const messageSchema = new mongoose.Schema(
  {
    // senderId: The user who SENT this message.
    // - type: mongoose.Schema.Types.ObjectId — This is NOT a string or number.
    //   It's a special MongoDB ObjectId (a 24-character hex string like "67a1b2c3d4e5f6a7b8c9d0e1").
    //   Every document in MongoDB has an _id field of this type.
    // - ref: "User" — This tells Mongoose that this ObjectId points to a document
    //   in the "users" collection. This enables "population" — you can use
    //   .populate("senderId") to automatically fetch the full User object
    //   (name, profilePic, etc.) instead of just the raw ObjectId.
    // - required: true — every message must have a sender
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // receiverId: The user who should RECEIVE this message.
    // Same structure as senderId — it references a User document.
    // Together, senderId + receiverId define a 1:1 conversation.
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // text: The actual message content (what the user typed).
    // - type: String — stores the message text
    // - trim: true — removes leading/trailing whitespace automatically
    //   (e.g., "  hello  " becomes "hello")
    // - maxlength: 2000 — limits messages to 2000 characters to prevent abuse
    // IMPORTANT: Either `text` or `image` (or both) must be present.
    // The controller validates this before saving.
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // image: URL to an image attached to the message (stored on Cloudinary).
    // - type: String — stores the image URL (e.g., "https://res.cloudinary.com/...")
    // - Optional — not every message has an image. If absent, this field is undefined.
    //   Users can send text-only messages, image-only messages, or both.
    image: {
      type: String,
    },

    // readBy: An array of User ObjectIds who have READ this message.
    // This is how we track unread messages and show read receipts.
    //
    // How it works:
    //   1. When a message is sent, readBy is initialized with [senderId]
    //      (the sender has implicitly "read" their own message).
    //   2. When the receiver opens the chat, their ID is added to readBy.
    //   3. To count unread messages for a user, we query:
    //      "messages where receiverId=me AND readBy does NOT include me"
    //
    // - type: Array of ObjectId — each element references a User
    // - ref: "User" — enables population if needed
    // - default: [] — starts as an empty array (populated by the controller on creation)
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    // isDeleted: Soft delete flag for messages.
    // Instead of physically deleting messages from the database, we mark them as deleted.
    // This preserves chat history integrity and allows showing "[Message deleted]" placeholder.
    // - type: Boolean — true if message was deleted by sender
    // - default: false — messages are not deleted by default
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // editedAt: Timestamp of when the message was last edited.
    // Only set when the message is updated (edited by sender).
    // Used to show "edited" label in the UI.
    // - type: Date — stores the edit timestamp
    // - Optional — only present if message has been edited
    editedAt: {
      type: Date,
    },

    // replyTo: Reference to the message this is replying to.
    // Enables WhatsApp-style threaded replies where a message quotes the original.
    // - messageId: The _id of the original message being replied to
    // - senderId: The sender of the original message (for display)
    // - text: First 100 characters of the original message (truncated for preview)
    // - image: Boolean indicating if original message had an image
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      senderName: {
        type: String,
      },
      text: {
        type: String,
        maxlength: 100, // Store truncated preview
      },
      hasImage: {
        type: Boolean,
        default: false,
      },
    },

    // isStarred: Whether the current user has starred this message.
    // Enables WhatsApp-style message bookmarking for quick access later.
    // Starred messages are user-specific (each user has their own starred list).
    // - type: Boolean — defaults to false (not starred)
    // - Used to show star icon and filter starred messages
    isStarred: {
      type: Boolean,
      default: false,
    },

    // isForwarded: Whether this message was forwarded from another chat.
    // Shows "Forwarded" label in the UI (WhatsApp-style).
    // - type: Boolean — defaults to false
    isForwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    // timestamps: true — Mongoose auto-adds createdAt and updatedAt.
    // createdAt is used to order messages chronologically in the chat.
    timestamps: true,
  }
);

// Database indexes for faster query performance
// Compound index: Optimize conversation message retrieval (most common query)
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
// Index: Optimize unread message queries
messageSchema.index({ receiverId: 1, readBy: 1 });
// Index: Optimize message search (text search across message content)
messageSchema.index({ text: "text" });

// mongoose.model("Message", messageSchema): Creates the Message model.
// This model is used to:
//   - Message.create({ senderId, receiverId, text }) — save a new message
//   - Message.find({ $or: [...] }) — find all messages in a conversation
//   - Message.updateMany({ readBy: { $ne: userId } }, { $addToSet: { readBy: userId } })
//     — mark all unread messages from a partner as read
const Message = mongoose.model("Message", messageSchema);

// Export the model so other files can use it:
//   - message.controller.js uses it for sending/receiving/reading messages
//   - group.controller.js has its own GroupMessage model (separate from 1:1 messages)
export default Message;
