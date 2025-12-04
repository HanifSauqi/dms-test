#!/usr/bin/env node

/**
 * Create Superadmin Account Script
 *
 * This script creates a default superadmin account for initial setup.
 * Run this after setting up the database.
 *
 * Usage:
 *   node scripts/create-superadmin.js
 *
 * Or with custom credentials:
 *   node scripts/create-superadmin.js "Admin Name" "admin@example.com" "password123"
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Default credentials
const DEFAULT_NAME = 'System Administrator';
const DEFAULT_EMAIL = 'admin@dms.com';
const DEFAULT_PASSWORD = 'admin123';

async function createSuperadmin() {
  console.log('\n============================================');
  console.log('🔧 Creating Superadmin Account');
  console.log('============================================\n');

  try {
    // Get credentials from command line or use defaults
    const name = process.argv[2] || DEFAULT_NAME;
    const email = process.argv[3] || DEFAULT_EMAIL;
    const password = process.argv[4] || DEFAULT_PASSWORD;

    // Check if superadmin already exists
    const existingAdmin = await pool.query(
      'SELECT id, email FROM users WHERE role = $1',
      ['superadmin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Superadmin account already exists:');
      console.log(`   Email: ${existingAdmin.rows[0].email}`);
      console.log('\n💡 If you want to create a new superadmin, you can:');
      console.log('   1. Update the existing one in the database');
      console.log('   2. Or create a regular user and change role to superadmin');
      console.log('\n============================================\n');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert superadmin
    console.log('💾 Creating superadmin account...');
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'superadmin']
    );

    const admin = result.rows[0];

    console.log('\n✅ Superadmin account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🆔 ID:', admin.id);
    console.log('📅 Created:', admin.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (password === DEFAULT_PASSWORD) {
      console.log('⚠️  WARNING: You are using the default password!');
      console.log('   Please change it immediately after first login.\n');
    }

    console.log('🎉 You can now login to the application!');
    console.log('   URL: http://localhost:3000/auth/login');
    console.log('\n============================================\n');

  } catch (error) {
    console.error('\n❌ Error creating superadmin:');
    console.error('  ', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Database is running');
    console.error('   2. .env file is configured correctly');
    console.error('   3. Database schema has been initialized\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createSuperadmin();
