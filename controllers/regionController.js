const Region = require('../models/Region');
const Tour = require('../models/Tour');
const mongoose = require('mongoose');

exports.getRegions = async (req, res) => {
  try {
    const regions = await Region.find().lean();
    console.log('Regions fetched:', regions.map(r => r.name));
    res.render('regions/index', {
      regions,
      error: null,
    });
  } catch (error) {
    console.error('Ошибка в getRegions:', error);
    res.render('regions/index', {
      regions: [],
      error: 'Ошибка загрузки регионов',
    });
  }
};

exports.getRegionById = async (req) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error('Неверный идентификатор региона');
    }
    const region = await Region.findById(req.params.id).lean();
    if (!region) {
      throw new Error('Регион не найден');
    }

    const page = parseInt(req.query.page) || 1;
    const validTypes = ['all', 'active', 'excursion', 'camping', 'health', 'passive'];
    const type = validTypes.includes(req.query.type) ? req.query.type : 'all';
    const limit = 6;
    const skip = (page - 1) * limit;

    console.log('Query params:', { id: req.params.id, page, type });

    if (page < 1) {
      return {
        region,
        tours: [],
        currentPage: 1,
        totalPages: 1,
        totalTours: 0,
        currentType: type,
        error: 'Неверный номер страницы'
      };
    }

    const filter = { 'location.region': region.name };
    if (type !== 'all') {
      filter.type = type;
    }

    console.log('Tour filter:', filter);

    const tours = await Tour.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(filter);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Tours found:', tours.length, 'Total tours:', totalTours, 'Tours:', tours.map(t => t.title));

    if (page > totalPages && totalTours > 0) {
      return {
        region,
        tours: [],
        currentPage: page,
        totalPages,
        totalTours,
        currentType: type,
        error: 'Такой страницы не существует'
      };
    }

    return {
      region,
      tours,
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: tours.length,
      currentType: type,
      error: null
    };
  } catch (error) {
    console.error('Ошибка в getRegionById:', error);
    throw error;
  }
};

exports.filterRegionTours = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Неверный идентификатор региона' });
    }
    const region = await Region.findById(req.params.id).lean();
    if (!region) {
      return res.status(404).json({ error: 'Регион не найден' });
    }

    const page = parseInt(req.query.page) || 1;
    const validTypes = ['all', 'active', 'excursion', 'camping', 'health', 'passive'];
    const type = validTypes.includes(req.query.type) ? req.query.type : 'all';
    const limit = 6;
    const skip = (page - 1) * limit;

    console.log('Filter query params:', { id: req.params.id, page, type });

    if (page < 1) {
      return res.status(400).json({ error: 'Неверный номер страницы' });
    }

    const filter = { 'location.region': region.name };
    if (type !== 'all') {
      filter.type = type;
    }

    console.log('Filter tour filter:', filter);

    const tours = await Tour.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(filter);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Filter tours found:', tours.length, 'Total tours:', totalTours);

    res.json({
      tours,
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: tours.length,
      currentType: type,
    });
  } catch (error) {
    console.error('Ошибка в filterRegionTours:', error);
    res.status(500).json({ error: 'Ошибка загрузки туров' });
  }
};