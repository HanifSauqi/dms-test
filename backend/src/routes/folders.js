const express = require('express');
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  copyFolder
} = require('../controllers/folderController');
const {
  shareFolder,
  getFolderPermissions,
  updateFolderPermission,
  revokeFolderAccess,
  getSharedFolders
} = require('../controllers/folderSharingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All folder routes require authentication
router.use(authenticateToken);

// Folder CRUD operations
router.post('/', createFolder);
router.get('/', getFolders);
router.get('/shared', getSharedFolders);
router.get('/:id', getFolderById);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.post('/:id/copy', copyFolder);

// Folder sharing operations
router.post('/:folderId/share', shareFolder);
router.get('/:folderId/permissions', getFolderPermissions);
router.put('/:folderId/permissions/:userId', updateFolderPermission);
router.delete('/:folderId/permissions/:userId', revokeFolderAccess);

module.exports = router;