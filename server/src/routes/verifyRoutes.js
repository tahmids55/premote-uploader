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

  if (!env.verifyName || !env.secretCode) {
    clearVerifiedCookie(res);
    return res.status(500).json({ message: "Verification is not configured on server" });
  }

  const isNameValid = safeEqual(String(name || "").trim(), env.verifyName);
  const isCodeValid = safeEqual(String(code || "").trim(), env.secretCode);

  if (!isNameValid || !isCodeValid) {
    clearVerifiedCookie(res);
    return res.status(401).json({ message: "Verification failed: name or secret code is incorrect" });
  }

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
