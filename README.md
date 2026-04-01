# PRemote Uploader to Google Drive

Simple upload-only app for Vercel deployment.

- Frontend: React (Vite)
- Backend: one Vercel Serverless Function at `/api/upload`
- Goal: upload files directly to one fixed Google Drive folder

## Step 1: Keep only the upload backend function

This repo now includes one function:

- `api/upload.js`

It accepts a file via multipart/form-data and uploads it to your Google Drive folder using Google OAuth credentials stored in Vercel env variables.

No listing endpoint is required.

## Step 2: Vercel Environment Variables

In Vercel Project Settings -> Environment Variables, add:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OWNER_REFRESH_TOKEN`
- `DRIVE_FOLDER_ID`

These are used only by `api/upload.js`.
Do not expose them in frontend code.

## Step 3: Frontend upload

Frontend sends file to `/api/upload`:

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

fetch("/api/upload", {
  method: "POST",
  body: formData
})
  .then((res) => res.json())
  .then((data) => console.log("Uploaded:", data));
```

## Step 4: Test upload

- Local: `vercel dev` and test `/api/upload`
- Deployed: push to GitHub -> Vercel auto-deploys -> frontend uploads to Google Drive

## Project Structure

```text
.
  api/
    upload.js
  client/
    src/
      App.jsx
      components/UploadCard.jsx
  vercel.json
  package.json
```

## Security Notes

- Never commit `.env` or OAuth client secret files.
- Keep all Google tokens server-side only.
- Rotate tokens immediately if leaked.
