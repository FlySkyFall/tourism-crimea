
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error', 'Доступ разрешён только администраторам');
    res.redirect('/auth/login');
  };
  
  module.exports = { ensureAdmin };