/**
 * Environment Variable Validator
 * Validates required environment variables at startup
 */

const requiredEnvVars = {
  // Database - Support both DATABASE_URL or individual DB_* variables
  DB_HOST: {
    required: false,
    default: 'localhost',
    description: 'PostgreSQL host'
  },
  DB_PORT: {
    required: false,
    default: '5432',
    description: 'PostgreSQL port'
  },
  DB_NAME: {
    required: false,
    default: 'dms_db',
    description: 'PostgreSQL database name'
  },
  DB_USER: {
    required: false,
    default: 'postgres',
    description: 'PostgreSQL username'
  },
  DB_PASSWORD: {
    required: true,
    description: 'PostgreSQL password',
    validate: (value) => {
      if (!value || value.length === 0) {
        return 'DB_PASSWORD is required';
      }
      return null;
    }
  },

  // Authentication
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token generation',
    validate: (value) => {
      if (value.length < 32) {
        return 'JWT_SECRET must be at least 32 characters for security';
      }
      return null;
    }
  },

  // Server
  PORT: {
    required: false,
    default: '3001',
    description: 'Server port',
    validate: (value) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'PORT must be a valid port number (1-65535)';
      }
      return null;
    }
  },

  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Node environment',
    validate: (value) => {
      const validEnvs = ['development', 'production', 'test'];
      if (!validEnvs.includes(value)) {
        return `NODE_ENV must be one of: ${validEnvs.join(', ')}`;
      }
      return null;
    }
  },

  // Optional: Gemini AI
  GEMINI_API_KEY: {
    required: false,
    description: 'Google Gemini API key for AI features',
    validate: (value) => {
      if (value && value.length < 20) {
        return 'GEMINI_API_KEY appears to be invalid (too short)';
      }
      return null;
    }
  },

  // AI Configuration
  AI_PROVIDER: {
    required: false,
    default: 'gemini',
    description: 'AI provider to use (gemini or ollama)',
    validate: (value) => {
      const validProviders = ['gemini', 'ollama'];
      if (value && !validProviders.includes(value)) {
        return `AI_PROVIDER must be one of: ${validProviders.join(', ')}`;
      }
      return null;
    }
  },
  LLM_SERVICE_URL: {
    required: false,
    default: 'http://localhost:3005',
    description: 'URL for the standalone LLM service'
  }
};

/**
 * Validate all environment variables
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];

    // Check if required var is missing
    if (config.required && !value) {
      errors.push(`❌ Missing required environment variable: ${key} - ${config.description}`);
      continue;
    }

    // Set default if not provided
    if (!value && config.default) {
      process.env[key] = config.default;
      console.log(`ℹ️  Using default for ${key}: ${config.default}`);
      continue;
    }

    // Skip validation if optional and not provided
    if (!config.required && !value) {
      warnings.push(`⚠️  Optional environment variable not set: ${key} - ${config.description}`);
      continue;
    }

    // Run custom validation
    if (value && config.validate) {
      const error = config.validate(value);
      if (error) {
        errors.push(`❌ Invalid ${key}: ${error}`);
      }
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }

  // Display errors and exit if any
  if (errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:');
    errors.forEach(error => console.error(`  ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment variables validated successfully\n');
}

module.exports = { validateEnv };
