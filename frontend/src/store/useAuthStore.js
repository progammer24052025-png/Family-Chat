import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { registerForPushNotifications, unregisterFromPushNotifications } from "../services/notificationService";

// Socket URL configuration:
// - Web development: Empty string (uses Vite proxy to localhost:3000)
// - Web production (Vercel): Direct connection to Render backend
// - Mobile app (Capacitor): Direct connection to Render backend
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  "https://family-chat-bwy9.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });

      toast.success("Account created successfully!");
      get().connectSocket();
      
      // Register for push notifications on mobile
      await registerForPushNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
      
      // Register for push notifications on mobile
      await registerForPushNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
      
      // Unregister from push notifications
      await unregisterFromPushNotifications();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // If socket already exists, just reconnect it (Socket.io handles retries internally)
    const existing = get().socket;
    if (existing) {
      if (!existing.connected) existing.connect();
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true, // ensures cookies are sent with the connection
    });

    socket.connect();
    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
