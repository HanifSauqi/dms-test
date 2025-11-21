const pool = require('../src/utils/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Running auto-classification migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/001_add_auto_classification.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter out comments/empty lines
    const queries = migrationSQL
      .split(';')
      .map(q => q.trim())
      .filter(q => q && !q.startsWith('--') && !q.startsWith('\\echo'));

    // Execute each query
    for (const query of queries) {
      if (query) {
        console.log(`Executing: ${query.substring(0, 50)}...`);
        await pool.query(query);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📝 Auto-classification tables and columns have been added.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();