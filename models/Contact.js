const { getDb } = require('../config/db');

const COLLECTION = 'contacts';

class Contact {
    static getCollection() {
        return getDb().collection(COLLECTION);
    }

    static async save(contactData) {
        return await this.getCollection().insertOne({
            ...contactData,
            createdAt: new Date()
        });
    }
}

module.exports = Contact;
