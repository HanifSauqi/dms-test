'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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

export default function ReportDetailPage() {
  const { api } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;

  const [report, setReport] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Default report configuration
  const defaultReports = {};

  const documentMatchesKeywords = (doc, keywords) => {
    // Combine all searchable fields
    const searchText = `
      ${doc.title || ''}
      ${doc.fileName || ''}
      ${doc.description || ''}
      ${doc.extractedText || ''}
      ${doc.content || ''}
    `.toLowerCase();

    // Document matches ONLY if it contains ALL keywords (AND logic)
    return keywords.every(keyword => searchText.includes(keyword.toLowerCase()));
  };

  const loadReport = useCallback(async () => {
    // Skip loading if we're in the process of deleting
    if (isDeleting) {
      return;
    }

    try {
      setLoading(true);

      // Load report configuration
      let reportConfig = null;
      const savedReports = localStorage.getItem('customReports');
      if (savedReports) {
        const reports = JSON.parse(savedReports);
        reportConfig = reports.find(r => r.id === reportId);
      }

      if (!reportConfig) {
        router.replace('/dashboard/report');
        return;
      }

      setReport(reportConfig);

      // Strategy: Search for each keyword separately, then find intersection
      let documentSets = [];

      // Search for each keyword individually using the search API
      for (const keyword of reportConfig.keywords) {
        try {
          const searchResponse = await api.get(`/documents/search?q=${encodeURIComponent(keyword)}`);
          if (searchResponse.data.success) {
            const docs = Array.isArray(searchResponse.data.data)
              ? searchResponse.data.data
              : (searchResponse.data.data?.documents || []);
            documentSets.push(new Set(docs.map(d => d.id)));
            console.log(`Keyword "${keyword}" found ${docs.length} documents`);
          } else {
            documentSets.push(new Set());
          }
        } catch (err) {
          console.error(`Error searching for keyword "${keyword}":`, err);
          documentSets.push(new Set());
        }
      }

      // Find intersection: documents that appear in ALL searches (AND logic)
      let commonDocIds = null;
      if (documentSets.length > 0) {
        commonDocIds = documentSets[0];
        for (let i = 1; i < documentSets.length; i++) {
          commonDocIds = new Set([...commonDocIds].filter(id => documentSets[i].has(id)));
        }
      } else {
        commonDocIds = new Set();
      }

      console.log(`%c📊 Intersection Result`, 'color: green; font-weight: bold');
      console.log(`Documents matching ALL keywords: ${commonDocIds.size}`);

      // Now fetch the full details of these common documents
      let allDocs = [];
      if (commonDocIds.size > 0) {
        // Search with first keyword to get full document details
        const searchResponse = await api.get(`/documents/search?q=${encodeURIComponent(reportConfig.keywords[0])}`);
        if (searchResponse.data.success) {
          const docs = Array.isArray(searchResponse.data.data)
            ? searchResponse.data.data
            : (searchResponse.data.data?.documents || []);
          // Filter to only include documents in our intersection
          allDocs = docs.filter(doc => commonDocIds.has(doc.id));

          console.log(`%c✅ Matched Documents:`, 'color: green; font-weight: bold');
          allDocs.forEach(doc => {
            console.log(`  - ${doc.title} (ID: ${doc.id})`);
            console.log(`    File: ${doc.fileName}`);
          });
        }
      }

      setDocuments(allDocs);
      console.log(`%c🎯 Final Result: ${allDocs.length} documents`, 'color: blue; font-weight: bold', reportConfig.keywords);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [api, isDeleting, reportId, router]);

  const generateChartData = useCallback(() => {
    // Documents are already filtered by keywords in loadReport
    const filteredDocs = documents;

    let data = [];
    const now = new Date();

    switch (report.timeRange) {
      case 'daily':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));

          const count = filteredDocs.filter(doc => {
            const docDate = new Date(doc.createdAt);
            return docDate >= dayStart && docDate <= dayEnd;
          }).length;

          data.push({
            name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
            count: count,
            date: dayStart.toLocaleDateString()
          });
        }
        break;

      case 'weekly':
        // Last 7 weeks
        for (let i = 6; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          const count = filteredDocs.filter(doc => {
            const docDate = new Date(doc.createdAt);
            return docDate >= weekStart && docDate <= weekEnd;
          }).length;

          data.push({
            name: `Week ${7 - i}`,
            count: count,
            date: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
          });
        }
        break;

      case 'monthly':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

          const count = filteredDocs.filter(doc => {
            const docDate = new Date(doc.createdAt);
            return docDate >= monthStart && docDate <= monthEnd;
          }).length;

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          data.push({
            name: monthNames[date.getMonth()],
            count: count,
            date: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
          });
        }
        break;

      case 'yearly':
        // Group by year
        const yearCounts = {};
        filteredDocs.forEach(doc => {
          const year = new Date(doc.createdAt).getFullYear();
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        });

        data = Object.keys(yearCounts)
          .sort()
          .map(year => ({
            name: year,
            count: yearCounts[year],
            date: year
          }));
        break;
    }

    setChartData(data);
  }, [documents, report]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const handleFocus = () => {
      loadReport();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadReport]);

  useEffect(() => {
    if (report && documents.length > 0) {
      generateChartData();
    }
  }, [report, documents, generateChartData]);

  const handleExportCSV = () => {
    if (chartData.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = [
      ['Period', 'Count', 'Date'],
      ...chartData.map(item => [item.name, item.count, item.date])
    ]
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

  const handleDeleteReport = () => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Set deleting flag to prevent loadReport from running
      setIsDeleting(true);

      const savedReports = localStorage.getItem('customReports');
      if (savedReports) {
        const parsed = JSON.parse(savedReports);
        const filtered = parsed.filter(r => r.id !== reportId);
        localStorage.setItem('customReports', JSON.stringify(filtered));

        // Redirect to report list immediately without alert
        router.replace('/dashboard/report');
      } else {
        alert('No reports found to delete');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
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

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
  const avgCount = chartData.length > 0 ? (totalCount / chartData.length).toFixed(1) : 0;
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(item => item.count)) : 0;

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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
            {report.description && (
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1">
                <span className="font-medium">Keywords:</span>
                {report.keywords.map((keyword, index) => (
                  <span key={index} className="flex items-center">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {keyword}
                    </span>
                    {index < report.keywords.length - 1 && (
                      <span className="mx-1 font-semibold text-gray-700">AND</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 italic">
                (Documents must contain all keywords)
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/report/${reportId}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDeleteReport}
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average per Period</p>
              <p className="text-2xl font-bold text-gray-900">{avgCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Peak Count</p>
              <p className="text-2xl font-bold text-gray-900">{maxCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Analytical Details</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.date}</p>
                          <p className="text-sm text-gray-600">
                            Documents: <span className="font-semibold text-blue-600">{payload[0].value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Documents"
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.date}</p>
                          <p className="text-sm text-gray-600">
                            Documents: <span className="font-semibold text-blue-600">{payload[0].value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Documents" />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No data available for this report</p>
          </div>
        )}
      </div>
    </div>
  );
}
