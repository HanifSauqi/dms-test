const pool = require('../utils/database');

class SettingsService {
    /**
     * Get all system settings
     * returns object like { gemini_api_key: 'xxx', ollama_url: 'yyy' }
     */
    async getSettings() {
        const result = await pool.query('SELECT key, value FROM system_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    /**
     * Get specific setting by key
     */
    async getSetting(key) {
        const result = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
        return result.rows.length > 0 ? result.rows[0].value : null;
    }

    /**
     * Update setting
     */
    async updateSetting(key, value, userId) {
        await pool.query(
            `INSERT INTO system_settings (key, value, updated_by, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (key) DO UPDATE 
       SET value = $2, updated_by = $3, updated_at = NOW()`,
            [key, value, userId]
        );
        return { key, value };
    }
}

module.exports = new SettingsService();
