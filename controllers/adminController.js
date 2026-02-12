const Movie = require('../models/Movie');

// GET /admin/dashboard
exports.dashboard = async (req, res) => {
    try {
        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: null, success: null });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.render('admin/dashboard', { movies: [], error: 'Failed to load movies', success: null });
    }
};

// POST /admin/movies
exports.createMovie = async (req, res) => {
    try {
        const { title, genre, duration, releaseDate, rating, description } = req.body;

        if (!title || !genre) {
            const movies = await Movie.getAll();
            return res.render('admin/dashboard', {
                movies,
                error: 'Title and Genre are required',
                success: null
            });
        }

        if (rating && (parseFloat(rating) < 0 || parseFloat(rating) > 10)) {
            const movies = await Movie.getAll();
            return res.render('admin/dashboard', {
                movies,
                error: 'Rating must be between 0 and 10',
                success: null
            });
        }

        await Movie.create({ title, genre, duration, releaseDate, rating, description });

        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: null, success: 'Movie added successfully!' });
    } catch (err) {
        console.error('Error creating movie:', err);
        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: 'Failed to add movie', success: null });
    }
};

// POST /admin/movies/:id/update
exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, genre, duration, releaseDate, rating, description } = req.body;

        if (!title || !genre) {
            const movies = await Movie.getAll();
            return res.render('admin/dashboard', {
                movies,
                error: 'Title and Genre are required',
                success: null
            });
        }

        await Movie.update(id, { title, genre, duration, releaseDate, rating, description });

        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: null, success: 'Movie updated successfully!' });
    } catch (err) {
        console.error('Error updating movie:', err);
        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: 'Failed to update movie', success: null });
    }
};

// POST /admin/movies/:id/delete
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        await Movie.delete(id);

        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: null, success: 'Movie deleted successfully!' });
    } catch (err) {
        console.error('Error deleting movie:', err);
        const movies = await Movie.getAll();
        res.render('admin/dashboard', { movies, error: 'Failed to delete movie', success: null });
    }
};
