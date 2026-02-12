const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { pool } = require('../db/database');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

// Login handler
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { error: 'Bitte geben Sie Benutzername und Passwort ein.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password, role, must_change_password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.render('login', { error: 'Ungültige Anmeldedaten.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.render('login', { error: 'Ungültige Anmeldedaten.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.must_change_password
    };

    // Force password change if required
    if (user.must_change_password) {
      return res.redirect('/auth/change-password');
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
  }
});

// Change password page
router.get('/change-password', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('change-password', { 
    error: null, 
    success: null,
    forced: req.session.user.mustChangePassword 
  });
});

// Change password handler
router.post('/change-password', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  const forced = req.session.user.mustChangePassword;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('change-password', { 
      error: 'Alle Felder sind erforderlich.',
      success: null,
      forced
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('change-password', { 
      error: 'Die neuen Passwörter stimmen nicht überein.',
      success: null,
      forced
    });
  }

  if (newPassword.length < 8) {
    return res.render('change-password', { 
      error: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
      success: null,
      forced
    });
  }

  // Check for password complexity
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return res.render('change-password', { 
      error: 'Das Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten.',
      success: null,
      forced
    });
  }

  try {
    // Verify current password
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.session.user.id]
    );

    if (result.rows.length === 0) {
      return res.redirect('/auth/login');
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!validPassword) {
      return res.render('change-password', { 
        error: 'Das aktuelle Passwort ist falsch.',
        success: null,
        forced
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password = $1, must_change_password = false WHERE id = $2',
      [hashedPassword, req.session.user.id]
    );

    // Update session
    req.session.user.mustChangePassword = false;

    if (forced) {
      return res.redirect('/dashboard');
    }

    res.render('change-password', { 
      error: null, 
      success: 'Passwort erfolgreich geändert.',
      forced: false
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.render('change-password', { 
      error: 'Ein Fehler ist aufgetreten.',
      success: null,
      forced
    });
  }
});

// Logout handler
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
