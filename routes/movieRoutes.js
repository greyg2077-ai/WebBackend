const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/movies', movieController.listMovies);
router.get('/search', movieController.searchMovies);
router.get('/api/search', movieController.apiSearchMovies);

module.exports = router;
