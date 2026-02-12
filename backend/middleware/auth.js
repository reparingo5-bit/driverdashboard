function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    title: 'Zugriff verweigert',
    message: 'Sie haben keine Berechtigung für diese Aktion.'
  });
}

module.exports = { isAuthenticated, isAdmin };
