const BaseService = require('./BaseService');
const pool = require('../utils/database');

class PermissionService extends BaseService {
  constructor() {
    super('folder_permissions');
    this.PERMISSION_LEVELS = {
      VIEWER: 'viewer',
      EDITOR: 'editor'
    };
  }

  async checkFolderAccess(folderId, userId) {
    const result = await pool.query(
      `SELECT f.id, f.owner_id,
        CASE WHEN f.owner_id = $2 THEN 'owner' ELSE fp.permission_level END as access_level
       FROM folders f
       LEFT JOIN folder_permissions fp ON f.id = fp.folder_id AND fp.user_id = $2
       WHERE f.id = $1 AND (f.owner_id = $2 OR fp.user_id = $2)`,
      [folderId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async checkFolderOwnership(folderId, userId) {
    const result = await pool.query(
      'SELECT id FROM folders WHERE id = $1 AND owner_id = $2',
      [folderId, userId]
    );

    return result.rows.length > 0;
  }

  async getUserPermission(folderId, userId) {
    const folderResult = await pool.query(
      'SELECT owner_id FROM folders WHERE id = $1',
      [folderId]
    );

    if (folderResult.rows.length === 0) {
      return null;
    }

    if (folderResult.rows[0].owner_id === userId) {
      return 'owner';
    }

    const permResult = await pool.query(
      'SELECT permission_level FROM folder_permissions WHERE folder_id = $1 AND user_id = $2',
      [folderId, userId]
    );

    return permResult.rows.length > 0 ? permResult.rows[0].permission_level : null;
  }

  hasWritePermission(accessLevel) {
    return ['owner', 'editor'].includes(accessLevel);
  }

  hasAdminPermission(accessLevel) {
    return ['owner'].includes(accessLevel);
  }

  isOwner(accessLevel) {
    return accessLevel === 'owner';
  }

  async shareFolder(folderId, targetUserId, permissionLevel, ownerId) {
    const isOwner = await this.checkFolderOwnership(folderId, ownerId);
    if (!isOwner) {
      throw new Error('Only folder owner can share folders');
    }

    const validPermissions = Object.values(this.PERMISSION_LEVELS);
    if (!validPermissions.includes(permissionLevel)) {
      throw new Error(`Invalid permission level. Use: ${validPermissions.join(', ')}`);
    }

    if (targetUserId === ownerId) {
      throw new Error('Cannot share folder with yourself');
    }

    const existing = await pool.query(
      'SELECT permission_level FROM folder_permissions WHERE folder_id = $1 AND user_id = $2',
      [folderId, targetUserId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE folder_permissions SET permission_level = $1, created_at = CURRENT_TIMESTAMP WHERE folder_id = $2 AND user_id = $3',
        [permissionLevel, folderId, targetUserId]
      );
      return { action: 'updated', oldPermission: existing.rows[0].permission_level };
    }

    await pool.query(
      'INSERT INTO folder_permissions (folder_id, user_id, permission_level) VALUES ($1, $2, $3)',
      [folderId, targetUserId, permissionLevel]
    );

    return { action: 'created' };
  }

  async updatePermission(folderId, targetUserId, permissionLevel, ownerId) {
    const isOwner = await this.checkFolderOwnership(folderId, ownerId);
    if (!isOwner) {
      throw new Error('Only folder owner can update permissions');
    }

    const validPermissions = Object.values(this.PERMISSION_LEVELS);
    if (!validPermissions.includes(permissionLevel)) {
      throw new Error(`Invalid permission level. Use: ${validPermissions.join(', ')}`);
    }

    const result = await pool.query(
      'UPDATE folder_permissions SET permission_level = $1 WHERE folder_id = $2 AND user_id = $3 RETURNING *',
      [permissionLevel, folderId, targetUserId]
    );

    if (result.rows.length === 0) {
      throw new Error('Permission not found for this user');
    }

    return result.rows[0];
  }

  async revokePermission(folderId, targetUserId, ownerId) {
    const isOwner = await this.checkFolderOwnership(folderId, ownerId);
    if (!isOwner) {
      throw new Error('Only folder owner can revoke permissions');
    }

    const result = await pool.query(
      'DELETE FROM folder_permissions WHERE folder_id = $1 AND user_id = $2 RETURNING *',
      [folderId, targetUserId]
    );

    if (result.rows.length === 0) {
      throw new Error('Permission not found for this user');
    }

    return result.rows[0];
  }

  async getFolderPermissions(folderId, ownerId) {
    const isOwner = await this.checkFolderOwnership(folderId, ownerId);
    if (!isOwner) {
      throw new Error('Only folder owner can view permissions');
    }

    const result = await pool.query(
      `SELECT fp.permission_level, fp.created_at, u.id, u.name, u.email
       FROM folder_permissions fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.folder_id = $1
       ORDER BY fp.created_at DESC`,
      [folderId]
    );

    return result.rows;
  }

  async getSharedWithUser(userId) {
    const result = await pool.query(
      `SELECT f.id, f.name, f.parent_id, f.created_at, fp.permission_level,
              u.name as owner_name, u.email as owner_email,
              COUNT(d.id) as document_count
       FROM folders f
       JOIN folder_permissions fp ON f.id = fp.folder_id
       JOIN users u ON f.owner_id = u.id
       LEFT JOIN documents d ON f.id = d.folder_id
       WHERE fp.user_id = $1
       GROUP BY f.id, f.name, f.parent_id, f.created_at, fp.permission_level, u.name, u.email
       ORDER BY f.name ASC`,
      [userId]
    );

    return result.rows;
  }

  async getUsersWithAccess(folderId) {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email,
        CASE WHEN f.owner_id = u.id THEN 'owner' ELSE fp.permission_level END as access_level
       FROM users u
       LEFT JOIN folders f ON f.owner_id = u.id AND f.id = $1
       LEFT JOIN folder_permissions fp ON fp.user_id = u.id AND fp.folder_id = $1
       WHERE f.owner_id = u.id OR fp.user_id IS NOT NULL`,
      [folderId]
    );

    return result.rows;
  }
}

module.exports = new PermissionService();
