const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'partner')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create drivers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vorname VARCHAR(255) NOT NULL,
        nachname VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'neu' CHECK (status IN ('aktiv', 'inaktiv', 'neu')),
        fahrzeugtyp VARCHAR(50) NOT NULL CHECK (fahrzeugtyp IN ('Fahrrad', 'PKW', 'Caddy', 'Transporter')),
        kennzeichen VARCHAR(50),
        sticker BOOLEAN DEFAULT false,
        app BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create extra_sticker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS extra_sticker (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kennzeichen VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create empfehlungen table
    await client.query(`
      CREATE TABLE IF NOT EXISTS empfehlungen (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vorname VARCHAR(255) NOT NULL,
        nachname VARCHAR(255) NOT NULL,
        abholort VARCHAR(255) NOT NULL,
        abgabeort VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDatabase };
