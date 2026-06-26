// Root route-transition loading UI (App Router Suspense fallback).
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
