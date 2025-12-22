'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CertificateNewEditForm } from '../certificate-new-edit-form';

// ----------------------------------------------------------------------

export function UserCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new user"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CertificateNewEditForm />
    </DashboardContent>
  );
}
