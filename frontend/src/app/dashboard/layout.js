'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderIcon,
  TagIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  HomeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { Montserrat } from 'next/font/google';
import ErrorBoundary from '@/components/ErrorBoundary';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700']
});

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="bg-white flex flex-col border-r border-gray-200">
        {/* Logo Section */}
        <div className="bg-white">
          <div className="flex items-center px-5 py-4">
            <div className="flex items-center space-x-3">
              <div className="h-18 w-18 flex-shrink-0">
                <Image
                  src="/Mask group.png"
                  alt="PDU Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className={`space-y-0 ${montserrat.className}`}>
                <h1 className="text-lg font-bold text-gray-900 tracking-wider -mb-1">Document</h1>
                <h1 className="text-lg font-bold text-gray-900 tracking-wider -mb-1">Management</h1>
                <h1 className="text-lg font-bold text-gray-900 tracking-wider">System</h1>
              </div>
            </div>
          </div>
          {/* Separator */}
          <div className="mx-5 mb-2 h-px bg-gray-200"></div>
        </div>


        {/* Navigation */}
        <nav className="py-2">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                isActive('/dashboard') && pathname === '/dashboard'
                  ? 'text-orange-600 bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <HomeIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive('/dashboard') && pathname === '/dashboard' ? 'text-orange-600' : 'text-gray-500'
              }`} />
              Home
            </Link>

            <Link
              href="/dashboard/files"
              className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                isActive('/dashboard/files')
                  ? 'text-orange-600 bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FolderIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive('/dashboard/files') ? 'text-orange-600' : 'text-gray-500'
              }`} />
              My Files
            </Link>

            <Link
              href="/dashboard/shared"
              className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                isActive('/dashboard/shared')
                  ? 'text-orange-600 bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive('/dashboard/shared') ? 'text-orange-600' : 'text-gray-500'
              }`} />
              Shared With Me
            </Link>

            <Link
              href="/dashboard/labels"
              className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                isActive('/dashboard/labels')
                  ? 'text-orange-600 bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TagIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive('/dashboard/labels') ? 'text-orange-600' : 'text-gray-500'
              }`} />
              Labels
            </Link>

            <Link
              href="/dashboard/settings"
              className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                isActive('/dashboard/settings')
                  ? 'text-orange-600 bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CogIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive('/dashboard/settings') ? 'text-orange-600' : 'text-gray-500'
              }`} />
              Settings
            </Link>

            {/* User Management - Superadmin Only */}
            {user?.role === 'superadmin' && (
              <Link
                href="/dashboard/users"
                className={`group flex items-center px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive('/dashboard/users')
                    ? 'text-orange-600 bg-red-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive('/dashboard/users') ? 'text-orange-600' : 'text-gray-500'
                }`} />
                User Management
              </Link>
            )}
          </div>
        </nav>
      </div>

{/* Main Content Area */}
<div className="flex-1 flex flex-col">
  {/* Top Header - User Profile with Dropdown */}
  <div className="bg-transparent flex items-center px-8 py-7 justify-between border-gray-200">
    
    <h1 className="text-2xl pl-2 font-bold text-gray-900">
      Dashboard
    </h1>

    {/* Profile Dropdown */}
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-full"
      >
        <UserCircleIcon className="h-12 w-12 text-gray-600" />
      </button>

      {/* Dropdown Menu */}
      {showProfileDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={async () => {
              setShowProfileDropdown(false);
              await logout();
              router.push('/auth/login');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-orange-500" />
            Logout
          </button>
        </div>
      )}
    </div>
  </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="px-10 pb-4">
            <ErrorBoundary fallbackMessage="Something went wrong while loading this page. Please try refreshing.">
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}