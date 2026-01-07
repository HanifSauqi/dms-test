module.exports = {
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024,
  MAX_DOCUMENTS_PER_QUERY: 100,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_DEFAULT_PAGE: 1,
  RECENT_DOCUMENTS_DEFAULT_LIMIT: 10,
  ACTIVITY_DEDUPLICATION_WINDOW_SECONDS: 10,
  SEARCH_DEFAULT_LIMIT: 50,
  MAX_LABEL_NAME_LENGTH: 50,
  VALID_ACTIVITY_TYPES: ['created', 'viewed', 'edited', 'downloaded', 'shared'],
  PERMISSION_LEVELS: {
    READ: 'read',
    WRITE: 'write',
    ADMIN: 'admin'
  }
  // Note: File type validation is handled by config/upload.config.js
};
