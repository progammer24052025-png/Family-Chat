// ========================================
// HEALTH CHECK ROUTE — health.route.js
// ========================================
// Provides a /api/health endpoint for uptime monitoring and deployment health checks.
// Returns server status, database connection status, and uptime information.
// Used by monitoring services (Render, Railway, UptimeRobot) to verify the server is healthy.
// ========================================

import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * GET /api/health
 * Returns:
 *   - status: Overall server health ("healthy" or "degraded")
 *   - uptime: How long the server has been running (seconds)
 *   - timestamp: Current server time
 *   - database: MongoDB connection status ("connected" or "disconnected")
 *   - version: Node.js version running the server
 */
router.get("/", (req, res) => {
  // Check database connection status
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  // Determine overall health status
  // Server is "degraded" if database is disconnected
  const overallStatus = dbStatus === "connected" ? "healthy" : "degraded";

  res.status(dbStatus === "connected" ? 200 : 503).json({
    status: overallStatus,
    uptime: process.uptime(), // Server uptime in seconds
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: process.version, // Node.js version (e.g., "v20.11.0")
  });
});

export default router;
