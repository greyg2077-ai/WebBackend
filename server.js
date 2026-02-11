require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const {
  initializeDatabase,
  closeDatabase,
  getAllMovies,
  getAllMoviesSorted,
  searchMovies,
  getAllRooms,
  getMongoClient,
  findUserByUsername,
  createUser,
  saveContactMessage,
  deleteUser
} = require('./db/database');
const seatsRoutes = require('./routes/seats');
const { isAuthenticated } = require('./middleware/authMiddleware');
// const authRoutes = require('./routes/auth'); // Removed external route

const app = express();

// MongoDB URL - same database for everything
const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost:27017/cinema';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Session configuration - uses same cinema database
app.use(session({
  secret: process.env.SESSION_SECRET || 'cinema-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Make user available to all views
app.use((req, res, next) => {
  console.log('[DEBUG] Middleware: checking user session');
  res.locals.user = req.session && req.session.userId ? {
    id: req.session.userId,
    username: req.session.username
  } : null;
  console.log('[DEBUG] User:', res.locals.user ? res.locals.user.username : 'Guest');
  next();
});

// ================= AUTH ROUTES (INLINED) =================

// GET - Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null, success: null });
});

// GET - Register page
app.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { error: null });
});

// POST - Register user
app.post('/register', async (req, res) => {
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

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.render('register', { error: 'Username already taken' });
    }

    await createUser(username, password);
    res.render('login', { error: null, success: 'Registration successful! Please login.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { error: 'An error occurred. Please try again.' });
  }
});

// POST - Login user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.render('login', { error: 'All fields are required', success: null });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.render('login', { error: 'Invalid credentials', success: null });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid credentials', success: null });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'An error occurred. Please try again.', success: null });
  }
});

// GET - Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
});

// POST - Delete Account
app.post('/delete-account', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    await deleteUser(userId);

    // Destroy session after deletion
    req.session.destroy((err) => {
      if (err) console.error('Error destroying session after account deletion:', err);
      // Redirect to home.
      res.redirect('/');
    });

  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).send('Error deleting account');
  }
});

// =========================================================

// app.use('/', authRoutes); // Replaced by inline routes above

// PAGE ROUTES

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/movies', async (req, res) => {
  try {
    const sortBy = req.query.sort || '';
    const movies = sortBy ? await getAllMoviesSorted(sortBy) : await getAllMovies();
    res.render('item', { movies, currentSort: sortBy });
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.render('item', { movies: [], currentSort: '' });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const contactData = { name, email, message };
    await saveContactMessage(contactData);
    res.send(`<h2>Thanks, ${name}! Your message has been received.</h2>`);
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).send('Error saving data.');
  }
});

app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.render('search', { query: '', movies: [] });
  }
  try {
    const movies = await searchMovies(q);
    res.render('search', { query: q, movies });
  } catch (err) {
    console.error('Error searching movies:', err);
    res.render('search', { query: q, movies: [] });
  }
});

app.get('/buy', async (req, res) => {
  try {
    const rooms = await getAllRooms();
    res.render('buy', { rooms });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.render('buy', { rooms: [] });
  }
});

// API ROUTES - CINEMA SEATS CRUD

// Mount seats API routes
app.use('/api/seats', seatsRoutes);

// API search route
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.json([]);
    }
    const movies = await searchMovies(q);
    res.json(movies);
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({ error: err.message });
  }
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    project: 'Cinema Ticket Booking System',
    description: 'Backend API for cinema seat booking with MongoDB',
    version: '1.0.0',
    entity: 'Cinema Seats',
    database: 'MongoDB',
    routes: {
      pages: ['/', '/about', '/contact', '/search'],
      api: {
        'GET /api/seats': 'Get all rooms with seats',
        'GET /api/seats/:roomId': 'Get specific room (room1-room5)',
        'POST /api/seats/book': 'Book a ticket (PROTECTED)',
        'POST /api/seats/manage-booking': 'Manage booking (PROTECTED)'
      }
    }
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    statusCode: 404
  });
});

// 404 handler for page routes
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server after database is initialized
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('!!! NEW SERVER VERSION ACTIVE !!!');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  try {
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});