import { CONFIG } from 'src/global-config';
import { COCForm } from 'src/sections/pdf/coc/view';

// ----------------------------------------------------------------------

export const metadata = { title: `COC | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <COCForm />;
}
