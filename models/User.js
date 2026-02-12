const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { getDb } = require('../config/db');

const COLLECTION = 'users';

class User {
    static getCollection() {
        return getDb().collection(COLLECTION);
    }

    static async findByUsername(username) {
        return await this.getCollection().findOne({
            username: username.trim().toLowerCase()
        });
    }

    static async findById(id) {
        return await this.getCollection().findOne({
            _id: new ObjectId(id)
        });
    }

    static async create(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await this.getCollection().insertOne({
            username: username.trim().toLowerCase(),
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        });
        return result;
    }

    static async deleteById(userId) {
        return await this.getCollection().deleteOne({
            _id: new ObjectId(userId)
        });
    }
}

module.exports = User;
