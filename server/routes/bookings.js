const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new booking
router.post('/', auth, [
  body('hotelId').isMongoId().withMessage('Invalid hotel ID'),
  body('roomType').isIn(['Single', 'Double', 'Deluxe', 'Suite']).withMessage('Invalid room type'),
  body('numberOfRooms').isInt({ min: 1 }).withMessage('Number of rooms must be at least 1'),
  body('guests.adults').isInt({ min: 1 }).withMessage('At least 1 adult required'),
  body('guests.children').optional().isInt({ min: 0 }).withMessage('Invalid number of children'),
  body('checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').isISO8601().withMessage('Invalid check-out date'),
  body('guestDetails.primaryGuest.name').trim().notEmpty().withMessage('Primary guest name is required'),
  body('guestDetails.primaryGuest.email').isEmail().withMessage('Valid email is required'),
  body('guestDetails.primaryGuest.phone').isMobilePhone().withMessage('Valid phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      hotelId,
      roomType,
      numberOfRooms,
      guests,
      checkIn,
      checkOut,
      guestDetails
    } = req.body;

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate <= now) {
      return res.status(400).json({ message: 'Check-in date must be in the future' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Find hotel and check availability
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ message: 'Hotel not found or not available' });
    }

    const room = hotel.rooms.find(r => r.type === roomType);
    if (!room) {
      return res.status(404).json({ message: 'Room type not found' });
    }

    if (room.availableRooms < numberOfRooms) {
      return res.status(400).json({ 
        message: `Only ${room.availableRooms} rooms available for ${roomType}` 
      });
    }

    // Check guest capacity
    const totalGuests = guests.adults + (guests.children || 0);
    if (totalGuests > room.maxOccupancy * numberOfRooms) {
      return res.status(400).json({ 
        message: `Maximum occupancy exceeded. Max ${room.maxOccupancy} guests per room` 
      });
    }

    // Calculate pricing
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const roomPrice = room.price;
    const totalAmount = roomPrice * numberOfRooms * totalNights;
    const taxes = Math.round(totalAmount * 0.12); // 12% tax
    const finalAmount = totalAmount + taxes;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      hotel: hotelId,
      roomType,
      numberOfRooms,
      guests,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalNights,
      pricing: {
        roomPrice,
        totalAmount,
        taxes,
        finalAmount
      },
      guestDetails
    });

    await booking.save();

    // Update room availability
    await hotel.updateRoomAvailability(roomType, numberOfRooms, 'decrease');

    // Add booking to user's bookings
    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id }
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`hotel-${hotelId}`).emit('room-availability-changed', {
        hotelId,
        roomType,
        availableRooms: room.availableRooms - numberOfRooms,
        bookingId: booking._id
      });
    }

    // Populate booking details
    await booking.populate('hotel', 'name address images');
    await booking.populate('user', 'name email phone');

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
      paymentRequired: true
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error during booking creation' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('hotel', 'name address images rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel', 'name address images amenities rating checkInTime checkOutTime policies')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin/hotel owner
    if (booking.user._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      // Check if user is the hotel owner
      const hotel = await Hotel.findById(booking.hotel._id);
      if (!hotel || hotel.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long')
], async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Booking cannot be cancelled. Check cancellation policy.' 
      });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.paymentDetails.refundAmount = refundAmount;

    if (refundAmount > 0) {
      booking.paymentStatus = refundAmount === booking.pricing.finalAmount ? 'refunded' : 'partial-refund';
    }

    await booking.save();

    // Restore room availability
    const hotel = await Hotel.findById(booking.hotel);
    await hotel.updateRoomAvailability(booking.roomType, booking.numberOfRooms, 'increase');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const updatedRoom = hotel.rooms.find(r => r.type === booking.roomType);
      io.to(`hotel-${booking.hotel}`).emit('room-availability-changed', {
        hotelId: booking.hotel,
        roomType: booking.roomType,
        availableRooms: updatedRoom.availableRooms,
        bookingId: booking._id,
        action: 'cancelled'
      });
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking,
      refundAmount
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error during booking cancellation' });
  }
});

// Check-in
router.put('/:id/checkin', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is hotel owner or admin
    const hotel = await Hotel.findById(booking.hotel);
    if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed to check-in' });
    }

    const now = new Date();
    const checkInDate = new Date(booking.checkIn);

    // Allow check-in up to 1 day before and after scheduled date
    const oneDayBefore = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAfter = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);

    if (now < oneDayBefore || now > oneDayAfter) {
      return res.status(400).json({ message: 'Check-in not allowed at this time' });
    }

    booking.status = 'checked-in';
    booking.checkedInAt = now;
    await booking.save();

    res.json({
      message: 'Check-in successful',
      booking
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// Check-out
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is hotel owner or admin
    const hotel = await Hotel.findById(booking.hotel);
    if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'checked-in') {
      return res.status(400).json({ message: 'Guest must be checked-in to check-out' });
    }

    booking.status = 'checked-out';
    booking.checkedOutAt = new Date();
    await booking.save();

    res.json({
      message: 'Check-out successful',
      booking
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// Get hotel bookings (Hotel owner only)
router.get('/hotel/:hotelId', auth, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10, status, date } = req.query;

    // Verify hotel ownership
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { hotel: hotelId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
      query.$or = [
        { checkIn: { $gte: targetDate, $lt: nextDay } },
        { checkOut: { $gte: targetDate, $lt: nextDay } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get hotel bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;