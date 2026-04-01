import dotenv from "dotenv";

dotenv.config();

function parseGoogleDriveFolderId(input) {
  if (!input) {
    return null;
  }

  // Allow passing a raw folder id or a full folder URL.
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  const idQueryMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch?.[1]) {
    return idQueryMatch[1];
  }

  return input;
}

const requiredEnv = [
  "MONGO_URI",
  "CLIENT_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_OWNER_REFRESH_TOKEN"
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const resolvedFolderId = parseGoogleDriveFolderId(
  process.env.DRIVE_FOLDER_ID || process.env.DRIVE_FOLDER_LINK
);

if (!resolvedFolderId) {
  throw new Error(
    "Missing Drive target. Set DRIVE_FOLDER_ID or DRIVE_FOLDER_LINK in environment variables."
  );
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleOwnerAccessToken: process.env.GOOGLE_OWNER_ACCESS_TOKEN || "",
  googleOwnerRefreshToken: process.env.GOOGLE_OWNER_REFRESH_TOKEN,
  driveFolderId: resolvedFolderId
};
