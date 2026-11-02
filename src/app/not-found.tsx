'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F0E8] text-slate-900">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl mt-4 font-semibold">Page Not Found</p>
      <p className="mt-2 text-slate-500">The page you are looking for does not exist.</p>
      <Link href="/home" className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
        Go to Dashboard
      </Link>
    </div>
  );
}