const Contact = require('../models/Contact');

// GET /contact
exports.showContactPage = (req, res) => {
    res.render('contact');
};

// POST /contact
exports.submitContact = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('All fields are required.');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Please enter a valid email address.');
    }

    try {
        await Contact.save({ name: name.trim(), email: email.trim(), message: message.trim() });
        res.send(`<h2>Thanks, ${name}! Your message has been received.</h2>`);
    } catch (err) {
        console.error('Error saving contact message:', err);
        res.status(500).send('Error saving data.');
    }
};
