const BaseService = require('./BaseService');
const pool = require('../utils/database');

class ReportService extends BaseService {
    constructor() {
        super('reports');
    }

    /**
     * Create a new report
     */
    async createReport(data, userId) {
        const { name, description, keywords, timeRange } = data;

        // Check for duplicate name
        const existing = await pool.query(
            'SELECT id FROM reports WHERE name = $1 AND user_id = $2',
            [name, userId]
        );

        if (existing.rows.length > 0) {
            throw new Error('Report with this name already exists');
        }

        const result = await pool.query(
            `INSERT INTO reports (name, description, keywords, time_range, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, description || '', keywords || [], timeRange || 'monthly', userId]
        );

        return result.rows[0];
    }

    /**
     * Get all reports for a user
     */
    async getReports(userId) {
        const result = await pool.query(
            `SELECT * FROM reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Get a single report by ID
     */
    async getReportById(reportId, userId) {
        const result = await pool.query(
            'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
            [reportId, userId]
        );

        return result.rows[0] || null;
    }

    /**
     * Update a report
     */
    async updateReport(reportId, data, userId) {
        const report = await this.getReportById(reportId, userId);

        if (!report) {
            throw new Error('Report not found');
        }

        const { name, description, keywords, timeRange } = data;

        // Check for duplicate name if name is changing
        if (name && name !== report.name) {
            const existing = await pool.query(
                'SELECT id FROM reports WHERE name = $1 AND user_id = $2 AND id != $3',
                [name, userId, reportId]
            );

            if (existing.rows.length > 0) {
                throw new Error('Report with this name already exists');
            }
        }

        const result = await pool.query(
            `UPDATE reports 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           keywords = COALESCE($3, keywords),
           time_range = COALESCE($4, time_range),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
            [name, description, keywords, timeRange, reportId, userId]
        );

        return result.rows[0];
    }

    /**
     * Delete a report
     */
    async deleteReport(reportId, userId) {
        const report = await this.getReportById(reportId, userId);

        if (!report) {
            throw new Error('Report not found');
        }

        await pool.query(
            'DELETE FROM reports WHERE id = $1 AND user_id = $2',
            [reportId, userId]
        );

        return report;
    }

    /**
     * Get report statistics - count documents matching keywords
     */
    async getReportStats(reportId, userId) {
        const report = await this.getReportById(reportId, userId);

        if (!report) {
            throw new Error('Report not found');
        }

        const keywords = report.keywords || [];

        if (keywords.length === 0) {
            return {
                report,
                stats: [],
                total: 0
            };
        }

        // Build keyword conditions - ALL keywords must match (AND logic)
        const keywordConditions = keywords
            .map((_, index) => `extracted_content ILIKE $${index + 2}`)
            .join(' AND ');

        const keywordParams = keywords.map(kw => `%${kw}%`);

        // Get date grouping and series generation based on time_range
        let dateGrouping, dateFormat, seriesStart, seriesEnd, seriesInterval;
        switch (report.time_range) {
            case 'daily':
                dateGrouping = "DATE_TRUNC('day', created_at)";
                dateFormat = 'YYYY-MM-DD';
                seriesStart = "CURRENT_DATE - INTERVAL '6 days'";
                seriesEnd = "CURRENT_DATE";
                seriesInterval = "'1 day'::interval";
                break;
            case 'weekly':
                dateGrouping = "DATE_TRUNC('week', created_at)";
                dateFormat = 'YYYY-"W"IW';
                seriesStart = "DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '6 weeks'";
                seriesEnd = "DATE_TRUNC('week', CURRENT_DATE)";
                seriesInterval = "'1 week'::interval";
                break;
            case 'yearly':
                dateGrouping = "DATE_TRUNC('year', created_at)";
                dateFormat = 'YYYY';
                seriesStart = "DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '9 years'";
                seriesEnd = "DATE_TRUNC('year', CURRENT_DATE)";
                seriesInterval = "'1 year'::interval";
                break;
            case 'monthly':
            default:
                dateGrouping = "DATE_TRUNC('month', created_at)";
                dateFormat = 'YYYY-MM';
                seriesStart = "DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'";
                seriesEnd = "DATE_TRUNC('month', CURRENT_DATE)";
                seriesInterval = "'1 month'::interval";
                break;
        }

        // Generate all periods in the range and LEFT JOIN with actual document counts
        const statsQuery = `
      WITH periods AS (
        SELECT generate_series(
          ${seriesStart},
          ${seriesEnd},
          ${seriesInterval}
        )::date as period
      ),
      doc_counts AS (
        SELECT 
          ${dateGrouping}::date as period,
          COUNT(*) as count
        FROM documents
        WHERE owner_id = $1 AND ${keywordConditions}
        GROUP BY ${dateGrouping}
      )
      SELECT 
        p.period,
        TO_CHAR(p.period, '${dateFormat}') as period_label,
        COALESCE(d.count, 0) as count
      FROM periods p
      LEFT JOIN doc_counts d ON p.period = d.period
      ORDER BY p.period ASC
    `;

        const statsResult = await pool.query(statsQuery, [userId, ...keywordParams]);

        // Get total count (within the time range)
        const totalQuery = `
      SELECT COUNT(*) as total
      FROM documents
      WHERE owner_id = $1 AND ${keywordConditions} 
        AND created_at >= ${seriesStart} AND created_at < ${seriesEnd} + ${seriesInterval}
    `;

        const totalResult = await pool.query(totalQuery, [userId, ...keywordParams]);

        return {
            report,
            stats: statsResult.rows,
            total: parseInt(totalResult.rows[0].total)
        };
    }
}

module.exports = new ReportService();
