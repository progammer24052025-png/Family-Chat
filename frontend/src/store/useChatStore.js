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

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

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
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: messages.concat(res.data) });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
  },
}));
