import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createSessionToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
