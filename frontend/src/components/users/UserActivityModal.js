'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon, DocumentTextIcon, FolderIcon, UserIcon } from '@heroicons/react/24/outline';
import { userActivitiesApi } from '@/lib/api';

const activityTypeLabels = {
  login: 'Login',
  logout: 'Logout',
  create_document: 'Created Document',
  edit_document: 'Edited Document',
  delete_document: 'Deleted Document',
  view_document: 'Viewed Document',
  download_document: 'Downloaded Document',
  share_document: 'Shared Document',
  create_folder: 'Created Folder',
  edit_folder: 'Edited Folder',
  delete_folder: 'Deleted Folder',
  create_user: 'Created User',
  edit_user: 'Edited User',
  delete_user: 'Deleted User'
};

const activityTypeColors = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  create_document: 'bg-blue-100 text-blue-800',
  edit_document: 'bg-yellow-100 text-yellow-800',
  delete_document: 'bg-red-100 text-red-800',
  view_document: 'bg-purple-100 text-purple-800',
  download_document: 'bg-indigo-100 text-indigo-800',
  share_document: 'bg-pink-100 text-pink-800',
  create_folder: 'bg-blue-100 text-blue-800',
  edit_folder: 'bg-yellow-100 text-yellow-800',
  delete_folder: 'bg-red-100 text-red-800',
  create_user: 'bg-blue-100 text-blue-800',
  edit_user: 'bg-yellow-100 text-yellow-800',
  delete_user: 'bg-red-100 text-red-800'
};

const getActivityIcon = (activityType) => {
  if (activityType.includes('document')) {
    return DocumentTextIcon;
  } else if (activityType.includes('folder')) {
    return FolderIcon;
  } else if (activityType.includes('user')) {
    return UserIcon;
  }
  return ClockIcon;
};

export default function UserActivityModal({ isOpen, onClose, user }) {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    currentPage: 1,
    totalPages: 1
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserActivities();
      fetchUserStats();
    }
  }, [isOpen, user, pagination.offset]);

  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userActivitiesApi.getUserActivities(user.id, {
        limit: pagination.limit,
        offset: pagination.offset
      });

      if (response.success) {
        setActivities(response.data.activities);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err.response?.data?.message || 'Failed to load user activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await userActivitiesApi.getUserStats(user.id);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset - prev.limit
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 md:p-8 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Activity Logs - {user?.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 md:p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6 md:h-5 md:w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                </div>

                {/* Statistics Section */}
                {stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium">Total Activities</div>
                      <div className="text-2xl font-bold text-blue-900">{stats.total_activities || 0}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium">Logins</div>
                      <div className="text-2xl font-bold text-green-900">{stats.login_count || 0}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium">Documents</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {(parseInt(stats.documents_created || 0) +
                          parseInt(stats.documents_edited || 0) +
                          parseInt(stats.documents_deleted || 0))}
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-sm text-yellow-600 font-medium">Folders</div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {(parseInt(stats.folders_created || 0) +
                          parseInt(stats.folders_edited || 0) +
                          parseInt(stats.folders_deleted || 0))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities List */}
                <div className="border border-gray-200 rounded-lg">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading activities...</p>
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-600">
                      <p>{error}</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No activity records found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {activities.map((activity) => {
                        const Icon = getActivityIcon(activity.activity_type);
                        return (
                          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className={`rounded-lg p-2 ${activityTypeColors[activity.activity_type] || 'bg-gray-100 text-gray-800'}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {activityTypeLabels[activity.activity_type] || activity.activity_type}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(activity.created_at)}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                  {activity.activity_description}
                                </p>
                                {activity.ip_address && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    IP: {activity.ip_address}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {activities.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{pagination.offset + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.offset + pagination.limit, pagination.total)}
                        </span> of{' '}
                        <span className="font-medium">{pagination.total}</span> activities
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={pagination.currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
