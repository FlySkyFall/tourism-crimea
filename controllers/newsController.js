exports.getNewsPage = (req, res) => {
  try {
    res.render('news', {
      user: req.user || null,
    });
  } catch (error) {
    console.error('Ошибка загрузки страницы новостей:', error);
    res.status(500).render('error', { message: 'Ошибка загрузки страницы новостей' });
  }
};