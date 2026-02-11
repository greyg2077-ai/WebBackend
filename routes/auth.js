const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { createUser, findUserByUsername } = require('../db/database');

// GET - Login page
router.get('/login', (req, res) => {
    // If already logged in, redirect to home
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    res.render('login', { error: null, success: null });
});

// GET - Register page
router.get('/register', (req, res) => {
    // If already logged in, redirect to home
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    res.render('register', { error: null });
});

// POST - Register user
router.post('/register', async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;

        // Validate input
        if (!username || !password || !confirmPassword) {
            return res.render('register', {
                error: 'All fields are required'
            });
        }

        // Username validation
        if (username.length < 3) {
            return res.render('register', {
                error: 'Username must be at least 3 characters'
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.render('register', {
                error: 'Password must be at least 6 characters'
            });
        }

        // Confirm password match
        if (password !== confirmPassword) {
            return res.render('register', {
                error: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            return res.render('register', {
                error: 'Username already taken'
            });
        }

        // Create user (password is hashed in createUser function)
        await createUser(username, password);

        // Redirect to login with success message
        res.render('login', {
            error: null,
            success: 'Registration successful! Please login.'
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', {
            error: 'An error occurred. Please try again.'
        });
    }
});

// POST - Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.render('login', {
                error: 'All fields are required',
                success: null
            });
        }

        // Find user
        const user = await findUserByUsername(username);
        if (!user) {
            return res.render('login', {
                error: 'Invalid credentials',  // Generic message for security
                success: null
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', {
                error: 'Invalid credentials',  // Generic message for security
                success: null
            });
        }

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        // Redirect to home
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', {
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
});

// GET - Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
