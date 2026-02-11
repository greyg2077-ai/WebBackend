// Authentication middleware

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }

    // Check if this is an API request
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login.'
        });
    }

    // Redirect to login for page requests
    return res.redirect('/login');
}

module.exports = { isAuthenticated };
