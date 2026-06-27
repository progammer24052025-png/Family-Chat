// ========================================
// WINSTON LOGGER CONFIGURATION
// ========================================
// Replaces console.log/console.error with a professional logging system.
// Features:
//   - Log levels: error, warn, info, http, debug
//   - Structured JSON format for production
//   - Human-readable format for development
//   - Automatic timestamps
//   - File output for errors (error.log) and all logs (combined.log)
// ========================================

import winston from "winston";
import { ENV } from "./env.js";

// Define log format based on environment
const logFormat = ENV.NODE_ENV === "production"
  ? winston.format.json() // Machine-readable JSON in production
  : winston.format.combine(
      winston.format.colorize(), // Color-coded output
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Format: [timestamp] LEVEL: message
        let log = `${timestamp} ${level}: ${message}`;
        // Include additional metadata if present
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        return log;
      })
    );

// Create the logger instance
const logger = winston.createLogger({
  level: ENV.NODE_ENV === "production" ? "warn" : "debug", // More verbose in development
  format: logFormat,
  transports: [
    // Always log to console
    new winston.transports.Console({
      format: ENV.NODE_ENV === "production"
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),

    // In production, also log to files
    ...(ENV.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error", // Only errors
            maxsize: 5242880, // 5MB per file
            maxFiles: 5, // Keep last 5 files
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

export default logger;
