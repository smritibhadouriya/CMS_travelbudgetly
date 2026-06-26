'use client';

// Panel-scoped error boundary. Keeps the sidebar/header shell (panel layout)
// and shows the error in the content area, so the admin can still navigate.
import ErrorView from '@/components/ErrorView';

export default function PanelError({ error, reset }) {
  return <ErrorView error={error} reset={reset} />;
}
