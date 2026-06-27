// ========================================
// AUTHENTICATION CONTROLLER — auth.controller.js
// ========================================
// This file contains the ACTUAL LOGIC for authentication operations.
// The route file (auth.route.js) just says "when POST /signup, run signup()".
// This file IS the signup() function — it handles:
//   1. Validating input (email format, password length)
//   2. Checking if user already exists
//   3. Hashing the password (NEVER store plain text passwords)
//   4. Creating the user in the database
//   5. Generating a JWT token and setting it as an HTTP-only cookie
//   6. Sending a welcome email
//
// JWT (JSON Web Token) = A signed token that proves the user's identity.
// After login, the browser stores it in an HTTP-only cookie. Every subsequent
// request sends this cookie automatically, and the backend verifies it to
// know who the user is.
// ========================================

// sendWelcomeEmail: Sends a welcome email to new users after signup.
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

// generateToken: Creates a JWT token and sets it as an HTTP-only cookie.
// Defined in utils.js — we'll cover it later in the learning path.
import { generateToken } from "../lib/utils.js";

// validatePassword: Checks password strength against security requirements.
import { validatePassword } from "../lib/passwordValidation.js";

// logger: Winston logger for structured error logging
import logger from "../lib/logger.js";

// User: The Mongoose model for the "users" collection.
// Used to create new users (signup) and find existing users (login).
import User from "../models/User.js";

// bcrypt: A library for hashing passwords securely.
// Hashing = One-way encryption. You can hash "password123" → "$2b$10$abc123...",
// but you CANNOT reverse it. To verify a password, you hash the input and compare.
// This means even if someone steals your database, they can't read passwords.
import bcrypt from "bcryptjs";

// ENV: Contains environment variables (CLIENT_URL for the welcome email link).
import { ENV } from "../lib/env.js";

// cloudinary: The Cloudinary SDK for uploading profile pictures.
// Profile pics are uploaded to Cloudinary (cloud image hosting) and we store the URL.
import cloudinary from "../lib/cloudinary.js";

// ========================================
// SIGNUP — Create a new user account
// ========================================
// Called when a user fills out the signup form and clicks "Sign Up".
// Flow: Validate → Check email exists → Hash password → Save user → Set JWT cookie → Send email
export const signup = async (req, res) => {
  // Extract fields from the request body (sent by the frontend as JSON).
  const { fullName, email, password } = req.body;

  try {
    // --- STEP 1: Validate required fields ---
    // If any field is missing or empty, reject the request with 400 Bad Request.
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // --- STEP 2: Validate password strength ---
    // Enforces modern security standards: min 8 chars, uppercase, lowercase, number, special char.
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // --- STEP 3: Validate email format ---
    // Regex checks: "something@something.something"
    // Rejects: "hello", "hello@", "@domain.com", "user@.com"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // --- STEP 4: Check if email already exists ---
    // User.findOne() searches the "users" collection for a document with this email.
    // If found, reject signup — each email can only have one account.
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // --- STEP 5: Hash the password ---
    // NEVER store plain text passwords. bcrypt.hash() converts "123456" into
    // something like "$2b$10$abc123xyz..." — a one-way hash that can't be reversed.
    //
    // bcrypt.genSalt(10): Generates a "salt" (random data) with 10 rounds of hashing.
    // More rounds = slower but more secure. 10 is a good balance.
    // bcrypt.hash(password, salt): Hashes the password with the salt.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- STEP 6: Create the new User object ---
    // This does NOT save to the database yet — it just creates the object in memory.
    // We use the hashedPassword, NOT the raw password.
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    // --- STEP 7: Save the user and set the JWT cookie ---
    // newUser.save() writes the user to MongoDB. This returns the saved document
    // with the auto-generated _id, createdAt, updatedAt fields.
    if (newUser) {
      // IMPORTANT ORDER: Save first, THEN generate token.
      // Why? generateToken needs the user's _id, which is only assigned after saving.
      //
      // Old code (commented out) had a race condition: token was generated before save,
      // which could fail if the save encountered an error (duplicate email, etc.).
      const savedUser = await newUser.save();

      // generateToken(): Creates a JWT signed with the user's _id and sets it
      // as an HTTP-only cookie. HTTP-only means JavaScript can't read it
      // (prevents XSS attacks stealing the token).
      // The `req` parameter is used to determine the request's origin for cookie settings.
      generateToken(savedUser._id, res, req);

      // --- STEP 8: Send response to the frontend ---
      // Return the user object (WITHOUT the password!) to the frontend.
      // The frontend stores this in Zustand state to show the user's info in the UI.
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      // --- STEP 9: Send welcome email (in background) ---
      // This runs AFTER the response is sent. If it fails, the user is still signed up —
      // the email is a nice-to-have, not critical.
      // Wrapped in try-catch so email failures don't crash the signup.
      try {
        // ENV.CLIENT_URL[0] = The first allowed origin (usually http://localhost:5173).
        // Used in the welcome email's "Open Family Chat" button link.
        await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL[0]);
      } catch (error) {
        logger.warn("Failed to send welcome email", { error: error.message, email: savedUser.email });
      }
    } else {
      // This branch is rarely hit — User constructor would throw before this.
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    // Catch-all for any unexpected errors (database down, network issues, etc.).
    logger.error("Error in signup controller", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

// ========================================
// LOGIN — Authenticate an existing user
// ========================================
// Called when a user fills out the login form and clicks "Log In".
// Flow: Validate → Find user → Compare password → Set JWT cookie → Return user
export const login = async (req, res) => {
  // Extract email and password from the request body.
  const { email, password } = req.body;

  // Both fields are required — reject if missing.
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // --- STEP 1: Find the user by email ---
    // If no user exists with this email, reject.
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // SECURITY: We say "Invalid credentials" (not "Email not found" or "Wrong password").
    // This prevents attackers from figuring out which emails are registered.
    // Always be vague about WHICH part is wrong.

    // --- STEP 2: Compare the provided password with the stored hash ---
    // bcrypt.compare() hashes the input password and checks if it matches the stored hash.
    // Returns true if they match, false if they don't.
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // --- STEP 3: Generate JWT token and set cookie ---
    // Same as signup — creates a signed JWT with the user's _id and sets it as a cookie.
    generateToken(user._id, res, req);

    // --- STEP 4: Return the user object (without password) ---
    // The frontend stores this in Zustand state to show the user's info.
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    // Catch-all for unexpected errors.
    logger.error("Error in login controller", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

// ========================================
// LOGOUT — Clear the JWT cookie
// ========================================
// Called when the user clicks "Log Out".
// We don't need to do anything server-side except clear the cookie.
// The frontend also clears its Zustand auth state.
//
// _ (underscore) = Unused parameter. The request object (req) is not needed here,
// so we use `_` as a convention to indicate "this parameter is intentionally ignored".
export const logout = (_, res) => {
  // res.cookie(): Sets a cookie. By setting "jwt" to an empty string with maxAge: 0,
  // the browser immediately expires and deletes the cookie.
  // After this, the user is no longer authenticated.
  res.cookie("jwt", "", { maxAge: 0 });

  res.status(200).json({ message: "Logged out successfully" });
};

// ========================================
// UPDATE PROFILE — Upload a new profile picture
// ========================================
// Called when the user selects a new profile picture.
// Requires authentication (protectRoute middleware runs first).
// Flow: Validate → Upload to Cloudinary → Update user in DB → Return updated user
export const updateProfile = async (req, res) => {
  try {
    // Extract the base64-encoded image from the request body.
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    // req.user is set by protectRoute middleware (the JWT was verified and the user's
    // data was attached to req.user). This is how we know WHO is making the request.
    const userId = req.user._id;

    // Upload the base64 image to Cloudinary.
    // cloudinary.uploader.upload() sends the image to Cloudinary's servers,
    // they store it and return a URL (secure_url) where the image can be accessed.
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // Update the user's profilePic field in MongoDB with the new Cloudinary URL.
    // User.findByIdAndUpdate(userId, { profilePic: url }, { new: true }):
    //   - userId: Which user to update
    //   - { profilePic: url }: What to update
    //   - { new: true }: Return the UPDATED document (not the old one)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    // Return the updated user object to the frontend.
    res.status(200).json(updatedUser);
  } catch (error) {
    // Catch-all for errors (Cloudinary upload failed, DB error, etc.).
    logger.error("Error in update profile", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};
