const Tour = require('../models/Tour');
const Region = require('../models/Region');

exports.getHomePage = async (req, res) => {
  try {
    const { type, page: pageStr } = req.query;
    const page = parseInt(pageStr) || 1;
    const limit = 3; // Лимит 3 тура на страницу
    const skip = (page - 1) * limit;
    const tourQuery = type ? { isFeatured: true, type } : { isFeatured: true };
    const totalTours = await Tour.countDocuments(tourQuery);
    const totalPages = Math.ceil(totalTours / limit);
    const featuredTours = await Tour.find(tourQuery).skip(skip).limit(limit).lean();
    const regions = await Region.find().limit(6).lean();

    // Редирект на последнюю страницу, если page > totalPages
    if (page > totalPages && totalPages > 0) {
      const redirectParams = new URLSearchParams();
      redirectParams.append('page', totalPages);
      if (type && type !== 'all') redirectParams.append('type', type);
      return res.redirect(`/?${redirectParams.toString()}`);
    }

    res.render('index', {
      featuredTours,
      regions,
      user: req.user || null,
      currentType: type || 'all',
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: featuredTours.length
    });
  } catch (error) {
    console.error('Ошибка загрузки главной страницы:', error);
    res.status(500).render('error', { message: 'Ошибка загрузки главной страницы' });
  }
};

exports.filterTours = async (req, res) => {
  try {
    const { type, page: pageStr } = req.query;
    const page = parseInt(pageStr) || 1;
    const limit = 3; // Лимит 3 тура на страницу
    const skip = (page - 1) * limit;
    const query = type ? { isFeatured: true, type } : { isFeatured: true };
    const tours = await Tour.find(query).skip(skip).limit(limit).lean();
    const totalTours = await Tour.countDocuments(query);
    const totalPages = Math.ceil(totalTours / limit);

    console.log(`Фильтрация туров: type=${type || 'all'}, page=${page}, найдено=${tours.length}`);

    res.json({
      tours,
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: tours.length
    });
  } catch (error) {
    console.error('Ошибка фильтрации туров:', error);
    res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
  }
};