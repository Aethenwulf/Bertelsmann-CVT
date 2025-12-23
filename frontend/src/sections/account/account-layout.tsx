'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useEffect, useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  {
    label: 'General',
    icon: <Iconify width={24} icon="solar:user-id-bold" />,
    href: paths.dashboard.user.account,
  },
  {
    label: 'Security',
    icon: <Iconify width={24} icon="ic:round-vpn-key" />,
    href: `${paths.dashboard.user.account}/change-password`,
  },
];

// ----------------------------------------------------------------------

export function AccountLayout({ children, ...other }: DashboardContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext() as any;

  const userId = Number(user?.id ?? user?.user_id);

  // lock rule
  const profileCompleted = Boolean(user?.profile_completed);
  const isLocked = !profileCompleted;

  // base routes
  const generalHref = paths.dashboard.user.account;
  const securityHref = `${paths.dashboard.user.account}/change-password`;

  // show security only if you still want it for userId === 1 AND profile is completed
  const showSecurityTab = userId === 1 && profileCompleted;

  // If locked, force user to General page (even if they type URL)
  useEffect(() => {
    if (profileCompleted) return;

    if (removeLastSlash(pathname) !== removeLastSlash(generalHref)) {
      router.replace(generalHref);
    }
  }, [profileCompleted, pathname, router, generalHref]);

  const NAV_ITEMS = useMemo(
    () => [
      {
        label: 'General',
        icon: <Iconify width={24} icon="solar:user-id-bold" />,
        href: generalHref,
      },
      ...(showSecurityTab
        ? [
            {
              label: 'Security',
              icon: <Iconify width={24} icon="ic:round-vpn-key" />,
              href: securityHref,
            },
          ]
        : []),
    ],
    [generalHref, securityHref, showSecurityTab]
  );

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading="Account"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Account' }]}
        sx={{ mb: 3 }}
      />

      <Tabs value={removeLastSlash(pathname)} sx={{ mb: { xs: 3, md: 5 } }}>
        {NAV_ITEMS.map((tab) => (
          <Tab
            component={RouterLink}
            key={tab.href}
            label={tab.label}
            icon={tab.icon}
            value={tab.href}
            href={tab.href}
            // optional: also disable clicking tabs while locked
            disabled={isLocked && tab.href !== generalHref}
          />
        ))}
      </Tabs>

      {children}
    </DashboardContent>
  );
}
