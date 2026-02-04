# Cinema Booking System

## Description

A full-stack cinema booking application built with Node.js, Express, and MongoDB. This application allows users to browse movies, view available seats, and make seat bookings. The system includes a modern web interface with dynamic seat selection and booking management.

## Features

- **Movie Browsing**: View all available movies with detailed information
- **Seat Selection**: Interactive seat selection interface for booking
- **Room Management**: Support for multiple cinema rooms
- **Search Functionality**: Search movies by title
- **Responsive Design**: Mobile-friendly user interface
- **MongoDB Integration**: Persistent data storage for movies, seats, and bookings

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB instance (local or cloud-based)

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd express-post-form
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env` file (see Environment Variables section below)

5. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port specified in your `.env` file)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017
```

### Variable Descriptions

- **PORT**: The port number where the server will run (default: 3000). The hosting platform automatically assigns a port at runtime.
- **MONGO_URI**: MongoDB connection string. Use `mongodb://localhost:27017` for local development, or your cloud MongoDB URL (e.g., MongoDB Atlas) for production.

### Example for Production (MongoDB Atlas)

```
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cinema?retryWrites=true&w=majority
```

## Project Structure

```
├── server.js              # Main Express server file
├── package.json           # Project dependencies
├── .env                   # Environment variables (not tracked by git)
├── .gitignore            # Git ignore rules
├── contacts.json         # Sample data
├── db/
│   └── database.js       # MongoDB connection and queries
├── routes/
│   └── seats.js          # Seat booking routes
├── views/                # EJS templates
│   ├── home.ejs
│   ├── about.ejs
│   ├── item.ejs
│   ├── buy.ejs
│   ├── contact.ejs
│   ├── search.ejs
│   └── 404.ejs
└── public/
    └── style.css         # Styling
```

## Available Scripts

- `npm start` - Start the server
- `npm install` - Install dependencies
- `npm audit fix` - Fix security vulnerabilities

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Template Engine**: EJS
- **Frontend**: HTML, CSS, JavaScript
- **Environment Management**: dotenv

## Security

- Never commit `.env` file to version control (already configured in `.gitignore`)
- Use strong passwords for MongoDB connections
- Validate and sanitize all user inputs
- Keep dependencies updated with `npm audit fix`

## Deployment

This application is ready for cloud deployment on platforms like:
- Heroku
- Railway
- Render
- Vercel (with serverless functions)
- Azure App Service

The application reads the `PORT` environment variable at runtime, allowing hosting platforms to automatically assign the correct port.

## Deployed URL

[Your deployed application URL will appear here]

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGO_URI` is correct in `.env`
- Check MongoDB server is running (for local development)
- Ensure network access is allowed (for cloud databases)

### Port Already in Use
- Change the `PORT` value in `.env` to an available port
- Or use: `PORT=5000 npm start`

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed
- Clear npm cache: `npm cache clean --force`

## License

This project is open source and available under the MIT License.

## Contact & Support

For issues or questions, please refer to the project documentation or contact the development team.
