import logger from "../lib/logger.js";
import User from "../models/User.js";
import { sendPushToUser } from "../lib/pushService.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user._id;

    // Can't send request to yourself
    if (senderId.equals(userId)) {
      return res.status(400).json({ message: "Cannot send friend request to yourself." });
    }

    // Check if user exists
    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already friends
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json({ message: "Already friends with this user." });
    }

    // Check if request already exists
    const existingRequest = receiver.friendRequests.find(
      (req) => req.from.equals(senderId) && req.status === "pending"
    );
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    // Add friend request to receiver's list
    receiver.friendRequests.push({ from: senderId, status: "pending" });
    await receiver.save();

    // Send push notification to receiver
    const sender = await User.findById(senderId).select("fullName profilePic");
    await sendPushToUser(userId, {
      title: "New Friend Request",
      body: `${sender.fullName} wants to connect with you`,
      icon: sender.profilePic || "/avatar.png",
      data: {
        type: "friend_request",
        fromUserId: senderId.toString(),
        requestId: receiver.friendRequests[receiver.friendRequests.length - 1]._id.toString()
      },
      // Android action buttons
      android: {
        actions: [
          { action: "accept", title: "Accept", icon: "accept_icon" },
          { action: "reject", title: "Reject", icon: "reject_icon" }
        ]
      },
      // iOS action categories (configured in iOS app)
      aps: {
        category: "FRIEND_REQUEST"
      }
    });

    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (error) {
    logger.error("Error in sendFriendRequest", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Find the user and the specific request
    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed." });
    }

    // Update request status
    request.status = "accepted";

    // Add each user to the other's friends list
    if (!user.friends.includes(request.from)) {
      user.friends.push(request.from);
    }

    const sender = await User.findById(request.from);
    if (!sender.friends.includes(userId)) {
      sender.friends.push(userId);
    }

    await user.save();
    await sender.save();

    // Send notification to sender that their request was accepted
    const receiver = await User.findById(userId).select("fullName profilePic");
    await sendPushToUser(request.from, {
      title: "Friend Request Accepted",
      body: `${receiver.fullName} accepted your friend request`,
      icon: receiver.profilePic || "/avatar.png",
      data: {
        type: "friend_request",
        status: "accepted"
      }
    });

    res.status(200).json({ message: "Friend request accepted." });
  } catch (error) {
    logger.error("Error in acceptFriendRequest", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed." });
    }

    // Update request status
    request.status = "rejected";
    await user.save();

    // Send notification to sender that their request was rejected
    const receiver = await User.findById(userId).select("fullName profilePic");
    await sendPushToUser(request.from, {
      title: "Friend Request Rejected",
      body: `${receiver.fullName} declined your friend request`,
      icon: receiver.profilePic || "/avatar.png",
      data: {
        type: "friend_request",
        status: "rejected"
      }
    });

    res.status(200).json({ message: "Friend request rejected." });
  } catch (error) {
    logger.error("Error in rejectFriendRequest", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pending friend requests
export const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "friendRequests.from",
      "fullName profilePic"
    );

    const pendingRequests = user.friendRequests
      .filter((req) => req.status === "pending")
      .map((req) => ({
        _id: req._id,
        from: req.from,
        createdAt: req.createdAt,
      }));

    res.status(200).json(pendingRequests);
  } catch (error) {
    logger.error("Error in getPendingFriendRequests", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user's friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "friends",
      "fullName profilePic email"
    );

    res.status(200).json(user.friends);
  } catch (error) {
    logger.error("Error in getFriends", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Remove from current user's friends list
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: friendId } },
      { new: true }
    );

    // Remove current user from friend's list
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    logger.error("Error in removeFriend", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cancel a sent friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user._id;

    // Remove the request from receiver's list
    await User.findByIdAndUpdate(userId, {
      $pull: {
        friendRequests: { from: senderId, status: "pending" },
      },
    });

    res.status(200).json({ message: "Friend request cancelled." });
  } catch (error) {
    logger.error("Error in cancelFriendRequest", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
};
