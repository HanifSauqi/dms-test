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
  },
  VALID_FILE_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/json'
  ]
};
