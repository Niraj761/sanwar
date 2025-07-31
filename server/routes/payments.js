const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', auth, [
  body('bookingId').isMongoId().withMessage('Invalid booking ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { bookingId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment is already completed
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Check if booking is still valid
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay for cancelled booking' });
    }

    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.pricing.finalAmount * 100), // Convert to cents
        currency: 'inr', // Indian Rupees for OYO
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user._id.toString(),
          hotelName: booking.hotel.name,
          bookingReference: booking.bookingReference
        },
        description: `Booking payment for ${booking.hotel.name} - ${booking.bookingReference}`,
        receipt_email: booking.user.email
      });

      // Update booking with payment intent ID
      booking.paymentDetails.paymentIntentId = paymentIntent.id;
      await booking.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.pricing.finalAmount
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      res.status(500).json({ 
        message: 'Payment processing error',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error during payment creation' });
  }
});

// Confirm payment
router.post('/confirm-payment', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('bookingId').isMongoId().withMessage('Invalid booking ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { paymentIntentId, bookingId } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update booking payment status
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.paymentDetails.paidAmount = paymentIntent.amount / 100; // Convert from cents
        booking.paymentDetails.paymentMethod = paymentIntent.payment_method_types[0];
        booking.paymentDetails.transactionId = paymentIntent.id;

        await booking.save();

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
          io.to(`hotel-${booking.hotel}`).emit('booking-confirmed', {
            bookingId: booking._id,
            hotelId: booking.hotel,
            status: 'confirmed'
          });
        }

        res.json({
          message: 'Payment confirmed successfully',
          booking: {
            id: booking._id,
            bookingReference: booking.bookingReference,
            status: booking.status,
            paymentStatus: booking.paymentStatus
          }
        });
      } else {
        // Payment failed or pending
        booking.paymentStatus = 'failed';
        await booking.save();

        res.status(400).json({
          message: 'Payment not completed',
          paymentStatus: paymentIntent.status
        });
      }
    } catch (stripeError) {
      console.error('Stripe retrieve error:', stripeError);
      res.status(500).json({ 
        message: 'Payment verification error',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error during payment confirmation' });
  }
});

// Process refund
router.post('/refund', auth, [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { bookingId, reason = 'Customer requested refund' } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is eligible for refund
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'No payment to refund' });
    }

    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({ message: 'Already refunded' });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();
    if (refundAmount <= 0) {
      return res.status(400).json({ message: 'Not eligible for refund' });
    }

    try {
      // Process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentDetails.paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          bookingId: booking._id.toString(),
          refundReason: reason
        }
      });

      // Update booking
      booking.paymentDetails.refundAmount = refundAmount;
      booking.paymentStatus = refundAmount === booking.pricing.finalAmount ? 'refunded' : 'partial-refund';
      
      await booking.save();

      res.json({
        message: 'Refund processed successfully',
        refundAmount,
        refundId: refund.id,
        status: refund.status
      });
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      res.status(500).json({ 
        message: 'Refund processing error',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Server error during refund processing' });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find({ 
      user: req.user._id,
      paymentStatus: { $in: ['paid', 'refunded', 'partial-refund'] }
    })
    .populate('hotel', 'name address')
    .select('bookingReference hotel checkIn checkOut pricing paymentStatus paymentDetails createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalTransactions = await Booking.countDocuments({ 
      user: req.user._id,
      paymentStatus: { $in: ['paid', 'refunded', 'partial-refund'] }
    });

    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.json({
      transactions: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking && booking.paymentStatus !== 'paid') {
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            booking.paymentDetails.paidAmount = paymentIntent.amount / 100;
            booking.paymentDetails.transactionId = paymentIntent.id;
            await booking.save();

            // Emit real-time update
            const io = req.app.get('io');
            if (io) {
              io.to(`hotel-${booking.hotel}`).emit('booking-confirmed', {
                bookingId: booking._id,
                hotelId: booking.hotel,
                status: 'confirmed'
              });
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBookingId = failedPayment.metadata.bookingId;
        
        if (failedBookingId) {
          const booking = await Booking.findById(failedBookingId);
          if (booking) {
            booking.paymentStatus = 'failed';
            await booking.save();
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;