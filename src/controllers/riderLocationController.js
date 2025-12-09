import LocationLog from '../Models/LocationLog.js';
import Rider from '../Models/Rider.js';
import { body, validationResult } from 'express-validator';

// Update rider location
export const updateLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, speed, heading, accuracy } = req.body;
    const riderId = req.rider._id;

    // Create location log
    const locationLog = new LocationLog({
      riderId,
      lat,
      lng,
      speed: speed || 0,
      heading,
      accuracy
    });

    await locationLog.save();

    // Update rider's current location
    await Rider.findByIdAndUpdate(riderId, {
      currentLocation: {
        lat,
        lng,
        lastUpdated: new Date()
      }
    });

    // Emit location update via socket.io (if connected)
    if (req.io) {
      req.io.to('admin-room').emit('rider-location-update', {
        riderId: riderId.toString(),
        location: { lat, lng, speed, heading },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get rider location history
export const getLocationHistory = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const { limit = 50 } = req.query;

    const locations = await LocationLog.find({ riderId })
      .sort({ ts: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    res.json(locations);
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all active riders' locations (for admin)
export const getAllRidersLocations = async (req, res) => {
  try {
    const riders = await Rider.find({ isActive: true })
      .select('name riderId vehicleType currentLocation')
      .populate('currentLocation');

    const locations = riders
      .filter(rider => rider.currentLocation)
      .map(rider => ({
        riderId: rider._id,
        name: rider.name,
        riderIdCode: rider.riderId,
        vehicleType: rider.vehicleType,
        location: rider.currentLocation
      }));

    res.json(locations);
  } catch (error) {
    console.error('Get all riders locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validation
export const validateLocationUpdate = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('Invalid speed'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Invalid heading'),
  body('accuracy').optional().isFloat({ min: 0 }).withMessage('Invalid accuracy')
];