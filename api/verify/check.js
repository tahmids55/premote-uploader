const MAX_FAILED_ATTEMPTS = 3;
const BAN_DURATION_MS = 5 * 60 * 1000;
const verifyAttemptState = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
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

function parseRequestBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (_error) {
      return null;
    }
  }

  return req.body || {};
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const ip = getClientIp(req);
    const attemptEntry = getAttemptEntry(ip);

    if (attemptEntry.bannedUntil > Date.now()) {
      const retryAfterSeconds = getRetryAfterSeconds(attemptEntry.bannedUntil);
      res.setHeader("Retry-After", String(retryAfterSeconds));
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

    const requestBody = parseRequestBody(req);
    if (!requestBody) {
      return res.status(400).json({ message: "Invalid request body JSON" });
    }

    const { name, code } = requestBody;

    // Use environment variables from Vercel if set, otherwise fallback to defaults
    const expectedName = process.env.VERIFY_NAME || "Taki";
    const expectedCode = process.env.SECRET_CODE || process.env.VERIFY_CODE || "1234";

    if (!name || !code) {
      return res.status(400).json({ message: "Name and secret code are required" });
    }

    if (name.toLowerCase() === expectedName.toLowerCase() && code === expectedCode) {
      verifyAttemptState.delete(ip);
      // Verification successful
      return res.status(200).json({ success: true, message: "Verification successful" });
    } else {
      attemptEntry.failedAttempts += 1;
      const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - attemptEntry.failedAttempts);

      if (attemptEntry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        attemptEntry.failedAttempts = 0;
        attemptEntry.bannedUntil = Date.now() + BAN_DURATION_MS;

        const retryAfterSeconds = getRetryAfterSeconds(attemptEntry.bannedUntil);
        res.setHeader("Retry-After", String(retryAfterSeconds));

        return res.status(429).json({
          message: `Too many failed attempts. Your IP is blocked for ${Math.ceil(BAN_DURATION_MS / 60000)} minutes.`,
          retryAfterSeconds,
          attemptsRemaining: 0,
          maxAttempts: MAX_FAILED_ATTEMPTS
        });
      }

      return res.status(401).json({
        message: `Incorrect name or secret code. ${attemptsRemaining} attempt(s) remaining before temporary ban.`,
        attemptsRemaining,
        maxAttempts: MAX_FAILED_ATTEMPTS
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Internal server error during verification" });
  }
};