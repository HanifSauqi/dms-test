const BaseService = require('./BaseService');
const pool = require('../utils/database');
const permissionService = require('./PermissionService');
const { logUserActivity } = require('../utils/userActivityLogger');

class FolderService extends BaseService {
  constructor() {
    super('folders');
  }

  async createFolder(data, userId) {
    const { name, parentId } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }

    if (name.length > 255) {
      throw new Error('Folder name too long (max 255 characters)');
    }

    if (parentId) {
      const access = await permissionService.checkFolderAccess(parentId, userId);
      if (!access) {
        throw new Error('Parent folder not found or access denied');
      }
    }

    const duplicate = await pool.query(
      'SELECT id FROM folders WHERE name = $1 AND parent_id = $2 AND owner_id = $3',
      [name.trim(), parentId || null, userId]
    );

    if (duplicate.rows.length > 0) {
      throw new Error('Folder with this name already exists in this location');
    }

    const result = await pool.query(
      'INSERT INTO folders (name, parent_id, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), parentId || null, userId]
    );

    const folder = result.rows[0];

    // Log user activity
    await logUserActivity(userId, 'create_folder', {
      description: `Created folder: ${folder.name}`,
      targetType: 'folder',
      targetId: folder.id,
      metadata: {
        folderName: folder.name,
        parentId: folder.parent_id
      }
    });

    return folder;
  }

  async getFolders(userId, parentId = null) {
    const query = `
      SELECT DISTINCT f.id, f.name, f.parent_id, f.owner_id, f.created_at,
        CASE WHEN f.owner_id = $1 THEN 'owner' ELSE fp.permission_level END as access_level
      FROM folders f
      LEFT JOIN folder_permissions fp ON f.id = fp.folder_id AND fp.user_id = $1
      WHERE (f.owner_id = $1 OR fp.user_id = $1)
        AND f.parent_id ${parentId ? '= $2' : 'IS NULL'}
      ORDER BY f.name ASC
    `;

    const params = parentId ? [userId, parentId] : [userId];
    const result = await pool.query(query, params);

    const folders = await Promise.all(
      result.rows.map(async (folder) => {
        const docCount = await pool.query(
          'SELECT COUNT(*) as count FROM documents WHERE folder_id = $1',
          [folder.id]
        );

        return {
          ...folder,
          documentCount: parseInt(docCount.rows[0].count)
        };
      })
    );

    return folders;
  }

  async getFolderById(folderId, userId) {
    const access = await permissionService.checkFolderAccess(folderId, userId);
    if (!access) {
      throw new Error('Folder not found or access denied');
    }

    const folder = await pool.query(
      `SELECT f.*,
        CASE WHEN f.owner_id = $2 THEN 'owner' ELSE fp.permission_level END as access_level
       FROM folders f
       LEFT JOIN folder_permissions fp ON f.id = fp.folder_id AND fp.user_id = $2
       WHERE f.id = $1`,
      [folderId, userId]
    );

    const subfolders = await pool.query(
      `SELECT f.id, f.name, f.created_at,
        COUNT(d.id) as document_count
       FROM folders f
       LEFT JOIN documents d ON f.id = d.folder_id
       WHERE f.parent_id = $1 AND (f.owner_id = $2 OR EXISTS(
         SELECT 1 FROM folder_permissions fp WHERE fp.folder_id = f.id AND fp.user_id = $2
       ))
       GROUP BY f.id, f.name, f.created_at
       ORDER BY f.name ASC`,
      [folderId, userId]
    );

    const documents = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.file_path, d.created_at,
        array_agg(l.name) FILTER (WHERE l.name IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.folder_id = $1
       GROUP BY d.id, d.title, d.file_name, d.file_path, d.created_at
       ORDER BY d.created_at DESC`,
      [folderId]
    );

    return {
      folder: folder.rows[0],
      subfolders: subfolders.rows,
      documents: documents.rows
    };
  }

  async updateFolder(folderId, data, userId) {
    const { name } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }

    const isOwner = await permissionService.checkFolderOwnership(folderId, userId);
    if (!isOwner) {
      throw new Error('Only folder owner can update folder name');
    }

    const folder = await this.findById(folderId);

    const duplicate = await pool.query(
      'SELECT id FROM folders WHERE name = $1 AND parent_id = $2 AND owner_id = $3 AND id != $4',
      [name.trim(), folder.parent_id, userId, folderId]
    );

    if (duplicate.rows.length > 0) {
      throw new Error('Folder with this name already exists in this location');
    }

    const result = await pool.query(
      'UPDATE folders SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), folderId]
    );

    const updatedFolder = result.rows[0];

    // Log user activity
    await logUserActivity(userId, 'edit_folder', {
      description: `Edited folder: ${updatedFolder.name}`,
      targetType: 'folder',
      targetId: folderId,
      metadata: {
        oldName: folder.name,
        newName: updatedFolder.name
      }
    });

    return updatedFolder;
  }

  async deleteFolder(folderId, userId, force = false) {
    const isOwner = await permissionService.checkFolderOwnership(folderId, userId);
    if (!isOwner) {
      throw new Error('Only folder owner can delete folders');
    }

    // Get folder details before deletion for logging
    const folderDetails = await this.findById(folderId);

    const contentCheck = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM folders WHERE parent_id = $1) as subfolder_count,
        (SELECT COUNT(*) FROM documents WHERE folder_id = $1) as document_count`,
      [folderId]
    );

    const { subfolder_count, document_count } = contentCheck.rows[0];

    if ((parseInt(subfolder_count) > 0 || parseInt(document_count) > 0) && !force) {
      throw new Error('Cannot delete folder: contains subfolders or documents. Use force=true to delete recursively.');
    }

    // Log user activity before deletion
    await logUserActivity(userId, 'delete_folder', {
      description: `Deleted folder: ${folderDetails.name}`,
      targetType: 'folder',
      targetId: folderId,
      metadata: {
        folderName: folderDetails.name,
        force: force,
        subfolderCount: parseInt(subfolder_count),
        documentCount: parseInt(document_count)
      }
    });

    await this.transaction(async (client) => {
      if (force) {
        await this.deleteSubfoldersRecursively(client, folderId);

        const documents = await client.query(
          'SELECT id FROM documents WHERE folder_id = $1',
          [folderId]
        );

        for (const doc of documents.rows) {
          await client.query('DELETE FROM document_labels WHERE document_id = $1', [doc.id]);
          await client.query('DELETE FROM document_activities WHERE document_id = $1', [doc.id]);
          await client.query('DELETE FROM documents WHERE id = $1', [doc.id]);
        }

        await client.query('DELETE FROM folder_permissions WHERE folder_id = $1', [folderId]);
      }

      await client.query('DELETE FROM folders WHERE id = $1', [folderId]);
    });

    return true;
  }

  async deleteSubfoldersRecursively(client, parentId) {
    const subfolders = await client.query(
      'SELECT id FROM folders WHERE parent_id = $1',
      [parentId]
    );

    for (const subfolder of subfolders.rows) {
      await this.deleteSubfoldersRecursively(client, subfolder.id);

      const documents = await client.query(
        'SELECT id FROM documents WHERE folder_id = $1',
        [subfolder.id]
      );

      for (const doc of documents.rows) {
        await client.query('DELETE FROM document_labels WHERE document_id = $1', [doc.id]);
        await client.query('DELETE FROM document_activities WHERE document_id = $1', [doc.id]);
        await client.query('DELETE FROM documents WHERE id = $1', [doc.id]);
      }

      await client.query('DELETE FROM folder_permissions WHERE folder_id = $1', [subfolder.id]);
      await client.query('DELETE FROM folders WHERE id = $1', [subfolder.id]);
    }
  }

  async moveFolder(folderId, targetParentId, userId) {
    const isOwner = await permissionService.checkFolderOwnership(folderId, userId);
    if (!isOwner) {
      throw new Error('Only folder owner can move folders');
    }

    if (targetParentId) {
      const access = await permissionService.checkFolderAccess(targetParentId, userId);
      if (!access) {
        throw new Error('Target parent folder not found or access denied');
      }

      const isCircular = await this.checkCircularReference(folderId, targetParentId);
      if (isCircular) {
        throw new Error('Cannot move folder into its own subfolder');
      }
    }

    const result = await pool.query(
      'UPDATE folders SET parent_id = $1 WHERE id = $2 RETURNING *',
      [targetParentId || null, folderId]
    );

    return result.rows[0];
  }

  async checkCircularReference(folderId, targetParentId) {
    let currentId = targetParentId;

    while (currentId) {
      if (currentId === folderId) {
        return true;
      }

      const result = await pool.query(
        'SELECT parent_id FROM folders WHERE id = $1',
        [currentId]
      );

      if (result.rows.length === 0) {
        break;
      }

      currentId = result.rows[0].parent_id;
    }

    return false;
  }

  async getFolderHierarchy(folderId, userId) {
    const hierarchy = [];
    let currentId = folderId;

    while (currentId) {
      const result = await pool.query(
        'SELECT id, name, parent_id FROM folders WHERE id = $1',
        [currentId]
      );

      if (result.rows.length === 0) {
        break;
      }

      const folder = result.rows[0];
      const access = await permissionService.checkFolderAccess(folder.id, userId);

      if (!access) {
        break;
      }

      hierarchy.unshift(folder);
      currentId = folder.parent_id;
    }

    return hierarchy;
  }
}

module.exports = new FolderService();
