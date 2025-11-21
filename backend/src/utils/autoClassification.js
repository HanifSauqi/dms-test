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
    console.log('🤖 Auto-classification started:', {
      userId,
      manualFolderId,
      hasContent: !!extractedContent,
      contentLength: extractedContent?.length || 0
    });

    // If folder manually specified, respect user's choice
    if (manualFolderId) {
      console.log('📁 Manual folder selected, skipping auto-classification');
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

    console.log(`📋 Found ${rulesResult.rows.length} active classification rules`);

    if (rulesResult.rows.length === 0) {
      console.log('⚠️ No active classification rules found');
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
      console.log('⚠️ No extracted content to match against');
      return {
        targetFolderId: null,
        autoClassified: false,
        matchedKeyword: null,
        folderName: null
      };
    }

    console.log('🔍 Checking keywords against content...');
    console.log('Content preview:', contentLower.substring(0, 200));

    for (const rule of rulesResult.rows) {
      const keywordLower = rule.keyword.toLowerCase();
      console.log(`  - Checking keyword: "${rule.keyword}" in folder "${rule.folder_name}"`);

      if (contentLower.includes(keywordLower)) {
        console.log(`✅ MATCH FOUND! Keyword "${rule.keyword}" matched!`);
        return {
          targetFolderId: rule.target_folder_id,
          autoClassified: true,
          matchedKeyword: rule.keyword,
          folderName: rule.folder_name,
          ruleId: rule.id
        };
      }
    }

    console.log('❌ No keyword matches found');

    // No matches found
    return {
      targetFolderId: null,
      autoClassified: false,
      matchedKeyword: null,
      folderName: null
    };

  } catch (error) {
    console.error('Auto-classification error:', error);
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