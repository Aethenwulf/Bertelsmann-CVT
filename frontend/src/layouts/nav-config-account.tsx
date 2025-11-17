import SvgIcon from '@mui/material/SvgIcon';

import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: 'Profile',
    href: `${paths.dashboard.user.account}`,
    icon: <Iconify icon="solar:shield-keyhole-bold-duotone" />,
  },
];
