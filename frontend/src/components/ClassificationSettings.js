import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ClassificationSettings = () => {
  const { api } = useAuth();
  const [rules, setRules] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState({
    keyword: '',
    targetFolderId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Filtered rules based on status filter
  const filteredRules = useMemo(() => {
    if (statusFilter === 'all') return rules;
    if (statusFilter === 'active') return rules.filter(r => r.isActive);
    if (statusFilter === 'inactive') return rules.filter(r => !r.isActive);
    return rules;
  }, [rules, statusFilter]);

  // Count statistics
  const activeCount = useMemo(() => rules.filter(r => r.isActive).length, [rules]);
  const inactiveCount = useMemo(() => rules.filter(r => !r.isActive).length, [rules]);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch classification rules and folders in parallel using AuthContext api
      const [rulesResponse, foldersResponse] = await Promise.all([
        api.get('/classification/rules'),
        api.get('/classification/folders')
      ]);

      setRules(rulesResponse.data.data.rules || []);
      setFolders(foldersResponse.data.data.folders || []);

    } catch (error) {
      console.error('Fetch error:', error);
      setError('Error fetching data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addRule = async () => {
    if (!newRule.keyword.trim() || !newRule.targetFolderId) {
      setError('Please enter keyword and select folder');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await api.post('/classification/rules', newRule);

      setSuccess('Classification rule added successfully');
      setNewRule({ keyword: '', targetFolderId: '' });
      fetchData(); // Refresh the list

    } catch (error) {
      console.error('Add rule error:', error);
      setError(error.response?.data?.message || 'Failed to add rule');
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await api.delete(`/classification/rules/${ruleId}`);
      setSuccess('Classification rule deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Delete rule error:', error);
      setError(error.response?.data?.message || 'Failed to delete rule');
    }
  };

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      await api.put(`/classification/rules/${ruleId}`, {
        isActive: !currentStatus
      });
      setSuccess('Rule status updated successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Toggle rule error:', error);
      setError(error.response?.data?.message || 'Failed to update rule');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading classification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearMessages} className="float-right text-red-700 hover:text-red-900">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={clearMessages} className="float-right text-green-700 hover:text-green-900">
            ×
          </button>
        </div>
      )}

      {/* Add New Rule */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4">Add New Classification Rule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword/Phrase
            </label>
            <input
              type="text"
              value={newRule.keyword}
              onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
              placeholder="e.g., fit and proper, kontak kerja"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Folder
            </label>
            <select
              value={newRule.targetFolderId}
              onChange={(e) => setNewRule({ ...newRule, targetFolderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-gray-700"
            >
              <option value="">Select Folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addRule}
              disabled={saving}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-base font-semibold">Current Classification Rules</h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${statusFilter === 'all' ? 'bg-gray-200 text-gray-700' : 'bg-gray-200/50 text-gray-500'
                }`}>
                {rules.length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${statusFilter === 'active'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Active
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${statusFilter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200/50 text-gray-500'
                }`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${statusFilter === 'inactive'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Inactive
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${statusFilter === 'inactive' ? 'bg-gray-200 text-gray-600' : 'bg-gray-200/50 text-gray-500'
                }`}>
                {inactiveCount}
              </span>
            </button>
          </div>
        </div>

        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No classification rules set up yet. Add your first rule above.
          </p>
        ) : filteredRules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No {statusFilter === 'active' ? 'active' : 'inactive'} rules found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Keyword/Phrase
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Target Folder
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRules.map(rule => (
                  <tr key={rule.id} className={`hover:bg-gray-50 transition-colors ${!rule.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${rule.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {rule.keyword}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center text-sm ${rule.isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {rule.folderName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${rule.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRuleStatus(rule.id, rule.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rule.isActive
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                          {rule.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClassificationSettings;