/**
 * Regenerate Embeddings for All Documents
 *
 * Purpose: Re-generate embeddings using Gemini API (768-dim) for all existing documents
 * Use case: After migrating from BGE-M3 (1024-dim) to Gemini (768-dim)
 *
 * Usage:
 *   node scripts/regenerate-embeddings.js
 *
 * Options:
 *   --batch-size=N    Process N documents at a time (default: 10)
 *   --delay=N         Delay N ms between batches (default: 1000)
 *   --dry-run         Show what would be done without doing it
 */

const pool = require('../src/utils/database');
const { generateEmbedding } = require('../src/utils/embeddingService');
require('dotenv').config();

// Parse command-line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '10');
const delay = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || '1000');
const dryRun = args.includes('--dry-run');

console.log('🔄 Embedding Regeneration Script');
console.log('='.repeat(50));
console.log(`Batch size: ${batchSize}`);
console.log(`Delay: ${delay}ms`);
console.log(`Dry run: ${dryRun ? 'YES (no changes will be made)' : 'NO'}`);
console.log('='.repeat(50));
console.log('');

async function regenerateEmbeddings() {
  try {
    // Step 1: Get all documents that need embeddings
    console.log('📊 Fetching documents...');

    const result = await pool.query(`
      SELECT id, title, extracted_content,
        CASE WHEN content_vector IS NULL THEN true ELSE false END as needs_embedding
      FROM documents
      WHERE extracted_content IS NOT NULL
      ORDER BY id ASC
    `);

    const allDocs = result.rows;
    const docsNeedingEmbedding = allDocs.filter(doc => doc.needs_embedding);

    console.log(`Total documents: ${allDocs.length}`);
    console.log(`Documents needing embedding: ${docsNeedingEmbedding.length}`);
    console.log(`Documents with embeddings: ${allDocs.length - docsNeedingEmbedding.length}`);
    console.log('');

    if (docsNeedingEmbedding.length === 0) {
      console.log('✅ All documents already have embeddings!');
      return;
    }

    if (dryRun) {
      console.log('🔍 DRY RUN: Would regenerate embeddings for:');
      docsNeedingEmbedding.slice(0, 5).forEach(doc => {
        console.log(`   - ID ${doc.id}: ${doc.title.substring(0, 50)}...`);
      });
      if (docsNeedingEmbedding.length > 5) {
        console.log(`   ... and ${docsNeedingEmbedding.length - 5} more`);
      }
      console.log('');
      console.log('Run without --dry-run to actually regenerate embeddings');
      return;
    }

    // Step 2: Regenerate embeddings in batches
    console.log('🚀 Starting embedding generation...');
    console.log('');

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < docsNeedingEmbedding.length; i += batchSize) {
      const batch = docsNeedingEmbedding.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(docsNeedingEmbedding.length / batchSize);

      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} documents)`);

      for (const doc of batch) {
        try {
          console.log(`   Processing ID ${doc.id}: ${doc.title.substring(0, 40)}...`);

          // Generate embedding
          const embedding = await generateEmbedding(doc.extracted_content);

          // Update database
          await pool.query(
            `UPDATE documents SET content_vector = $1 WHERE id = $2`,
            [JSON.stringify(embedding), doc.id]
          );

          succeeded++;
          console.log(`   ✅ Success (${embedding.length} dimensions)`);

        } catch (error) {
          failed++;
          console.error(`   ❌ Failed: ${error.message}`);

          // Stop if too many failures
          if (failed > 5 && failed / processed > 0.5) {
            throw new Error('Too many failures (>50%), stopping to prevent issues');
          }
        }

        processed++;
      }

      // Delay between batches to respect API rate limits
      if (i + batchSize < docsNeedingEmbedding.length) {
        console.log(`   ⏳ Waiting ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log('');
    }

    // Step 3: Summary
    console.log('='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total processed: ${processed}`);
    console.log(`Succeeded: ${succeeded} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success rate: ${((succeeded / processed) * 100).toFixed(1)}%`);
    console.log('');

    // Step 4: Recreate HNSW index if all successful
    if (failed === 0) {
      console.log('🔨 Recreating HNSW index for fast vector search...');

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_documents_content_vector_hnsw
        ON documents USING hnsw (content_vector vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
      `);

      console.log('✅ HNSW index created successfully');
      console.log('');
    } else {
      console.log('⚠️  HNSW index not recreated due to failures');
      console.log('   Fix failed documents and run again');
      console.log('');
    }

    // Step 5: Verify results
    console.log('🔍 Verifying results...');

    const verifyResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(content_vector) as with_vectors,
        COUNT(*) - COUNT(content_vector) as without_vectors
      FROM documents
      WHERE extracted_content IS NOT NULL
    `);

    const stats = verifyResult.rows[0];
    console.log(`Total documents: ${stats.total}`);
    console.log(`With vectors: ${stats.with_vectors}`);
    console.log(`Without vectors: ${stats.without_vectors}`);
    console.log('');

    if (stats.without_vectors > 0) {
      console.log('⚠️  Warning: Some documents still missing vectors');
      console.log('   Run this script again to retry failed documents');
    } else {
      console.log('✅ All documents have embeddings!');
      console.log('');
      console.log('🎉 Migration complete! Your system is now optimized.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Stop old embedding service: docker stop embedding-service');
      console.log('2. Remove embedding service from startup scripts');
      console.log('3. Test semantic search to verify it works');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
regenerateEmbeddings().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
