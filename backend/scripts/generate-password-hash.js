#!/usr/bin/env node

/**
 * Generate Password Hash Script
 *
 * This script generates a bcrypt hash for a given password.
 * Use this when you need to manually insert a user with SQL.
 *
 * Usage:
 *   node scripts/generate-password-hash.js [password]
 *
 * Example:
 *   node scripts/generate-password-hash.js admin123
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2] || 'admin123';

  console.log('\n============================================');
  console.log('🔐 Generating Password Hash');
  console.log('============================================\n');

  console.log(`Password: ${password}`);
  console.log('Hashing...\n');

  try {
    const hash = await bcrypt.hash(password, 10);

    console.log('✅ Hash generated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Hash:', hash);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Copy this hash and use in SQL:\n');
    console.log(`INSERT INTO users (name, email, password, role)`);
    console.log(`VALUES (`);
    console.log(`  'System Administrator',`);
    console.log(`  'admin@dms.com',`);
    console.log(`  '${hash}',`);
    console.log(`  'superadmin'`);
    console.log(`);\n`);

    console.log('============================================\n');

    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log(`✅ Hash verification: ${isValid ? 'VALID' : 'INVALID'}\n`);

  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
}

generateHash();
