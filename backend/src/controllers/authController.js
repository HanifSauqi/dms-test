const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/database');
const { successResponse, errorResponse } = require('../utils/response');
const authConfig = require('../config/auth.config');
const { logUserActivity } = require('../utils/userActivityLogger');
const { validatePassword, validateEmail } = require('../utils/validators');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    // Create user with normalized data (default role is 'user')
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name.trim(), normalizedEmail, hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
    );

    successResponse(res, 'User registered successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    errorResponse(res, 'Registration failed', 500, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    if (!validateEmail(normalizedEmail)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id, name, email, password, role, is_active, deleted_at, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = userResult.rows[0];

    // Check if account is soft deleted
    if (user.deleted_at !== null) {
      return errorResponse(res, 'This account has been deleted. Please contact the administrator.', 403);
    }

    // Check if account is disabled
    if (!user.is_active) {
      return errorResponse(res, 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.', 403);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
    );

    // Log user login activity
    await logUserActivity(user.id, 'login', {
      description: `User ${user.name} logged in`,
      targetType: 'system',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    successResponse(res, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    errorResponse(res, 'Login failed', 500, error.message);
  }
};

const logout = async (req, res) => {
  try {
    // Log user logout activity
    await logUserActivity(req.user.id, 'logout', {
      description: `User ${req.user.name} logged out`,
      targetType: 'system',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    successResponse(res, 'Logout successful', {
      message: 'User logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 'Logout failed', 500, error.message);
  }
};

module.exports = { register, login, logout };