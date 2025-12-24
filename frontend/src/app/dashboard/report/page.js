'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import DropdownMenu from '@/components/DropdownMenu';
import { reportApi } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';

export default function ReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportApi.getAll();
      setReports(response.data?.reports || response.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      showError('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleViewReport = (report) => {
    router.push(`/dashboard/report/${report.id}`);
  };

  const handleDeleteReport = async (report) => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await reportApi.delete(report.id);
      showSuccess(`Report "${report.name}" deleted successfully`);
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      showError('Failed to delete report');
    }
  };

  const getDropdownOptions = (report) => {
    return [
      {
        label: 'View Report',
        icon: <EyeIcon className="h-4 w-4" />,
        action: 'view'
      },
      {
        label: 'Edit',
        icon: <PencilIcon className="h-4 w-4" />,
        action: 'edit'
      },
      {
        label: 'Delete',
        icon: <TrashIcon className="h-4 w-4" />,
        action: 'delete',
        destructive: true
      }
    ];
  };

  const handleMenuClick = (option, report) => {
    switch (option.action) {
      case 'view':
        handleViewReport(report);
        break;
      case 'edit':
        router.push(`/dashboard/report/${report.id}/edit`);
        break;
      case 'delete':
        handleDeleteReport(report);
        break;
    }
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return range;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <span
          onClick={() => router.push('/dashboard')}
          className="hover:text-gray-900 cursor-pointer transition-colors"
        >
          Home
        </span>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Report</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Statistical reports based on document keywords and time ranges
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/report/create')}
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Report
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow relative group"
          >
            {/* Dropdown Menu */}
            <div className="absolute top-4 right-4">
              <DropdownMenu
                options={getDropdownOptions(report)}
                onOptionClick={(option) => handleMenuClick(option, report)}
              />
            </div>

            {/* Icon */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-8">
              {report.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {report.description}
            </p>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center text-xs text-gray-500 flex-wrap">
                <span className="font-medium">Keywords:</span>
                <div className="ml-2 flex flex-wrap gap-1 items-center">
                  {(report.keywords || []).map((keyword, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {keyword}
                      </span>
                      {index < report.keywords.length - 1 && (
                        <span className="text-xs font-semibold text-gray-600">AND</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <span className="font-medium">Time Range:</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  {getTimeRangeLabel(report.time_range || report.timeRange)}
                </span>
              </div>
            </div>

            {/* View Button */}
            <button
              onClick={() => handleViewReport(report)}
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <DocumentChartBarIcon className="h-4 w-4 mr-2" />
              View Report
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {reports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No reports created yet</p>
          <button
            onClick={() => router.push('/dashboard/report/create')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Report
          </button>
        </div>
      )}
    </div>
  );
}
