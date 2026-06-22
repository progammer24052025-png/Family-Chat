import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Create a reusable SMTP transport using Gmail (or any SMTP provider)
export const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};
