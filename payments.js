const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for course purchase
// @access  Private
router.post('/create-payment-intent', auth, [
  body('courseId').notEmpty().withMessage('Course ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not published' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Calculate amount (in cents for Stripe)
    const amount = Math.round(course.currentPrice * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        courseId,
        studentId: req.user._id.toString(),
        courseTitle: course.title
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      course: {
        id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: course.currentPrice
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/confirm
// @desc    Confirm payment and create enrollment
// @access  Private
router.post('/confirm', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('courseId').notEmpty().withMessage('Course ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, courseId } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: req.user._id,
      course: courseId,
      payment: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        paymentMethod: 'stripe',
        paymentStatus: 'completed',
        transactionId: paymentIntent.id
      }
    });

    await enrollment.save();

    // Update user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        enrolledCourses: {
          course: courseId,
          enrolledAt: new Date()
        }
      }
    });

    // Update course's enrolled students
    await Course.findByIdAndUpdate(courseId, {
      $push: {
        enrolledStudents: {
          student: req.user._id,
          enrolledAt: new Date()
        }
      }
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title thumbnail category level')
      .populate('student', 'name email');

    res.json({
      message: 'Payment confirmed and enrollment created successfully',
      enrollment: populatedEnrollment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
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
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Handle successful payment
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title thumbnail')
      .sort({ enrolledAt: -1 });

    const paymentHistory = enrollments.map(enrollment => ({
      id: enrollment._id,
      course: enrollment.course,
      amount: enrollment.payment.amount,
      currency: enrollment.payment.currency,
      paymentStatus: enrollment.payment.paymentStatus,
      transactionId: enrollment.payment.transactionId,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status
    }));

    res.json(paymentHistory);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/refund
// @desc    Request refund for enrollment
// @access  Private
router.post('/refund', auth, [
  body('enrollmentId').notEmpty().withMessage('Enrollment ID is required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { enrollmentId, reason } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if user is authorized
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if payment was made via Stripe
    if (enrollment.payment.paymentMethod !== 'stripe' || !enrollment.payment.transactionId) {
      return res.status(400).json({ message: 'Refund not available for this payment method' });
    }

    // Check if already refunded
    if (enrollment.payment.paymentStatus === 'refunded') {
      return res.status(400).json({ message: 'Payment already refunded' });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: enrollment.payment.transactionId,
      reason: 'requested_by_customer',
      metadata: {
        enrollmentId: enrollment._id.toString(),
        reason
      }
    });

    // Update enrollment payment status
    enrollment.payment.paymentStatus = 'refunded';
    enrollment.status = 'dropped';
    await enrollment.save();

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 