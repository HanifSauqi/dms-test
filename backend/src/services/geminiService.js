const { GoogleGenAI } = require('@google/genai');
const geminiConfig = require('../config/gemini.config');

/**
 * Gemini AI Service for RAG (Retrieval-Augmented Generation)
 */

class GeminiService {
  constructor() {
    this.config = geminiConfig;
    this.defaultApiKey = this.config.apiKey;
    // We can't await in constructor, so we'll lazy load or init
    this.initialize(this.defaultApiKey);
  }

  async loadGlobalConfig() {
    const settingsService = require('./settingsService');
    const dbKey = await settingsService.getSetting('gemini_api_key');
    this.defaultApiKey = dbKey || this.config.apiKey;

    // Re-initialize if key changed
    if (this.defaultApiKey) {
      this.initialize(this.defaultApiKey); // Reloads this.ai
    }
  }

  initialize(apiKey) {
    if (!apiKey || apiKey.length < 20) {
      // console.warn('⚠️  GEMINI_API_KEY not found or invalid'); // Too noisy if strictly controlled
      this.enabled = false;
      this.ai = null;
      return;
    }

    try {
      this.ai = new GoogleGenAI({ apiKey });
      this.enabled = true;
    } catch (error) {
      this.enabled = false;
      this.ai = null;
    }
  }

  getClient(apiKey) {
    if (apiKey && apiKey !== this.defaultApiKey) {
      return new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Execute API request with retry logic
   * @private
   */
  async executeWithRetry(fn, options = {}) {
    const retries = options.retries || this.config.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`Gemini API attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Helper to extract text from Gemini response safely
   * Handles differnet SDK response structures
   * @private
   */
  _extractTextFromResponse(response) {
    if (!response) return '';

    // 1. Try helper function (SDK v1.0+)
    if (typeof response.text === 'function') {
      try { return response.text(); } catch (e) { }
    }

    // 2. Try direct property
    if (response.text && typeof response.text === 'string') {
      return response.text;
    }

    // 3. Manual extraction from candidates (Standard API)
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        return candidate.content.parts.map(p => p.text).join('');
      }
    }

    return '';
  }

  /**
   * Check if Gemini service is available
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Test the connection with a specific API Key
   */
  async testConnection(apiKey) {
    try {
      let keyToUse;
      if (apiKey) {
        keyToUse = apiKey;
      } else {
        await this.loadGlobalConfig();
        keyToUse = this.defaultApiKey;
      }

      const client = this.getClient(keyToUse);
      if (!client) throw new Error('Client not initialized');

      const modelName = this.config.defaultModels.search;

      const response = await client.models.generateContent({
        model: modelName,
        contents: "Hello"
      });

      // Fallback text extraction
      let text = '';
      if (typeof response.text === 'function') {
        text = response.text();
      } else if (response.text) {
        text = response.text;
      } else if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
        const parts = response.candidates[0].content.parts || [];
        text = parts.map(p => p.text).join('');
      } else {
        text = JSON.stringify(response);
      }

      return { success: true, message: 'Connection successful', response: text };
    } catch (error) {
      // console.error('[GeminiService] testConnection - Error:', error.message);

      let errorType = 'general_error';
      if (error.message.includes('API key expired')) errorType = 'expired_key';
      else if (error.message.includes('API_KEY_INVALID')) errorType = 'invalid_key';
      else if (error.status === 429 || error.message.includes('429')) errorType = 'quota_exceeded';

      return { success: false, error: error.message, errorType };
    }
  }


  async extractMetadata(content, fileName = '') {
    if (!this.enabled || !this.config.features.metadataExtraction) {
      return { error: 'Gemini service not available' };
    }

    try {
      const truncatedContent = content.substring(0, this.config.maxContentLength);

      const prompt = `Analyze this document and extract structured metadata as JSON.

Document file: ${fileName}
Content: ${truncatedContent}

Instructions:
1. Detect document type(CV, Resume, Invoice, Contract, Report, Proposal, etc.)
2. Extract relevant fields based on document type:
- CV / Resume: name, years_experience, skills, education, position, contact
  - Invoice: invoice_number, amount, client, due_date, status, items
    - Contract: parties, start_date, end_date, value, terms
      - Report: period, type, key_metrics, summary
        - Proposal: title, client, value, deadline, scope
          - Generic: title, date, keywords, category, summary

3. Return ONLY valid JSON in this format:
{
  "document_type": "type",
    "confidence": 0.95,
      "extracted_fields": {
    "field1": "value1",
      "field2": "value2"
  },
  "summary": "brief summary",
    "key_entities": ["entity1", "entity2"],
      "suggested_tags": ["tag1", "tag2"]
}

Return JSON only, no markdown, no explanation.`;

      const response = await this.executeWithRetry(async () => {
        return await this.ai.models.generateContent({
          model: this.config.defaultModels.extraction,
          contents: prompt
        });
      });

      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const metadata = JSON.parse(jsonMatch[0]);
      return metadata;

    } catch (error) {
      console.error('Error extracting metadata:', error.message);
      return {
        document_type: 'unknown',
        confidence: 0,
        extracted_fields: {},
        summary: '',
        error: error.message
      };
    }
  }

  async parseQuery(query) {
    if (!this.enabled || !this.config.features.ragSearch) {
      return { originalQuery: query, filters: {} };
    }

    // Validate and truncate query
    const sanitizedQuery = String(query).substring(0, this.config.maxQueryLength).trim();
    if (sanitizedQuery.length < 2) {
      return { originalQuery: query, filters: {}, keywords: [] };
    }

    try {
      const prompt = `Parse this search query and extract search criteria as JSON.

User Query: "${query}"

Instructions:
Extract:
1. document_type: Type of document user is looking for (CV, Invoice, Contract, etc.)
  2. filters: Specific criteria to filter by
    - For numbers: use operator(>, <, >=, <=, =) and value
      - For dates: extract date range or relative time
        - For status: extract status keywords
          - For text: extract keywords
3. keywords: Main search terms
4. intent: What user wants to find

Examples:
Query: "cv dengan pengalaman 5 tahun ke atas"
{
  "document_type": "cv",
    "filters": {
    "years_experience": { "operator": ">=", "value": 5 }
  },
  "keywords": ["cv", "pengalaman", "experience"],
    "intent": "find_cv_by_experience"
}

Query: "invoice yang belum dibayar bulan ini"
{
  "document_type": "invoice",
    "filters": {
    "status": "unpaid",
      "date_range": "current_month"
  },
  "keywords": ["invoice", "belum dibayar", "unpaid"],
    "intent": "find_unpaid_invoices"
}

Return ONLY valid JSON, no markdown, no explanation.`;

      // Generate content using Gemini API with retry logic
      const response = await this.executeWithRetry(async () => {
        return await this.ai.models.generateContent({
          model: this.config.defaultModels.search,
          contents: prompt
        });
      });

      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { originalQuery: query, filters: {}, keywords: [query] };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        ...parsed,
        originalQuery: query
      };

    } catch (error) {
      console.error('Error parsing query:', error.message);
      return {
        originalQuery: query,
        filters: {},
        keywords: [query],
        error: error.message
      };
    }
  }

  /**
   * RAG Search: Retrieve relevant documents and filter based on AI analysis
   *
   * @param {string} query - User's question
   * @param {Array} documents - Retrieved documents from semantic search
   * @returns {object} RAG response with matching files
   */
  async ragSearch(query, documents, options = {}) {
    await this.loadGlobalConfig();
    const apiKey = options.apiKey; // User provided key takes precedence

    const client = this.getClient(apiKey);

    // Check if service is enabled OR if a custom key is provided
    const isServiceActive = this.enabled || (apiKey && apiKey.length > 20);



    if (!isServiceActive || !this.config.features.ragSearch) {
      return {
        matching_files: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          reason: 'Gemini service not available - showing semantic search results'
        })),
        summary: 'RAG service not available. Showing semantic search results only.',
        total_found: documents.length
      };
    }

    if (!documents || documents.length === 0) {
      return {
        matching_files: [],
        summary: 'No relevant documents found for your query.',
        total_found: 0
      };
    }

    try {
      // Build context from retrieved documents
      const context = documents.map((doc, index) => {
        const content = (doc.extracted_content || doc.description || '').substring(0, 50000);

        return `[Document ${index + 1}]
ID: ${doc.id}
Title: ${doc.title}
File: ${doc.fileName}
Content: ${content}
--- `;
      }).join('\n\n');

      const prompt = `You are a document search assistant.Analyze the documents and find which ones match the user's query.

Retrieved Documents:
${context}

User Query: "${query}"

Instructions:
1. Read each document content carefully
2. Determine which documents match the user's criteria (e.g., experience >= 5 years, skills include Python, etc.)
3. For each matching document, explain WHY it matches
4. Return results as JSON:

{
  "matching_files": [
    {
      "id": document_id_number,
      "title": "document title",
      "fileName": "file.pdf",
      "reason": "具体的理由 (e.g., Has 7 years experience which exceeds 5 years requirement, Skills include Python)"
    }
  ],
    "summary": "Brief explanation of what was found",
      "total_found": number_of_matches
}

If no documents match the criteria, return empty array with explanation in summary.
Return ONLY valid JSON, no markdown.`;

      // Generate content using Gemini API with retry logic
      const response = await this.executeWithRetry(async () => {
        return await client.models.generateContent({
          model: this.config.defaultModels.search,
          contents: prompt
        });
      }, options);

      const text = this._extractTextFromResponse(response);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const ragResponse = JSON.parse(jsonMatch[0]);

      return ragResponse;

    } catch (error) {
      console.error('Error in RAG search:', error.message);

      let errorType = 'general_error';
      // Detect specific errors
      if (error.message.includes('API key expired')) errorType = 'expired_key';
      else if (error.message.includes('API_KEY_INVALID')) errorType = 'invalid_key';
      else if (error.status === 429 || error.message.includes('429')) errorType = 'quota_exceeded';

      return {
        matching_files: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          reason: 'Error in AI processing - showing semantic search results'
        })),
        summary: `Error processing query: ${error.message} `,
        total_found: documents.length,
        error: error.message,
        errorType: errorType // NEW: Pass error type for frontend feedback
      };
    }
  }

  /**
   * Filter documents based on extracted metadata and query criteria
   *
   * @param {Array} documents - Documents with metadata
   * @param {object} queryParsed - Parsed query with filters
   * @returns {Array} Filtered documents
   */
  filterByMetadata(documents, queryParsed) {
    if (!queryParsed.filters || Object.keys(queryParsed.filters).length === 0) {
      return documents;
    }

    return documents.filter(doc => {
      if (!doc.structured_metadata || !doc.structured_metadata.extracted_fields) {
        return false;
      }

      const fields = doc.structured_metadata.extracted_fields;

      // Check each filter
      for (const [key, filter] of Object.entries(queryParsed.filters)) {
        const fieldValue = fields[key];

        if (fieldValue === undefined) {
          return false;
        }

        // Handle numeric comparisons
        if (typeof filter === 'object' && filter.operator && filter.value !== undefined) {
          const numValue = parseFloat(fieldValue);
          const filterValue = parseFloat(filter.value);

          switch (filter.operator) {
            case '>':
              if (!(numValue > filterValue)) return false;
              break;
            case '<':
              if (!(numValue < filterValue)) return false;
              break;
            case '>=':
              if (!(numValue >= filterValue)) return false;
              break;
            case '<=':
              if (!(numValue <= filterValue)) return false;
              break;
            case '=':
              if (numValue !== filterValue) return false;
              break;
          }
        }
        // Handle string matching
        else if (typeof filter === 'string') {
          if (typeof fieldValue === 'string') {
            if (!fieldValue.toLowerCase().includes(filter.toLowerCase())) {
              return false;
            }
          } else if (fieldValue !== filter) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

// Singleton instance
module.exports = new GeminiService();
