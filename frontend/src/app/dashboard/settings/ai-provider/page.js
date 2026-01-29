'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, CpuChipIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getAIPreferences, saveAIPreferences } from '@/utils/aiPreferences';

export default function AISettingsPage() {
    const { api, user, loading } = useAuth();
    const router = useRouter();
    const [provider, setProvider] = useState('gemini');
    const [llmUrl, setLlmUrl] = useState('http://localhost:3005');
    const [geminiKey, setGeminiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [health, setHealth] = useState(null);
    const [checkingHealth, setCheckingHealth] = useState(false);

    // Note: Since we don't have a settings table, we'll use localStorage 
    // or just inform the user to update the .env for now, 
    // but let's try to mock the persistence or use a temporary approach.
    // Ideally, this should hit an API. Let's check if we can add a settings API.

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const prefs = getAIPreferences();
        setProvider(prefs.provider);
        setLlmUrl(prefs.llmUrl);
        setGeminiKey(prefs.geminiKey || '');
    }, []);

    const checkOllamaHealth = async () => {
        setCheckingHealth(true);
        try {
            const response = await fetch(`${llmUrl}/health`);
            const data = await response.json();
            setHealth(data);
            if (data.status === 'OK') {
                toast.success('LLM Service is online');
            } else {
                toast.error('LLM Service returned error status');
            }
        } catch (error) {
            console.error('Health check failed:', error);
            setHealth({ status: 'Error', details: error.message });
            toast.error('Could not connect to LLM Service');
        } finally {
            setCheckingHealth(false);
        }
    };

    const checkGeminiConnection = async () => {
        setCheckingHealth(true);
        try {
            const response = await api.post('/documents/test-ai-config', {
                provider: 'gemini',
                apiKey: geminiKey
            });

            if (response.data.success) {
                setHealth({ status: 'OK', message: 'Connected to Gemini AI' });
                toast.success('Gemini Connection Successful');
            } else {
                // Soft failure (handled by backend 200 OK)
                const data = response.data;
                const errMsg = data.message || data.error || 'Unknown error';
                const errType = data.errorType;

                let cleanMessage = errMsg;
                let showDetails = true;

                if (errType === 'expired_key') {
                    toast.error('Gemini Key Expired!');
                    cleanMessage = 'API Key has expired. Please renew it.';
                    showDetails = false;
                }
                else if (errType === 'quota_exceeded') {
                    toast.error('Gemini Quota Exceeded!');
                    cleanMessage = 'API Quota Exceeded. Try again later.';
                    showDetails = false;
                }
                else if (errType === 'invalid_key') {
                    toast.error('Invalid Gemini Key!');
                    cleanMessage = 'The API Key provided is invalid.';
                    showDetails = false;
                }
                else {
                    toast.error('Gemini Connection Failed: ' + errMsg);
                }

                setHealth({
                    status: 'Error',
                    message: cleanMessage,
                    details: showDetails ? (data.error || errMsg) : null
                });
            }
        } catch (error) {
            // Network or Server crash errors
            console.error('Gemini check failed:', error);
            const errMsg = error.message || 'Connection Error';
            setHealth({ status: 'Error', details: errMsg });
            toast.error('Connection Error: ' + errMsg);
        } finally {
            setCheckingHealth(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        saveAIPreferences(provider, llmUrl, geminiKey);

        setTimeout(() => {
            setSaving(false);
            toast.success('AI Provider preferences saved');
        }, 500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Provider Settings</h1>
                        <p className="text-sm text-gray-500">Configure which AI model powers your document search and analysis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar/Info */}
                <div className="md:col-span-1">
                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                        <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                            <InformationCircleIcon className="h-5 w-5 mr-2" />
                            About AI Providers
                        </h3>
                        <div className="space-y-4 text-sm text-orange-700">
                            <p>
                                <strong>Gemini AI:</strong> High-performance cloud-based AI by Google. Requires an API key and internet connection.
                            </p>
                            <p>
                                <strong>Ollama (Local):</strong> Run privacy-focused AI models locally on your own hardware. Requires the LLM Service and Ollama to be running.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">Select AI Provider</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Provider Options */}
                            <div className="grid grid-cols-1 gap-4">
                                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${provider === 'gemini' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="provider"
                                        value="gemini"
                                        checked={provider === 'gemini'}
                                        onChange={(e) => {
                                            setProvider(e.target.value);
                                            setHealth(null);
                                        }}
                                        className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div className="ml-4 flex-1">
                                        <span className="block text-sm font-bold text-gray-900">Cloud AI (Google Gemini)</span>
                                        <span className="block text-xs text-gray-500">Fast, accurate, and ready to use out of the box.</span>
                                    </div>
                                    {provider === 'gemini' && <CheckCircleIcon className="h-6 w-6 text-orange-500" />}
                                </label>

                                {/* Gemini Config */}
                                {provider === 'gemini' && (
                                    <div className="ml-8 mt-2 p-4 bg-white border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={geminiKey}
                                                onChange={(e) => setGeminiKey(e.target.value)}
                                                placeholder="AIzaSy..."
                                                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                            <button
                                                onClick={checkGeminiConnection}
                                                disabled={checkingHealth}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                            >
                                                {checkingHealth ? 'Checking...' : 'Test Connection'}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Leave empty to use the server-side default key.
                                        </p>
                                        {health && provider === 'gemini' && (
                                            <div className={`mt-3 p-3 rounded-md text-sm ${health.status === 'OK' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                <div className="flex items-center">
                                                    <span className={`h-2 w-2 rounded-full mr-2 ${health.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <strong>Status: {health.status}</strong>
                                                </div>
                                                {health.message && <p className="mt-1">{health.message}</p>}
                                                {health.details && <p className="mt-1 text-xs">{health.details}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${provider === 'ollama' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="provider"
                                        value="ollama"
                                        checked={provider === 'ollama'}
                                        onChange={(e) => {
                                            setProvider(e.target.value);
                                            setHealth(null);
                                        }}
                                        className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div className="ml-4 flex-1">
                                        <span className="block text-sm font-bold text-gray-900">Local AI (Ollama)</span>
                                        <span className="block text-xs text-gray-500">Private, secure, and runs on your local machine.</span>
                                    </div>
                                    {provider === 'ollama' && <CheckCircleIcon className="h-6 w-6 text-orange-500" />}
                                </label>
                            </div>

                            {/* Ollama Config */}
                            {provider === 'ollama' && (
                                <div className="pt-4 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">LLM Service URL (Managed by Admin)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={llmUrl}
                                                readOnly
                                                className="flex-1 block w-full rounded-md border-gray-200 bg-gray-100 text-gray-500 shadow-sm sm:text-sm cursor-not-allowed"
                                            />
                                            <button
                                                onClick={checkOllamaHealth}
                                                disabled={checkingHealth}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                            >
                                                {checkingHealth ? 'Checking...' : 'Test Connection'}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            This URL is configured by the system administrator. You can only test the connection.
                                        </p>
                                    </div>

                                    {health && provider === 'ollama' && (
                                        <div className={`p-3 rounded-md text-sm ${health.status === 'OK' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                            <div className="flex items-center">
                                                <span className={`h-2 w-2 rounded-full mr-2 ${health.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <strong>Status: {health.status}</strong>
                                            </div>
                                            {health.ollama && <p className="mt-1">Ollama: {health.ollama}</p>}
                                            {health.details && <p className="mt-1 text-xs">{health.details}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
