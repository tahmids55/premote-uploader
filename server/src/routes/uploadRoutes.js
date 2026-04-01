import express from "express";
import fs from "fs";
import multer from "multer";
import { createDriveClient, createOAuthClient } from "../config/google.js";
import { env } from "../config/env.js";
import { Upload } from "../models/Upload.js";
import { requireVerified } from "../middleware/verification.js";

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

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: env.googleOwnerAccessToken || undefined,
      refresh_token: env.googleOwnerRefreshToken
    });

    // Triggers token refresh automatically if the access token is expired.
    await oauth2Client.getAccessToken();

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
    return next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

export default router;
