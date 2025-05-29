const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travelController');

router.get('/', travelController.getTravelPage);
router.get('/place/:id', travelController.getPlacePage);

module.exports = router;