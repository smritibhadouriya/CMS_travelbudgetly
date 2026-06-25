import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <h1 className="text-7xl font-bold text-red-500">404</h1>
      <p className="text-xl mt-4 mb-8">Page Not Found</p>
      <Link href="/dashboard" className="px-5 py-2 bg-blue-600 text-white rounded-lg">
        Go to Dashboard
      </Link>
    </div>
  );
}
