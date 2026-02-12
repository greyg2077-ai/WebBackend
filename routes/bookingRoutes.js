const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Page routes
router.get('/buy', bookingController.showBuyPage);
router.get('/my-bookings', isAuthenticated, bookingController.getMyBookings);
router.post('/my-bookings/cancel', isAuthenticated, bookingController.cancelMyBooking);

// API routes
router.get('/api/seats', bookingController.getAllRooms);
router.get('/api/seats/:roomId', bookingController.getRoomById);
router.post('/api/seats/book', isAuthenticated, bookingController.bookSeat);
router.post('/api/seats/manage-booking', isAuthenticated, bookingController.manageBooking);

module.exports = router;
