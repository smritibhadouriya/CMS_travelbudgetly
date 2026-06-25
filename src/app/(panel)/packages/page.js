'use client';
import PackageTableView from '@/screens/PagesContent/PackageTableView.jsx';
import config from '@/lib/panel-config';

export default function Page() {
  return <PackageTableView config={config} />;
}
