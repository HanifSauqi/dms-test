'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import { ArrowPathIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/utils/toast';

export default function TrashPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch trash users
  useEffect(() => {
    let isMounted = true;

    const loadTrashUsers = async () => {
      if (isMounted) {
        await fetchTrashUsers();
      }
    };

    loadTrashUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTrashUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getTrashUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching trash users:', error);
      showError(error?.message || 'Failed to fetch trash users');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to restore user "${userName}"?`)) {
      return;
    }

    try {
      const response = await usersApi.restoreUser(userId);
      if (response.success) {
        showSuccess(`User "${userName}" restored successfully!`);
        await fetchTrashUsers(); // Refresh the list
      }
    } catch (error) {
      showError(error?.message || 'Failed to restore user');
    }
  };

  const handlePermanentDelete = async (userId, userName) => {
    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete user "${userName}" and ALL their data!\n\nThis includes:\n- All folders owned by this user\n- All documents owned by this user\n- All activity history\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;

    const confirmation = prompt(confirmMessage);

    if (confirmation !== 'DELETE') {
      if (confirmation !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    try {
      const response = await usersApi.permanentDeleteUser(userId);
      if (response.success) {
        showSuccess(`User "${userName}" permanently deleted!`);
        await fetchTrashUsers(); // Refresh the list
      }
    } catch (error) {
      showError(error?.message || 'Failed to permanently delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600"
            >
              Home
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              <span className="ml-1 text-sm font-medium text-gray-500">
                Trash
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Trash</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage deleted users - restore or permanently delete them
        </p>
      </div>

      {/* Trash Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deleted At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(u.deleted_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleRestoreUser(u.id, u.name)}
                        className="text-green-600 hover:text-green-900"
                        title="Restore user"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(u.id, u.name)}
                        disabled={u.id === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={u.id === user.id ? "You cannot delete yourself" : "Delete permanently"}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted users</h3>
              <p className="mt-1 text-sm text-gray-500">Trash is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
