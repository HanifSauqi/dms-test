const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getClassificationRules,
  addClassificationRule,
  updateClassificationRule,
  deleteClassificationRule,
  getUserFolders
} = require('../controllers/classificationController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/classification/rules - Get user's classification rules
router.get('/rules', getClassificationRules);

// POST /api/classification/rules - Add new classification rule
router.post('/rules', addClassificationRule);

// PUT /api/classification/rules/:id - Update classification rule
router.put('/rules/:id', updateClassificationRule);

// DELETE /api/classification/rules/:id - Delete classification rule
router.delete('/rules/:id', deleteClassificationRule);

// GET /api/classification/folders - Get user's folders for dropdown
router.get('/folders', getUserFolders);

module.exports = router;