'use client';

// Last-resort boundary: catches errors thrown in the ROOT layout itself.
// It replaces the root layout when active, so it must render its own
// <html>/<body> and load global styles.
import './globals.css';
import ErrorView from '@/components/ErrorView';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <ErrorView error={error} reset={reset} title="Application error" />
      </body>
    </html>
  );
}
