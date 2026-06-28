import axios from "axios";

// API URL configuration:
// - Development: Uses Vite proxy (relative URL "/api")
// - Production: Direct connection to Render backend
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? "https://buddy-chat-bwy9.onrender.com" : "");

export const axiosInstance = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : "/api",
  withCredentials: true,
});
