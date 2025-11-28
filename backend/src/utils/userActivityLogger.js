const pool = require('./database');

/**
 * Log user activity to user_activities table
 * @param {number} userId - ID of the user performing the activity
 * @param {string} activityType - Type of activity (login, logout, create_document, etc.)
 * @param {object} options - Additional options
 * @param {string} options.description - Human-readable description
 * @param {string} options.targetType - Type of target resource (document, folder, user, system)
 * @param {number} options.targetId - ID of target resource
 * @param {string} options.ipAddress - IP address of the user
 * @param {string} options.userAgent - User agent string
 * @param {object} options.metadata - Additional JSON metadata
 * @returns {Promise<object>} - Created activity log entry
 */
async function logUserActivity(userId, activityType, options = {}) {
  try {
    const {
      description = '',
      targetType = null,
      targetId = null,
      ipAddress = null,
      userAgent = null,
      metadata = null
    } = options;

    const query = `
      INSERT INTO user_activities (
        user_id,
        activity_type,
        activity_description,
        target_type,
        target_id,
        ip_address,
        user_agent,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const values = [
      userId,
      activityType,
      description,
      targetType,
      targetId,
      ipAddress,
      userAgent,
      metadata ? JSON.stringify(metadata) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw error to prevent breaking the main flow
    return null;
  }
}

/**
 * Get user activity history
 * @param {number} userId - ID of the user
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @param {number} options.offset - Number of records to skip
 * @param {string} options.activityType - Filter by activity type
 * @param {string} options.targetType - Filter by target type
 * @param {Date} options.startDate - Filter activities from this date
 * @param {Date} options.endDate - Filter activities until this date
 * @returns {Promise<object>} - Activity history with pagination info
 */
async function getUserActivityHistory(userId, options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      activityType = null,
      targetType = null,
      startDate = null,
      endDate = null
    } = options;

    let query = `
      SELECT
        ua.*,
        u.name as user_name,
        u.email as user_email
      FROM user_activities ua
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE ua.user_id = $1
    `;

    const values = [userId];
    let paramIndex = 2;

    // Add filters
    if (activityType) {
      query += ` AND ua.activity_type = $${paramIndex}`;
      values.push(activityType);
      paramIndex++;
    }

    if (targetType) {
      query += ` AND ua.target_type = $${paramIndex}`;
      values.push(targetType);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ua.created_at >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ua.created_at <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY ua.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM user_activities ua
      WHERE ua.user_id = $1
    `;
    const countValues = [userId];
    let countParamIndex = 2;

    if (activityType) {
      countQuery += ` AND ua.activity_type = $${countParamIndex}`;
      countValues.push(activityType);
      countParamIndex++;
    }

    if (targetType) {
      countQuery += ` AND ua.target_type = $${countParamIndex}`;
      countValues.push(targetType);
      countParamIndex++;
    }

    if (startDate) {
      countQuery += ` AND ua.created_at >= $${countParamIndex}`;
      countValues.push(startDate);
      countParamIndex++;
    }

    if (endDate) {
      countQuery += ` AND ua.created_at <= $${countParamIndex}`;
      countValues.push(endDate);
      countParamIndex++;
    }

    const [activities, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      activities: activities.rows,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    };
  } catch (error) {
    console.error('Error getting user activity history:', error);
    throw error;
  }
}

/**
 * Get all users' activity summary (for superadmin)
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of records
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<object>} - Users with their activity stats
 */
async function getAllUsersActivitySummary(options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(ua.id) as total_activities,
        MAX(ua.created_at) as last_activity,
        COUNT(CASE WHEN ua.activity_type = 'login' THEN 1 END) as login_count,
        COUNT(CASE WHEN ua.activity_type = 'logout' THEN 1 END) as logout_count,
        COUNT(CASE WHEN ua.activity_type LIKE '%document%' THEN 1 END) as document_activities,
        COUNT(CASE WHEN ua.activity_type LIKE '%folder%' THEN 1 END) as folder_activities
      FROM users u
      LEFT JOIN user_activities ua ON u.id = ua.user_id
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY last_activity DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) as total FROM users`;

    const [result, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      users: result.rows,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    };
  } catch (error) {
    console.error('Error getting users activity summary:', error);
    throw error;
  }
}

/**
 * Get recent activities across all users (for superadmin dashboard)
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Array>} - Recent activities
 */
async function getRecentActivities(limit = 20) {
  try {
    const query = `
      SELECT
        ua.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM user_activities ua
      LEFT JOIN users u ON ua.user_id = u.id
      ORDER BY ua.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
}

/**
 * Get activity statistics for a specific user
 * @param {number} userId - ID of the user
 * @param {object} options - Options for date range
 * @returns {Promise<object>} - Activity statistics
 */
async function getUserActivityStats(userId, options = {}) {
  try {
    const { startDate = null, endDate = null } = options;

    let query = `
      SELECT
        COUNT(*) as total_activities,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        COUNT(CASE WHEN activity_type = 'login' THEN 1 END) as login_count,
        COUNT(CASE WHEN activity_type = 'logout' THEN 1 END) as logout_count,
        COUNT(CASE WHEN activity_type = 'create_document' THEN 1 END) as documents_created,
        COUNT(CASE WHEN activity_type = 'edit_document' THEN 1 END) as documents_edited,
        COUNT(CASE WHEN activity_type = 'delete_document' THEN 1 END) as documents_deleted,
        COUNT(CASE WHEN activity_type = 'view_document' THEN 1 END) as documents_viewed,
        COUNT(CASE WHEN activity_type = 'download_document' THEN 1 END) as documents_downloaded,
        COUNT(CASE WHEN activity_type = 'create_folder' THEN 1 END) as folders_created,
        COUNT(CASE WHEN activity_type = 'edit_folder' THEN 1 END) as folders_edited,
        COUNT(CASE WHEN activity_type = 'delete_folder' THEN 1 END) as folders_deleted,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM user_activities
      WHERE user_id = $1
    `;

    const values = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    throw error;
  }
}

module.exports = {
  logUserActivity,
  getUserActivityHistory,
  getAllUsersActivitySummary,
  getRecentActivities,
  getUserActivityStats
};
