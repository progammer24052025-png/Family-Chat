// ========================================
// BACKEND ENTRY POINT — server.js
// ========================================
// This is the FIRST file that runs when you start the backend (`npm run dev`).
// It creates the Express app, mounts all API routes, configures middleware
// (CORS, cookies, JSON parsing), and starts the HTTP + WebSocket server.
//
// Think of this file as the "front desk" of your backend — it decides:
//   1. What tools (middleware) every request must pass through
//   2. Which department (route) handles which type of request
//   3. When the server is ready to accept visitors
// ========================================

// ---------- STEP 1: Import Dependencies ----------

// Express: The web framework that handles HTTP requests (GET, POST, PUT, DELETE)
// Without Express, you'd have to use Node's raw `http` module which is verbose.
import express from "express";

// cookie-parser: Reads cookies from incoming requests.
// We use this to read the JWT token stored in the browser's cookie after login.
import cookieParser from "cookie-parser";

// path: Node.js built-in module for working with file/folder paths across OS (Windows/macOS/Linux).
import path from "path";

// cors: "Cross-Origin Resource Sharing" middleware.
// Controls which websites/domains are allowed to talk to this backend.
// Without CORS, a browser on http://localhost:5173 would be blocked from
// calling http://localhost:3000 (different port = different origin).
import cors from "cors";

// ---------- STEP 2: Import Our Own Route Files ----------

// These are the "departments" — each file handles a specific set of API endpoints.
// Example: authRoutes handles /api/auth/signup, /api/auth/login, /api/auth/logout
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import pushRoutes from "./routes/push.route.js";
import healthRoutes from "./routes/health.route.js";
import friendRoutes from "./routes/friend.route.js";

// connectDB: Function that establishes the MongoDB database connection.
import { connectDB } from "./lib/db.js";

// ENV: All environment variables (PORT, MONGO_URI, JWT_SECRET, etc.) loaded in one place.
// Loaded from the `.env` file — never hardcode secrets in code.
import { ENV } from "./lib/env.js";

// app + server: Imported from the Socket.io setup file.
// `app` is the Express application instance.
// `server` is the HTTP server (which Express wraps) — needed for WebSocket upgrades.
// Socket.io attaches itself to this HTTP server to handle real-time connections.
import { app, server } from "./lib/socket.js";

// ---------- STEP 3: Resolve the Project Root Directory ----------

// __dirname gives the directory of the current file (server.js).
// path.resolve() converts it to an absolute path (e.g., "C:\Users\...\backend\src").
// Used later to serve the frontend's built files in production mode.
const __dirname = path.resolve();

// ---------- STEP 4: Choose the Port ----------

// Read PORT from .env file, default to 3000 if not specified.
// The backend will listen at http://localhost:3000 (or whatever IP you're on).
const PORT = ENV.PORT || 3000;

// ---------- STEP 5: Configure Global Middleware ----------

// Middleware = functions that run BEFORE your route handlers.
// They can modify the request, reject it, or pass it to the next handler.

// express.json({ limit: "5mb" }):
// Parses incoming JSON request bodies and puts them in `req.body`.
// The 5mb limit allows users to send large images (base64 encoded) in messages.
// Without this, `req.body` would be `undefined` for JSON requests.
app.use(express.json({ limit: "5mb" }));

// cors():
// Allows the frontend (running on a different origin/port) to call this backend.
// The custom origin function checks if the request's origin is in our allowed list
// (defined in .env as CLIENT_URL). This supports:
//   - Local development: http://localhost:5173
//   - Ngrok tunneling (for mobile testing): https://xxx.ngrok-free.dev
//   - Production: your Render/Deploy URL
// `credentials: true` allows cookies (containing JWT) to be sent with requests.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server calls)
      if (!origin || ENV.CLIENT_URL.includes(origin)) {
        callback(null, true); // null = no error, true = allow this request
      } else {
        callback(new Error("Not allowed by CORS")); // Reject unknown origins
      }
    },
    credentials: true, // Allow cookies to be sent with cross-origin requests
  })
);

// cookieParser():
// Parses the `Cookie` header from incoming requests.
// After login, the JWT is stored in an HTTP-only cookie. This middleware
// makes it accessible as `req.cookies` in route handlers.
app.use(cookieParser());

// ---------- STEP 6: Mount API Routes ----------

// Each route file handles a group of related endpoints.
// The prefix defines the URL path — anything starting with "/api/auth" goes to authRoutes.

// Example: POST /api/auth/login  → handled by authRoutes
// Example: GET  /api/messages/chats → handled by messageRoutes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/friends", friendRoutes);

// ---------- STEP 7: Production Setup (Deployment) ----------

// When deployed to production (Render, Railway, etc.), the frontend is built
// into static files (HTML, CSS, JS) in the `frontend/dist` folder.
// Instead of running a separate Vite server, we serve these files from Express.

if (ENV.NODE_ENV === "production") {
  // express.static(): Serves files from the `dist` folder as-is.
  // Example: A request to /assets/index.css returns the CSS file directly.
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Catch-all route: For ANY URL not matched above, serve index.html.
  // This is needed for React Router (SPA) — if a user refreshes on /chat,
  // the server returns index.html and React Router handles the routing client-side.
  // The `_` (underscore) is a convention for "unused parameter" (we ignore `req`).
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// ---------- STEP 8: Start the Server ----------

// IMPORTANT: We connect to MongoDB BEFORE starting the server.
// Why? If the server starts accepting requests before the DB is ready,
// those requests will fail (e.g., login can't find the User model).
// `.then()` ensures the server only starts listening AFTER DB connection succeeds.

connectDB().then(() => {
  // server.listen(): Starts the HTTP server on the chosen port.
  // `server` (not `app`) is used because Socket.io needs the raw HTTP server
  // to handle WebSocket protocol upgrades (HTTP → WebSocket).
  server.listen(PORT, () => {
    console.log("Server running on port: " + PORT);
  });
});
