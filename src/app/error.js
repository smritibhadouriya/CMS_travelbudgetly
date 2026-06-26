'use client';

// Route-level error boundary. Catches runtime errors in the page tree below the
// root layout, keeping the root layout (html/body) intact.
import ErrorView from '@/components/ErrorView';

export default function Error({ error, reset }) {
  return <ErrorView error={error} reset={reset} />;
}
