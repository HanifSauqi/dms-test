/**
 * Validation Utilities
 * Centralized validation functions for the application
 */

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate required fields
 * @param {Object} fields - Object with field names and values
 * @returns {Object} { valid: boolean, missingFields: string[] }
 */
const validateRequiredFields = (fields) => {
    const missingFields = [];
    for (const [name, value] of Object.entries(fields)) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(name);
        }
    }
    return {
        valid: missingFields.length === 0,
        missingFields
    };
};

module.exports = {
    validatePassword,
    validateEmail,
    validateRequiredFields
};
