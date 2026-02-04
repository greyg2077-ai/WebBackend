const { MongoClient } = require('mongodb');
const path = require('path');

// MongoDB for everything
const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'cinema';
const SEATS_COLLECTION = 'seats';
const MOVIES_COLLECTION = 'movies';

let mongoClient = null;
let mongoDb = null;

// Initialize MongoDB
async function initializeDatabase() {
  try {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGO_DB_NAME);
    
    console.log('Connected to MongoDB at:', MONGO_URL);
    
    // Initialize collections
    await initializeSeatsCollection();
    await initializeMoviesCollection();
    
    return mongoDb;
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

// Initialize seats collection with 5 rooms and 10 seats each
async function initializeSeatsCollection() {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    const existingCount = await collection.countDocuments();
    
    if (existingCount === 0) {
      // Create 5 rooms with 10 seats each
      const rooms = [];
      for (let room = 1; room <= 5; room++) {
        const seats = [];
        for (let seatNum = 1; seatNum <= 10; seatNum++) {
          seats.push({
            seatNumber: seatNum,
            isAvailable: true,
            ownerName: ''
          });
        }
        
        rooms.push({
          roomId: `room${room}`,
          roomNumber: room,
          totalSeats: 10,
          seats: seats,
          createdAt: new Date()
        });
      }
      
      await collection.insertMany(rooms);
      console.log('✓ Initialized 5 cinema rooms with 10 seats each');
    } else {
      console.log('✓ Seats collection already exists');
    }
  } catch (err) {
    console.error('Error initializing seats collection:', err);
    throw err;
  }
}

// Initialize movies collection
async function initializeMoviesCollection() {
  try {
    const collection = mongoDb.collection(MOVIES_COLLECTION);
    const existingCount = await collection.countDocuments();
    
    if (existingCount === 0) {
      // Sample movies
      const sampleMovies = [
        {
          title: 'The Shawshank Redemption',
          genre: 'Drama',
          description: 'Two imprisoned men bond over a number of years...',
          duration: 142,
          releaseDate: '1994-09-23',
          rating: 9.3
        },
        {
          title: 'The Dark Knight',
          genre: 'Action',
          description: 'Batman faces a new criminal mastermind...',
          duration: 152,
          releaseDate: '2008-07-18',
          rating: 9.0
        },
        {
          title: 'Inception',
          genre: 'Sci-Fi',
          description: 'A thief who steals corporate secrets...',
          duration: 148,
          releaseDate: '2010-07-16',
          rating: 8.8
        },
        {
          title: 'Pulp Fiction',
          genre: 'Crime',
          description: 'The lives of two mob hitmen, a boxer, a gangster...',
          duration: 154,
          releaseDate: '1994-10-14',
          rating: 8.9
        },
        {
          title: 'Forrest Gump',
          genre: 'Drama',
          description: 'The presidencies of Kennedy and Johnson unfold...',
          duration: 142,
          releaseDate: '1994-07-06',
          rating: 8.8
        }
      ];
      
      await collection.insertMany(sampleMovies);
      console.log('✓ Initialized 5 sample movies');
    } else {
      console.log('✓ Movies collection already exists');
    }
  } catch (err) {
    console.error('Error initializing movies collection:', err);
    throw err;
  }
}

// Close database
async function closeDatabase() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
  } catch (err) {
    console.error('Error closing database:', err);
    throw err;
  }
}

// ===== SEATS OPERATIONS =====

async function getAllRooms() {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    return await collection.find({}).toArray();
  } catch (err) {
    throw err;
  }
}

async function getRoomById(roomId) {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    return await collection.findOne({ roomId: roomId });
  } catch (err) {
    throw err;
  }
}

async function bookSeat(roomId, seatNumber, ownerName) {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    const result = await collection.updateOne(
      { roomId: roomId, 'seats.seatNumber': seatNumber },
      {
        $set: {
          'seats.$.isAvailable': false,
          'seats.$.ownerName': ownerName
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
}

async function updateSeat(roomId, seatNumber, newOwnerName) {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    const result = await collection.updateOne(
      { roomId: roomId, 'seats.seatNumber': seatNumber },
      {
        $set: {
          'seats.$.ownerName': newOwnerName
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
}

async function deleteSeat(roomId, seatNumber) {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    const result = await collection.updateOne(
      { roomId: roomId, 'seats.seatNumber': seatNumber },
      {
        $set: {
          'seats.$.isAvailable': true,
          'seats.$.ownerName': ''
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
}

async function deleteTicketByName(roomId, name) {
  try {
    const collection = mongoDb.collection(SEATS_COLLECTION);
    const result = await collection.updateOne(
      { roomId: roomId },
      {
        $set: {
          'seats.$[elem].isAvailable': true,
          'seats.$[elem].ownerName': ''
        }
      },
      {
        arrayFilters: [{ 'elem.ownerName': name }]
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
}

// ===== MOVIES OPERATIONS =====

async function getAllMovies() {
  try {
    const collection = mongoDb.collection(MOVIES_COLLECTION);
    return await collection.find({}).toArray();
  } catch (err) {
    throw err;
  }
}

async function searchMovies(query) {
  try {
    const collection = mongoDb.collection(MOVIES_COLLECTION);
    return await collection.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getAllRooms,
  getRoomById,
  bookSeat,
  updateSeat,
  deleteSeat,
  deleteTicketByName,
  getAllMovies,
  searchMovies
};
