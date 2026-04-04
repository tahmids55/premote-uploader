import express from "express";
import fs from "fs";
import multer from "multer";
import { createDriveClient, createOAuthClient } from "../config/google.js";
import { env } from "../config/env.js";
import { Upload } from "../models/Upload.js";
import { requireVerified } from "../middleware/verification.js";
import { getAccessToken } from "../services/googleAuth.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

router.post("/", requireVerified, upload.single("file"), async (req, res, next) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const accessToken = await getAccessToken({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      refreshToken: env.googleOwnerRefreshToken
    });

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const drive = createDriveClient(oauth2Client);
    filePath = req.file.path;

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [env.driveFolderId]
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath)
      },
      fields: "id, webViewLink"
    });

    await Upload.create({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      driveFileId: uploadResponse.data.id,
      driveWebViewLink: uploadResponse.data.webViewLink,
      uploaderIp: req.ip
    });

    return res.json({
      fileId: uploadResponse.data.id,
      webViewLink: uploadResponse.data.webViewLink
    });
  } catch (error) {
    if (error.code === "invalid_grant") {
      return res.status(401).json({
        message: "Google refresh token is invalid or expired.",
        details:
          "Regenerate GOOGLE_OWNER_REFRESH_TOKEN from the same OAuth client and update server environment variables."
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

    return next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

export default router;
