import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';
import { UserEditView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `User edit | Dashboard - ${CONFIG.appName}`,
};

type Props = {
  params: { id: string };
};

// ✅ No axios / getUser here – just pass id down
export default function Page({ params }: Props) {
  const { id } = params;
  return <UserEditView userId={id} />;
}

// ----------------------------------------------------------------------

const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';
export { dynamic };

// You can either remove generateStaticParams entirely,
// or leave this simple version if you don’t need static export yet.
export async function generateStaticParams() {
  if (CONFIG.isStaticExport) {
    return []; // or fetch ids from backend later
  }
  return [];
}
