module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, code } = req.body || {};

    // Use environment variables from Vercel if set, otherwise fallback to defaults
    const expectedName = process.env.VERIFY_NAME || "Taki";
    const expectedCode = process.env.VERIFY_CODE || "1234";

    if (!name || !code) {
      return res.status(400).json({ message: "Name and secret code are required" });
    }

    if (name.toLowerCase() === expectedName.toLowerCase() && code === expectedCode) {
      // Verification successful
      return res.status(200).json({ success: true, message: "Verification successful" });
    } else {
      // Verification failed
      return res.status(401).json({ message: "Incorrect name or secret code" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Internal server error during verification" });
  }
};