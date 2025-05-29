const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const Attraction = require('../models/Attraction');

router.get('/', regionController.getRegions);

router.get('/:id', async (req, res, next) => {
  try {
    const region = await regionController.getRegionById(req);
    // Запрос достопримечательностей в радиусе 5 км от центра региона
    const attractions = await Attraction.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [region.region.coordinates.lng, region.region.coordinates.lat]
          },
          distanceField: 'distance',
          maxDistance: 5000, // 5 км в метрах
          spherical: true,
          query: { 'location.region': region.region.name }
        }
      },
      { $limit: 50 } // Ограничение для оптимизации
    ]).exec();
    console.log('Attractions fetched within 5km:', attractions.map(a => ({ name: a.name, distance: a.distance })));
    res.render('regions/region', {
      region: region.region,
      tours: region.tours,
      attractions,
      currentPage: region.currentPage,
      totalPages: region.totalPages,
      totalTours: region.totalTours,
      toursOnPage: region.toursOnPage,
      currentType: region.currentType,
      error: region.error,
      user: req.user || null,
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
  } catch (error) {
    console.error('Error in /regions/:id:', error);
    next(error);
  }
});

router.get('/:id/filter', regionController.filterRegionTours);

module.exports = router;