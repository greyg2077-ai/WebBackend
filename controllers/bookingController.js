const Booking = require('../models/Booking');

// GET /buy
exports.showBuyPage = async (req, res) => {
    try {
        const rooms = await Booking.getAllRooms();
        res.render('buy', { rooms });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.render('buy', { rooms: [] });
    }
};

// GET /api/seats
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Booking.getAllRooms();
        res.status(200).json({
            success: true,
            message: 'All rooms retrieved successfully',
            data: rooms
        });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

// GET /api/seats/:roomId
exports.getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId.match(/^room[1-5]$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID. Valid rooms are: room1, room2, room3, room4, room5'
            });
        }

        const room = await Booking.getRoomById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room retrieved successfully',
            data: room
        });
    } catch (err) {
        console.error('Error fetching room:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

// POST /api/seats/book
exports.bookSeat = async (req, res) => {
    try {
        const { roomId, seatNumber, ownerName } = req.body;
        const userId = req.session.user ? req.session.user.id : req.session.userId;

        // Validate input
        if (!roomId || seatNumber === undefined || !ownerName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: roomId, seatNumber, and ownerName'
            });
        }

        if (!roomId.match(/^room[1-5]$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID. Valid rooms are: room1-room5'
            });
        }

        const seatNum = parseInt(seatNumber);
        if (isNaN(seatNum) || seatNum < 1 || seatNum > 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seat number. Must be between 1 and 10'
            });
        }

        if (typeof ownerName !== 'string' || ownerName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner name'
            });
        }

        // Check seat availability
        const room = await Booking.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const seat = room.seats.find(s => s.seatNumber === seatNum);
        if (!seat) {
            return res.status(404).json({
                success: false,
                message: 'Seat not found'
            });
        }

        if (!seat.isAvailable) {
            return res.status(400).json({
                success: false,
                message: `Seat ${seatNumber} is already booked by ${seat.ownerName}`
            });
        }

        // Book the seat with userId for data ownership
        const result = await Booking.bookSeat(roomId, seatNum, ownerName.trim(), userId);

        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to book seat'
            });
        }

        res.status(201).json({
            success: true,
            message: `Ticket booked successfully for ${ownerName.trim()} in seat ${seatNumber}`,
            data: {
                roomId,
                seatNumber: seatNum,
                ownerName: ownerName.trim()
            }
        });
    } catch (err) {
        console.error('Error booking seat:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

// POST /api/seats/manage-booking
exports.manageBooking = async (req, res) => {
    try {
        const { roomId, seatNumber, ownerName, newOwnerName, action } = req.body;

        if (!roomId || seatNumber === undefined || !ownerName || !action) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: roomId, seatNumber, ownerName, and action'
            });
        }

        if (!roomId.match(/^room[1-5]$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID. Valid rooms are: room1-room5'
            });
        }

        if (!['update', 'delete'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "update" or "delete"'
            });
        }

        const seatNum = parseInt(seatNumber);
        if (isNaN(seatNum) || seatNum < 1 || seatNum > 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seat number. Must be between 1 and 10'
            });
        }

        const room = await Booking.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const seat = room.seats.find(s => s.seatNumber === seatNum);
        if (!seat) {
            return res.status(404).json({
                success: false,
                message: 'Seat not found'
            });
        }

        if (seat.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Seat is not booked'
            });
        }

        if (seat.ownerName !== ownerName.trim()) {
            return res.status(403).json({
                success: false,
                message: 'Owner name does not match. You cannot modify this booking.'
            });
        }

        if (action === 'delete') {
            const result = await Booking.cancelSeat(roomId, seatNum);
            if (result.modifiedCount === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete booking'
                });
            }
            return res.status(200).json({
                success: true,
                message: `Booking deleted successfully. Seat ${seatNumber} is now available`,
                data: { roomId, seatNumber: seatNum, ownerName: ownerName.trim(), action: 'delete' }
            });
        }

        if (action === 'update') {
            if (!newOwnerName || typeof newOwnerName !== 'string' || newOwnerName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid new owner name'
                });
            }

            const result = await Booking.updateSeat(roomId, seatNum, newOwnerName.trim());
            if (result.modifiedCount === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update booking'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Booking updated successfully',
                data: {
                    roomId,
                    seatNumber: seatNum,
                    oldOwnerName: ownerName.trim(),
                    newOwnerName: newOwnerName.trim(),
                    action: 'update'
                }
            });
        }
    } catch (err) {
        console.error('Error managing booking:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

// GET /my-bookings
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : req.session.userId;
        const bookings = await Booking.getUserBookings(userId);
        res.render('my-bookings', { bookings });
    } catch (err) {
        console.error('Error fetching user bookings:', err);
        res.render('my-bookings', { bookings: [] });
    }
};

// POST /my-bookings/cancel
exports.cancelMyBooking = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : req.session.userId;
        const { roomId, seatNumber } = req.body;

        if (!roomId || seatNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: roomId and seatNumber'
            });
        }

        const seatNum = parseInt(seatNumber);
        if (isNaN(seatNum) || seatNum < 1 || seatNum > 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seat number'
            });
        }

        // Verify the booking belongs to this user
        const room = await Booking.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const seat = room.seats.find(s => s.seatNumber === seatNum);
        if (!seat || seat.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Seat is not booked'
            });
        }

        if (!seat.userId || seat.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own bookings'
            });
        }

        const result = await Booking.cancelSeat(roomId, seatNum);
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel booking'
            });
        }

        res.redirect('/my-bookings');
    } catch (err) {
        console.error('Error cancelling booking:', err);
        res.status(500).send('Error cancelling booking');
    }
};
