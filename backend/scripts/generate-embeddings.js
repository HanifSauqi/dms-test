/**
 * Script to generate embeddings for existing documents
 * Run this after setting up semantic search to add embeddings to old documents
 *
 * Usage: node backend/scripts/generate-embeddings.js
 */

require('dotenv').config();
const pool = require('../src/utils/database');
const { generateEmbedding, checkEmbeddingServiceHealth, cleanTextForEmbedding } = require('../src/utils/embeddingService');

async function generateEmbeddingsForExistingDocs(forceRegenerate = false) {
  console.log('🚀 Starting embedding generation for existing documents...\n');

  if (forceRegenerate) {
    console.log('🔄 FORCE MODE: Regenerating embeddings for ALL documents with cleaned text\n');
  }

  try {
    // Check if embedding service is running
    console.log('Checking embedding service health...');
    const isHealthy = await checkEmbeddingServiceHealth();

    if (!isHealthy) {
      console.error('❌ Embedding service is not running!');
      console.error('Please start the service with: cd embedding-service && python main.py');
      process.exit(1);
    }
    console.log('✅ Embedding service is healthy\n');

    // Get documents based on force flag
    let query;
    if (forceRegenerate) {
      query = `SELECT id, title, extracted_content
               FROM documents
               WHERE extracted_content IS NOT NULL
                 AND LENGTH(TRIM(extracted_content)) > 0
               ORDER BY id`;
    } else {
      query = `SELECT id, title, extracted_content
               FROM documents
               WHERE content_vector IS NULL
                 AND extracted_content IS NOT NULL
                 AND LENGTH(TRIM(extracted_content)) > 0
               ORDER BY id`;
    }

    const result = await pool.query(query);

    const totalDocs = result.rows.length;
    console.log(`📄 Found ${totalDocs} documents to process\n`);

    if (totalDocs === 0) {
      console.log('✨ All documents already have embeddings!');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    // Process each document
    for (let i = 0; i < result.rows.length; i++) {
      const doc = result.rows[i];
      const progress = `[${i + 1}/${totalDocs}]`;

      try {
        console.log(`${progress} Processing: ${doc.title} (ID: ${doc.id})`);
        console.log(`  └─ Original content: ${doc.extracted_content.length} chars`);

        // Preview cleaned text
        const cleanedText = cleanTextForEmbedding(doc.extracted_content, 2000);
        console.log(`  └─ Cleaned content: ${cleanedText.length} chars`);
        console.log(`  └─ Preview: ${cleanedText.substring(0, 150)}...`);

        // Generate embedding (automatically cleans text)
        const embedding = await generateEmbedding(doc.extracted_content);

        // Update database
        await pool.query(
          'UPDATE documents SET content_vector = $1 WHERE id = $2',
          [JSON.stringify(embedding), doc.id]
        );

        successCount++;
        console.log(`${progress} ✅ Success\n`);

      } catch (error) {
        failCount++;
        console.error(`${progress} ❌ Failed: ${error.message}\n`);
      }

      // Add small delay to avoid overwhelming the service
      if (i < result.rows.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total documents: ${totalDocs}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('═══════════════════════════════════════\n');

    if (successCount > 0) {
      console.log('🎉 Embeddings generated successfully!');
      console.log('\n💡 Next step: Create HNSW index for better performance');
      console.log('   Run: PGPASSWORD=<your-db-password> psql -U postgres -d document_management_system -f "database/migrations/create_hnsw_index.sql"');
      console.log('   (Replace <your-db-password> with your actual PostgreSQL password)');
    }

    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check for --force flag
const forceRegenerate = process.argv.includes('--force');

// Run the script
generateEmbeddingsForExistingDocs(forceRegenerate);
