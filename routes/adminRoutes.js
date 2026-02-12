const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(isAuthenticated);
router.use(isAdmin);

router.get('/dashboard', adminController.dashboard);
router.post('/movies', adminController.createMovie);
router.post('/movies/:id/update', adminController.updateMovie);
router.post('/movies/:id/delete', adminController.deleteMovie);

module.exports = router;
