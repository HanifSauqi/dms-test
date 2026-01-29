'use client';



// Removed toast to prevent duplicate notifications
export const saveAIPreferences = (provider, llmUrl, geminiKey) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('llm_service_url', llmUrl);

        if (geminiKey && geminiKey.trim() !== '') {
            localStorage.setItem('gemini_api_key', geminiKey.trim());
        } else {
            localStorage.removeItem('gemini_api_key');
        }
    }
};

export const getAIPreferences = () => {
    if (typeof window !== 'undefined') {
        return {
            provider: localStorage.getItem('ai_provider') || 'gemini',
            llmUrl: localStorage.getItem('llm_service_url') || 'http://localhost:3005',
            geminiKey: localStorage.getItem('gemini_api_key') || ''
        };
    }
    return { provider: 'gemini', llmUrl: 'http://localhost:3005', geminiKey: '' };
};
