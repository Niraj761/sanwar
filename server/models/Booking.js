const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Deluxe', 'Suite']
  },
  numberOfRooms: {
    type: Number,
    required: true,
    min: 1
  },
  guests: {
    adults: {
      type: Number,
      required: true,
      min: 1
    },
    children: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  totalNights: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    roomPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial-refund'],
    default: 'pending'
  },
  paymentDetails: {
    paymentIntentId: String,
    paymentMethod: String,
    paidAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    transactionId: String
  },
  guestDetails: {
    primaryGuest: {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      }
    },
    specialRequests: {
      type: String,
      default: ''
    }
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  checkedInAt: {
    type: Date
  },
  checkedOutAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = 'OYO' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Calculate total nights
bookingSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    this.totalNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  next();
});

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function() {
  return this.totalNights;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const checkInDate = new Date(this.checkIn);
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilCheckIn > 24 && ['pending', 'confirmed'].includes(this.status);
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const checkInDate = new Date(this.checkIn);
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Full refund if cancelled more than 48 hours before
  if (hoursUntilCheckIn > 48) {
    return this.pricing.finalAmount;
  }
  
  // 50% refund if cancelled between 24-48 hours before
  if (hoursUntilCheckIn > 24) {
    return this.pricing.finalAmount * 0.5;
  }
  
  return 0;
};

module.exports = mongoose.model('Booking', bookingSchema);