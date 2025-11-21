/**
 * Re-extract full content from existing documents
 * Run: node reextract_documents.js
 */

const pool = require('./src/utils/database');
const { extractTextContent } = require('./src/utils/fileProcessor');
const path = require('path');

async function reextractDocuments() {
  try {
    console.log('🔄 Starting re-extraction of existing documents...\n');

    // Get all documents without extracted_content
    const result = await pool.query(
      `SELECT id, title, file_name, file_path FROM documents
       WHERE extracted_content IS NULL OR extracted_content = ''
       ORDER BY id`
    );

    const documents = result.rows;
    console.log(`📄 Found ${documents.length} documents to re-extract\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        console.log(`Processing: ${doc.title} (ID: ${doc.id})`);

        // Build full file path
        const fullPath = path.join(__dirname, doc.file_path);
        console.log(`   Path: ${fullPath}`);

        // Determine file type
        const ext = path.extname(doc.file_name).toLowerCase();
        let fileType = 'unknown';
        if (['.pdf'].includes(ext)) fileType = 'pdf';
        else if (['.doc', '.docx'].includes(ext)) fileType = 'docx';
        else if (['.xls', '.xlsx'].includes(ext)) fileType = 'xlsx';

        // Extract full content
        const extractedContent = await extractTextContent(fullPath, fileType);

        if (!extractedContent || extractedContent.trim().length === 0) {
          console.log(`   ⚠️  No content extracted\n`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Extracted ${extractedContent.length} characters`);

        // Update database with full content
        await pool.query(
          `UPDATE documents
           SET extracted_content = $1
           WHERE id = $2`,
          [extractedContent, doc.id]
        );

        console.log(`   ✅ Updated database\n`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Successfully re-extracted: ${successCount} documents`);
    console.log(`❌ Failed: ${errorCount} documents`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
reextractDocuments();
