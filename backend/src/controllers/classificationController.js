const pool = require('../utils/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get user's classification rules
const getClassificationRules = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT ucr.*, f.name as folder_name
      FROM user_classification_rules ucr
      JOIN folders f ON ucr.target_folder_id = f.id
      WHERE ucr.user_id = $1 AND ucr.is_active = true
      ORDER BY ucr.priority DESC, ucr.created_at ASC
    `, [userId]);

    successResponse(res, 'Classification rules retrieved successfully', {
      rules: result.rows.map(rule => ({
        id: rule.id,
        keyword: rule.keyword,
        targetFolderId: rule.target_folder_id,
        folderName: rule.folder_name,
        isActive: rule.is_active,
        priority: rule.priority,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at
      }))
    });

  } catch (error) {
    errorResponse(res, 'Failed to retrieve classification rules', 500, error.message);
  }
};

// Add new classification rule
const addClassificationRule = async (req, res) => {
  try {
    const { keyword, targetFolderId, priority = 0 } = req.body;
    const userId = req.user.id;
    const target_folder_id = targetFolderId;

    // Validation
    if (!keyword || keyword.trim().length === 0) {
      return errorResponse(res, 'Keyword is required', 400);
    }

    if (!target_folder_id) {
      return errorResponse(res, 'Target folder is required', 400);
    }

    // Validate folder belongs to user or user has access
    const folderCheck = await pool.query(`
      SELECT f.id, f.name FROM folders f
      LEFT JOIN folder_permissions fp ON f.id = fp.folder_id
      WHERE f.id = $1 AND (f.owner_id = $2 OR (fp.user_id = $2 AND fp.permission_level IN ('write', 'admin')))
    `, [target_folder_id, userId]);

    if (folderCheck.rows.length === 0) {
      return errorResponse(res, 'Folder not found or insufficient permissions', 404);
    }

    // Check if keyword already exists for this user
    const existingRule = await pool.query(
      'SELECT id FROM user_classification_rules WHERE user_id = $1 AND LOWER(keyword) = LOWER($2) AND is_active = true',
      [userId, keyword.trim()]
    );

    if (existingRule.rows.length > 0) {
      return errorResponse(res, 'Keyword already exists in your classification rules', 409);
    }

    // Add new rule
    const ruleResult = await pool.query(`
      INSERT INTO user_classification_rules (user_id, keyword, target_folder_id, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, keyword.trim(), target_folder_id, priority]);

    const rule = ruleResult.rows[0];

    // Get folder name for response
    const folderName = folderCheck.rows[0].name;

    successResponse(res, 'Classification rule added successfully', {
      rule: {
        id: rule.id,
        keyword: rule.keyword,
        targetFolderId: rule.target_folder_id,
        folderName: folderName,
        isActive: rule.is_active,
        priority: rule.priority,
        createdAt: rule.created_at
      }
    }, 201);

  } catch (error) {
    errorResponse(res, 'Failed to add classification rule', 500, error.message);
  }
};

// Update classification rule
const updateClassificationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, targetFolderId, priority, isActive } = req.body;
    const userId = req.user.id;
    const target_folder_id = targetFolderId;
    const is_active = isActive;

    // Check if rule belongs to user
    const ruleCheck = await pool.query(
      'SELECT id FROM user_classification_rules WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ruleCheck.rows.length === 0) {
      return errorResponse(res, 'Classification rule not found', 404);
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [id, userId];
    let paramIndex = 3;

    if (keyword !== undefined) {
      updateFields.push(`keyword = $${paramIndex}`);
      params.push(keyword.trim());
      paramIndex++;
    }

    if (target_folder_id !== undefined) {
      // Validate folder access
      const folderCheck = await pool.query(`
        SELECT f.id FROM folders f
        LEFT JOIN folder_permissions fp ON f.id = fp.folder_id
        WHERE f.id = $1 AND (f.owner_id = $2 OR (fp.user_id = $2 AND fp.permission_level IN ('write', 'admin')))
      `, [target_folder_id, userId]);

      if (folderCheck.rows.length === 0) {
        return errorResponse(res, 'Target folder not found or insufficient permissions', 404);
      }

      updateFields.push(`target_folder_id = $${paramIndex}`);
      params.push(target_folder_id);
      paramIndex++;
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    const updateQuery = `
      UPDATE user_classification_rules
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);
    const updatedRule = result.rows[0];

    successResponse(res, 'Classification rule updated successfully', {
      rule: {
        id: updatedRule.id,
        keyword: updatedRule.keyword,
        targetFolderId: updatedRule.target_folder_id,
        isActive: updatedRule.is_active,
        priority: updatedRule.priority,
        createdAt: updatedRule.created_at,
        updatedAt: updatedRule.updated_at
      }
    });

  } catch (error) {
    errorResponse(res, 'Failed to update classification rule', 500, error.message);
  }
};

// Delete classification rule
const deleteClassificationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if rule belongs to user
    const ruleResult = await pool.query(
      'SELECT * FROM user_classification_rules WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ruleResult.rows.length === 0) {
      return errorResponse(res, 'Classification rule not found', 404);
    }

    // Delete rule
    await pool.query(
      'DELETE FROM user_classification_rules WHERE id = $1',
      [id]
    );

    successResponse(res, 'Classification rule deleted successfully');

  } catch (error) {
    errorResponse(res, 'Failed to delete classification rule', 500, error.message);
  }
};

// Get user's folders for dropdown
const getUserFolders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT DISTINCT f.id, f.name
      FROM folders f
      LEFT JOIN folder_permissions fp ON f.id = fp.folder_id
      WHERE f.owner_id = $1 OR (fp.user_id = $1 AND fp.permission_level IN ('write', 'admin'))
      ORDER BY f.name ASC
    `, [userId]);

    successResponse(res, 'User folders retrieved successfully', {
      folders: result.rows
    });

  } catch (error) {
    errorResponse(res, 'Failed to retrieve user folders', 500, error.message);
  }
};

module.exports = {
  getClassificationRules,
  addClassificationRule,
  updateClassificationRule,
  deleteClassificationRule,
  getUserFolders
};