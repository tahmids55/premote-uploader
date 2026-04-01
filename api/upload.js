import fs from "fs";
import { google } from "googleapis";
import formidable from "formidable";

function parseMultipart(req) {
  const form = formidable({
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    const uploadedFile = pickUploadedFile(files);

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_OWNER_REFRESH_TOKEN
    });

    await oauth2Client.getAccessToken();

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client
    });

    const created = await drive.files.create({
      requestBody: {
        name: uploadedFile.originalFilename || uploadedFile.newFilename,
        parents: [process.env.DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: uploadedFile.mimetype || "application/octet-stream",
        body: fs.createReadStream(uploadedFile.filepath)
      },
      fields: "id,webViewLink"
    });

    return res.status(200).json({
      fileId: created.data.id,
      webViewLink: created.data.webViewLink
    });
  } catch (error) {
    console.error("Upload function error:", error);
    return res.status(500).json({
      message: "Upload failed",
      details: error.message
    });
  }
}
