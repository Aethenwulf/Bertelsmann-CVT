'use client';

import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';
import { useEffect, useState } from 'react';

import type { IUserItem } from 'src/types/user';
import { getUser } from 'src/api/users';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  userId: string;
};

export function UserEditView({ userId }: Props) {
  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const user = await getUser(userId);
        if (!active) return;

        if (!user) {
          toast.error('User not found');
        }

        setCurrentUser(user);
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message ?? 'Failed to load user');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit user"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.user.root },
          {
            name: currentUser?.name || userId || 'User',
          },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.user.list}
            variant="contained"
            startIcon={<Iconify icon="mingcute:left-line" />}
          >
            Back to list
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Optional loading UI */}
      {/* you can show a skeleton/spinner here based on `loading` */}

      <UserNewEditForm currentUser={currentUser ?? undefined} />
    </DashboardContent>
  );
}
