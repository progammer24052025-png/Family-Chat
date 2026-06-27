import jwt from "jsonwebtoken";
import { ENV } from "./env.js";
import { JWT_CONFIG, COOKIE_SETTINGS } from "./constants.js";

export const generateToken = (userId, res, req) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_CONFIG.EXPIRATION,
  });

  // Detect cross-origin requests (e.g. frontend via ngrok hitting local backend).
  // Cross-origin cookies require sameSite:"none" + secure:true to be stored by the browser.
  const requestOrigin = req?.headers?.origin;
  const isCrossOrigin = requestOrigin && !ENV.CLIENT_URL.includes(requestOrigin)
    ? false // origin not in allowlist — shouldn't happen, default to strict
    : requestOrigin && requestOrigin !== `http://localhost:${ENV.PORT || 3000}`;

  // same-origin (localhost:5173 → localhost:3000 in dev): secure can be false
  // cross-origin (ngrok https → localhost:3000): secure must be true
  const isProduction = ENV.NODE_ENV === "production";

  res.cookie(JWT_CONFIG.COOKIE_NAME, token, {
    maxAge: JWT_CONFIG.EXPIRATION_MS,
    httpOnly: COOKIE_SETTINGS.HTTP_ONLY,
    sameSite: isProduction || isCrossOrigin ? COOKIE_SETTINGS.SAME_SITE_NONE : COOKIE_SETTINGS.SAME_SITE_LAX,
    secure: isProduction || isCrossOrigin ? COOKIE_SETTINGS.SECURE_PROD : COOKIE_SETTINGS.SECURE_DEV,
  });

  return token;
};

// http://localhost
// https://dsmakmk.com
