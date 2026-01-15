const path = require('path');

module.exports = {
  uploadDir: path.join(__dirname, '../../uploads'),
  maxFileSize: 100 * 1024 * 1024,
  maxFiles: 5,
  allowedTypes: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'csv'],
};
