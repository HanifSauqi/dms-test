const settingsService = require('../services/settingsService');

const getSettings = async (req, res) => {
    try {
        const settings = await settingsService.getSettings();

        // Security: Mask the API Key if not admin (or maybe even for admin to prevent shoulder surfing)
        // But for now, let's send it. If we want stricter security we can mask it.
        // For general public config access, we might want to return masked versions.
        // Actually, only admins usually hit this endpoint? 
        // Wait, ollamaService needs to read it on backend, that's internal.
        // Frontend user checks "Ollama URL" -> this is public info for the user to see? 
        // Yes, users need to know the URL to test connection? No, backend tests it.
        // But frontend Settings page shows the URL.

        // Let's Mask Gemini Key
        if (settings.gemini_api_key) {
            settings.gemini_api_key_masked = settings.gemini_api_key.substring(0, 5) + '...' + settings.gemini_api_key.substring(settings.gemini_api_key.length - 4);
            // Only return full key if requested by Admin? For now let's just return masked for safety in non-admin contexts if we separate them.
            // But since this is general get, let's check role.
            if (req.user && req.user.role !== 'admin') {
                delete settings.gemini_api_key; // Don't send full key to non-admin
            }
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    // Check Admin Role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { gemini_api_key, ollama_url } = req.body;
    const userId = req.user.id;

    try {
        if (gemini_api_key !== undefined) {
            await settingsService.updateSetting('gemini_api_key', gemini_api_key, userId);
        }
        if (ollama_url !== undefined) {
            await settingsService.updateSetting('ollama_url', ollama_url, userId);
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
