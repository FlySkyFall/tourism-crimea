const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Требуется авторизация');
    return res.redirect('/auth/login');
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    req.flash('error', 'Доступ запрещён: требуется роль администратора или модератора');
    return res.redirect('/tours');
  }

  next();
};

module.exports = adminMiddleware;