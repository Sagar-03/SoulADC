const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Course = require('../models/Course');
const router = express.Router();

// Note: You'll need to install stripe: npm install stripe
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payment/create-checkout-session
 * Create Stripe checkout session for course purchase
 */
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { courseId, coupon, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Calculate price (apply coupon if valid)
    let price = course.price;
    if (coupon && coupon.toLowerCase() === 'soul10') {
      price = price * 0.9; // 10% discount
    }

    // TODO: Replace with actual Stripe integration
    // For now, return a mock response
    console.log(`💳 Payment request for course ${course.title} by user ${userId}`);
    console.log(`💰 Price: $${price} (original: $${course.price})`);
    
    // Mock Stripe checkout session
    const mockSession = {
      url: `${successUrl}?session_id=mock_session_123&course_id=${courseId}`,
      sessionId: 'mock_session_123'
    };

    res.json(mockSession);

    /* 
    // REAL STRIPE IMPLEMENTATION (uncomment when ready):
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        courseId: courseId,
        userId: userId,
        originalPrice: course.price,
        finalPrice: price,
        coupon: coupon || ''
      }
    });

    res.json({ url: session.url, sessionId: session.id });
    */

  } catch (error) {
    console.error('❌ Payment session creation error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

/**
 * POST /api/payment/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // TODO: Implement Stripe webhook handling
  /*
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update user's purchased courses
      const { courseId, userId } = session.metadata;
      
      // Add course to user's purchased courses
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedCourses: courseId }
      });
      
      console.log(`✅ Payment successful for course ${courseId} by user ${userId}`);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  */

  res.json({ received: true });
});

/**
 * GET /api/payment/success
 * Handle successful payment
 */
router.get('/success', protect, async (req, res) => {
  try {
    const { session_id, course_id } = req.query;
    const userId = req.user.id;

    // Mock success handling (replace with actual verification)
    console.log(`✅ Payment success - Session: ${session_id}, Course: ${course_id}, User: ${userId}`);
    
    // For demo purposes, add course to user's purchased list
    // In production, this should be handled by webhook
    if (course_id) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedCourses: course_id }
      });
    }

    res.json({ 
      success: true, 
      message: 'Payment successful!',
      courseId: course_id,
      redirectUrl: `/mycourse/${course_id}`
    });

  } catch (error) {
    console.error('❌ Payment success handling error:', error);
    res.status(500).json({ error: 'Failed to process payment success' });
  }
});

module.exports = router;