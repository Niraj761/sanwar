const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Deluxe', 'Suite']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  availableRooms: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  maxOccupancy: {
    type: Number,
    required: true,
    min: 1
  }
});

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  images: [{
    type: String,
    required: true
  }],
  amenities: [{
    type: String
  }],
  rooms: [roomSchema],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  checkInTime: {
    type: String,
    default: '14:00'
  },
  checkOutTime: {
    type: String,
    default: '12:00'
  },
  policies: {
    cancellation: {
      type: String,
      default: 'Free cancellation before 24 hours'
    },
    petPolicy: {
      type: String,
      default: 'Pets not allowed'
    },
    smokingPolicy: {
      type: String,
      default: 'No smoking'
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
hotelSchema.index({ location: '2dsphere' });

// Update room availability
hotelSchema.methods.updateRoomAvailability = function(roomType, quantity, operation = 'decrease') {
  const room = this.rooms.find(r => r.type === roomType);
  if (!room) throw new Error('Room type not found');
  
  if (operation === 'decrease') {
    if (room.availableRooms < quantity) {
      throw new Error('Not enough rooms available');
    }
    room.availableRooms -= quantity;
  } else if (operation === 'increase') {
    room.availableRooms = Math.min(room.availableRooms + quantity, room.totalRooms);
  }
  
  return this.save();
};

// Calculate average rating
hotelSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating.average = Math.round((sum / this.reviews.length) * 10) / 10;
  this.rating.count = this.reviews.length;
};

module.exports = mongoose.model('Hotel', hotelSchema);