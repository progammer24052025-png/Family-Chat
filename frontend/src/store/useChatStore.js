import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  unreadCounts: {}, // { [userId]: count }
  hasMore: false, // Pagination: more messages available
  nextCursor: null, // Pagination: cursor for loading older messages
  replyTo: null, // Reply: message being replied to
  starredMessages: [], // Starred: all starred messages across all chats
  showStarredMessages: false, // UI: toggle starred messages view

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setReplyTo: (replyTo) => {
    // Only set replyTo if it has valid data
    if (replyTo && replyTo.messageId) {
      set({ replyTo });
    } else {
      set({ replyTo: null });
    }
  },
  setShowStarredMessages: (show) => set({ showStarredMessages: show }),

  // Toggle star on a message
  toggleStarMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/star/${messageId}`);
      const { isStarred } = res.data;
      
      // Update the message in the current messages array
      const { messages } = get();
      set({
        messages: messages.map((msg) =>
          msg._id === messageId ? { ...msg, isStarred } : msg
        ),
      });

      // Refresh starred messages list
      const { getStarredMessages } = get();
      await getStarredMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle star");
    }
  },

  // Get all starred messages
  getStarredMessages: async () => {
    try {
      const res = await axiosInstance.get("/messages/starred");
      set({ starredMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load starred messages");
    }
  },

  // Forward a message to multiple users
  forwardMessage: async (messageId, receiverIds) => {
    try {
      const res = await axiosInstance.post("/messages/forward", {
        messageId,
        receiverIds,
      });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to forward message");
      throw error;
    }
  },

  // Friend system functions
  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends");
      return res.data;
    } catch (error) {
      console.error("Failed to get friends:", error);
      return [];
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send friend request");
      throw error;
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const res = await axiosInstance.put(`/friends/request/${requestId}/accept`);
      toast.success("Friend request accepted");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
      throw error;
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      const res = await axiosInstance.put(`/friends/request/${requestId}/reject`);
      toast.success("Friend request rejected");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
      throw error;
    }
  },

  cancelFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/friends/request/${userId}`);
      toast.success("Friend request cancelled");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
      throw error;
    }
  },

  removeFriend: async (friendId) => {
    try {
      const res = await axiosInstance.delete(`/friends/${friendId}`);
      toast.success("Friend removed");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
      throw error;
    }
  },

  getPendingFriendRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests/pending");
      return res.data;
    } catch (error) {
      console.error("Failed to get pending requests:", error);
      return [];
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
      // Also fetch unread counts alongside chat partners
      get().getUnreadCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      // API returns: [{ _id: senderId, count: n }, ...]
      const counts = {};
      res.data.forEach(({ _id, count }) => {
        counts[_id] = count;
      });
      set({ unreadCounts: counts });
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.put(`/messages/read/${userId}`);
      // Clear the unread count for this user locally
      const { unreadCounts } = get();
      set({ unreadCounts: { ...unreadCounts, [userId]: 0 } });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // Backend now returns paginated response: { messages: [...], hasMore, nextCursor }
      set({ 
        messages: res.data.messages || res.data, // Support both old and new format
        hasMore: res.data.hasMore || false,
        nextCursor: res.data.nextCursor || null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Load older messages (pagination)
  loadOlderMessages: async (userId) => {
    const { nextCursor, messages } = get();
    if (!nextCursor) return; // No more messages to load

    try {
      const res = await axiosInstance.get(`/messages/${userId}`, {
        params: {
          limit: 50,
          cursor: nextCursor,
        },
      });

      // Prepend older messages to the existing list
      const olderMessages = res.data.messages || res.data;
      set({
        messages: [...olderMessages, ...messages],
        hasMore: res.data.hasMore || false,
        nextCursor: res.data.nextCursor || null,
      });
    } catch (error) {
      toast.error("Failed to load older messages");
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyTo } = get();
    const { authUser } = useAuthStore.getState();

    // Ensure messages is always an array
    const messagesArray = Array.isArray(messages) ? messages : [];

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      replyTo: replyTo, // Include reply data
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messagesArray, optimisticMessage], replyTo: null });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        ...messageData,
        replyTo, // Send reply data to backend
      });
      set({ messages: [...messagesArray, res.data] });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messagesArray });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, unreadCounts } = get();
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;

      if (isMessageSentFromSelectedUser) {
        // Chat with this sender is open — show message and mark as read immediately
        const currentMessages = get().messages;
        set({ messages: [...currentMessages, newMessage] });
        get().markMessagesAsRead(newMessage.senderId);
      } else {
        // Chat with this sender is NOT open — increment unread count
        const senderId = newMessage.senderId;
        set({
          unreadCounts: {
            ...unreadCounts,
            [senderId]: (unreadCounts[senderId] || 0) + 1,
          },
        });
      }

      // Read isSoundEnabled live from store (not from stale closure)
      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });

    // When someone else reads our messages, no action needed for MVP
    socket.on("messagesRead", () => {
      // Future: could show "read" receipts on sent messages
    });

    // Listen for message edits
    socket.on("messageEdited", (editedMessage) => {
      const { messages } = get();
      set({
        messages: messages.map((msg) =>
          msg._id === editedMessage._id ? editedMessage : msg
        ),
      });
    });

    // Listen for message deletions
    socket.on("messageDeleted", ({ messageId, isDeleted }) => {
      const { messages } = get();
      set({
        messages: messages.map((msg) =>
          msg._id === messageId ? { ...msg, isDeleted, text: "", image: "" } : msg
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  },

  // Delete a message
  deleteMessage: async (messageId, deleteForEveryone = true) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Update local state
      const { messages } = get();
      if (deleteForEveryone) {
        // Mark as deleted in local state
        set({
          messages: messages.map((msg) =>
            msg._id === messageId ? { ...msg, isDeleted: true, text: "", image: "" } : msg
          ),
        });
      } else {
        // Remove from view (delete for me only)
        set({
          messages: messages.filter((msg) => msg._id !== messageId),
        });
      }
    } catch (error) {
      throw error;
    }
  },

  // Edit a message
  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text: newText });
      
      // Update local state with edited message
      const { messages } = get();
      set({
        messages: messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error) {
      throw error;
    }
  },
}));
