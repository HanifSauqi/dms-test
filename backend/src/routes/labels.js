const express = require('express');
const {
  createLabel,
  getLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  assignLabelToDocument,
  removeLabelFromDocument
} = require('../controllers/labelController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All label routes require authentication
router.use(authenticateToken);

// Label CRUD operations
router.post('/', createLabel);
router.get('/', getLabels);
router.get('/:id', getLabelById);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

// Label-Document assignments
router.post('/assign', assignLabelToDocument);
router.delete('/remove/:documentId/:labelId', removeLabelFromDocument);

module.exports = router;