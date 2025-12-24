const bcrypt = require('bcryptjs');
const pool = require('../utils/database');
const { successResponse, errorResponse } = require('../utils/response');
const authConfig = require('../config/auth.config');
const { logUserActivity } = require('../utils/userActivityLogger');
const { validatePassword, validateEmail } = require('../utils/validators');

/**
 * Create new user (superadmin only)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    // Validate name length
    if (name.trim().length < 2 || name.length > 100) {
      return errorResponse(res, 'Name must be between 2 and 100 characters', 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Validate role
    if (!['user', 'superadmin'].includes(role)) {
      return errorResponse(res, 'Role must be either "user" or "superadmin"', 400);
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(res, passwordValidation.message, 400);
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return errorResponse(res, 'User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

    // Create user with specified role
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name.trim(), normalizedEmail, hashedPassword, role]
    );

    const user = newUser.rows[0];

    // Log user activity
    await logUserActivity(req.user.id, 'create_user', {
      description: `Created user: ${user.name} (${user.email})`,
      targetType: 'user',
      targetId: user.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        createdUserEmail: user.email,
        createdUserRole: user.role
      }
    });

    successResponse(res, 'User created successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    }, 201);

  } catch (error) {
    logger.error('Create user error:', error);
    errorResponse(res, 'Failed to create user', 500, error.message);
  }
};

/**
 * Get all users (superadmin only)
 * Only returns active users (not soft deleted)
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );

    successResponse(res, 'Users retrieved successfully', {
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, 'Failed to retrieve users', 500, error.message);
  }
};

/**
 * Get single user by ID (superadmin only)
 * Only returns active users (not soft deleted)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, 'User retrieved successfully', {
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    errorResponse(res, 'Failed to retrieve user', 500, error.message);
  }
};

/**
 * Update user (superadmin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Validate at least one field is provided
    if (!name && !email && !role) {
      return errorResponse(res, 'At least one field (name, email, or role) must be provided', 400);
    }

    // Check if user exists and get current data
    const existingUser = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const oldUserData = existingUser.rows[0];

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (name) {
      if (name.trim().length < 2 || name.length > 100) {
        return errorResponse(res, 'Name must be between 2 and 100 characters', 400);
      }
      updates.push(`name = $${paramCounter++}`);
      values.push(name.trim());
    }

    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return errorResponse(res, 'Invalid email format', 400);
      }
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email is already used by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [normalizedEmail, id]
      );

      if (emailCheck.rows.length > 0) {
        return errorResponse(res, 'Email is already used by another user', 409);
      }

      updates.push(`email = $${paramCounter++}`);
      values.push(normalizedEmail);
    }

    if (role) {
      if (!['user', 'superadmin'].includes(role)) {
        return errorResponse(res, 'Role must be either "user" or "superadmin"', 400);
      }
      updates.push(`role = $${paramCounter++}`);
      values.push(role);
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, name, email, role, created_at
    `;

    const result = await pool.query(query, values);

    // Log user activity
    await logUserActivity(req.user.id, 'edit_user', {
      description: `Edited user: ${result.rows[0].name} (${result.rows[0].email})`,
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        oldData: {
          name: oldUserData.name,
          email: oldUserData.email,
          role: oldUserData.role
        },
        newData: {
          name: result.rows[0].name,
          email: result.rows[0].email,
          role: result.rows[0].role
        }
      }
    });

    successResponse(res, 'User updated successfully', {
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, 'Failed to update user', 500, error.message);
  }
};

/**
 * Soft delete user (superadmin only)
 * Moves user to trash instead of permanent deletion
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    // Check if user exists and is not already deleted
    const existingUser = await pool.query(
      'SELECT id, name, email, role, deleted_at FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = existingUser.rows[0];

    // Check if already deleted
    if (user.deleted_at !== null) {
      return errorResponse(res, 'User is already in trash', 400);
    }

    // Soft delete: set deleted_at timestamp
    await pool.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1',
      [id]
    );

    // Log user activity
    await logUserActivity(req.user.id, 'delete_user', {
      description: `Moved user to trash: ${user.name} (${user.email})`,
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        deletedUserName: user.name,
        deletedUserEmail: user.email,
        deletedUserRole: user.role,
        deletionType: 'soft'
      }
    });

    successResponse(res, 'User moved to trash successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 'Failed to delete user', 500, error.message);
  }
};

/**
 * Get all deleted users in trash (superadmin only)
 */
const getTrashUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );

    successResponse(res, 'Trash users retrieved successfully', {
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get trash users error:', error);
    errorResponse(res, 'Failed to retrieve trash users', 500, error.message);
  }
};

/**
 * Restore user from trash (superadmin only)
 */
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is in trash
    const existingUser = await pool.query(
      'SELECT id, name, email, role, deleted_at FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = existingUser.rows[0];

    // Check if user is in trash
    if (user.deleted_at === null) {
      return errorResponse(res, 'User is not in trash', 400);
    }

    // Restore: set deleted_at to NULL
    await pool.query(
      'UPDATE users SET deleted_at = NULL WHERE id = $1',
      [id]
    );

    // Log user activity
    await logUserActivity(req.user.id, 'edit_user', {
      description: `Restored user from trash: ${user.name} (${user.email})`,
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        restoredUserName: user.name,
        restoredUserEmail: user.email,
        restoredUserRole: user.role,
        deletedAt: user.deleted_at
      }
    });

    successResponse(res, 'User restored successfully');

  } catch (error) {
    console.error('Restore user error:', error);
    errorResponse(res, 'Failed to restore user', 500, error.message);
  }
};

/**
 * Permanently delete user from trash (superadmin only)
 * This is irreversible and will delete all related data
 */
const permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'You cannot permanently delete your own account', 400);
    }

    // Check if user exists and is in trash
    const existingUser = await pool.query(
      'SELECT id, name, email, role, deleted_at FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = existingUser.rows[0];

    // Only allow permanent deletion if user is in trash
    if (user.deleted_at === null) {
      return errorResponse(res, 'User must be in trash before permanent deletion', 400);
    }

    // Log user activity before permanent deletion
    await logUserActivity(req.user.id, 'delete_user', {
      description: `Permanently deleted user: ${user.name} (${user.email})`,
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        deletedUserName: user.name,
        deletedUserEmail: user.email,
        deletedUserRole: user.role,
        deletionType: 'permanent',
        deletedAt: user.deleted_at
      }
    });

    // Permanent delete: actually remove from database
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    successResponse(res, 'User permanently deleted successfully');

  } catch (error) {
    console.error('Permanent delete user error:', error);
    errorResponse(res, 'Failed to permanently delete user', 500, error.message);
  }
};

/**
 * Toggle user account status (enable/disable) (superadmin only)
 * Disabled users cannot login to the system
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate input
    if (typeof isActive !== 'boolean') {
      return errorResponse(res, 'isActive field is required and must be a boolean', 400);
    }

    // Prevent disabling yourself
    if (parseInt(id) === req.user.id && !isActive) {
      return errorResponse(res, 'You cannot disable your own account', 400);
    }

    // Check if user exists and is not deleted
    const existingUser = await pool.query(
      'SELECT id, name, email, role, is_active, deleted_at FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = existingUser.rows[0];

    // Check if user is in trash
    if (user.deleted_at !== null) {
      return errorResponse(res, 'Cannot modify status of deleted user. Please restore the user first.', 400);
    }

    // Prevent disabling the last active superadmin
    if (user.role === 'superadmin' && !isActive) {
      const activeSuperadminsResult = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND is_active = TRUE AND deleted_at IS NULL',
        ['superadmin']
      );

      const activeSuperadminsCount = parseInt(activeSuperadminsResult.rows[0].count);

      if (activeSuperadminsCount <= 1) {
        return errorResponse(res, 'Cannot disable the last active superadmin account', 400);
      }
    }

    // Update user status
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, role, is_active, created_at',
      [isActive, id]
    );

    // Log user activity
    await logUserActivity(req.user.id, 'edit_user', {
      description: `${isActive ? 'Enabled' : 'Disabled'} user: ${user.name} (${user.email})`,
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        action: isActive ? 'enable' : 'disable',
        previousStatus: user.is_active,
        newStatus: isActive,
        targetUserEmail: user.email,
        targetUserRole: user.role
      }
    });

    successResponse(res, `User ${isActive ? 'enabled' : 'disabled'} successfully`, {
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    errorResponse(res, 'Failed to update user status', 500, error.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTrashUsers,
  restoreUser,
  permanentDeleteUser,
  toggleUserStatus
};
