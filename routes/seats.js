const express = require('express');
const router = express.Router();
const {
  getAllRooms,
  getRoomById,
  bookSeat,
  updateSeat,
  deleteSeat,
  deleteTicketByName
} = require('../db/database');
const { isAuthenticated } = require('../middleware/authMiddleware');

// GET all rooms with seats (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const rooms = await getAllRooms();
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
});

// GET single room by ID (PUBLIC)
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Validate roomId format
    if (!roomId.match(/^room[1-5]$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID. Valid rooms are: room1, room2, room3, room4, room5'
      });
    }

    const room = await getRoomById(roomId);

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
});

// POST - Book a ticket (PROTECTED - requires authentication)
router.post('/book', isAuthenticated, async (req, res) => {
  try {
    const { roomId, seatNumber, ownerName } = req.body;

    // Validate input
    if (!roomId || seatNumber === undefined || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: roomId, seatNumber, and ownerName'
      });
    }

    // Validate roomId
    if (!roomId.match(/^room[1-5]$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID. Valid rooms are: room1-room5'
      });
    }

    // Validate seat number
    const seatNum = parseInt(seatNumber);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat number. Must be between 1 and 10'
      });
    }

    // Validate owner name
    if (typeof ownerName !== 'string' || ownerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner name'
      });
    }

    // Check if room exists and seat is available
    const room = await getRoomById(roomId);
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

    // Book the seat
    const result = await bookSeat(roomId, seatNum, ownerName.trim());

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
});

// POST - Manage booking (PROTECTED - requires authentication)
router.post('/manage-booking', isAuthenticated, async (req, res) => {
  try {
    const { roomId, seatNumber, ownerName, newOwnerName, action } = req.body;

    // Validate input
    if (!roomId || seatNumber === undefined || !ownerName || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: roomId, seatNumber, ownerName, and action'
      });
    }

    // Validate roomId
    if (!roomId.match(/^room[1-5]$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID. Valid rooms are: room1-room5'
      });
    }

    // Validate action
    if (!['update', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "update" or "delete"'
      });
    }

    // Validate seat number
    const seatNum = parseInt(seatNumber);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat number. Must be between 1 and 10'
      });
    }

    // Check if room and seat exist
    const room = await getRoomById(roomId);
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

    // Check if seat is booked
    if (seat.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Seat is not booked'
      });
    }

    // Verify owner name matches
    if (seat.ownerName !== ownerName.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Owner name does not match. You cannot modify this booking.'
      });
    }

    // Handle action
    if (action === 'delete') {
      const result = await deleteSeat(roomId, seatNum);

      if (result.modifiedCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete booking'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Booking deleted successfully. Seat ${seatNumber} is now available`,
        data: {
          roomId,
          seatNumber: seatNum,
          ownerName: ownerName.trim(),
          action: 'delete'
        }
      });
    }

    if (action === 'update') {
      // Validate new owner name
      if (!newOwnerName || typeof newOwnerName !== 'string' || newOwnerName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid new owner name'
        });
      }

      const result = await updateSeat(roomId, seatNum, newOwnerName.trim());

      if (result.modifiedCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update booking'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Booking updated successfully`,
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
});

module.exports = router;
