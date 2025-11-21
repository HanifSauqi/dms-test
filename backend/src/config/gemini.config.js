/**
 * Gemini AI Configuration
 * Centralized configuration for Google Gemini API
 */

module.exports = {
  // API Configuration
  apiKey: process.env.GEMINI_API_KEY,

  // Model Configuration
  models: {
    flash: 'gemini-2.0-flash-exp',      // Fast, cost-effective
    flashThinking: 'gemini-2.5-flash',  // Balanced reasoning
    pro: 'gemini-2.5-pro-latest'        // Most capable
  },

  // Default model for different tasks
  defaultModels: {
    extraction: 'gemini-2.5-flash',     // Metadata extraction
    search: 'gemini-2.0-flash-exp',     // RAG search
    classification: 'gemini-2.5-flash'  // Document classification
  },

  // Request settings
  timeout: 30000,           // 30 seconds
  maxRetries: 3,            // Number of retry attempts
  retryDelay: 1000,         // Initial retry delay (ms)

  // Content limits
  maxContentLength: 5000,   // Max content length for processing
  maxQueryLength: 500,      // Max query length

  // Feature flags
  features: {
    metadataExtraction: true,
    ragSearch: true,
    autoClassification: true,
    caching: false  // Enable when implementing cache
  }
};
