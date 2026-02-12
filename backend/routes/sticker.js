const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { isAdmin } = require('../middleware/auth');

// Extra Sticker page
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, kennzeichen, created_at
      FROM extra_sticker
      ORDER BY created_at DESC
    `);

    res.render('sticker', {
      title: 'Extra Sticker Liste',
      stickers: result.rows
    });
  } catch (error) {
    console.error('Sticker list error:', error);
    res.render('error', {
      title: 'Fehler',
      message: 'Fehler beim Laden der Sticker-Liste.'
    });
  }
});

// Add sticker (admin only)
router.post('/add', isAdmin, async (req, res) => {
  const { kennzeichen } = req.body;

  if (!kennzeichen) {
    return res.status(400).json({ error: 'Kennzeichen ist erforderlich.' });
  }

  try {
    await pool.query(
      'INSERT INTO extra_sticker (kennzeichen) VALUES ($1)',
      [kennzeichen]
    );

    res.redirect('/sticker');
  } catch (error) {
    console.error('Add sticker error:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Stickers.' });
  }
});

// Delete sticker (admin only)
router.post('/delete/:id', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM extra_sticker WHERE id = $1', [id]);
    res.redirect('/sticker');
  } catch (error) {
    console.error('Delete sticker error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Stickers.' });
  }
});

module.exports = router;
