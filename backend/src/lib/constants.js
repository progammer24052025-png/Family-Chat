// ========================================
// APPLICATION CONSTANTS
// ========================================
// Centralized constants to replace magic numbers and strings throughout the codebase.
// Improves code readability and makes configuration changes easier.
// ========================================

// JWT Configuration
export const JWT_CONFIG = {
  EXPIRATION: "7d", // Token expires in 7 days
  EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  COOKIE_NAME: "jwt",
};

// Password Validation Rules
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
};

// Message Limits
export const MESSAGE_LIMITS = {
  MAX_TEXT_LENGTH: 2000,
  MAX_IMAGE_SIZE_MB: 5,
  PAGINATION_DEFAULT_LIMIT: 50, // Messages per page
};

// Group Limits
export const GROUP_LIMITS = {
  MAX_NAME_LENGTH: 60,
  MIN_MEMBERS: 1, // Excluding admin
};

// Rate Limiting
export const RATE_LIMITS = {
  AUTH_MAX_ATTEMPTS: 5, // Max login attempts
  AUTH_WINDOW_MINUTES: 15, // Time window for auth attempts
  GENERAL_MAX_REQUESTS: 100, // General API rate limit
  GENERAL_WINDOW_SECONDS: 60, // Time window for general requests
};

// Cookie Settings
export const COOKIE_SETTINGS = {
  HTTP_ONLY: true,
  SAME_SITE_LAX: "lax",
  SAME_SITE_NONE: "none",
  SECURE_PROD: true,
  SECURE_DEV: false,
};

// Environment Defaults
export const ENV_DEFAULTS = {
  PORT: "3000",
  NODE_ENV: "development",
  CLIENT_URL: "http://localhost:5173",
  SMTP_PORT: "587",
  EMAIL_FROM_NAME: "Family Chat",
};

// Database
export const DB_CONSTANTS = {
  READINESS_CONNECTED: 1, // MongoDB connection readyState value for connected
};

// Socket.io
export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  NEW_MESSAGE: "newMessage",
  NEW_GROUP_MESSAGE: "newGroupMessage",
  MESSAGES_READ: "messagesRead",
  GET_ONLINE_USERS: "getOnlineUsers",
  TYPING: "typing",
  STOP_TYPING: "stopTyping",
};
