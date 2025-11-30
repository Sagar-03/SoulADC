// backend/routes/paymentRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const Course = require("../models/Course");
const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payment/create-checkout-session
 * Create Stripe checkout session for course purchase
 */

router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    const { courseId, coupon, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Calculate price (apply coupon if valid)
    let price = course.price;
    if (coupon) {
      const code = coupon.toLowerCase();
      if (code === "soul10") {
        price = price * 0.9; // 10% discount
      } else if (code === "free100") {
        price = 0; // 100% discount
      }
    }

    // Create real Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aud", // Australian dollars
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        courseId: courseId,
        userId: userId,
        originalPrice: course.price,
        finalPrice: price,
        coupon: coupon || "",
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("❌ Payment session creation error:", error);
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

/**
 * POST /api/payment/webhook
 * Handle Stripe webhook events (recommended for reliability)
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const { courseId, userId } = session.metadata;

        try {
          // Get course to fetch duration
          const course = await Course.findById(courseId);
          if (!course) {
            console.error(`❌ Course ${courseId} not found during webhook`);
            break;
          }

          // Calculate expiry date based on course duration
          const purchaseDate = new Date();
          const expiryDate = new Date(purchaseDate);
          expiryDate.setMonth(expiryDate.getMonth() + course.durationMonths);

          // Check if user already has this course
          const user = await User.findById(userId);
          const existingCourse = user.purchasedCourses.find(
            pc => pc.courseId.toString() === courseId.toString()
          );

          if (!existingCourse) {
            // Add new course with expiry date
            user.purchasedCourses.push({
              courseId: courseId,
              purchaseDate: purchaseDate,
              expiryDate: expiryDate,
              isExpired: false
            });
            await user.save();
          }

          console.log(`✅ Payment successful for course ${courseId} by user ${userId}, expires on ${expiryDate.toDateString()}`);
        } catch (dbErr) {
          console.error("❌ DB update error:", dbErr);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

/**
 * GET /api/payment/success
 * Handle successful payment redirect (frontend calls this)
 */
router.get("/success", protect, async (req, res) => {
  try {
    const { session_id, course_id } = req.query;
    const userId = req.user.id;

    // Retrieve the session from Stripe to confirm payment
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not verified." });
    }

    // Get course to fetch duration
    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Calculate expiry date based on course duration
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + course.durationMonths);

    // Update user's purchased courses with expiry tracking
    if (course_id) {
      const user = await User.findById(userId);
      const existingCourse = user.purchasedCourses.find(
        pc => pc.courseId && pc.courseId.toString() === course_id.toString()
      );

      if (!existingCourse) {
        user.purchasedCourses.push({
          courseId: course_id,
          purchaseDate: purchaseDate,
          expiryDate: expiryDate,
          isExpired: false
        });
        await user.save();
      }
    }

    console.log(`✅ Verified payment success - User: ${userId}, Course: ${course_id}, Expires: ${expiryDate.toDateString()}`);

    res.json({
      success: true,
      message: "Payment successful! Course added to account.",
      courseId: course_id,
      expiryDate: expiryDate,
      redirectUrl: `/mycourse/${course_id}`,
    });
  } catch (error) {
    console.error("❌ Payment success handling error:", error);
    res.status(500).json({ error: "Failed to process payment success" });
  }
});

module.exports = router;
