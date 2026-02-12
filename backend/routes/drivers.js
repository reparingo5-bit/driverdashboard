const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { isAdmin } = require('../middleware/auth');

// Add driver (admin only)
router.post('/add', isAdmin, async (req, res) => {
  const { vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app } = req.body;

  if (!vorname || !nachname || !fahrzeugtyp) {
    return res.status(400).json({ error: 'Vorname, Nachname und Fahrzeugtyp sind erforderlich.' });
  }

  try {
    await pool.query(
      `INSERT INTO drivers (vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        vorname,
        nachname,
        email || null,
        phone || null,
        status || 'neu',
        fahrzeugtyp,
        kennzeichen || null,
        sticker === 'true' || sticker === true,
        app === 'true' || app === true
      ]
    );

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Add driver error:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Fahrers.' });
  }
});

// Update driver (admin only)
router.post('/update/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app } = req.body;

  if (!vorname || !nachname || !fahrzeugtyp) {
    return res.status(400).json({ error: 'Vorname, Nachname und Fahrzeugtyp sind erforderlich.' });
  }

  try {
    await pool.query(
      `UPDATE drivers 
       SET vorname = $1, nachname = $2, email = $3, phone = $4, status = $5, 
           fahrzeugtyp = $6, kennzeichen = $7, sticker = $8, app = $9
       WHERE id = $10`,
      [
        vorname,
        nachname,
        email || null,
        phone || null,
        status,
        fahrzeugtyp,
        kennzeichen || null,
        sticker === 'true' || sticker === true,
        app === 'true' || app === true,
        id
      ]
    );

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Fahrers.' });
  }
});

// Update status only (admin + partner)
router.post('/status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['aktiv', 'inaktiv', 'neu'].includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status.' });
  }

  try {
    await pool.query('UPDATE drivers SET status = $1 WHERE id = $2', [status, id]);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Status.' });
  }
});

// Delete driver (admin only)
router.post('/delete/:id', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM drivers WHERE id = $1', [id]);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Fahrers.' });
  }
});

// Get driver for editing (admin only) - API endpoint
router.get('/get/:id', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fahrer nicht gefunden.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Fahrers.' });
  }
});

module.exports = router;
