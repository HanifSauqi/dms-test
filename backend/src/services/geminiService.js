const { GoogleGenAI } = require('@google/genai');
const geminiConfig = require('../config/gemini.config');

/**
 * Gemini AI Service for RAG (Retrieval-Augmented Generation)
 *
 * Features:
 * - Document metadata extraction
 * - Query understanding & parsing
 * - Document type detection
 * - RAG-based search with context
 */

class GeminiService {
  constructor() {
    this.config = geminiConfig;
    this.apiKey = this.config.apiKey;

    if (!this.apiKey || this.apiKey.length < 20) {
      console.warn('⚠️  GEMINI_API_KEY not found or invalid in environment variables');
      console.warn('   RAG features will be disabled');
      console.warn('   Get your free API key at: https://aistudio.google.com/');
      this.enabled = false;
      return;
    }

    try {
      // Initialize Google GenAI client
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      this.enabled = true;
    } catch (error) {
      this.enabled = false;
    }
  }

  /**
   * Execute API request with retry logic
   * @private
   */
  async executeWithRetry(fn, retries = this.config.maxRetries) {
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
   * Check if Gemini service is available
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Extract structured metadata from document content
   * Auto-detects document type and extracts relevant fields
   *
   * @param {string} content - Document text content
   * @param {string} fileName - Original file name for context
   * @returns {object} Structured metadata
   */
  async extractMetadata(content, fileName = '') {
    if (!this.enabled || !this.config.features.metadataExtraction) {
      return { error: 'Gemini service not available' };
    }

    try {
      // Truncate content to max length
      const truncatedContent = content.substring(0, this.config.maxContentLength);

      const prompt = `Analyze this document and extract structured metadata as JSON.

Document file: ${fileName}
Content: ${truncatedContent}

Instructions:
1. Detect document type (CV, Resume, Invoice, Contract, Report, Proposal, etc.)
2. Extract relevant fields based on document type:
   - CV/Resume: name, years_experience, skills, education, position, contact
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

      // Generate content using Gemini API with retry logic
      const response = await this.executeWithRetry(async () => {
        return await this.ai.models.generateContent({
          model: this.config.defaultModels.extraction,
          contents: prompt
        });
      });

      const text = response.text;

      // Parse JSON response
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

  /**
   * Parse user query to understand search intent
   * Extracts filters, criteria, and document type from natural language
   *
   * @param {string} query - User's natural language query
   * @returns {object} Parsed query with filters and criteria
   */
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
   - For numbers: use operator (>, <, >=, <=, =) and value
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
    "years_experience": {"operator": ">=", "value": 5}
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

      const text = response.text;

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
  async ragSearch(query, documents) {
    if (!this.enabled || !this.config.features.ragSearch) {
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
        return `[Document ${index + 1}]
ID: ${doc.id}
Title: ${doc.title}
File: ${doc.fileName}
Content: ${(doc.extractedContent || doc.description || '').substring(0, 1500)}
---`;
      }).join('\n\n');

      const prompt = `You are a document search assistant. Analyze the documents and find which ones match the user's query.

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
      "reason": "具体的な理由 (e.g., Has 7 years experience which exceeds 5 years requirement, Skills include Python)"
    }
  ],
  "summary": "Brief explanation of what was found",
  "total_found": number_of_matches
}

If no documents match the criteria, return empty array with explanation in summary.
Return ONLY valid JSON, no markdown.`;

      // Generate content using Gemini API with retry logic
      const response = await this.executeWithRetry(async () => {
        return await this.ai.models.generateContent({
          model: this.config.defaultModels.search,
          contents: prompt
        });
      });

      const text = response.text;

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const ragResponse = JSON.parse(jsonMatch[0]);

      return ragResponse;

    } catch (error) {
      console.error('Error in RAG search:', error.message);
      return {
        matching_files: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          reason: 'Error in AI processing - showing semantic search results'
        })),
        summary: `Error processing query: ${error.message}`,
        total_found: documents.length,
        error: error.message
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
