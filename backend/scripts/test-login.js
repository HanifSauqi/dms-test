#!/usr/bin/env node

/**
 * Test Login Script
 *
 * Script untuk test login tanpa frontend
 * Usage: node scripts/test-login.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function testLogin() {
  console.log('\n============================================');
  console.log('🧪 Testing Login');
  console.log('============================================\n');

  const email = 'admin@dms.com';
  const password = 'admin123';

  try {
    console.log('📧 Testing with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    // 1. Find user
    console.log('🔍 Step 1: Finding user in database...');
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database!\n');
      console.log('💡 Solution: Create superadmin first:');
      console.log('   npm run create-superadmin\n');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ User found!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password Hash: ${user.password.substring(0, 20)}...\n`);

    // 2. Test password
    console.log('🔐 Step 2: Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Password does not match!\n');
      console.log('💡 Possible issues:');
      console.log('   1. Wrong password');
      console.log('   2. Hash is incorrect');
      console.log('   3. Bcrypt version mismatch\n');
      console.log('🔧 Solution: Regenerate hash:');
      console.log('   npm run generate-hash admin123\n');
      process.exit(1);
    }

    console.log('✅ Password is correct!\n');

    // 3. Check JWT secret
    console.log('🔑 Step 3: Checking JWT configuration...');
    if (!process.env.JWT_SECRET) {
      console.log('⚠️  JWT_SECRET not found in .env!');
      console.log('   This might cause issues.\n');
    } else {
      console.log('✅ JWT_SECRET is configured\n');
    }

    // Success!
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Login should work with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    console.log('🌐 Try logging in at: http://localhost:3000/auth/login\n');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database exists (dms_db)');
    console.error('   3. .env is configured correctly\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testLogin();
