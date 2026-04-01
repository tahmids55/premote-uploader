import express from "express";
import crypto from "crypto";
import { env } from "../config/env.js";
import {
  clearVerifiedCookie,
  setVerifiedCookie
} from "../middleware/verification.js";

const router = express.Router();

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

router.post("/check", (req, res) => {
  const { name, code } = req.body || {};

  const isNameValid = safeEqual(String(name || "").trim(), env.verifyName);
  const isCodeValid = safeEqual(String(code || "").trim(), env.secretCode);

  if (!isNameValid || !isCodeValid) {
    clearVerifiedCookie(res);
    return res.status(401).json({ message: "Verification failed" });
  }

  setVerifiedCookie(res);
  return res.json({ verified: true });
});

router.post("/clear", (_req, res) => {
  clearVerifiedCookie(res);
  return res.json({ cleared: true });
});

export default router;
