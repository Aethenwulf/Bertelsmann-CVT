import type { LinkProps } from '@mui/material/Link';

import { forwardRef } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
  sx?: any;
};

export const Logo = forwardRef<HTMLAnchorElement, LogoProps>(
  ({ className, href = '/', isSingle = true, disabled, sx, ...other }, ref) => {
    const singleLogo = (
      <img
        alt="Single logo"
        src={`${CONFIG.assetsDir}/logo/logo-single.png`}
        width="100%"
        height="95%"
      />
    );

    const fullLogo = (
      <img
        alt="Full logo"
        src={`${CONFIG.assetsDir}/logo/logo-full.png`}
        width="100%"
        height="100%"
      />
    );

    return (
      <LogoRoot
        ref={ref}
        component={RouterLink}
        href={href}
        aria-label="Logo"
        underline="none"
        className={mergeClasses([logoClasses.root, className])}
        sx={[
          () => ({
            width: isSingle ? 40 : 202,
            height: isSingle ? 35 : 36,
            ...(disabled && { pointerEvents: 'none' }),
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {isSingle ? singleLogo : fullLogo}
      </LogoRoot>
    );
  }
);

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
