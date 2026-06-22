import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res, req) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
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

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks: cross-site scripting
    sameSite: isProduction || isCrossOrigin ? "none" : "lax",
    secure: isProduction || isCrossOrigin,
  });

  return token;
};

// http://localhost
// https://dsmakmk.com
