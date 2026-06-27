import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  groupUnreadCounts: {}, // { [groupId]: count }
  hasMoreGroups: false, // Pagination: more group messages available
  nextGroupCursor: null, // Pagination: cursor for loading older group messages

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  getMyGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
      get().getGroupUnreadCounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getGroupUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/groups/unread-counts");
      const counts = {};
      res.data.forEach(({ _id, count }) => {
        counts[_id] = count;
      });
      set({ groupUnreadCounts: counts });
    } catch (error) {
      console.error("Error fetching group unread counts:", error);
    }
  },

  createGroup: async ({ name, type, memberIds }) => {
    try {
      const res = await axiosInstance.post("/groups", { name, type, memberIds });
      set({ groups: [res.data, ...get().groups] });
      toast.success(`${type === "broadcast" ? "Broadcast" : "Group"} created!`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group.");
      return null;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      // Backend now returns paginated response: { messages: [...], hasMore, nextCursor }
      set({ 
        groupMessages: res.data.messages || res.data, // Support both formats
        hasMoreGroups: res.data.hasMore || false,
        nextGroupCursor: res.data.nextCursor || null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages.");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Load older group messages (pagination)
  loadOlderGroupMessages: async (groupId) => {
    const { nextGroupCursor, groupMessages } = get();
    if (!nextGroupCursor) return; // No more messages to load

    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`, {
        params: {
          limit: 50,
          cursor: nextGroupCursor,
        },
      });

      // Prepend older messages to the existing list
      const olderMessages = res.data.messages || res.data;
      set({
        groupMessages: [...olderMessages, ...groupMessages],
        hasMoreGroups: res.data.hasMore || false,
        nextGroupCursor: res.data.nextCursor || null,
      });
    } catch (error) {
      toast.error("Failed to load older messages");
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    const { authUser } = useAuthStore.getState();

    // Ensure groupMessages is always an array
    const messagesArray = Array.isArray(groupMessages) ? groupMessages : [];

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      groupId: selectedGroup._id,
      senderId: authUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ groupMessages: [...messagesArray, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
      // Replace optimistic with real message
      set({
        groupMessages: get().groupMessages.map((m) =>
          m._id === tempId ? res.data : m
        ),
      });
    } catch (error) {
      // Remove optimistic message on failure
      set({ groupMessages: messagesArray });
      toast.error(error.response?.data?.message || "Failed to send message.");
    }
  },

  markGroupMessagesAsRead: async (groupId) => {
    try {
      await axiosInstance.put(`/groups/${groupId}/read`);
      const { groupUnreadCounts } = get();
      set({ groupUnreadCounts: { ...groupUnreadCounts, [groupId]: 0 } });
    } catch (error) {
      console.error("Error marking group messages as read:", error);
    }
  },

  addMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/members/add`, {
        memberIds: [userId],
      });
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
      });
      toast.success("Member added.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member.");
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/members/remove`, {
        memberId: userId,
      });
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
      });
      toast.success("Member removed.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member.");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
      });
      toast.success("You left the group.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group.");
    }
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroup, groupUnreadCounts } = get();
      const isFromSelectedGroup = selectedGroup && newMessage.groupId === selectedGroup._id;

      if (isFromSelectedGroup) {
        // Chat is open — show message and mark as read immediately
        set({ groupMessages: [...get().groupMessages, newMessage] });
        get().markGroupMessagesAsRead(newMessage.groupId);
      } else {
        // Chat is closed — increment unread count for this group
        const groupId = newMessage.groupId;
        set({
          groupUnreadCounts: {
            ...groupUnreadCounts,
            [groupId]: (groupUnreadCounts[groupId] || 0) + 1,
          },
        });
      }

      // Play notification sound if enabled
      const { isSoundEnabled } = useChatStore.getState();
      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newGroupMessage");
  },
}));
