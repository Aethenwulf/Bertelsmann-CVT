'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type GuestGuardProps = {
  children: React.ReactNode;
};

function normalizePath(p: string) {
  return (p || '').replace(/\/+$/, '');
}

function isDashboardManagementPath(p: string) {
  const x = normalizePath(p);
  // anything under /dashboard/user is management in your app
  return x === paths.dashboard.user.root || x.startsWith(`${paths.dashboard.user.root}/`);
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { loading, authenticated, user } = useAuthContext() as any;

  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || CONFIG.auth.redirectPath;

  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkPermissions = async (): Promise<void> => {
    if (loading) return;

    if (authenticated) {
      const roleId = Number(user?.role_id ?? user?.role);
      const isCustomer = roleId === 2;

      // IMPORTANT: your auth-provider uses `profileCompleted` (camel) in redirect rules,
      // but DB uses `profile_completed`. support both to be safe.
      const profileCompleted = Boolean(user?.profile_completed ?? user?.profileCompleted);

      // 1) If customer and profile not completed -> profile page
      if (isCustomer && !profileCompleted) {
        window.location.href = paths.dashboard.user.account;
        return;
      }

      // 2) If customer -> always go dashboard root (never reuse admin returnTo)
      if (isCustomer) {
        window.location.href = paths.dashboard.root;
        return;
      }

      // 3) Non-customer: allow returnTo, but optional safety block
      // (prevents employee from landing on restricted pages if you add more roles later)
      if (!isCustomer && isDashboardManagementPath(returnTo) && roleId !== 1) {
        window.location.href = paths.dashboard.root;
        return;
      }

      // default behavior
      window.location.href = returnTo;
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading, user]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
