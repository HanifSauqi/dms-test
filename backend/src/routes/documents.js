const express = require('express');
const ctrl = require('../controllers/documentController');

const {
  uploadDocuments,
  getDocuments,
  getDocumentById,
  getDocumentDetails,
  deleteDocument,
  getSharedDocuments,
  downloadDocument,
  viewDocument,
  updateDocument,
  searchDocuments,
  ragSearchDocuments,
  getDocumentSharedUsers,
  getRecentDocuments,
  testAIConfig
} = ctrl;

const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

// Document operations
router.post('/upload', upload.array('files', 5), handleUploadError, uploadDocuments);
router.post('/test-ai-config', testAIConfig); // NEW: Test AI Connection
router.get('/search', searchDocuments);
router.get('/rag-search', ragSearchDocuments); // RAG search with Gemini AI (LLM-direct approach)
router.get('/recent', getRecentDocuments); // Get recent documents with activity tracking
router.get('/', getDocuments);
router.get('/shared', getSharedDocuments);
// IMPORTANT: Specific routes MUST come before generic /:id route
router.get('/:id/download', downloadDocument);
router.get('/:id/view', viewDocument);
router.get('/:id/details', getDocumentDetails); // NEW: Get without logging activity
router.get('/:id/shared-users', getDocumentSharedUsers);
// Generic routes come last
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;