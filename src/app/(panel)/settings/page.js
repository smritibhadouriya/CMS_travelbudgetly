'use client';
import SettingsAdmin from '@/screens/PagesContent/SettingsAdmin.jsx';
import config from '@/lib/panel-config';

export default function Page() {
  return <SettingsAdmin config={config} />;
}
