const BaseService = require('./BaseService');
const pool = require('../utils/database');
const permissionService = require('./PermissionService');
const { extractTextContent } = require('../utils/fileProcessor');
const { optimizeContent } = require('../utils/searchHelpers');
const { classifyDocument } = require('../utils/autoClassification');
const { logActivity } = require('../utils/activityLogger');
const { logUserActivity } = require('../utils/userActivityLogger');
const path = require('path');
const fs = require('fs').promises;

class DocumentService extends BaseService {
  constructor() {
    super('documents');
  }

  async uploadDocuments(files, options = {}) {
    const { folderId, labels, userId } = options;
    const uploadedDocuments = [];

    if (!files || !Array.isArray(files)) {
      throw new Error('Files array is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (folderId) {
      const access = await permissionService.checkFolderAccess(folderId, userId);
      if (!access) {
        throw new Error('Folder not found or access denied');
      }
      if (!permissionService.hasWritePermission(access.access_level)) {
        throw new Error('You do not have write permission for this folder');
      }
    }

    for (const file of files) {
      try {
        let extractedContent = null;
        try {
          const fileType = path.extname(file.originalname).slice(1);
          extractedContent = await extractTextContent(file.path, fileType);
          if (extractedContent) {
            extractedContent = extractedContent.replace(/\0/g, '');
            extractedContent = optimizeContent(extractedContent);
          }
        } catch (error) {
          console.error('Content extraction failed:', error.message);
        }
        const classification = await classifyDocument(extractedContent, userId, folderId);

        const finalFolderId = classification.autoClassified
          ? classification.targetFolderId
          : (folderId || null);

        const document = await pool.query(
          `INSERT INTO documents (title, file_name, file_path, extracted_content, folder_id, owner_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            file.originalname,
            file.filename,
            file.path,
            extractedContent,
            finalFolderId,
            userId
          ]
        );

        const doc = document.rows[0];

        if (classification && classification.autoClassified) {
          await pool.query(
            'UPDATE documents SET auto_classified = true, classification_keyword = $1 WHERE id = $2',
            [classification.matchedKeyword, doc.id]
          );
        }

        await logActivity(doc.id, userId, 'created');

        // Log user activity
        await logUserActivity(userId, 'create_document', {
          description: `Created document: ${doc.title}`,
          targetType: 'document',
          targetId: doc.id,
          metadata: {
            fileName: doc.file_name,
            folderId: doc.folder_id,
            autoClassified: classification?.autoClassified || false
          }
        });

        uploadedDocuments.push({
          id: doc.id,
          title: doc.title,
          fileName: doc.file_name,
          fileSize: file.size,
          fileType: path.extname(file.filename).slice(1),
          folderId: doc.folder_id,
          labels: [],
          createdAt: doc.created_at,
          autoClassified: classification?.autoClassified || false,
          matchedKeyword: classification?.matchedKeyword || null,
          targetFolderName: classification?.folderName || null
        });

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        continue;
      }
    }

    if (uploadedDocuments.length === 0) {
      throw new Error('Failed to process any files');
    }

    return uploadedDocuments;
  }

  async getDocuments(userId, filters = {}) {
    const { folderId, labels, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const actualFolderId = folderId === "null" || folderId === null ? null : folderId;

    // Modified query to include shared folders
    let query = `
      SELECT DISTINCT d.id, d.title, d.file_name, d.file_path, d.extracted_content,
        d.folder_id, d.owner_id, d.created_at, d.updated_at,
        f.name as folder_name,
        u.email as owner_email,
        u.name as owner_name,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN folders f ON d.folder_id = f.id
      LEFT JOIN document_labels dl ON d.id = dl.document_id
      LEFT JOIN labels l ON dl.label_id = l.id
      LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id
      WHERE (
        d.owner_id = $1
        OR (fp.user_id = $1 AND fp.permission_level IN ('viewer', 'editor', 'owner'))
      )
    `;

    const params = [userId];
    let paramCount = 1;

    if (actualFolderId) {
      paramCount++;
      query += ` AND d.folder_id = $${paramCount}`;
      params.push(actualFolderId);
    } else if (folderId !== undefined) {
      query += ` AND d.folder_id IS NULL`;
    }

    if (labels && labels.length > 0) {
      paramCount++;
      query += ` AND EXISTS(SELECT 1 FROM document_labels dl JOIN labels l ON dl.label_id = l.id WHERE dl.document_id = d.id AND l.name = ANY($${paramCount}))`;
      params.push(labels);
    }

    if (search) {
      paramCount++;
      query += ` AND (d.title ILIKE $${paramCount} OR d.extracted_content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY d.id, d.title, d.file_name, d.file_path, d.extracted_content,
        d.folder_id, d.owner_id, d.created_at, d.updated_at, f.name, u.email, u.name
      ORDER BY d.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Modified count query to include shared folders
    let countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM documents d
      LEFT JOIN document_labels dl ON d.id = dl.document_id
      LEFT JOIN labels l ON dl.label_id = l.id
      LEFT JOIN folder_permissions fp ON d.folder_id = fp.folder_id
      WHERE (
        d.owner_id = $1
        OR (fp.user_id = $1 AND fp.permission_level IN ('viewer', 'editor', 'owner'))
      )
    `;

    const countParams = [userId];
    let countParamIdx = 1;

    if (actualFolderId) {
      countParamIdx++;
      countQuery += ` AND d.folder_id = $${countParamIdx}`;
      countParams.push(actualFolderId);
    } else if (folderId !== undefined) {
      countQuery += ` AND d.folder_id IS NULL`;
    }

    if (labels && labels.length > 0) {
      countParamIdx++;
      countQuery += ` AND EXISTS(SELECT 1 FROM document_labels dl JOIN labels l ON dl.label_id = l.id WHERE dl.document_id = d.id AND l.name = ANY($${countParamIdx}))`;
      countParams.push(labels);
    }

    if (search) {
      countParamIdx++;
      countQuery += ` AND (d.title ILIKE $${countParamIdx} OR d.extracted_content ILIKE $${countParamIdx})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      documents: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async _getDocumentWithoutLogging(documentId, userId) {
    const result = await pool.query(
      `SELECT d.*, f.name as folder_name, u.name as owner_name,
        array_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color))
          FILTER (WHERE l.id IS NOT NULL) as labels
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN users u ON d.owner_id = u.id
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE d.id = $1
       GROUP BY d.id, f.name, u.name`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const doc = result.rows[0];

    if (doc.owner_id !== userId) {
      if (doc.folder_id) {
        const access = await permissionService.checkFolderAccess(doc.folder_id, userId);
        if (!access) {
          throw new Error('Access denied');
        }
      } else {
        throw new Error('Access denied');
      }
    }

    return doc;
  }

  async getDocumentById(documentId, userId) {
    const doc = await this._getDocumentWithoutLogging(documentId, userId);

    if (!doc) {
      return null;
    }

    // Note: Don't log here to avoid duplicate logging
    // Logging is handled by viewDocument() when user actually views the document

    return doc;
  }

  async updateDocument(documentId, updates, userId) {
    const doc = await this.findById(documentId);

    if (!doc) {
      throw new Error('Document not found');
    }

    if (doc.owner_id !== userId) {
      if (doc.folder_id) {
        const access = await permissionService.checkFolderAccess(doc.folder_id, userId);
        if (!access || !permissionService.hasWritePermission(access.access_level)) {
          throw new Error('You do not have permission to edit this document');
        }
      } else {
        throw new Error('You do not have permission to edit this document');
      }
    }

    const { title, folderId } = updates;
    const updateData = { updated_at: new Date() };

    if (title !== undefined) updateData.title = title;
    if (folderId !== undefined) {
      if (folderId) {
        const access = await permissionService.checkFolderAccess(folderId, userId);
        if (!access || !permissionService.hasWritePermission(access.access_level)) {
          throw new Error('You do not have permission to move document to this folder');
        }
      }
      updateData.folder_id = folderId;
    }

    const result = await pool.query(
      `UPDATE documents
       SET ${Object.keys(updateData).map((key, i) => `${key} = $${i + 2}`).join(', ')}
       WHERE id = $1
       RETURNING *`,
      [documentId, ...Object.values(updateData)]
    );

    await logActivity(documentId, userId, 'edited');

    // Log user activity
    await logUserActivity(userId, 'edit_document', {
      description: `Edited document: ${result.rows[0].title}`,
      targetType: 'document',
      targetId: documentId,
      metadata: {
        updates: {
          title: title !== undefined,
          folderId: folderId !== undefined
        },
        oldTitle: doc.title,
        newTitle: result.rows[0].title
      }
    });

    return result.rows[0];
  }

  async deleteDocument(documentId, userId) {
    const doc = await this.findById(documentId);

    if (!doc) {
      throw new Error('Document not found');
    }

    if (doc.owner_id !== userId) {
      throw new Error('Only document owner can delete documents');
    }

    // Log user activity before deletion
    await logUserActivity(userId, 'delete_document', {
      description: `Deleted document: ${doc.title}`,
      targetType: 'document',
      targetId: documentId,
      metadata: {
        fileName: doc.file_name,
        folderId: doc.folder_id
      }
    });

    await this.transaction(async (client) => {
      await client.query('DELETE FROM document_labels WHERE document_id = $1', [documentId]);
      await client.query('DELETE FROM document_activities WHERE document_id = $1', [documentId]);
      await client.query('DELETE FROM documents WHERE id = $1', [documentId]);

      try {
        await fs.unlink(doc.file_path);
      } catch (error) {
        console.error('Failed to delete file:', error.message);
      }
    });

    return doc;
  }

  async getSharedDocuments(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Query untuk mendapatkan documents dari shared folders
    const query = `
      SELECT DISTINCT d.id, d.title, d.file_name, d.file_path, d.extracted_content,
        d.folder_id, d.owner_id, d.created_at, d.updated_at,
        f.name as folder_name,
        u.email as owner_email,
        u.name as owner_name,
        fp.permission_level,
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) as labels
      FROM documents d
      JOIN folder_permissions fp ON d.folder_id = fp.folder_id
      JOIN folders f ON d.folder_id = f.id
      JOIN users u ON d.owner_id = u.id
      LEFT JOIN document_labels dl ON d.id = dl.document_id
      LEFT JOIN labels l ON dl.label_id = l.id
      WHERE fp.user_id = $1
        AND d.owner_id != $1
        AND fp.permission_level IN ('viewer', 'editor', 'owner')
      GROUP BY d.id, d.title, d.file_name, d.file_path, d.extracted_content,
        d.folder_id, d.owner_id, d.created_at, d.updated_at,
        f.name, u.email, u.name, fp.permission_level
      ORDER BY d.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    // Count total shared documents
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM documents d
      JOIN folder_permissions fp ON d.folder_id = fp.folder_id
      WHERE fp.user_id = $1
        AND d.owner_id != $1
        AND fp.permission_level IN ('viewer', 'editor', 'owner')
    `;

    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);

    return {
      documents: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getRecentDocuments(userId, limit = 10) {
    const result = await pool.query(
      `SELECT
        da.id as activity_id,
        da.activity_type,
        da.created_at as activity_time,
        d.id,
        d.title,
        d.file_name,
        d.created_at,
        d.updated_at,
        d.owner_id,
        f.name as folder_name,
        u.email as owner_email,
        u.name as owner_name,
        COALESCE(
          array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL),
          '{}'
        ) as labels
       FROM document_activities da
       JOIN documents d ON da.document_id = d.id
       LEFT JOIN users u ON d.owner_id = u.id
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN labels l ON dl.label_id = l.id
       WHERE da.user_id = $1
       GROUP BY da.id, da.activity_type, da.created_at,
         d.id, d.title, d.file_name, d.created_at, d.updated_at, d.owner_id,
         f.name, u.email, u.name
       ORDER BY da.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async addLabels(documentId, labelIds, userId) {
    const doc = await this.findById(documentId);

    if (!doc) {
      throw new Error('Document not found');
    }

    if (doc.owner_id !== userId) {
      throw new Error('Only document owner can add labels');
    }

    await this.transaction(async (client) => {
      for (const labelId of labelIds) {
        await client.query(
          'INSERT INTO document_labels (document_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [documentId, labelId]
        );
      }
    });

    return true;
  }

  async removeLabels(documentId, labelIds, userId) {
    const doc = await this.findById(documentId);

    if (!doc) {
      throw new Error('Document not found');
    }

    if (doc.owner_id !== userId) {
      throw new Error('Only document owner can remove labels');
    }

    await pool.query(
      'DELETE FROM document_labels WHERE document_id = $1 AND label_id = ANY($2)',
      [documentId, labelIds]
    );

    return true;
  }

  async getDocumentsByLabel(labelId, userId) {
    const result = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.created_at, d.updated_at,
        f.name as folder_name
       FROM documents d
       JOIN document_labels dl ON d.id = dl.document_id
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE dl.label_id = $1 AND d.owner_id = $2
       ORDER BY d.updated_at DESC`,
      [labelId, userId]
    );

    return result.rows;
  }

  async viewDocument(documentId, userId) {
    const doc = await this._getDocumentWithoutLogging(documentId, userId);

    if (!doc) {
      throw new Error('Document not found or access denied');
    }

    await logActivity(documentId, userId, 'viewed');

    return {
      path: doc.file_path,
      filename: doc.file_name
    };
  }

  async downloadDocument(documentId, userId) {
    const doc = await this._getDocumentWithoutLogging(documentId, userId);

    if (!doc) {
      throw new Error('Document not found or access denied');
    }

    await logActivity(documentId, userId, 'downloaded');

    return {
      path: doc.file_path,
      filename: doc.file_name
    };
  }

  async getDocumentSharedUsers(documentId, userId) {
    const doc = await this._getDocumentWithoutLogging(documentId, userId);
    if (!doc) {
      throw new Error('Document not found or access denied');
    }

    // Get users who have access to this document through folder sharing
    if (doc.folder_id) {
      const result = await pool.query(
        `SELECT DISTINCT u.id, u.name, u.email,
          CONCAT(SUBSTRING(u.name FROM 1 FOR 1), SUBSTRING(SPLIT_PART(u.name, ' ', 2) FROM 1 FOR 1)) as initials,
          fp.permission_level
         FROM folder_permissions fp
         JOIN users u ON fp.user_id = u.id
         WHERE fp.folder_id = $1
           AND fp.user_id != $2
         ORDER BY u.name`,
        [doc.folder_id, userId]
      );

      return result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials || user.name.substring(0, 2).toUpperCase(),
        permissionLevel: user.permission_level
      }));
    }

    return [];
  }
}

module.exports = new DocumentService();
