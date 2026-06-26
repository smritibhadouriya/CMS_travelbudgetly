
import PackageForm from '@/app/(panel)/packages/_shared/PackageForm.jsx';
import config from '@/lib/panel-config';

export default function Page() {
  return <PackageForm config={config} />;
}
