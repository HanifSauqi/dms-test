const folderService = require('../services/FolderService');
const { successResponse, errorResponse } = require('../utils/response');

const createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user.id;

    const folder = await folderService.createFolder({ name, parentId }, userId);

    successResponse(res, 'Folder created successfully', {
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        ownerId: folder.owner_id,
        createdAt: folder.created_at
      }
    }, 201);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('too long')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('access denied') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 409);
    }
    errorResponse(res, 'Failed to create folder', 500, error.message);
  }
};

const getFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parentId } = req.query;

    const folders = await folderService.getFolders(userId, parentId || null);

    successResponse(res, 'Folders retrieved successfully', {
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        ownerId: folder.owner_id,
        accessLevel: folder.access_level,
        documentCount: folder.documentCount,
        createdAt: folder.created_at
      }))
    });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve folders', 500, error.message);
  }
};

const getFolderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await folderService.getFolderById(id, userId);

    successResponse(res, 'Folder details retrieved successfully', {
      folder: {
        id: result.folder.id,
        name: result.folder.name,
        parentId: result.folder.parent_id,
        ownerId: result.folder.owner_id,
        accessLevel: result.folder.access_level,
        createdAt: result.folder.created_at
      },
      subfolders: result.subfolders.map(sf => ({
        id: sf.id,
        name: sf.name,
        documentCount: parseInt(sf.document_count),
        createdAt: sf.created_at
      })),
      documents: result.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.file_name,
        filePath: doc.file_path,
        labels: doc.labels || [],
        createdAt: doc.created_at
      }))
    });
  } catch (error) {
    if (error.message.includes('access denied') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to retrieve folder details', 500, error.message);
  }
};

const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    const folder = await folderService.updateFolder(id, { name }, userId);

    successResponse(res, 'Folder updated successfully', {
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        ownerId: folder.owner_id,
        createdAt: folder.created_at
      }
    });
  } catch (error) {
    if (error.message.includes('required')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('owner') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 409);
    }
    errorResponse(res, 'Failed to update folder', 500, error.message);
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const userId = req.user.id;

    const folderName = await folderService.deleteFolder(id, userId, force === 'true');

    successResponse(res, `Folder deleted successfully`);
  } catch (error) {
    if (error.message.includes('owner') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('contains')) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to delete folder', 500, error.message);
  }
};

const copyFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    const userId = req.user.id;

    const newFolder = await folderService.copyFolder(id, userId, parentId || null);

    successResponse(res, 'Folder copied successfully', {
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        parentId: newFolder.parent_id,
        ownerId: newFolder.owner_id,
        createdAt: newFolder.created_at
      }
    }, 201);
  } catch (error) {
    if (error.message.includes('permission') || error.message.includes('access denied') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 403);
    }
    if (error.message.includes('Cannot copy your own folder')) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to copy folder', 500, error.message);
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  copyFolder
};
