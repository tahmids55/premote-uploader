const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

let cachedAccessToken = "";
let cachedAccessTokenExpiresAt = 0;

function buildTokenRequestBody(clientId, clientSecret, refreshToken) {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("refresh_token", refreshToken);
  params.set("grant_type", "refresh_token");
  return params.toString();
}

function createTokenError(message, code, status, details) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

function getCachedToken() {
  if (!cachedAccessToken) {
    return null;
  }

  if (Date.now() >= cachedAccessTokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
    cachedAccessToken = "";
    cachedAccessTokenExpiresAt = 0;
    return null;
  }

  return cachedAccessToken;
}

async function requestNewAccessToken(clientId, clientSecret, refreshToken) {
  let response;

  try {
    response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: buildTokenRequestBody(clientId, clientSecret, refreshToken)
    });
  } catch (networkError) {
    throw createTokenError(
      "Google token refresh failed due to network error",
      "network_error",
      503,
      { cause: networkError?.message || String(networkError) }
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorCode = data?.error || "token_request_failed";
    const errorDescription = data?.error_description || "Unknown Google OAuth error";
    throw createTokenError(
      `Google token refresh failed: ${errorCode} (${errorDescription})`,
      errorCode,
      response.status,
      data
    );
  }

  if (!data?.access_token) {
    throw createTokenError(
      "Google token refresh failed: access_token missing in response",
      "missing_access_token",
      502,
      data
    );
  }

  const expiresInSeconds = Number(data.expires_in || 3600);
  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt = Date.now() + expiresInSeconds * 1000;

  return cachedAccessToken;
}

async function getAccessToken({ clientId, clientSecret, refreshToken, forceRefresh = false }) {
  if (!clientId || !clientSecret || !refreshToken) {
    throw createTokenError(
      "Missing OAuth credentials: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_OWNER_REFRESH_TOKEN are required",
      "missing_oauth_credentials",
      500
    );
  }

  if (!forceRefresh) {
    const cachedToken = getCachedToken();
    if (cachedToken) {
      return cachedToken;
    }
  }

  try {
    return await requestNewAccessToken(clientId, clientSecret, refreshToken);
  } catch (error) {
    if (error.code === "invalid_grant") {
      console.error("Google refresh token is invalid or expired.", error.details || error.message);
    } else {
      console.error("Failed to refresh Google access token.", error.details || error.message);
    }

    throw error;
  }
}

module.exports = {
  getAccessToken
};
