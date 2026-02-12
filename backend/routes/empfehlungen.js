const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { isAdmin } = require('../middleware/auth');

// Empfehlungen page
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, vorname, nachname, abholort, abgabeort, created_at
      FROM empfehlungen
      ORDER BY created_at DESC
    `);

    res.render('empfehlungen', {
      title: 'Empfehlungscode',
      empfehlungen: result.rows
    });
  } catch (error) {
    console.error('Empfehlungen list error:', error);
    res.render('error', {
      title: 'Fehler',
      message: 'Fehler beim Laden der Empfehlungen.'
    });
  }
});

// Add empfehlung (admin only)
router.post('/add', isAdmin, async (req, res) => {
  const { vorname, nachname, abholort, abgabeort } = req.body;

  if (!vorname || !nachname || !abholort || !abgabeort) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
  }

  try {
    await pool.query(
      'INSERT INTO empfehlungen (vorname, nachname, abholort, abgabeort) VALUES ($1, $2, $3, $4)',
      [vorname, nachname, abholort, abgabeort]
    );

    res.redirect('/empfehlungen');
  } catch (error) {
    console.error('Add empfehlung error:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen der Empfehlung.' });
  }
});

// Delete empfehlung (admin only)
router.post('/delete/:id', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM empfehlungen WHERE id = $1', [id]);
    res.redirect('/empfehlungen');
  } catch (error) {
    console.error('Delete empfehlung error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Empfehlung.' });
  }
});

module.exports = router;
