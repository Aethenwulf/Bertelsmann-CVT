'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostNewEditForm } from '../form-new-edit-form';

// ----------------------------------------------------------------------

export function COCForm() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Code of Conduct"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Form', href: paths.dashboard.root },
          { name: 'COC' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostNewEditForm />
    </DashboardContent>
  );
}
