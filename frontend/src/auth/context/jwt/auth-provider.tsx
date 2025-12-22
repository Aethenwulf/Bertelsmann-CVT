'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import axios, { endpoints } from 'src/lib/axios';
import { paths } from 'src/routes/paths';

import { AuthContext } from '../auth-context';
import { JWT_STORAGE_KEY } from './constant';
import { setSession, isValidToken } from './utils';

import type { AuthState } from '../../types';

function profileLockKey(userId?: string | number) {
  return userId ? `PROFILE_REDIRECT_LOCK_${userId}` : null;
}

function normalizePath(p: string) {
  return (p || '').replace(/\/+$/, '');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  // ------------------------------------------------------------
  // ✅ single function that actually refetches /auth/me
  // ------------------------------------------------------------
  const fetchMe = useCallback(async () => {
    const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

    if (!accessToken || !isValidToken(accessToken)) {
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      setState({ user: null, loading: false });
      return null;
    }

    await setSession(accessToken);

    const res = await axios.get(endpoints.auth.me);
    const { user } = res.data;

    // store token inside user like you already do
    const nextUser = { ...user, accessToken };

    setState({ user: nextUser, loading: false });
    return nextUser;
  }, [setState]);

  // ------------------------------------------------------------
  // ✅ keep your redirect logic, but run it after fetchMe
  // ------------------------------------------------------------
  const applyProfileRedirectRules = useCallback(
    (user: any) => {
      if (!user) return;

      const current = normalizePath(pathname);
      const profile = normalizePath(paths.dashboard.user.account);

      const isOnProfile = current === profile || current.startsWith(`${profile}/`);
      const needsProfile = user?.profileCompleted === false;

      // If they need profile but already on profile → do nothing
      if (needsProfile && isOnProfile) return;

      // If they need profile and not on profile → redirect
      if (needsProfile && !isOnProfile) {
        router.replace(paths.dashboard.user.account);
        return;
      }

      // lock is scoped per user id
      const lockKey = profileLockKey(user?.id ?? user?.user_id);
      const locked = lockKey ? sessionStorage.getItem(lockKey) === '1' : false;

      if (needsProfile && !locked) {
        if (lockKey) sessionStorage.setItem(lockKey, '1');
        router.replace(paths.dashboard.user.account);
        return;
      }

      // if profile is complete, clear this user's lock
      if (!needsProfile && lockKey) {
        sessionStorage.removeItem(lockKey);
      }
    },
    [pathname, router]
  );

  // ------------------------------------------------------------
  // ✅ your original "checkUserSession" now becomes:
  // fetchMe + apply rules
  // ------------------------------------------------------------
  const checkUserSession = useCallback(async () => {
    try {
      const user = await fetchMe();
      applyProfileRedirectRules(user);
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [fetchMe, applyProfileRedirectRules, setState]);

  // ------------------------------------------------------------
  // ✅ NEW: expose refresh() for profile updates
  // ------------------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      const user = await fetchMe();
      // optional: re-apply redirect rules (safe)
      applyProfileRedirectRules(user);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [fetchMe, applyProfileRedirectRules]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      refresh, // ✅ add this
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, refresh, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
