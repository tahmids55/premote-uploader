import express from "express";
import { google } from "googleapis";
import { createOAuthClient } from "../config/google.js";
import { createSessionToken } from "../services/session.js";
import { encryptToken } from "../services/tokenCrypto.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

router.get("/google", (req, res) => {
  const oauth2Client = createOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE, "openid", "email", "profile"]
  });

  return res.redirect(authUrl);
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: "Missing OAuth code" });
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.id || !data.email) {
      return res.status(400).json({ message: "Google profile data missing" });
    }

    const existingUser = await User.findOne({ googleId: data.id });
    const refreshTokenPlain = tokens.refresh_token || null;

    if (!refreshTokenPlain && !existingUser) {
      return res
        .status(400)
        .json({ message: "Refresh token missing. Re-consent is required." });
    }

    if (!tokens.access_token && !existingUser) {
      return res
        .status(400)
        .json({ message: "Access token missing from Google OAuth response." });
    }

    const accessTokenEnc = tokens.access_token
      ? encryptToken(tokens.access_token)
      : existingUser.accessTokenEnc;

    const refreshTokenEnc = refreshTokenPlain
      ? encryptToken(refreshTokenPlain)
      : existingUser.refreshTokenEnc;

    const user = await User.findOneAndUpdate(
      { googleId: data.id },
      {
        googleId: data.id,
        email: data.email,
        name: data.name || data.email,
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiryDate: tokens.expiry_date || null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const sessionToken = createSessionToken(user.id);

    res.cookie(env.cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.redirect(env.clientUrl);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production"
  });

  return res.json({ message: "Logged out" });
});

export default router;
