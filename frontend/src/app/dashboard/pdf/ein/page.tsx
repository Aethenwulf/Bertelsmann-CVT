import { CONFIG } from 'src/global-config';
import { EINForm } from 'src/sections/pdf/ein/view';

// ----------------------------------------------------------------------

export const metadata = { title: `EIN | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <EINForm />;
}
