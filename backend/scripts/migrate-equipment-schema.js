const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function migrateEquipmentSchema() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });

    console.log('Starting equipment_requests table migration...');

    // Check if current_stage column exists
    const tableInfo = await db.all("PRAGMA table_info(equipment_requests)");
    const hasCurrentStage = tableInfo.some(col => col.name === 'current_stage');

    if (!hasCurrentStage) {
      console.log('Adding current_stage column to equipment_requests table...');
      await db.run(`
        ALTER TABLE equipment_requests 
        ADD COLUMN current_stage TEXT DEFAULT 'HOD'
      `);
      console.log('✓ Added current_stage column');
    } else {
      console.log('✓ current_stage column already exists');
    }

    // Update existing records that don't have current_stage set
    await db.run(`
      UPDATE equipment_requests 
      SET current_stage = 'HOD' 
      WHERE current_stage IS NULL
    `);
    console.log('✓ Updated existing records');

    // Update status for existing approved records
    await db.run(`
      UPDATE equipment_requests 
      SET status = 'Approved - Fund Released', current_stage = 'COMPLETED'
      WHERE status = 'Approved - Fund Released' AND current_stage IS NULL
    `);

    // Check if equipment_approval_history table exists
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='equipment_approval_history'
    `);

    if (tables.length === 0) {
      console.log('Creating equipment_approval_history table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS equipment_approval_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          equipment_request_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          status TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_email TEXT NOT NULL,
          comment TEXT,
          action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (equipment_request_id) REFERENCES equipment_requests(id)
        )
      `);
      console.log('✓ Created equipment_approval_history table');
    } else {
      console.log('✓ equipment_approval_history table already exists');
    }

    console.log('Migration completed successfully!');
    await db.close();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateEquipmentSchema();

