const pool = require('./src/utils/database');

(async () => {
  try {
    const userId = 1;

    console.log('=== Recent Activities (Last 20) ===\n');
    const result = await pool.query(`
      SELECT
        da.id,
        da.document_id,
        da.activity_type,
        da.created_at,
        d.title
       FROM document_activities da
       JOIN documents d ON da.document_id = d.id
       WHERE da.user_id = $1
       ORDER BY da.created_at DESC
       LIMIT 20
    `, [userId]);

    console.log('Total activities:', result.rows.length);
    console.log('');

    // Show each activity
    result.rows.forEach((row, i) => {
      const time = new Date(row.created_at);
      console.log(`${i+1}. [${row.activity_type.toUpperCase()}] ${row.title}`);
      console.log(`   Doc ID: ${row.document_id} | Activity ID: ${row.id}`);
      console.log(`   Time: ${time.toLocaleString()}`);
      console.log('');
    });

    // Check for duplicates
    console.log('=== Checking for Same-Second Duplicates ===\n');
    const bySecond = {};
    result.rows.forEach(row => {
      const key = `${row.document_id}-${row.activity_type}-${new Date(row.created_at).toISOString().slice(0, 19)}`;
      if (!bySecond[key]) bySecond[key] = [];
      bySecond[key].push(row);
    });

    Object.entries(bySecond).forEach(([key, activities]) => {
      if (activities.length > 1) {
        console.log(`DUPLICATE FOUND: ${key}`);
        console.log(`  Count: ${activities.length}`);
        console.log(`  Activities: ${activities.map(a => a.id).join(', ')}`);
        console.log('');
      }
    });

    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
