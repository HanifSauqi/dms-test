const pool = require('../utils/database');

class BaseService {
  constructor(tableName) {
    // Sanitize table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error('Invalid table name');
    }
    this.tableName = tableName;
    this.pool = pool;
  }

  async findById(id, columns = '*') {
    // Sanitize column names to prevent SQL injection
    if (columns !== '*' && !/^[a-zA-Z_,\s*]+$/.test(columns)) {
      throw new Error('Invalid column names');
    }

    const query = `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(conditions = {}, columns = '*') {
    // Sanitize column names
    if (columns !== '*' && !/^[a-zA-Z_,\s*]+$/.test(columns)) {
      throw new Error('Invalid column names');
    }

    let query = `SELECT ${columns} FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      // Sanitize condition keys
      const validKeys = Object.keys(conditions).filter(key =>
        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
      );

      const whereClauses = validKeys.map((key, index) => {
        values.push(conditions[key]);
        return `${key} = $${index + 1}`;
      });

      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async create(data) {
    // Sanitize keys
    const keys = Object.keys(data).filter(key =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
    );

    if (keys.length === 0) {
      throw new Error('No valid data fields provided');
    }

    const values = keys.map(key => data[key]);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    // Sanitize keys
    const keys = Object.keys(data).filter(key =>
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
    );

    if (keys.length === 0) {
      throw new Error('No valid data fields provided');
    }

    const values = keys.map(key => data[key]);

    const setClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    values.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async exists(conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${whereClauses}) as exists`;
    const result = await this.pool.query(query, values);
    return result.rows[0].exists;
  }

  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      const whereClauses = Object.keys(conditions).map((key, index) => {
        values.push(conditions[key]);
        return `${key} = $${index + 1}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].count);
  }
}

module.exports = BaseService;
