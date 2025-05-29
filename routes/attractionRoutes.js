const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/AttractionController');

router.get('/', attractionController.getAttractions);
router.get('/:id', attractionController.getAttractionById);

module.exports = router;