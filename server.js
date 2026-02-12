require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');
const { connectDB, closeDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const MONGO_URL = process.env.MONGO_URI;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files & body parsers
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'cinema-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    dbName: 'cinema',
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Make user available to all views
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  } else if (req.session && req.session.userId) {
    // Backward compatibility with old session format
    res.locals.user = {
      id: req.session.userId,
      username: req.session.username,
      role: 'user'
    };
  } else {
    res.locals.user = null;
  }
  next();
});

// ===== MOUNT ROUTES =====

// Page routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.use('/', authRoutes);
app.use('/', movieRoutes);
app.use('/', bookingRoutes);
app.use('/', contactRoutes);
app.use('/admin', adminRoutes);

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    project: 'Cinema Ticket Booking System',
    description: 'Backend API for cinema seat booking with MongoDB',
    version: '2.0.0',
    entity: 'Cinema Seats',
    database: 'MongoDB',
    routes: {
      pages: ['/', '/about', '/contact', '/search', '/movies', '/buy', '/my-bookings', '/admin/dashboard'],
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

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
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
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});