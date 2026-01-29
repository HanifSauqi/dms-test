const BaseService = require('./BaseService');
const pool = require('../utils/database');
const { extractKeywords, calculateKeywordScore } = require('../utils/searchHelpers');
const geminiService = require('./geminiService');
const ollamaService = require('./ollamaService');

class SearchService extends BaseService {
  constructor() {
    super('documents');
  }

  async ragSearch(query, userId, options = {}) {
    const { limit = 50 } = options;

    let documents = await this.getAllUserDocuments(userId);

    if (documents.length === 0) {
      return { results: [], method: 'none' };
    }

    const aiProvider = options.aiProvider || process.env.AI_PROVIDER || 'gemini';
    const aiService = aiProvider === 'ollama' ? ollamaService : geminiService;

    if (aiService.isEnabled() || (aiProvider === 'gemini' && options.apiKey) || aiProvider === 'ollama') {
      try {
        const result = await this.analyzeWithAI(query, documents, limit, aiService, aiProvider, options);
        return result;
      } catch (error) {
        console.log(`\n⚠️  ${aiProvider.toUpperCase()} AI failed, using keyword fallback...`);
      }
    }

    const keywords = await extractKeywords(query);
    const keywordResults = await this.getKeywordMatchedDocuments(userId, keywords, limit);

    const results = keywordResults.length > 0 ? keywordResults : documents.slice(0, limit);
    return {
      results,
      method: 'keyword',
      info: 'AI unavailable or failed, used keyword matching'
    };
  }

  async getKeywordMatchedDocuments(userId, keywords, limit) {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return [];
    }

    const sanitizedKeywords = keywords
      .map(kw => String(kw).substring(0, 100).trim())
      .filter(kw => kw.length > 0);

    if (sanitizedKeywords.length === 0) {
      return [];
    }

    const keywordConditions = sanitizedKeywords
      .map((_, index) => `d.extracted_content ILIKE $${index + 2}`)
      .join(' OR ');

    const keywordParams = sanitizedKeywords.map(kw => `%${kw}%`);

    const result = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.file_path, d.extracted_content, d.created_at, d.updated_at,
        d.folder_id, d.owner_id,
        f.name as folder_name,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id AND fp.user_id = $1
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE (d.owner_id = $1 OR fp.user_id = $1) AND (${keywordConditions})
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.extracted_content, d.created_at, d.updated_at, d.folder_id, d.owner_id, f.name
       ORDER BY d.updated_at DESC
       LIMIT $${sanitizedKeywords.length + 2}`,
      [userId, ...keywordParams, Math.min(limit * 2, 100)]
    );

    return result.rows.map(doc => ({
      ...doc,
      keywordScore: calculateKeywordScore(doc.extracted_content, sanitizedKeywords)
    })).filter(doc => doc.keywordScore > 0);
  }

  async getAllUserDocuments(userId) {
    const result = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.file_path, d.extracted_content, d.created_at, d.updated_at,
        d.folder_id, d.owner_id,
        f.name as folder_name,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id AND fp.user_id = $1
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.owner_id = $1 OR fp.user_id = $1
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.extracted_content, d.created_at, d.updated_at, d.folder_id, d.owner_id, f.name
       ORDER BY d.updated_at DESC
       LIMIT 100`,
      [userId]
    );

    return result.rows;
  }

  async analyzeWithAI(query, documents, limit, aiService, providerName, options = {}) {
    if (providerName !== 'ollama' && !aiService.isEnabled() && !options.apiKey) {
      console.log(`⚠️  ${providerName.toUpperCase()} AI not available - Fallback to keyword`);
      return {
        results: documents.slice(0, limit),
        method: 'keyword',
        info: `${providerName} not configured`
      };
    }

    // console.log(`🤖 SEARCH METHOD: ${providerName.toUpperCase()} AI (RAG Search)`);

    try {
      // Use the service's built-in RAG search for both Ollama and Gemini
      // Both services now handle full user document sets (filtered by getAllUserDocuments)
      const searchDocs = documents;

      const ragResults = await aiService.ragSearch(query, searchDocs, options);

      // Robust ID matching (convert to string to handle int/string mismatches)
      const matchingIds = (ragResults.matching_files || []).map(f => String(f.id));

      const results = documents.filter(doc => matchingIds.includes(String(doc.id))).slice(0, limit);

      return {
        results,
        method: 'ai',
        provider: providerName,
        aiSummary: ragResults.summary,
        errorType: ragResults.errorType
      };
    } catch (error) {
      console.error(`⚠️  AI Search Error (${providerName}):`, error.message);
      return {
        results: documents.slice(0, limit),
        method: 'keyword',
        info: `AI error: ${error.message}`
      };
    }
  }

  async simpleSearch(query, userId, options = {}) {
    const { folderId, limit = 50, offset = 0 } = options;

    // Input validation
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const sanitizedOffset = Math.max(parseInt(offset) || 0, 0);

    let sql = `
      SELECT d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at,
        f.name as folder_name,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
      FROM documents d
      LEFT JOIN folders f ON d.folder_id = f.id
      LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id AND fp.user_id = $1
      LEFT JOIN document_labels dl ON d.id = dl.document_id
      LEFT JOIN labels l ON dl.label_id = l.id
      WHERE (d.owner_id = $1 OR fp.user_id = $1)
    `;

    const params = [userId];
    let paramCount = 1;

    if (query && typeof query === 'string' && query.trim().length > 0) {
      paramCount++;
      const sanitizedQuery = query.substring(0, 200).trim(); // Limit query length
      sql += ` AND (d.title ILIKE $${paramCount} OR d.extracted_content ILIKE $${paramCount})`;
      params.push(`%${sanitizedQuery}%`);
    }

    if (folderId) {
      paramCount++;
      // Validate folderId is a number
      const folderIdNum = parseInt(folderId);
      if (isNaN(folderIdNum)) {
        throw new Error('Invalid folder ID');
      }
      sql += ` AND d.folder_id = $${paramCount}`;
      params.push(folderIdNum);
    }

    sql += `
      GROUP BY d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at, f.name
      ORDER BY d.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(sanitizedLimit, sanitizedOffset);

    const result = await pool.query(sql, params);
    return result.rows;
  }

  async searchByLabels(labelIds, userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await pool.query(
      `SELECT DISTINCT d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at,
        f.name as folder_name,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id AND fp.user_id = $1
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE (d.owner_id = $1 OR fp.user_id = $1) AND EXISTS(
         SELECT 1 FROM document_labels WHERE document_id = d.id AND label_id = ANY($2)
       )
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at, f.name
       ORDER BY d.updated_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, labelIds, limit, offset]
    );

    return result.rows;
  }

  async searchInFolder(folderId, query, userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    // Input validation
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const sanitizedOffset = Math.max(parseInt(offset) || 0, 0);
    const sanitizedQuery = String(query).substring(0, 200).trim();

    const result = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id AND fp.user_id = $2
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.folder_id = $1 AND (d.owner_id = $2 OR fp.user_id = $2) AND (d.title ILIKE $3 OR d.extracted_content ILIKE $3)
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at
       ORDER BY d.updated_at DESC
       LIMIT $4 OFFSET $5`,
      [folderId, userId, `%${sanitizedQuery}%`, sanitizedLimit, sanitizedOffset]
    );

    return result.rows;
  }
}

module.exports = new SearchService();
