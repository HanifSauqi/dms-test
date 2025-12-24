const pool = require('./database');

/**
 * Auto-classify document based on user's classification rules
 * @param {string} extractedContent - Text content from document
 * @param {number} userId - User ID
 * @param {number|null} manualFolderId - Manually specified folder ID (takes priority)
 * @returns {Object} Classification result
 */
const classifyDocument = async (extractedContent, userId, manualFolderId = null) => {
  try {
    // If folder manually specified, respect user's choice
    if (manualFolderId) {
      return {
        targetFolderId: manualFolderId,
        autoClassified: false,
        matchedKeyword: null,
        folderName: null
      };
    }

    // Get user's active classification rules
    const rulesResult = await pool.query(`
      SELECT ucr.*, f.name as folder_name
      FROM user_classification_rules ucr
      JOIN folders f ON ucr.target_folder_id = f.id
      WHERE ucr.user_id = $1 AND ucr.is_active = true
      ORDER BY ucr.priority DESC, ucr.created_at ASC
    `, [userId]);

    if (rulesResult.rows.length === 0) {
      return {
        targetFolderId: null,
        autoClassified: false,
        matchedKeyword: null,
        folderName: null
      };
    }

    // Check for keyword matches in extracted content
    const contentLower = extractedContent ? extractedContent.toLowerCase() : '';

    if (!contentLower) {
      return {
        targetFolderId: null,
        autoClassified: false,
        matchedKeyword: null,
        folderName: null
      };
    }

    for (const rule of rulesResult.rows) {
      const keywordLower = rule.keyword.toLowerCase();

      if (contentLower.includes(keywordLower)) {
        return {
          targetFolderId: rule.target_folder_id,
          autoClassified: true,
          matchedKeyword: rule.keyword,
          folderName: rule.folder_name,
          ruleId: rule.id
        };
      }
    }

    // No matches found
    return {
      targetFolderId: null,
      autoClassified: false,
      matchedKeyword: null,
      folderName: null
    };

  } catch (error) {
    // Return no classification on error to prevent upload failure
    return {
      targetFolderId: null,
      autoClassified: false,
      matchedKeyword: null,
      folderName: null,
      error: error.message
    };
  }
};

module.exports = {
  classifyDocument
};