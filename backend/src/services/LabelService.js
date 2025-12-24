const BaseService = require('./BaseService');
const pool = require('../utils/database');

class LabelService extends BaseService {
  constructor() {
    super('labels');
  }

  async createLabel(data, userId) {
    const { name, color } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('Label name is required');
    }

    if (name.length > 50) {
      throw new Error('Label name too long (max 50 characters)');
    }

    const defaultColor = '#3b82f6';
    const labelColor = color || defaultColor;

    // Check for duplicate label name for this specific user
    const duplicate = await pool.query(
      'SELECT id FROM labels WHERE name = $1 AND user_id = $2',
      [name.trim(), userId]
    );

    if (duplicate.rows.length > 0) {
      throw new Error('Label with this name already exists');
    }

    // Insert label with user_id
    const result = await pool.query(
      'INSERT INTO labels (name, color, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), labelColor, userId]
    );

    return result.rows[0];
  }

  async getLabels(userId) {
    const result = await pool.query(
      `SELECT l.*, COUNT(dl.document_id) as document_count
       FROM labels l
       LEFT JOIN document_labels dl ON l.id = dl.label_id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.name ASC`,
      [userId]
    );

    return result.rows.map(label => ({
      ...label,
      documentCount: parseInt(label.document_count)
    }));
  }

  async getLabelById(labelId, userId) {
    const result = await pool.query(
      'SELECT * FROM labels WHERE id = $1 AND user_id = $2',
      [labelId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Label not found');
    }

    const label = result.rows[0];

    const documents = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.created_at
       FROM documents d
       JOIN document_labels dl ON d.id = dl.document_id
       WHERE dl.label_id = $1
       ORDER BY d.created_at DESC`,
      [labelId]
    );

    return {
      ...label,
      documents: documents.rows
    };
  }

  async updateLabel(labelId, data, userId) {
    const { name, color } = data;

    // Check label exists and belongs to user
    const label = await pool.query(
      'SELECT id FROM labels WHERE id = $1 AND user_id = $2',
      [labelId, userId]
    );

    if (label.rows.length === 0) {
      throw new Error('Label not found');
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Label name cannot be empty');
      }
      if (name.length > 50) {
        throw new Error('Label name too long (max 50 characters)');
      }

      // Check for duplicate among user's own labels
      const duplicate = await pool.query(
        'SELECT id FROM labels WHERE name = $1 AND user_id = $2 AND id != $3',
        [name.trim(), userId, labelId]
      );

      if (duplicate.rows.length > 0) {
        throw new Error('Label with this name already exists');
      }

      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
    }

    if (color !== undefined) {
      paramCount++;
      updates.push(`color = $${paramCount}`);
      values.push(color);
    }

    if (updates.length === 0) {
      throw new Error('No updates provided');
    }

    values.push(labelId);

    const result = await pool.query(
      `UPDATE labels SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteLabel(labelId, userId) {
    // Check label exists and belongs to user
    const label = await pool.query(
      'SELECT id, name FROM labels WHERE id = $1 AND user_id = $2',
      [labelId, userId]
    );

    if (label.rows.length === 0) {
      throw new Error('Label not found');
    }

    await this.transaction(async (client) => {
      await client.query('DELETE FROM document_labels WHERE label_id = $1', [labelId]);
      await client.query('DELETE FROM labels WHERE id = $1', [labelId]);
    });

    return label.rows[0];
  }

  async assignToDocument(labelId, documentId, userId) {
    // Check label exists and belongs to user
    const label = await pool.query(
      'SELECT id FROM labels WHERE id = $1 AND user_id = $2',
      [labelId, userId]
    );

    if (label.rows.length === 0) {
      throw new Error('Label not found');
    }

    const document = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
      [documentId, userId]
    );

    if (document.rows.length === 0) {
      throw new Error('Document not found');
    }

    await pool.query(
      'INSERT INTO document_labels (document_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [documentId, labelId]
    );

    return true;
  }

  async removeFromDocument(labelId, documentId, userId) {
    // Check label exists and belongs to user
    const label = await pool.query(
      'SELECT id FROM labels WHERE id = $1 AND user_id = $2',
      [labelId, userId]
    );

    if (label.rows.length === 0) {
      throw new Error('Label not found');
    }

    const document = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
      [documentId, userId]
    );

    if (document.rows.length === 0) {
      throw new Error('Document not found');
    }

    await pool.query(
      'DELETE FROM document_labels WHERE document_id = $1 AND label_id = $2',
      [documentId, labelId]
    );

    return true;
  }

  async getDocumentLabels(documentId, userId) {
    const document = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
      [documentId, userId]
    );

    if (document.rows.length === 0) {
      throw new Error('Document not found');
    }

    const result = await pool.query(
      `SELECT l.id, l.name, l.color
       FROM labels l
       JOIN document_labels dl ON l.id = dl.label_id
       WHERE dl.document_id = $1
       ORDER BY l.name ASC`,
      [documentId]
    );

    return result.rows;
  }
}

module.exports = new LabelService();
