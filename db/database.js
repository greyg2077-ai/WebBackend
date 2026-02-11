const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

// MongoDB for everything
const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'cinema';
const SEATS_COLLECTION = 'seats';
const MOVIES_COLLECTION = 'movies';
const USERS_COLLECTION = 'users';

let mongoClient = null;
let mongoDb = null;

// Initialize MongoDB
async function initializeDatabase() {
  try {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGO_DB_NAME);

    console.log('Connected to MongoDB at:', MONGO_URL);

    console.log('Connected to MongoDB at:', MONGO_URL);

    // Collections are already initialized in the database
    // Removed automatic initialization to prevent overwriting/duplication

    return mongoDb;
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

// Data initialization functions removed as per user request
// The database is expected to be pre-populated

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

// Get movies with sorting
async function getAllMoviesSorted(sortBy) {
  try {
    const collection = mongoDb.collection(MOVIES_COLLECTION);
    let sortOption = {};

    switch (sortBy) {
      case 'year_desc':
        sortOption = { releaseDate: -1 }; // Newest first
        break;
      case 'year_asc':
        sortOption = { releaseDate: 1 }; // Oldest first
        break;
      case 'rating':
        sortOption = { rating: -1 }; // High to low
        break;
      case 'duration':
        sortOption = { duration: -1 }; // Longest first
        break;
      case 'genre':
        sortOption = { genre: 1 }; // Alphabetical
        break;
      default:
        sortOption = {}; // No sorting
    }

    return await collection.find({}).sort(sortOption).toArray();
  } catch (err) {
    throw err;
  }
}

// Save contact message
async function saveContactMessage(contactData) {
  try {
    const collection = mongoDb.collection('contacts');
    const result = await collection.insertOne({
      ...contactData,
      createdAt: new Date()
    });
    return result;
  } catch (err) {
    throw err;
  }
}

// Delete user by ID
async function deleteUser(userId) {
  try {
    const collection = mongoDb.collection(USERS_COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });
    return result;
  } catch (err) {
    throw err;
  }
}

// ===== USER OPERATIONS =====

// Create a new user with hashed password
async function createUser(username, password) {
  try {
    const collection = mongoDb.collection(USERS_COLLECTION);

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await collection.insertOne({
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    });

    return result;
  } catch (err) {
    throw err;
  }
}

// Find user by username
async function findUserByUsername(username) {
  try {
    const collection = mongoDb.collection(USERS_COLLECTION);
    return await collection.findOne({
      username: username.trim().toLowerCase()
    });
  } catch (err) {
    throw err;
  }
}

// Get MongoDB client for session store
function getMongoClient() {
  return mongoClient;
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
  getAllMoviesSorted,
  searchMovies,
  createUser,
  findUserByUsername,
  findUserByUsername,
  saveContactMessage,
  deleteUser,
  getMongoClient
};
