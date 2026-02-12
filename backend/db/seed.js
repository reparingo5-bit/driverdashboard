/**
 * Database Seed Script
 * 
 * Creates initial admin user with forced password change.
 * Run ONCE during initial setup: node db/seed.js
 * 
 * SECURITY: The default password MUST be changed on first login.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Local PostgreSQL, no SSL needed
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...\n');

    // Run schema
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('✓ Database schema created');

    // Create admin user with forced password change
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length === 0) {
      // Generate a random temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      await client.query(
        `INSERT INTO users (username, password, role, must_change_password) 
         VALUES ($1, $2, $3, $4)`,
        ['admin', hashedPassword, 'admin', true]
      );

      console.log('✓ Admin user created');
      console.log('\n========================================');
      console.log('  INITIAL ADMIN CREDENTIALS');
      console.log('========================================');
      console.log(`  Username: admin`);
      console.log(`  Password: ${tempPassword}`);
      console.log('========================================');
      console.log('  ⚠️  You MUST change this password');
      console.log('     on first login!');
      console.log('========================================\n');
    } else {
      console.log('✓ Admin user already exists (skipped)');
    }

    console.log('\n✓ Database initialization complete!\n');

  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

seed();
