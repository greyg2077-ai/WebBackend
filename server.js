require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { 
  initializeDatabase, 
  closeDatabase,
  getAllMovies,
  searchMovies,
  getAllRooms
} = require('./db/database');
const seatsRoutes = require('./routes/seats');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// PAGE ROUTES

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/movies', async (req, res) => {
  try {
    const movies = await getAllMovies();
    res.render('item', { movies });
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.render('item', { movies: [] });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).send('All fields are required.');
  }
  const contactData = { name, email, message, timestamp: new Date().toISOString() };
  fs.writeFile('contacts.json', JSON.stringify(contactData, null, 2), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving data.');
    }
    res.send(`<h2>Thanks, ${name}! Your message has been received.</h2>`);
  });
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
        'POST /api/seats/:roomId/book': 'Book a ticket (provide seatNumber and customerName)',
        'PUT /api/seats/:roomId/seats/:seatNumber': 'Update booking (modify customer name)',
        'DELETE /api/seats/:roomId/cancel': 'Cancel booking by customer name'
      }
    },
    testLinks: {
      'Get all rooms': '/api/seats',
      'Get room1': '/api/seats/room1',
      'Get room2': '/api/seats/room2',
      'Get room3': '/api/seats/room3',
      'Get room4': '/api/seats/room4',
      'Get room5': '/api/seats/room5'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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