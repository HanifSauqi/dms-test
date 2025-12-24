import api from './client';

const reportApi = {
    /**
     * Get all reports for current user
     */
    getAll: () => {
        return api.get('/reports');
    },

    /**
     * Get a single report by ID
     */
    getById: (id) => {
        return api.get(`/reports/${id}`);
    },

    /**
     * Get report with statistics
     */
    getStats: (id) => {
        return api.get(`/reports/${id}/stats`);
    },

    /**
     * Create a new report
     */
    create: (data) => {
        return api.post('/reports', data);
    },

    /**
     * Update a report
     */
    update: (id, data) => {
        return api.put(`/reports/${id}`, data);
    },

    /**
     * Delete a report
     */
    delete: (id) => {
        return api.delete(`/reports/${id}`);
    }
};

export default reportApi;
