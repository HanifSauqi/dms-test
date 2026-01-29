'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ChevronLeftIcon, KeyIcon, ServerIcon } from '@heroicons/react/24/outline';

export default function AdminAISettingsPage() {
    const { api, user, loading } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState({
        gemini_api_key: '',
        ollama_url: 'http://localhost:11434'
    });
    const [saving, setSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin' && user.role !== 'superadmin') {
                toast.error('Unauthorized access');
                router.push('/dashboard');
                return;
            }
            fetchSettings();
        }
    }, [user, loading, router]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data.success) {
                setSettings({
                    gemini_api_key: response.data.data.gemini_api_key_masked || '', // Use masked or empty
                    ollama_url: response.data.data.ollama_url || 'http://localhost:11434'
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Only send API Key if it's not the masked version (i.e. user typed a new one)
            // If it starts with 'AIza' and contains '...', it's likely masked (simple check)
            // Better: only send if changed?
            // Actually, we can just send it. If it's masked, the backend should probably reject or we should handle it.
            // But here, if the user leaves it as masked, we shouldn't send it.

            const payload = {
                ollama_url: settings.ollama_url
            };

            // Heuristic to detect if key is modified from mask
            // If it doesn't have '...' or length is significantly different
            const isMasked = settings.gemini_api_key.includes('...') && settings.gemini_api_key.length < 20;
            // Actually masked key is usually short or specific format.
            // Let's assume if the user changed it, they want to update it.

            if (settings.gemini_api_key && !settings.gemini_api_key.includes('...')) {
                payload.gemini_api_key = settings.gemini_api_key;
            }

            const response = await api.put('/settings', payload);

            if (response.data.success) {
                toast.success('Global settings updated successfully');
                fetchSettings(); // Reload to get masked state back
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading || isLoadingData) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6 flex items-center">
                <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Global AI Configuration</h1>
                    <p className="text-sm text-gray-500">System-wide settings for all users (Fallbacks)</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSave} className="p-6 space-y-6">

                    {/* Gemini Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-medium text-gray-900 border-b pb-2">
                            <KeyIcon className="h-5 w-5 text-orange-500" />
                            <h3>Google Gemini (Cloud)</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Default API Key used for users who haven't set their own personal key.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Global API Key
                            </label>
                            <input
                                type="text"
                                value={settings.gemini_api_key}
                                onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                                placeholder="Enter default API Key..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Leave as is to keep current key. Overridable by users.
                            </p>
                        </div>
                    </div>

                    {/* Ollama Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 text-lg font-medium text-gray-900 border-b pb-2">
                            <ServerIcon className="h-5 w-5 text-blue-500" />
                            <h3>Ollama (Local AI)</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            The mandatory URL for the Local LLM Service. Users cannot change this.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service URL
                            </label>
                            <input
                                type="text"
                                value={settings.ollama_url}
                                onChange={(e) => setSettings({ ...settings, ollama_url: e.target.value })}
                                placeholder="http://localhost:3005"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
