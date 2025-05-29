module.exports = (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Требуется авторизация');
      return res.redirect('/auth/login');
    }
    next();
  };