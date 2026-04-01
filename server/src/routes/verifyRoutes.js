import express from "express";
import { env } from "../config/env.js";

const router = express.Router();


router.get("/secret-code", (req, res) => {
  // Only send the code and name if set in env
  if (!process.env.SECRET_CODE || !process.env.VERIFY_NAME) {
    return res.status(404).json({ message: "Verification info not set" });
  }
  res.json({ code: process.env.SECRET_CODE, name: process.env.VERIFY_NAME });
});

export default router;
