const reportService = require('../services/ReportService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Create a new report
 */
const createReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, keywords, timeRange } = req.body;

        if (!name || !name.trim()) {
            return errorResponse(res, 'Report name is required', 400);
        }

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return errorResponse(res, 'At least one keyword is required', 400);
        }

        const report = await reportService.createReport(
            { name: name.trim(), description, keywords, timeRange },
            userId
        );

        successResponse(res, 'Report created successfully', { report }, 201);
    } catch (error) {
        if (error.message.includes('already exists')) {
            return errorResponse(res, error.message, 409);
        }
        errorResponse(res, 'Failed to create report', 500, error.message);
    }
};

/**
 * Get all reports for current user
 */
const getReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const reports = await reportService.getReports(userId);

        successResponse(res, 'Reports retrieved successfully', { reports });
    } catch (error) {
        errorResponse(res, 'Failed to retrieve reports', 500, error.message);
    }
};

/**
 * Get a single report by ID
 */
const getReportById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const report = await reportService.getReportById(id, userId);

        if (!report) {
            return errorResponse(res, 'Report not found', 404);
        }

        successResponse(res, 'Report retrieved successfully', { report });
    } catch (error) {
        errorResponse(res, 'Failed to retrieve report', 500, error.message);
    }
};

/**
 * Get report with statistics
 */
const getReportStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const data = await reportService.getReportStats(id, userId);

        successResponse(res, 'Report statistics retrieved successfully', data);
    } catch (error) {
        if (error.message === 'Report not found') {
            return errorResponse(res, error.message, 404);
        }
        errorResponse(res, 'Failed to retrieve report statistics', 500, error.message);
    }
};

/**
 * Update a report
 */
const updateReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, keywords, timeRange } = req.body;

        const report = await reportService.updateReport(
            id,
            { name, description, keywords, timeRange },
            userId
        );

        successResponse(res, 'Report updated successfully', { report });
    } catch (error) {
        if (error.message === 'Report not found') {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('already exists')) {
            return errorResponse(res, error.message, 409);
        }
        errorResponse(res, 'Failed to update report', 500, error.message);
    }
};

/**
 * Delete a report
 */
const deleteReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await reportService.deleteReport(id, userId);

        successResponse(res, 'Report deleted successfully');
    } catch (error) {
        if (error.message === 'Report not found') {
            return errorResponse(res, error.message, 404);
        }
        errorResponse(res, 'Failed to delete report', 500, error.message);
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    getReportStats,
    updateReport,
    deleteReport
};
