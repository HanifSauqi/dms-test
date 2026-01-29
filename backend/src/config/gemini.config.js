/**
 * Gemini AI Configuration
 * Centralized configuration for Google Gemini API
 */

module.exports = {
  // API Configuration
  apiKey: process.env.GEMINI_API_KEY,

  // Model Configuration
  models: {
    flash: 'gemini-2.5-flash',           // Standard flash model
    flashLite: 'gemini-2.5-flash-lite',  // Lite version (higher RPD)
    pro: 'gemini-2.5-pro'                // Most capable
  },

  // Default model for different tasks
  defaultModels: {
    extraction: 'gemini-2.5-flash',      // Metadata extraction
    search: 'gemini-2.5-flash',          // RAG search
    classification: 'gemini-2.5-flash'   // Classification
  },

  // Request settings
  timeout: 30000,           // 30 seconds
  maxRetries: 3,            // Number of retry attempts
  retryDelay: 1000,         // Initial retry delay (ms)

  // Content limits
  maxContentLength: 50000,   // Max content length for processing
  maxQueryLength: 500,      // Max query length

  // Feature flags
  features: {
    metadataExtraction: true,
    ragSearch: true,
    autoClassification: true,
    caching: false  // Enable when implementing cache
  }
};
