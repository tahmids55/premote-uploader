import { google } from "googleapis";
import { env } from "./env.js";

export function createOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

export function createDriveClient(oauth2Client) {
  return google.drive({ version: "v3", auth: oauth2Client });
}
