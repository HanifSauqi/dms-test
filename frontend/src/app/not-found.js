'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <h1 className="text-6xl sm:text-7xl md:text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. You will be redirected to the dashboard automatically.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>

          <div className="block">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Redirecting in 3 seconds...
        </p>
      </div>
    </div>
  );
}