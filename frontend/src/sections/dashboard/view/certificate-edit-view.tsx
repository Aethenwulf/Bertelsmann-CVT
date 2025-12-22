'use client';

import type { IUserItem } from 'src/types/user';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CertificateNewEditForm } from '../certificate-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  user?: IUserItem;
};

export function CertificateEditView({ user: currentUser }: Props) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        backHref={paths.dashboard.user.list}
        links={[{ name: 'Dashboard', href: paths.dashboard.root }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CertificateNewEditForm currentUser={currentUser} />
    </DashboardContent>
  );
}
