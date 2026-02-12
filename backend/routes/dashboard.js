const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

// Dashboard page
router.get('/', async (req, res) => {
  try {
    // Get driver statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'aktiv') as aktiv,
        COUNT(*) FILTER (WHERE status = 'inaktiv') as inaktiv,
        COUNT(*) FILTER (WHERE status = 'neu') as neu
      FROM drivers
    `);

    const stats = statsResult.rows[0];

    // Get all drivers
    const driversResult = await pool.query(`
      SELECT id, vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app, created_at
      FROM drivers
      ORDER BY created_at DESC
    `);

    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        total: parseInt(stats.total) || 0,
        aktiv: parseInt(stats.aktiv) || 0,
        inaktiv: parseInt(stats.inaktiv) || 0,
        neu: parseInt(stats.neu) || 0
      },
      drivers: driversResult.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('error', {
      title: 'Fehler',
      message: 'Fehler beim Laden des Dashboards.'
    });
  }
});

// CSV Export
router.get('/export', async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }

  try {
    const result = await pool.query(`
      SELECT vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app, created_at
      FROM drivers
      ORDER BY created_at DESC
    `);

    const headers = ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Status', 'Fahrzeugtyp', 'Kennzeichen', 'Sticker', 'App', 'Erstellt am'];
    const csvRows = [headers.join(';')];

    for (const driver of result.rows) {
      const row = [
        driver.vorname,
        driver.nachname,
        driver.email || '',
        driver.phone || '',
        driver.status,
        driver.fahrzeugtyp,
        driver.kennzeichen || '',
        driver.sticker ? 'Ja' : 'Nein',
        driver.app ? 'Ja' : 'Nein',
        new Date(driver.created_at).toLocaleDateString('de-DE')
      ];
      csvRows.push(row.join(';'));
    }

    const csvContent = csvRows.join('\n');
    const filename = `fahrer_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csvContent); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export fehlgeschlagen' });
  }
});

module.exports = router;
