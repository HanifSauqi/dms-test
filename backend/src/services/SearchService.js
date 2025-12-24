const BaseService = require('./BaseService');
const pool = require('../utils/database');
const { extractKeywords, calculateKeywordScore } = require('../utils/searchHelpers');
const geminiService = require('./geminiService');

class SearchService extends BaseService {
  constructor() {
    super('documents');
  }

  async ragSearch(query, userId, options = {}) {
    const { limit = 50 } = options;

    const keywords = await extractKeywords(query);

    let documents = await this.getKeywordMatchedDocuments(userId, keywords, limit);

    if (documents.length === 0) {
      documents = await this.getAllUserDocuments(userId);
    }

    if (documents.length === 0) {
      return [];
    }

    const results = await this.analyzeWithGemini(query, documents, limit);

    return results;
  }

  async getKeywordMatchedDocuments(userId, keywords, limit) {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return [];
    }

    // Sanitize keywords: remove special characters and limit length
    const sanitizedKeywords = keywords
      .map(kw => String(kw).substring(0, 100).trim())
      .filter(kw => kw.length > 0);

    if (sanitizedKeywords.length === 0) {
      return [];
    }

    // Build parameterized query - safe from SQL injection
    const keywordConditions = sanitizedKeywords
      .map((_, index) => `extracted_content ILIKE $${index + 2}`)
      .join(' OR ');

    const keywordParams = sanitizedKeywords.map(kw => `%${kw}%`);

    const result = await pool.query(
      `SELECT id, title, file_name, extracted_content, created_at, updated_at
       FROM documents
       WHERE owner_id = $1 AND (${keywordConditions})
       ORDER BY updated_at DESC
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
      `SELECT id, title, file_name, extracted_content, created_at, updated_at
       FROM documents
       WHERE owner_id = $1
       ORDER BY updated_at DESC
       LIMIT 100`, // Prevent fetching too many documents
      [userId]
    );

    return result.rows;
  }

  async analyzeWithGemini(query, documents, limit) {
    if (!geminiService.isEnabled()) {
      console.warn('Gemini service not available. Returning keyword matches only.');
      return documents.slice(0, limit);
    }

    const documentsContext = documents.map((doc, index) => {
      const preview = doc.extracted_content
        ? doc.extracted_content.substring(0, 1000)
        : '';

      return `[${index}] Title: ${doc.title}\nFilename: ${doc.file_name}\nContent Preview: ${preview}`;
    }).join('\n\n');

    const prompt = `Analyze these documents and find the ones most relevant to the query: "${query}"

${documentsContext}

Return ONLY a JSON array of document indexes (numbers) sorted by relevance, like this:
[2, 5, 0, 8]

Return ONLY numbers of relevant documents. If none are relevant, return empty array [].
Maximum ${limit} results.`;

    try {
      // Use the executeWithRetry method from geminiService for reliability
      const response = await geminiService.executeWithRetry(async () => {
        return await geminiService.ai.models.generateContent({
          model: geminiService.config.defaultModels.search,
          contents: prompt
        });
      });

      const text = response.text;
      const jsonMatch = text.match(/\[[\d,\s]*\]/);

      if (!jsonMatch) {
        console.warn('Failed to parse Gemini response, returning all documents');
        return documents.slice(0, limit);
      }

      const relevantIndexes = JSON.parse(jsonMatch[0]);

      const results = relevantIndexes
        .map(index => documents[index])
        .filter(doc => doc !== undefined)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Gemini analysis error:', error.message);
      return documents.slice(0, limit);
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
      LEFT JOIN document_labels dl ON d.id = dl.document_id
      LEFT JOIN labels l ON dl.label_id = l.id
      WHERE d.owner_id = $1
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
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.owner_id = $1 AND EXISTS(
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
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.folder_id = $1 AND d.owner_id = $2 AND (d.title ILIKE $3 OR d.extracted_content ILIKE $3)
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.created_at, d.updated_at
       ORDER BY d.updated_at DESC
       LIMIT $4 OFFSET $5`,
      [folderId, userId, `%${sanitizedQuery}%`, sanitizedLimit, sanitizedOffset]
    );

    return result.rows;
  }
}

module.exports = new SearchService();
