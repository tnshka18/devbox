require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const packageRoutes = require('./routes/packages');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/packages', packageRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.IO for real-time collaboration / live reload signals
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on('file-change', ({ projectId, fileId, content }) => {
    // Broadcast to other clients in the same project
    socket.to(`project:${projectId}`).emit('file-updated', { fileId, content });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devbox';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('Starting server without DB (demo mode)...');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (no DB)`));
  });

module.exports = { app, io };
