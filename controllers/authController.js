const bcrypt = require('bcrypt');
const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null, success: null });
};

// GET /register
exports.getRegister = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { error: null });
};

// POST /register
exports.postRegister = async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;

        if (!username || !password || !confirmPassword) {
            return res.render('register', { error: 'All fields are required' });
        }
        if (username.length < 3) {
            return res.render('register', { error: 'Username must be at least 3 characters' });
        }
        if (password.length < 6) {
            return res.render('register', { error: 'Password must be at least 6 characters' });
        }
        if (password !== confirmPassword) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.render('register', { error: 'Username already taken' });
        }

        await User.create(username, password);
        res.render('login', { error: null, success: 'Registration successful! Please login.' });
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { error: 'An error occurred. Please try again.' });
    }
};

// POST /login
exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.render('login', { error: 'All fields are required', success: null });
        }

        const user = await User.findByUsername(username);
        if (!user) {
            return res.render('login', { error: 'Invalid credentials', success: null });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials', success: null });
        }

        // Store user info in session (including role for RBAC)
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role || 'user'
        };
        // Keep backward compat
        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred. Please try again.', success: null });
    }
};

// GET /logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
};

// POST /delete-account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : req.session.userId;

        if (!userId) {
            return res.status(401).send('Unauthorized');
        }

        await User.deleteById(userId);

        req.session.destroy((err) => {
            if (err) console.error('Error destroying session after account deletion:', err);
            res.redirect('/');
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).send('Error deleting account');
    }
};
