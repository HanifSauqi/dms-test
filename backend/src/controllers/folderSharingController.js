const pool = require('../utils/database');
const permissionService = require('../services/PermissionService');
const { successResponse, errorResponse } = require('../utils/response');

const shareFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { userEmail, permissionLevel } = req.body;
    const ownerId = req.user.id;

    if (!userEmail || !permissionLevel) {
      return errorResponse(res, 'User email and permission level are required', 400);
    }

    const folderResult = await pool.query(
      'SELECT id, name FROM folders WHERE id = $1',
      [folderId]
    );

    if (folderResult.rows.length === 0) {
      return errorResponse(res, 'Folder not found', 404);
    }

    const folder = folderResult.rows[0];

    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User with this email not found', 404);
    }

    const targetUser = userResult.rows[0];

    const result = await permissionService.shareFolder(folderId, targetUser.id, permissionLevel, ownerId);

    successResponse(res, result.action === 'updated' ? 'Folder permission updated successfully' : 'Folder shared successfully', {
      folder: { id: folder.id, name: folder.name },
      sharedWith: { id: targetUser.id, name: targetUser.name, email: userEmail },
      permission: permissionLevel,
      action: result.action
    }, result.action === 'created' ? 201 : 200);
  } catch (error) {
    if (error.message.includes('owner') || error.message.includes('yourself') || error.message.includes('Invalid permission')) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to share folder', 500, error.message);
  }
};

const getFolderPermissions = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;

    const folder = await pool.query(
      'SELECT id, name, owner_id FROM folders WHERE id = $1',
      [folderId]
    );

    if (folder.rows.length === 0) {
      return errorResponse(res, 'Folder not found', 404);
    }

    const permissions = await permissionService.getFolderPermissions(folderId, userId);

    successResponse(res, 'Folder permissions retrieved successfully', {
      folder: {
        id: folder.rows[0].id,
        name: folder.rows[0].name,
        ownerId: folder.rows[0].owner_id
      },
      permissions: permissions.map(perm => ({
        user: {
          id: perm.id,
          name: perm.name,
          email: perm.email
        },
        permissionLevel: perm.permission_level,
        sharedAt: perm.created_at
      }))
    });
  } catch (error) {
    if (error.message.includes('owner')) {
      return errorResponse(res, error.message, 403);
    }
    errorResponse(res, 'Failed to retrieve folder permissions', 500, error.message);
  }
};

const updateFolderPermission = async (req, res) => {
  try {
    const { folderId, userId } = req.params;
    const { permissionLevel } = req.body;
    const ownerId = req.user.id;

    const userInfo = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userInfo.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    await permissionService.updatePermission(folderId, userId, permissionLevel, ownerId);

    successResponse(res, 'Permission updated successfully', {
      user: { name: userInfo.rows[0].name, email: userInfo.rows[0].email },
      newPermission: permissionLevel
    });
  } catch (error) {
    if (error.message.includes('owner') || error.message.includes('Invalid permission')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to update permission', 500, error.message);
  }
};

const revokeFolderAccess = async (req, res) => {
  try {
    const { folderId, userId } = req.params;
    const ownerId = req.user.id;

    const folderResult = await pool.query(
      'SELECT name FROM folders WHERE id = $1',
      [folderId]
    );

    if (folderResult.rows.length === 0) {
      return errorResponse(res, 'Folder not found', 404);
    }

    const userInfo = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userInfo.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    await permissionService.revokePermission(folderId, userId, ownerId);

    successResponse(res, 'Access revoked successfully', {
      revokedUser: { name: userInfo.rows[0].name, email: userInfo.rows[0].email },
      folder: folderResult.rows[0].name
    });
  } catch (error) {
    if (error.message.includes('owner')) {
      return errorResponse(res, error.message, 403);
    }
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to revoke access', 500, error.message);
  }
};

const getSharedFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const sharedFolders = await permissionService.getSharedWithUser(userId);

    successResponse(res, 'Shared folders retrieved successfully', {
      sharedFolders: sharedFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        permissionLevel: folder.permission_level,
        documentCount: parseInt(folder.document_count),
        owner: {
          name: folder.owner_name,
          email: folder.owner_email
        },
        sharedAt: folder.created_at
      }))
    });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve shared folders', 500, error.message);
  }
};

module.exports = {
  shareFolder,
  getFolderPermissions,
  updateFolderPermission,
  revokeFolderAccess,
  getSharedFolders
};
