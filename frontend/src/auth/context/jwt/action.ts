'use client';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    // ✅ Backend expects `emailOrUsername`, so we map the email field here
    const params = { emailOrUsername: email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    // Backend currently returns `{ success, token, user }`
    // But the frontend originally expects `accessToken`
    // So we support both shapes: prefer `accessToken`, fallback to `token`
    const { accessToken, token } = res.data;

    const finalToken = accessToken || token;

    if (!finalToken) {
      throw new Error('Access token not found in response');
    }

    // `setSession` should handle storing the token and setting Authorization header
    setSession(finalToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    // Same flexible handling as sign in: support `accessToken` or `token`
    const { accessToken, token } = res.data;

    const finalToken = accessToken || token;

    if (!finalToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, finalToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (userId?: string | number): Promise<void> => {
  try {
    if (userId) {
      sessionStorage.removeItem(`PROFILE_REDIRECT_LOCK_${userId}`);
    }
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

