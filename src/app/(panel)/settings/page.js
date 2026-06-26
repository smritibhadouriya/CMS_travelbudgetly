import SettingsAdmin from './SettingsAdmin.jsx';
import { getSettings } from '@/lib/services/settings.service';

// Singleton config — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Mirrors GET /api/settings → { data: settings || {} }.
  // Save still goes through the existing API layer unchanged.
  const initialData = (await getSettings()) || {};
  return <SettingsAdmin initialData={initialData} />;
}
