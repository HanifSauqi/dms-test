'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChartBarIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { reportApi } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: [],
    timeRange: 'monthly'
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState({});

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportApi.getById(reportId);
      const report = response.data?.report || response.report;

      if (report) {
        setFormData({
          name: report.name,
          description: report.description || '',
          keywords: report.keywords || [],
          timeRange: report.time_range || report.timeRange || 'monthly'
        });
      } else {
        showError('Report not found');
        router.push('/dashboard/report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      showError('Failed to load report');
      router.push('/dashboard/report');
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;

    if (formData.keywords.includes(keyword)) {
      setErrors({ ...errors, keyword: 'Keyword already added' });
      return;
    }

    setFormData({
      ...formData,
      keywords: [...formData.keywords, keyword]
    });
    setKeywordInput('');
    setErrors({ ...errors, keyword: null });
  };

  const handleRemoveKeyword = (keyword) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    }

    if (formData.keywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      await reportApi.update(reportId, {
        name: formData.name.trim(),
        description: formData.description,
        keywords: formData.keywords,
        timeRange: formData.timeRange
      });

      showSuccess('Report updated successfully');
      router.push(`/dashboard/report/${reportId}`);
    } catch (error) {
      console.error('Error updating report:', error);
      showError(error.message || 'Failed to update report');
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6 pt-6 max-w-3xl mx-auto">
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
        <span
          onClick={() => router.push(`/dashboard/report/${reportId}`)}
          className="hover:text-gray-900 cursor-pointer transition-colors"
        >
          {formData.name}
        </span>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      {/* Header */}
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <div className="ml-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            Modify report keywords and settings
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2.5 sm:px-3 sm:py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="e.g., MCU Statistical Report"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Brief description of this report"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Documents must contain <span className="font-semibold text-gray-700">ALL</span> keywords to be counted (AND logic)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`flex-1 px-3 py-2.5 sm:px-3 sm:py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.keyword || errors.keywords ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter keyword and press Enter or click Add"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {errors.keyword && (
              <p className="mt-1 text-xs text-red-500">{errors.keyword}</p>
            )}
            {errors.keywords && (
              <p className="mt-1 text-xs text-red-500">{errors.keywords}</p>
            )}

            {/* Keywords List */}
            {formData.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 items-center">
                {formData.keywords.map((keyword, index) => (
                  <span key={index} className="inline-flex items-center gap-1">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-blue-200"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                    {index < formData.keywords.length - 1 && (
                      <span className="text-xs font-semibold text-gray-700 mx-1">AND</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select the time period for grouping document counts
            </p>
            <select
              value={formData.timeRange}
              onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="daily">Daily (Last 7 days)</option>
              <option value="weekly">Weekly (Last 7 weeks)</option>
              <option value="monthly">Monthly (Last 12 months)</option>
              <option value="yearly">Yearly (All years)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/report/${reportId}`)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
