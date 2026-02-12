const { getDb } = require('../config/db');

const COLLECTION = 'seats';

class Booking {
    static getCollection() {
        return getDb().collection(COLLECTION);
    }

    static async getAllRooms() {
        return await this.getCollection().find({}).toArray();
    }

    static async getRoomById(roomId) {
        return await this.getCollection().findOne({ roomId: roomId });
    }

    static async bookSeat(roomId, seatNumber, ownerName, userId) {
        return await this.getCollection().updateOne(
            { roomId: roomId, 'seats.seatNumber': seatNumber },
            {
                $set: {
                    'seats.$.isAvailable': false,
                    'seats.$.ownerName': ownerName,
                    'seats.$.userId': userId
                }
            }
        );
    }

    static async updateSeat(roomId, seatNumber, newOwnerName) {
        return await this.getCollection().updateOne(
            { roomId: roomId, 'seats.seatNumber': seatNumber },
            {
                $set: {
                    'seats.$.ownerName': newOwnerName
                }
            }
        );
    }

    static async cancelSeat(roomId, seatNumber) {
        return await this.getCollection().updateOne(
            { roomId: roomId, 'seats.seatNumber': seatNumber },
            {
                $set: {
                    'seats.$.isAvailable': true,
                    'seats.$.ownerName': '',
                    'seats.$.userId': null
                }
            }
        );
    }

    static async getUserBookings(userId) {
        // Aggregation to find all seats booked by this user across all rooms
        const rooms = await this.getCollection().find({
            'seats.userId': userId
        }).toArray();

        const bookings = [];
        rooms.forEach(room => {
            room.seats.forEach(seat => {
                if (seat.userId && seat.userId.toString() === userId.toString()) {
                    bookings.push({
                        roomId: room.roomId,
                        roomNumber: room.roomNumber,
                        seatNumber: seat.seatNumber,
                        ownerName: seat.ownerName
                    });
                }
            });
        });
        return bookings;
    }

    static async cancelBookingByUser(roomId, seatNumber, userId) {
        // Atomic: only cancel if the userId matches
        return await this.getCollection().updateOne(
            {
                roomId: roomId,
                'seats.seatNumber': seatNumber,
                'seats.userId': userId
            },
            {
                $set: {
                    'seats.$.isAvailable': true,
                    'seats.$.ownerName': '',
                    'seats.$.userId': null
                }
            }
        );
    }
}

module.exports = Booking;
