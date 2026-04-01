import { env } from "../config/env.js";

const VERIFIED_COOKIE_NAME = "uploader_verified";

function parseCookies(headerValue = "") {
  return headerValue
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf("=");
      if (index === -1) {
        return acc;
      }

      const key = item.slice(0, index).trim();
      const value = decodeURIComponent(item.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
}

export function setVerifiedCookie(res) {
  res.cookie(VERIFIED_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 60 * 60 * 1000
  });
}

export function clearVerifiedCookie(res) {
  res.clearCookie(VERIFIED_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production"
  });
}

export function requireVerified(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || "");

  if (cookies[VERIFIED_COOKIE_NAME] !== "1") {
    return res.status(403).json({ message: "Verification required" });
  }

  return next();
}
