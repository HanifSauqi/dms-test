const pool = require('./database');

const logActivity = async (documentId, userId, activityType) => {
  try {
    const validTypes = ['created', 'viewed', 'edited', 'downloaded', 'shared'];

    if (!validTypes.includes(activityType)) {
      console.error(`Invalid activity type: ${activityType}`);
      return;
    }

    const recentActivity = await pool.query(
      `SELECT id, created_at FROM document_activities
       WHERE document_id = $1
       AND user_id = $2
       AND activity_type = $3
       AND created_at > NOW() - INTERVAL '10 seconds'
       ORDER BY created_at DESC
       LIMIT 1`,
      [documentId, userId, activityType]
    );

    if (recentActivity.rows.length > 0) {
      return;
    }

    await pool.query(
      'INSERT INTO document_activities (document_id, user_id, activity_type) VALUES ($1, $2, $3)',
      [documentId, userId, activityType]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const getLatestActivity = async (documentId) => {
  try {
    const result = await pool.query(
      `SELECT activity_type, created_at
       FROM document_activities
       WHERE document_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [documentId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting latest activity:', error);
    return null;
  }
};

const getActivityHistory = async (documentId, limit = 10) => {
  try {
    const result = await pool.query(
      `SELECT da.*, u.name as user_name, u.email as user_email
       FROM document_activities da
       JOIN users u ON da.user_id = u.id
       WHERE da.document_id = $1
       ORDER BY da.created_at DESC
       LIMIT $2`,
      [documentId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting activity history:', error);
    return [];
  }
};

module.exports = {
  logActivity,
  getLatestActivity,
  getActivityHistory
};
