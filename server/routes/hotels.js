const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Hotel = require('../models/Hotel');
const { auth, hotelOwnerAuth } = require('../middleware/auth');

const router = express.Router();

// Search hotels
router.get('/search', [
  query('city').optional().trim(),
  query('checkIn').optional().isISO8601().withMessage('Invalid check-in date'),
  query('checkOut').optional().isISO8601().withMessage('Invalid check-out date'),
  query('guests').optional().isInt({ min: 1 }).withMessage('Guests must be at least 1'),
  query('rooms').optional().isInt({ min: 1 }).withMessage('Rooms must be at least 1'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Invalid minimum price'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Invalid maximum price'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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
      city,
      checkIn,
      checkOut,
      guests = 1,
      rooms = 1,
      minPrice,
      maxPrice,
      amenities,
      rating,
      page = 1,
      limit = 10,
      lat,
      lng,
      radius = 10
    } = req.query;

    // Build search query
    let searchQuery = { isActive: true };

    // Location-based search
    if (city) {
      searchQuery.$or = [
        { 'address.city': { $regex: city, $options: 'i' } },
        { 'address.state': { $regex: city, $options: 'i' } },
        { name: { $regex: city, $options: 'i' } }
      ];
    }

    // Geospatial search if coordinates provided
    if (lat && lng) {
      searchQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceQuery = {};
      if (minPrice) priceQuery.$gte = parseFloat(minPrice);
      if (maxPrice) priceQuery.$lte = parseFloat(maxPrice);
      searchQuery['rooms.price'] = priceQuery;
    }

    // Rating filter
    if (rating) {
      searchQuery['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Amenities filter
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      searchQuery.amenities = { $in: amenitiesArray };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const hotels = await Hotel.find(searchQuery)
      .select('-reviews') // Exclude reviews for performance
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email');

    // Filter hotels with available rooms for the dates
    let availableHotels = hotels;
    if (checkIn && checkOut) {
      // In a real application, you would check actual bookings
      // For now, we'll assume rooms are available if they have availableRooms > 0
      availableHotels = hotels.filter(hotel => 
        hotel.rooms.some(room => room.availableRooms >= parseInt(rooms))
      );
    }

    // Get total count for pagination
    const totalHotels = await Hotel.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalHotels / parseInt(limit));

    res.json({
      hotels: availableHotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalHotels,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      searchCriteria: {
        city,
        checkIn,
        checkOut,
        guests: parseInt(guests),
        rooms: parseInt(rooms),
        minPrice,
        maxPrice
      }
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({ message: 'Server error during hotel search' });
  }
});

// Get hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('reviews.user', 'name avatar');

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (!hotel.isActive) {
      return res.status(404).json({ message: 'Hotel not available' });
    }

    res.json({ hotel });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new hotel (Hotel owner only)
router.post('/', hotelOwnerAuth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Hotel name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.country').trim().notEmpty().withMessage('Country is required'),
  body('address.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('rooms').isArray({ min: 1 }).withMessage('At least one room type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const hotelData = {
      ...req.body,
      owner: req.user._id
    };

    // Set availableRooms equal to totalRooms for new hotels
    hotelData.rooms = hotelData.rooms.map(room => ({
      ...room,
      availableRooms: room.totalRooms
    }));

    const hotel = new Hotel(hotelData);
    await hotel.save();

    res.status(201).json({
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({ message: 'Server error during hotel creation' });
  }
});

// Update hotel (Hotel owner only)
router.put('/:id', hotelOwnerAuth, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check if user owns this hotel or is admin
    if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Hotel updated successfully',
      hotel: updatedHotel
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ message: 'Server error during hotel update' });
  }
});

// Add review to hotel
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rating, comment } = req.body;
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check if user has already reviewed this hotel
    const existingReview = hotel.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this hotel' });
    }

    // Add new review
    hotel.reviews.push({
      user: req.user._id,
      rating: parseInt(rating),
      comment
    });

    // Recalculate average rating
    hotel.calculateAverageRating();
    await hotel.save();

    // Populate the new review with user details
    await hotel.populate('reviews.user', 'name avatar');

    res.status(201).json({
      message: 'Review added successfully',
      review: hotel.reviews[hotel.reviews.length - 1]
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error during review submission' });
  }
});

// Get hotels by owner (Hotel owner only)
router.get('/owner/my-hotels', hotelOwnerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hotels = await Hotel.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalHotels = await Hotel.countDocuments({ owner: req.user._id });
    const totalPages = Math.ceil(totalHotels / parseInt(limit));

    res.json({
      hotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalHotels,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get owner hotels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;