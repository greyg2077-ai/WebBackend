const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const COLLECTION = 'movies';

class Movie {
    static getCollection() {
        return getDb().collection(COLLECTION);
    }

    static async getAll() {
        return await this.getCollection().find({}).toArray();
    }

    static async getAllSorted(sortBy) {
        let sortOption = {};
        switch (sortBy) {
            case 'year_desc':
                sortOption = { releaseDate: -1 };
                break;
            case 'year_asc':
                sortOption = { releaseDate: 1 };
                break;
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'duration':
                sortOption = { duration: -1 };
                break;
            case 'genre':
                sortOption = { genre: 1 };
                break;
            default:
                sortOption = {};
        }
        return await this.getCollection().find({}).sort(sortOption).toArray();
    }

    static async getAllPaginated(page = 1, limit = 10, sortBy = '') {
        const skip = (page - 1) * limit;
        let sortOption = {};
        switch (sortBy) {
            case 'year_desc':
                sortOption = { releaseDate: -1 };
                break;
            case 'year_asc':
                sortOption = { releaseDate: 1 };
                break;
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'duration':
                sortOption = { duration: -1 };
                break;
            case 'genre':
                sortOption = { genre: 1 };
                break;
            default:
                sortOption = {};
        }
        return await this.getCollection()
            .find({})
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    static async count() {
        return await this.getCollection().countDocuments();
    }

    static async search(query) {
        return await this.getCollection().find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { genre: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).toArray();
    }

    static async findById(id) {
        return await this.getCollection().findOne({ _id: new ObjectId(id) });
    }

    static async create(data) {
        return await this.getCollection().insertOne({
            title: data.title,
            genre: data.genre,
            duration: data.duration ? parseInt(data.duration) : null,
            releaseDate: data.releaseDate || null,
            rating: data.rating ? parseFloat(data.rating) : null,
            description: data.description || '',
            createdAt: new Date()
        });
    }

    static async update(id, data) {
        const updateData = {};
        if (data.title) updateData.title = data.title;
        if (data.genre) updateData.genre = data.genre;
        if (data.duration !== undefined) updateData.duration = parseInt(data.duration);
        if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;
        if (data.rating !== undefined) updateData.rating = parseFloat(data.rating);
        if (data.description !== undefined) updateData.description = data.description;
        updateData.updatedAt = new Date();

        return await this.getCollection().updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    static async delete(id) {
        return await this.getCollection().deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = Movie;
