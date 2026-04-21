const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDefaultPrices } = require('./services/priceService');
const { initSocket } = require('./utils/socket');

// Load environment variables
dotenv.config();

// Connect to database then seed govt price cache
connectDB().then(() => {
    seedDefaultPrices(); // Idempotent — skips if already seeded
}).catch(() => {}); // connectDB handles its own errors

// Import Express application
const app = require('./app');

// ── Wrap Express with http.Server so Socket.IO can attach ──
const httpServer = http.createServer(app);

// ── Initialize Socket.IO (must run before listen) ──────────
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    httpServer.close(() => {
        process.exit(1);
    });
});
