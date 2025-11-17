import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

// ✅ small change: accept string | null so callers can pass whatever they have safely
export function isValidToken(accessToken: string | null) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

// ✅ this now guarantees:
// - token is stored in sessionStorage
// - axios default Authorization header is set/removed
// - token expiration is scheduled
export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      // Save token so it persists across refreshes
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);

      // Attach token to ALL future axios requests
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server (or your exp)

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp as number);
      } else {
        console.error('Invalid access token payload, clearing session');
        sessionStorage.removeItem(JWT_STORAGE_KEY);
        delete axios.defaults.headers.common.Authorization;
      }
    } else {
      // Clear session
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);

    // On any error, make sure we don't leave a half-broken auth state
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;

    throw error;
  }
}
