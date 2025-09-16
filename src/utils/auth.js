function isApiRequest(req) {
  const accept = req.headers.accept || '';
  return req.xhr || req.originalUrl.startsWith('/api/') || accept.includes('application/json');
}

function requireAuth(req, res, next) {
  const user = req.session && req.session.user;
  if (user && user.id) return next();

  if (isApiRequest(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.flash) req.flash('error', 'Please log in first');
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  const user = req.session && req.session.user;
  if (user && user.role === 'ADMIN') return next();

  if (isApiRequest(req)) {
    return res.status(403).json({ error: 'Admins only' });
  }
  if (req.flash) req.flash('error', 'Admins only');
  return res.redirect('/properties');
}

module.exports = {
  requireAuth,
  requireAdmin,
};
