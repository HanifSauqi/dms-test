'use client';

import { useRouter } from 'next/navigation';
import { DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import SearchBar from '@/components/SearchBar';
import RecentlyFiles from '@/components/RecentlyFiles';

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <SearchBar />
      <div className="space-y-8 pt-2">
        {/* Quick Access Section */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Resume Card */}
            <div
              onClick={() => router.push('/dashboard/resume')}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Resume</h4>
                  <p className="text-xs text-gray-500 leading-tight">search for documents<br/>easily</p>
                </div>
                <div className="p-2.5 bg-orange-50 rounded-lg flex-shrink-0">
                  <DocumentTextIcon className="h-7 w-7 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Report Card */}
            <div
              onClick={() => router.push('/dashboard/report')}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Report</h4>
                  <p className="text-xs text-gray-500 leading-tight">statistical summary of<br/>files</p>
                </div>
                <div className="p-2.5 bg-orange-50 rounded-lg flex-shrink-0">
                  <ChartBarIcon className="h-7 w-7 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Files Section */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Recently Files</h3>
          <RecentlyFiles limit={10} />
        </div>
      </div>
    </>
  );
}
