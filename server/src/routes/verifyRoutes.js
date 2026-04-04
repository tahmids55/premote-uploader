import express from "express";
import crypto from "crypto";
import { env } from "../config/env.js";
import {
  clearVerifiedCookie,
  setVerifiedCookie
} from "../middleware/verification.js";

const router = express.Router();
const MAX_FAILED_ATTEMPTS = 3;
const BAN_DURATION_MS = 5 * 60 * 1000;
const verifyAttemptState = new Map();

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getRetryAfterSeconds(bannedUntil) {
  const remainingMs = Math.max(0, bannedUntil - Date.now());
  return Math.ceil(remainingMs / 1000);
}

function getAttemptEntry(ip) {
  const existing = verifyAttemptState.get(ip);
  if (existing) {
    return existing;
  }

  const initial = {
    failedAttempts: 0,
    bannedUntil: 0
  };
  verifyAttemptState.set(ip, initial);
  return initial;
}

router.post("/check", (req, res) => {
  const { name, code } = req.body || {};
  const ip = getClientIp(req);
  const attemptEntry = getAttemptEntry(ip);

  if (attemptEntry.bannedUntil > Date.now()) {
    const retryAfterSeconds = getRetryAfterSeconds(attemptEntry.bannedUntil);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    clearVerifiedCookie(res);
    return res.status(429).json({
      message: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`,
      retryAfterSeconds,
      attemptsRemaining: 0,
      maxAttempts: MAX_FAILED_ATTEMPTS
    });
  }

  if (attemptEntry.bannedUntil && attemptEntry.bannedUntil <= Date.now()) {
    attemptEntry.bannedUntil = 0;
    attemptEntry.failedAttempts = 0;
  }

  if (!env.verifyName || !env.secretCode) {
    clearVerifiedCookie(res);
    return res.status(500).json({ message: "Verification is not configured on server" });
  }

  const isNameValid = safeEqual(String(name || "").trim(), env.verifyName);
  const isCodeValid = safeEqual(String(code || "").trim(), env.secretCode);

  if (!isNameValid || !isCodeValid) {
    attemptEntry.failedAttempts += 1;

    if (attemptEntry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      attemptEntry.failedAttempts = 0;
      attemptEntry.bannedUntil = Date.now() + BAN_DURATION_MS;

      const retryAfterSeconds = getRetryAfterSeconds(attemptEntry.bannedUntil);
      res.setHeader("Retry-After", String(retryAfterSeconds));

      clearVerifiedCookie(res);
      return res.status(429).json({
        message: `Too many failed attempts. Your IP is blocked for ${Math.ceil(BAN_DURATION_MS / 60000)} minutes.`,
        retryAfterSeconds,
        attemptsRemaining: 0,
        maxAttempts: MAX_FAILED_ATTEMPTS
      });
    }

    const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - attemptEntry.failedAttempts);
    clearVerifiedCookie(res);
    return res.status(401).json({
      message: `Verification failed: name or secret code is incorrect. ${attemptsRemaining} attempt(s) remaining before temporary ban.`,
      attemptsRemaining,
      maxAttempts: MAX_FAILED_ATTEMPTS
    });
  }

  verifyAttemptState.delete(ip);
  setVerifiedCookie(res);
  return res.json({ verified: true });
});

router.post("/", (req, res) => {
  req.url = "/check";
  return router.handle(req, res);
});

router.post("/clear", (_req, res) => {
  clearVerifiedCookie(res);
  return res.json({ cleared: true });
});

export default router;
