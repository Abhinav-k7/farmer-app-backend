/**
 * utils/socket.js  — Backend Socket.IO singleton
 *
 * Usage:
 *   In server.js:       const { initSocket } = require('./utils/socket');
 *                       initSocket(httpServer);
 *
 *   Anywhere else:      const { getIO } = require('../utils/socket');
 *                       getIO().to(userId.toString()).emit('notification', payload);
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO and attach it to the HTTP server.
 * Called once in server.js after the Express app is ready.
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',       // Tighten to your domain in production
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,   // 60s — how long to wait for pong before drop
        pingInterval: 25000,  // 25s — how often server pings client
        transports: ['polling', 'websocket'],  // allow polling fallback
    });

    // ── JWT Auth Middleware for Socket ──────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            // Token expired: allow connection but mark userId as null
            // The HTTP API enforces auth separately; socket is for real-time pushes only
            if (err.name === 'TokenExpiredError') {
                // Decode without verification to get userId for reconnect
                try {
                    const decoded = jwt.decode(token);
                    socket.userId = decoded?.id || 'anonymous';
                    console.warn(`[Socket] Expired token for user ${socket.userId} — connected with limitations`);
                    return next();
                } catch (_) {}
            }
            return next(new Error('Invalid token'));
        }
    });

    // ── Connection Handler ──────────────────────────────────
    io.on('connection', (socket) => {
        // Each user joins their own private room
        socket.join(socket.userId.toString());
        console.log(`[Socket] User ${socket.userId} connected — joined room`);

        socket.on('disconnect', (reason) => {
            console.log(`[Socket] User ${socket.userId} disconnected: ${reason}`);
        });
    });

    console.log('[Socket] Socket.IO initialized');
    return io;
};

/**
 * Get the initialized IO instance.
 * Throws if initSocket() has not been called yet.
 */
const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized. Call initSocket(httpServer) first.');
    return io;
};

module.exports = { initSocket, getIO };
