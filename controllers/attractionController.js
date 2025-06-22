const Attraction = require('../models/Attraction');

exports.getAttractions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const region = req.query.region ? req.query.region.trim() : '';
    const category = req.query.category ? req.query.category.trim() : '';

    console.log('Raw Attraction filter params from req.query:', req.query); // Логирование всех параметров
    console.log('Cleaned Attraction filter params:', { page, search, region, category }); // Логирование очищенных данных

    const query = {};
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (region) {
      query['location.region'] = region;
    }
    if (category) {
      query.category = category;
    }

    const attractions = await Attraction.find(query)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalAttractions = await Attraction.countDocuments(query);
    const totalPages = Math.ceil(totalAttractions / limit);

    // Детальная отладка содержимого images
    attractions.forEach((attraction, index) => {
      console.log(`Attraction ${index + 1} - Name: ${attraction.name}, Images: ${JSON.stringify(attraction.images)}, Description: ${attraction.description || 'undefined'}`);
    });
    console.log('Attractions found:', attractions.length, 'Total:', totalAttractions);

    res.render('attractions/index', {
      attractions,
      currentPage: page,
      totalPages,
      totalAttractions,
      attractionsOnPage: attractions.length,
      currentSearch: search,
      currentRegion: region,
      currentCategory: category,
      error: attractions.length ? null : 'Нет достопримечательностей для выбранных фильтров',
    });
  } catch (error) {
    console.error('Ошибка в getAttractions:', error.message, error.stack);
    res.render('attractions/index', {
      attractions: [],
      currentPage: 1,
      totalPages: 1,
      totalAttractions: 0,
      currentSearch: '',
      currentRegion: '',
      currentCategory: '',
      error: `Ошибка загрузки достопримечательностей: ${error.message}`,
    });
  }
};

exports.getAttractionById = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id).lean();
    if (!attraction) {
      return res.status(404).render('error', { message: 'Достопримечательность не найдена' });
    }
    console.log(`Attraction ${attraction.name} - Images: ${JSON.stringify(attraction.images)}`);
    res.render('attractions/attraction', {
      attraction,
      user: req.user || null,
      error: null,
    });
  } catch (error) {
    console.error('Ошибка в getAttractionById:', error.message, error.stack);
    res.status(500).render('error', { message: 'Ошибка загрузки достопримечательности' });
  }
};