const axios = require('axios');

/**
 * Ollama AI Service for local LLM processing
 */
class OllamaService {
    constructor() {
        this.enabled = process.env.AI_PROVIDER === 'ollama';
        this.baseUrl = process.env.LLM_SERVICE_URL || 'http://localhost:3005';
        this.model = process.env.OLLAMA_MODEL || 'qwen2.5';

        this.config = {
            maxContentPerDoc: 5000,    // Characters per document
            maxTotalContent: 50000,    // Total content limit
            timeout: 180000            // 3 minutes
        };
    }

    async ensureConfig() {
        const settingsService = require('./settingsService');
        const dbUrl = await settingsService.getSetting('ollama_url');
        this.baseUrl = dbUrl || process.env.LLM_SERVICE_URL || 'http://localhost:3005';
        this.enabled = process.env.AI_PROVIDER === 'ollama';
    }

    /**
     * Check if Ollama service is available
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Execute API request with basic error handling
     */
    async executeWithRetry(fn) {
        try {
            return await fn();
        } catch (error) {
            console.error('Ollama execution error:', error.message);
            throw error;
        }
    }

    /**
     * Extract structured metadata from document content
     * 
     * @param {string} content - Document text content
     * @param {string} fileName - Original file name for context
     * @returns {object} Structured metadata
     */
    async extractMetadata(content, fileName = '') {
        await this.ensureConfig();
        if (!this.enabled) {
            return { error: 'Ollama service not enabled' };
        }

        try {
            const truncatedContent = content.substring(0, 4000);

            const messages = [
                {
                    role: 'system',
                    content: `You are a document analyzer. Analyze documents and extract metadata.
Return ONLY valid JSON with this structure:
{
  "document_type": "CV|Invoice|Contract|Report|Manual|Other",
  "confidence": 0.0-1.0,
  "extracted_fields": { "field": "value" },
  "summary": "brief summary",
  "key_entities": ["entity1"],
  "suggested_tags": ["tag1"]
}`
                },
                {
                    role: 'user',
                    content: `Analyze this document and extract metadata.
File: ${fileName}
Content: ${truncatedContent}`
                }
            ];

            const response = await axios.post(`${this.baseUrl}/api/chat`, {
                messages,
                model: this.model,
                format: 'json'
            }, { timeout: this.config.timeout });

            if (response.data?.success && response.data?.message?.content) {
                let data = response.data.message.content;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        const jsonMatch = data.match(/\{[\s\S]*\}/);
                        if (jsonMatch) data = JSON.parse(jsonMatch[0]);
                    }
                }
                return data;
            }

            // Fallback to legacy endpoint
            const legacyResponse = await axios.post(`${this.baseUrl}/api/analyze`, {
                prompt: `Analyze this document: ${fileName}\nContent: ${truncatedContent}`,
                system: 'Extract metadata as JSON.',
                model: this.model
            });

            return legacyResponse.data?.data || { document_type: 'unknown', confidence: 0 };

        } catch (error) {
            console.error('Error extracting metadata with Ollama:', error.message);
            return {
                document_type: 'unknown',
                confidence: 0,
                extracted_fields: {},
                summary: '',
                error: error.message
            };
        }
    }

    async ragSearch(query, documents) {
        await this.ensureConfig();

        if (!this.enabled) {
            return {
                matching_files: documents.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    fileName: doc.fileName || doc.file_name,
                    reason: 'Ollama not active'
                })),
                summary: 'Local AI not active.',
                total_found: documents.length
            };
        }

        if (!documents || documents.length === 0) {
            return { matching_files: [], summary: 'No documents to search.', total_found: 0 };
        }

        try {
            // Filter out documents with null/empty content
            const validDocs = documents.filter(doc => {
                const content = doc.extracted_content || doc.description || '';
                return content.trim().length > 0;
            });

            if (validDocs.length === 0) {
                return { matching_files: [], summary: 'No documents with content.', total_found: 0 };
            }

            // PRE-FILTER: Extract keywords and filter documents
            const stopWords = ['berikan', 'saya', 'dokumen', 'cari', 'tampilkan', 'tolong',
                'minta', 'lihat', 'yang', 'dari', 'untuk', 'dengan', 'ini', 'itu',
                'ke', 'di', 'dan', 'atau', 'semua', 'ada', 'adalah'];
            let docsToProcess = validDocs;
            if (keywords.length > 0) {
                docsToProcess = validDocs.filter(doc => {
                    const title = (doc.title || '').toLowerCase();
                    const docType = this._detectDocType(doc.title).toLowerCase();
                    const fileName = (doc.fileName || doc.file_name || '').toLowerCase();

                    // STRICT: Match only title, type, or fileName (NOT content)
                    return keywords.some(kw =>
                        title.includes(kw) ||
                        docType.includes(kw) ||
                        fileName.includes(kw)
                    );
                });

                // If no matches, fallback to all valid docs
                if (docsToProcess.length === 0) {
                    docsToProcess = validDocs;
                }
            }

            // Build document context
            const context = docsToProcess.map((doc, index) => {
                const content = (doc.extracted_content || doc.description || '')
                    .substring(0, this.config.maxContentPerDoc);
                const docType = this._detectDocType(doc.title);
                const fileName = doc.fileName || doc.file_name || '';

                return `[Document ${index + 1}]
ID: ${doc.id}
Type: ${docType}
Title: ${doc.title}
FileName: ${fileName}
Content: ${content}
---`;
            }).join('\n\n');

            // BEST PRACTICE: Use chat API with messages array
            const messages = [
                {
                    role: 'system',
                    content: `You are a document search assistant.

For each document, check:
1. Does the Type match the query? (e.g., query "mcu" matches Type: MCU)
2. Does any specific term from the query appear in the Content field?

IMPORTANT: 
- For query "X dari Y" or "X cito" - you must FIND "Y" or "cito" in the Content field
- Search the entire Content text for the exact word
- Only include documents where you actually find the search term
- If term not found in Content, do not include that document`
                },
                {
                    role: 'user',
                    content: `Query: "${query}"

Search these documents:
${context}

For query "${query}", search for relevant terms in each document's Content.
Return only documents where you find matching terms:
{"matching_files": [{"id": <n>, "title": "<title>", "reason": "<quote the text you found>"}], "summary": "<findings>", "total_found": <count>}`
                }
            ];

            console.log(`🔍 [Ollama RAG] Sending request to ${this.baseUrl}/api/chat`);

            const response = await axios.post(`${this.baseUrl}/api/chat`, {
                messages,
                model: this.model,
                format: 'json',
                options: {
                    temperature: 0.1  // Low temperature for consistent results
                }
            }, { timeout: this.config.timeout });

            console.log('✅ [Ollama RAG] Response received');

            // Parse response
            let data;
            if (response.data?.success && response.data?.message?.content) {
                data = response.data.message.content;
            } else if (response.data?.data) {
                data = response.data.data;
            } else {
                throw new Error('Unexpected response format');
            }

            // Parse JSON if string
            if (typeof data === 'string') {
                try {
                    const jsonMatch = data.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        data = JSON.parse(jsonMatch[0]);
                    } else {
                        data = JSON.parse(data);
                    }
                } catch (e) {
                    console.error('JSON parsing failed:', e.message);
                    console.log('Raw response:', data);
                    throw new Error('Failed to parse JSON response');
                }
            }

            // Normalize field names
            if (!data.matching_files && data.matches) {
                data.matching_files = data.matches;
            }

            // Ensure IDs are numbers
            if (data.matching_files) {
                data.matching_files = data.matching_files.map(f => ({
                    ...f,
                    id: parseInt(f.id, 10)
                }));
            }

            console.log(`🎯 [Ollama RAG] Found ${data.total_found || data.matching_files?.length || 0} matches`);

            return data;

        } catch (error) {
            console.error('❌ Error in Ollama RAG search:', error.message);

            // Return fallback results
            return {
                matching_files: documents.slice(0, 5).map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    reason: 'Fallback - AI error occurred'
                })),
                summary: `Error: ${error.message}`,
                total_found: Math.min(documents.length, 5)
            };
        }
    }

    /**
     * Detect document type from title
     * @private
     */
    _detectDocType(title) {
        const t = (title || '').toLowerCase();
        if (t.includes('cv ') || t.includes('cv-') || t.startsWith('cv')) return 'CV';
        if (t.includes('mcu ') || t.includes('mcu-') || t.startsWith('mcu')) return 'MCU';
        if (t.includes('invoice') || t.includes('faktur')) return 'INVOICE';
        if (t.includes('manual') || t.includes('guide')) return 'MANUAL';
        if (t.includes('report') || t.includes('laporan')) return 'REPORT';
        return 'DOCUMENT';
    }
}

module.exports = new OllamaService();
