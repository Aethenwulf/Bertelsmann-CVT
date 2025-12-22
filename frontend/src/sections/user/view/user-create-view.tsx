'use client';

import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

export function UserCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new user"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.user.root },
          { name: 'New user' },
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

      <UserNewEditForm />
    </DashboardContent>
  );
}
