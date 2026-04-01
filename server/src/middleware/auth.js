import { env } from "../config/env.js";
import { verifySessionToken } from "../services/session.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = verifySessionToken(token);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid session" });
  }
}
