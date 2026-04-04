const fs = require("fs");
const { google } = require("googleapis");
const { IncomingForm } = require("formidable");
const { getAccessToken } = require("./lib/googleAuth");

function parseMultipart(req) {
  const form = new IncomingForm({
    multiples: false,
    maxFileSize: 20 * 1024 * 1024
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

function pickUploadedFile(files) {
  const fileEntry = files.file;

  if (!fileEntry) {
    return null;
  }

  return Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
}

function resolveFolderId(value) {
  const input = String(value || "").trim();

  if (!input) {
    return "";
  }

  const byPath = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) {
    return byPath[1];
  }

  const byQuery = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (byQuery?.[1]) {
    return byQuery[1];
  }

  return input;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  let uploadedFile;

  try {
    const required = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_OWNER_REFRESH_TOKEN",
      "DRIVE_FOLDER_ID"
    ];

    for (const key of required) {
      if (!process.env[key]) {
        return res.status(500).json({ message: `Missing env var: ${key}` });
      }
    }

    const { files } = await parseMultipart(req);
    uploadedFile = pickUploadedFile(files);

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || undefined
    );

    const accessToken = await getAccessToken({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_OWNER_REFRESH_TOKEN
    });

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const folderId = resolveFolderId(process.env.DRIVE_FOLDER_ID);

    if (!folderId) {
      return res.status(500).json({ message: "Invalid DRIVE_FOLDER_ID value" });
    }

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client
    });

    const created = await drive.files.create({
      requestBody: {
        name: uploadedFile.originalFilename || uploadedFile.newFilename,
        parents: [folderId]
      },
      media: {
        mimeType: uploadedFile.mimetype || "application/octet-stream",
        body: fs.createReadStream(uploadedFile.filepath)
      },
      fields: "id,webViewLink",
      supportsAllDrives: true
    });

    return res.status(200).json({
      fileId: created.data.id,
      webViewLink: created.data.webViewLink
    });
  } catch (error) {
    console.error("Upload function error:", error);

    if (error.code === "invalid_grant") {
      return res.status(401).json({
        message: "Google refresh token is invalid or expired.",
        details:
          "Regenerate GOOGLE_OWNER_REFRESH_TOKEN from the same OAuth client and update it in Vercel."
      });
    }

    if (error.code === "unauthorized_client") {
      return res.status(401).json({
        message: "Google OAuth client is not authorized for this refresh token.",
        details:
          "Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET match the OAuth client used to create GOOGLE_OWNER_REFRESH_TOKEN."
      });
    }

    if (typeof error.status === "number" && error.status >= 400 && error.status < 600) {
      return res.status(error.status).json({
        message: "Google OAuth token refresh request failed.",
        details: error.message
      });
    }

    return res.status(500).json({
      message: "Upload failed",
      details: error.message
    });
  } finally {
    if (uploadedFile?.filepath && fs.existsSync(uploadedFile.filepath)) {
      fs.unlinkSync(uploadedFile.filepath);
    }
  }
};
