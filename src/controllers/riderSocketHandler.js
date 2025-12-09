import jwt from 'jsonwebtoken';
import Rider from '../Models/Rider.js';

// Rider socket authentication
const authenticateRiderSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rider = await Rider.findById(decoded.riderId).select('-passwordHash -otp');

    if (!rider) {
      return next(new Error("Authentication error: Rider not found"));
    }

    if (!rider.isActive) {
      return next(new Error("Authentication error: Rider account deactivated"));
    }

    socket.rider = rider;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};

// Handle rider connections for real-time features
export const handleRiderConnection = (io) => {
  // Create separate namespace for riders
  const riderIo = io.of('/rider');

  riderIo.use(authenticateRiderSocket);

  riderIo.on('connection', (socket) => {
    console.log(`Rider ${socket.rider.name} connected for real-time updates`);

    // Join rider-specific room
    socket.join(`rider_${socket.rider._id}`);

    // Handle location updates from rider app
    socket.on('location-update', (locationData) => {
      // Broadcast to admin room for monitoring
      io.to('admin-room').emit('rider-location-update', {
        riderId: socket.rider._id.toString(),
        riderName: socket.rider.name,
        location: locationData,
        timestamp: new Date()
      });
    });

    // Handle rider status updates
    socket.on('status-update', (statusData) => {
      io.to('admin-room').emit('rider-status-update', {
        riderId: socket.rider._id.toString(),
        riderName: socket.rider.name,
        status: statusData,
        timestamp: new Date()
      });
    });

    // Handle order status updates
    socket.on('order-update', (orderData) => {
      io.to('admin-room').emit('rider-order-update', {
        riderId: socket.rider._id.toString(),
        riderName: socket.rider.name,
        order: orderData,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`Rider ${socket.rider.name} disconnected from real-time updates`);
    });
  });
};

// Handle admin connections for monitoring
export const handleAdminConnection = (io) => {
  io.on('connection', (socket) => {
    // Check if admin
    if (socket.user && socket.user.role === 'admin') {
      socket.join('admin-room');
      console.log(`Admin ${socket.user.name} joined admin monitoring room`);
    }
  });
};