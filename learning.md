# Learning Log: Problems Faced and Solutions Applied

This file documents the main issues you reported during development/deployment and how each one was solved.

## 1) Initial Architecture Mismatch

### Problem
You wanted a public upload portal where users can upload files directly to **your fixed Google Drive folder**.

### What was wrong initially
The first implementation used end-user Google login (`/auth/google`, per-user token storage), which did not match your required flow.

### Solution
Refactored to owner-driven upload flow:
- Removed user-auth dependency from upload path.
- Upload endpoint now uses owner credentials and fixed folder parent.
- Frontend became upload-first (no login gate).

### Key outcome
Any user can upload; files go directly to your configured owner folder.

---

## 2) Local Runtime Failure: MongoDB Connection Refused

### Error/Symptom
Backend startup failed with Mongo error (ECONNREFUSED on `127.0.0.1:27017`).

### Root cause
MongoDB was not running locally.

### Solution
Started local MongoDB instance and restarted dev stack.

### Key outcome
Server booted and backend became reachable.

---

## 3) Misleading Frontend Upload Error Message

### Error/Symptom
UI showed: `Upload failed. Please try again with a smaller file.` even when backend was down.

### Root cause
Frontend catch block used a generic fallback message for different failure types.

### Solution
Improved error handling logic:
- Network/backend unreachable -> clear connectivity message.
- 413 -> explicit file-size message.
- API message/details -> surfaced to user.

### Key outcome
Errors became actionable instead of misleading.

---

## 4) Port Collision on Backend (`EADDRINUSE: 5000`)

### Error/Symptom
Node crashed with `listen EADDRINUSE`.

### Root cause
A stale process was already bound to port 5000.

### Solution
Killed stale process on port 5000 and restarted services.

### Key outcome
Server started normally on port 5000.

---

## 5) CORS/Origin Mismatch During Local Development

### Error/Symptom
Frontend reported backend unreachable while backend health endpoint was live.

### Root cause
Backend CORS was locked to one origin (e.g., `http://localhost:5173`) while Vite moved to another port (`5174+`).

### Solution
Updated CORS policy to allow localhost dev ports in development mode.

### Key outcome
Requests from changing local Vite ports stopped being blocked.

---

## 6) Vercel Build Failure: `vite: command not found`

### Error/Symptom
Vercel build error:
- `sh: line 1: vite: command not found`
- `npm run build exited with 127`

### Root cause
Build ran from repository root where client dependency installation was not guaranteed.

### Solution
- Adjusted root build script to install client deps before build.
- Added Vercel configuration with correct output directory.

### Key outcome
Frontend build became valid for Vercel root deployment.

---

## 7) Git Push Rejected on New Remote (non-fast-forward)

### Error/Symptom
Push rejected with `fetch first` / remote contains work.

### Root cause
Remote branch had commits not in local branch.

### Solution
Pulled with rebase, then pushed.

### Key outcome
Repository synchronized and push succeeded.

---

## 8) Security Incident: Sensitive Temp File Found (`tmp.txt`)

### Error/Symptom
Unexpected file contained OAuth token exchange output.

### Root cause
Temporary debug artifact was generated and staged accidentally.

### Solution
- Removed file before commit.
- Added ignore rules for temp artifacts and secret files.

### Key outcome
Sensitive data file was not committed.

---

## 9) Production Upload Failure from Vercel: Backend Unreachable

### Error/Symptom
Frontend at Vercel URL could not upload; showed backend unreachable.

### Root cause
Frontend deployment existed, but backend routing/env expectations differed by environment.

### Solution
Converted to Vercel upload-only serverless flow:
- Added single API function: `/api/upload`.
- Frontend posts directly to `/api/upload` for deployed app.
- Added deployment-focused README guidance.

### Key outcome
Architecture aligned with Vercel deployment model for upload-only path.

---

## 10) Serverless Runtime Error: `formidable is not a function`

### Error/Symptom
Vercel function crashed with parser initialization error.

### Root cause
Incorrect Formidable import/usage pattern for runtime.

### Solution
Switched to `IncomingForm` constructor usage.

### Key outcome
Multipart parsing became runtime-compatible.

---

## 11) Google OAuth Token Refresh Error: `unauthorized_client`

### Error/Symptom
Google token endpoint returned 401 with `unauthorized_client`.

### Root cause
Refresh token and OAuth client credentials mismatch (token not issued for the same client id/secret currently configured).

### Solution
- Added explicit error guidance in API response.
- Added optional access-token fallback support.
- Updated token values where provided.

### Required operational fix
In Vercel env, ensure these belong to the **same OAuth app**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OWNER_REFRESH_TOKEN`

### Key outcome
Error is now diagnosable immediately; mismatch path is clear.

---

## 12) Local 404 Upload Error

### Error/Symptom
`Upload failed (HTTP 404)` in local run.

### Root cause
Local Express route is `/upload`, while frontend was calling `/api/upload` (Vercel path).

### Solution
A local-dev route override was added, then reverted per your final preference to keep Vercel-only behavior.

### Final state
Frontend remains Vercel-first (`/api/upload`) because you do not need local upload flow.

---

## 13) Git/Repo Management Changes Completed

### Completed
- Updated remote repository to your requested URL.
- Pushed all deployment and fix commits.
- Added security-focused ignore coverage.
- Refined README for setup + showcase.

---

## 14) Verify Page Brute-Force Protection Gap

### Problem
Verification endpoint allowed unlimited failed attempts from the same IP.

### Before implementation
- No maximum wrong-attempt limit.
- No temporary IP ban after repeated failures.
- No countdown feedback in UI after lockout.

### Solution
- Added per-IP failed-attempt tracking.
- Applied max 3 wrong attempts.
- On third failure, applied 5-minute IP ban (HTTP 429 with `Retry-After`).
- Verify page now shows a live countdown and disables form submit/inputs during lockout.

### Key outcome
Verification is now resistant to repeated rapid guessing attempts, with clear lockout feedback to the user.

---

## Final Guidance for Stable Deployment

1. Keep Vercel env values consistent and from same OAuth app.
2. Rotate tokens if exposed during debugging.
3. Use only server-side env vars for secrets.
4. Redeploy after any env or token change.
5. Check Vercel function logs first for exact error class.

---

## Learning Summary

The majority of failures came from environment/config mismatches (ports, CORS, OAuth credential pairing, deployment routing), not core upload logic. Once runtime + env alignment was fixed, the flow became stable and debuggable.
