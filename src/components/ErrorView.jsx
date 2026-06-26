'use client';

// Single reusable error UI for the App Router error boundaries
// (app/error.js, app/(panel)/error.js, app/global-error.js).
export default function ErrorView({ error, reset, title = 'Something went wrong' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-slate-50">
      <h1 className="text-3xl font-bold text-red-500">{title}</h1>
      <p className="text-slate-600 mt-3 mb-8 max-w-md">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={() => reset?.()}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
