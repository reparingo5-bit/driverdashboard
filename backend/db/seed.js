require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { pool, initializeDatabase } = require('./database');

async function seed() {
  try {
    // Initialize tables first
    await initializeDatabase();

    const client = await pool.connect();
    try {
      // Check if admin user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        ['admin']
      );

      if (existingUser.rows.length === 0) {
        // Hash password
        const hashedPassword = await bcrypt.hash('Admin123!', 12);

        // Create admin user
        await client.query(
          'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
          ['admin', hashedPassword, 'admin']
        );

        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }

      // Add some sample data for testing
      const existingDrivers = await client.query('SELECT COUNT(*) FROM drivers');
      
      if (parseInt(existingDrivers.rows[0].count) === 0) {
        const sampleDrivers = [
          { vorname: 'Max', nachname: 'Müller', email: 'max@example.com', phone: '+49 123 456789', status: 'aktiv', fahrzeugtyp: 'PKW', kennzeichen: 'B-MM 1234', sticker: true, app: true },
          { vorname: 'Anna', nachname: 'Schmidt', email: 'anna@example.com', phone: '+49 987 654321', status: 'aktiv', fahrzeugtyp: 'Fahrrad', kennzeichen: '', sticker: false, app: true },
          { vorname: 'Thomas', nachname: 'Weber', email: 'thomas@example.com', phone: '+49 111 222333', status: 'inaktiv', fahrzeugtyp: 'Transporter', kennzeichen: 'B-TW 5678', sticker: true, app: false },
          { vorname: 'Lisa', nachname: 'Fischer', email: 'lisa@example.com', phone: '+49 444 555666', status: 'neu', fahrzeugtyp: 'Caddy', kennzeichen: 'B-LF 9012', sticker: false, app: false },
        ];

        for (const driver of sampleDrivers) {
          await client.query(
            `INSERT INTO drivers (vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [driver.vorname, driver.nachname, driver.email, driver.phone, driver.status, driver.fahrzeugtyp, driver.kennzeichen, driver.sticker, driver.app]
          );
        }
        console.log('Sample drivers added successfully');
      }

      console.log('Seed completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
