// Authentication & Authorization middleware

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && (req.session.user || req.session.userId)) {
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

// Check if user has admin role
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }

    if (req.originalUrl.startsWith('/api')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    return res.status(403).render('404');
}

// Check if user owns the resource (used for booking cancellation)
function isOwner(req, res, next) {
    // This is handled at the controller level since we need to check
    // the actual resource ownership in the database
    return next();
}

module.exports = { isAuthenticated, isAdmin, isOwner };
