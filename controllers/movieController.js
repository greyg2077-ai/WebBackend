const Movie = require('../models/Movie');

// GET /movies - paginated movie list
exports.listMovies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sort || '';

        const movies = await Movie.getAllPaginated(page, limit, sortBy);
        const totalMovies = await Movie.count();
        const totalPages = Math.ceil(totalMovies / limit);

        res.render('item', {
            movies,
            currentSort: sortBy,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (err) {
        console.error('Error fetching movies:', err);
        res.render('item', {
            movies: [],
            currentSort: '',
            currentPage: 1,
            totalPages: 1,
            limit: 10
        });
    }
};

// GET /search
exports.searchMovies = async (req, res) => {
    const q = req.query.q;
    if (!q) {
        return res.render('search', { query: '', movies: [] });
    }
    try {
        const movies = await Movie.search(q);
        res.render('search', { query: q, movies });
    } catch (err) {
        console.error('Error searching movies:', err);
        res.render('search', { query: q, movies: [] });
    }
};

// GET /api/search
exports.apiSearchMovies = async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) {
            return res.json([]);
        }
        const movies = await Movie.search(q);
        res.json(movies);
    } catch (err) {
        console.error('Error searching:', err);
        res.status(500).json({ error: err.message });
    }
};
