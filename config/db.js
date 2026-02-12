const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'cinema';

let mongoClient = null;
let mongoDb = null;

async function connectDB() {
    try {
        mongoClient = new MongoClient(MONGO_URL);
        await mongoClient.connect();
        mongoDb = mongoClient.db(MONGO_DB_NAME);
        console.log('Connected to MongoDB at:', MONGO_URL);
        return mongoDb;
    } catch (err) {
        console.error('Error connecting to database:', err);
        throw err;
    }
}

function getDb() {
    if (!mongoDb) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return mongoDb;
}

function getMongoClient() {
    return mongoClient;
}

async function closeDB() {
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

module.exports = { connectDB, getDb, getMongoClient, closeDB };
