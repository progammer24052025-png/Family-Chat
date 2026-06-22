import axios from "axios";

// Relative URL: in dev, Vite's proxy forwards /api to localhost:3000;
// in production, the backend serves the frontend at the same origin.
// This works from any device — including via ngrok.
export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});
