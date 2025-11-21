/**
 * Cleanup Duplicate Files Script
 *
 * Purpose: Remove orphaned files from uploads/ folder that don't exist in database
 * Use case: Clean up files that were uploaded multiple times but deleted from DB
 *
 * Usage:
 *   node scripts/cleanup-duplicate-files.js
 *
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --force      Skip confirmation prompt
 */

const fs = require('fs').promises;
const path = require('path');
const pool = require('../src/utils/database');
require('dotenv').config();

// Parse command-line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const fullUploadPath = path.join(__dirname, '..', UPLOAD_PATH);

console.log('🗑️  File Cleanup Script');
console.log('='.repeat(60));
console.log(`Upload folder: ${fullUploadPath}`);
console.log(`Dry run: ${dryRun ? 'YES (no files will be deleted)' : 'NO'}`);
console.log('='.repeat(60));
console.log('');

async function cleanupDuplicateFiles() {
  try {
    // Step 1: Get all files in uploads folder
    console.log('📂 Scanning uploads folder...');

    let allFiles = [];
    try {
      allFiles = await fs.readdir(fullUploadPath);
      console.log(`Found ${allFiles.length} files in uploads folder`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('❌ Uploads folder not found:', fullUploadPath);
        return;
      }
      throw error;
    }

    // Step 2: Get all file_name references from database
    console.log('🗄️  Checking database...');

    const result = await pool.query(`
      SELECT DISTINCT file_name, file_path, COUNT(*) as count
      FROM documents
      GROUP BY file_name, file_path
      ORDER BY count DESC
    `);

    const dbFiles = new Set(result.rows.map(row => row.file_name));
    console.log(`Found ${dbFiles.size} unique files referenced in database`);

    // Show duplicates in database (same file referenced multiple times)
    const duplicates = result.rows.filter(row => row.count > 1);
    if (duplicates.length > 0) {
      console.log('');
      console.log('⚠️  Warning: Files referenced multiple times in database:');
      duplicates.forEach(dup => {
        console.log(`   - ${dup.file_name} (${dup.count} times)`);
      });
      console.log('   This is OK if documents were intentionally duplicated');
    }

    console.log('');

    // Step 3: Find orphaned files (in folder but not in DB)
    const orphanedFiles = allFiles.filter(file => !dbFiles.has(file));

    console.log('📊 Analysis Results:');
    console.log(`   Total files in folder: ${allFiles.length}`);
    console.log(`   Files in database: ${dbFiles.size}`);
    console.log(`   Orphaned files: ${orphanedFiles.length}`);
    console.log('');

    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found! Upload folder is clean.');
      return;
    }

    // Step 4: Calculate storage savings
    let totalSize = 0;
    const fileDetails = [];

    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(fullUploadPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileDetails.push({
          name: file,
          size: stats.size,
          sizeReadable: formatBytes(stats.size)
        });
      } catch (error) {
        console.warn(`   Warning: Could not stat file ${file}: ${error.message}`);
      }
    }

    console.log('🗑️  Orphaned Files to Delete:');
    console.log('');

    // Show top 10 largest orphaned files
    fileDetails
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.sizeReadable})`);
      });

    if (orphanedFiles.length > 10) {
      console.log(`   ... and ${orphanedFiles.length - 10} more files`);
    }

    console.log('');
    console.log(`💾 Total storage to free: ${formatBytes(totalSize)}`);
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN: No files were deleted');
      console.log('   Run without --dry-run to actually delete files');
      return;
    }

    // Step 5: Confirmation
    if (!force) {
      console.log('⚠️  WARNING: This will permanently delete files!');
      console.log('');
      console.log('Are you sure you want to delete these files?');
      console.log('Type "yes" to confirm, or anything else to cancel:');

      // Wait for user input
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('> ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('');
        console.log('❌ Cancelled. No files were deleted.');
        return;
      }
    }

    // Step 6: Delete orphaned files
    console.log('');
    console.log('🗑️  Deleting orphaned files...');

    let deleted = 0;
    let failed = 0;

    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(fullUploadPath, file);
        await fs.unlink(filePath);
        deleted++;
        console.log(`   ✅ Deleted: ${file}`);
      } catch (error) {
        failed++;
        console.error(`   ❌ Failed to delete ${file}: ${error.message}`);
      }
    }

    // Step 7: Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files deleted: ${deleted} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Storage freed: ${formatBytes(totalSize)}`);
    console.log('');

    if (deleted > 0) {
      console.log('✅ Cleanup complete! Upload folder is now optimized.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the script
cleanupDuplicateFiles().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
