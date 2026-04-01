# PRemote Uploader to Google Drive

A full-stack MERN upload portal where any user can upload files through a simple web UI, and every file is stored in one fixed Google Drive folder controlled by the owner.

This project is designed for both:

- Showcase/demo portfolios
- Personal use with your own Google credentials and Drive folder

## Showcase Highlights

- Clean upload-first UI (no user login required)
- Node.js + Express upload API with `multer`
- Google Drive upload integration via `googleapis`
- Owner account token flow (refresh token based)
- MongoDB logging for upload records
- Production-minded security defaults and environment-based secrets

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Google Integration: Drive API (`googleapis`)

## Architecture

1. User opens frontend and chooses a file.
2. Frontend posts multipart data to backend `/upload`.
3. Backend uses owner refresh token (and optional access token) to call Google Drive API.
4. File is created in the configured folder with `drive.files.create()`.
5. Backend returns Drive file ID and view link.

## Folder Structure

```text
uploader/
  client/
    src/
      components/
      App.jsx
      main.jsx
      styles.css
    .env.example
    package.json
  server/
    src/
      config/
      models/
      routes/
      app.js
      server.js
    .env.example
    package.json
  .gitignore
  package.json
  README.md
```

## Personal Setup (Use Your Own Credentials)

### 1. Google Cloud

1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Create OAuth 2.0 Web Client credentials.
4. Generate a refresh token for your Google account (owner account) with scope:
   - `https://www.googleapis.com/auth/drive.file`
5. Create/select a target folder in Google Drive.

### 2. Environment Files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill `server/.env`:

- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `CLIENT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OWNER_ACCESS_TOKEN` (optional)
- `GOOGLE_OWNER_REFRESH_TOKEN` (required)
- `DRIVE_FOLDER_ID` (required)

Fill `client/.env`:

- `VITE_API_URL` (example: `http://localhost:5000`)

### 3. Install and Run

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173` (or next free Vite port)
- Backend: `http://localhost:5000`

## Security Notes

- Never commit `.env` files or OAuth credential JSON files.
- Keep tokens only on backend, never in frontend code.
- Rotate credentials immediately if exposed.
- Use HTTPS and restricted CORS origins in production.

## Deployment Notes

- Set `NODE_ENV=production`.
- Use managed MongoDB (Atlas or equivalent).
- Set production `CLIENT_URL` and `VITE_API_URL`.
- Ensure the server process can write temporary upload files.

## License

Use this project freely for learning and personal deployment.
