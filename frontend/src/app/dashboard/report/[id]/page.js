'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { reportApi } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;

  const [report, setReport] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReport = useCallback(async () => {
    if (isDeleting) return;

    try {
      setLoading(true);

      // Load report with statistics from API
      const response = await reportApi.getStats(reportId);
      const data = response.data || response;

      if (!data.report) {
        router.replace('/dashboard/report');
        return;
      }

      setReport(data.report);
      setTotal(data.total || 0);

      // Transform stats for chart
      const stats = data.stats || [];
      const transformedData = stats.map(item => ({
        period: item.period_label,
        count: parseInt(item.count) || 0
      }));

      setChartData(transformedData);
    } catch (error) {
      console.error('Error loading report:', error);
      if (error.message?.includes('not found') || error.status === 404) {
        router.replace('/dashboard/report');
      } else {
        showError('Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  }, [reportId, router, isDeleting]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case 'daily': return 'Daily (Last 7 days)';
      case 'weekly': return 'Weekly (Last 7 weeks)';
      case 'monthly': return 'Monthly (Last 12 months)';
      case 'yearly': return 'Yearly (All years)';
      default: return range;
    }
  };

  const handleExportCSV = () => {
    if (!chartData.length) {
      showError('No data to export');
      return;
    }

    const headers = ['Period', 'Document Count'];
    const rows = chartData.map(item => [item.period, item.count]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteReport = async () => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await reportApi.delete(reportId);
      showSuccess(`Report "${report.name}" deleted successfully`);
      router.replace('/dashboard/report');
    } catch (error) {
      console.error('Error deleting report:', error);
      showError('Failed to delete report');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
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
        <span
          onClick={() => router.push('/dashboard/report')}
          className="hover:text-gray-900 cursor-pointer transition-colors"
        >
          Report
        </span>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{report.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{report.name}</h1>
            {report.description && (
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/report/${reportId}/edit`)}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={handleDeleteReport}
            className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Keywords */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Keywords</h3>
            <div className="flex flex-wrap gap-1 items-center">
              {(report.keywords || []).map((keyword, index) => (
                <span key={index} className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {keyword}
                  </span>
                  {index < report.keywords.length - 1 && (
                    <span className="text-xs font-semibold text-gray-600">AND</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Time Range</h3>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">
                {getTimeRangeLabel(report.time_range || report.timeRange)}
              </span>
            </div>
          </div>

          {/* Total Documents */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Documents</h3>
            <p className="text-2xl font-bold text-orange-600">{total}</p>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Chart Type:</span>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={chartData.length === 0}
          className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Documents"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ fill: '#F97316' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Documents" fill="#F97316" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No data available for this report</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload documents containing the keywords to see statistics
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
