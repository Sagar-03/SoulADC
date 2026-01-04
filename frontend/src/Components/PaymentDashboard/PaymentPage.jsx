import React, { useState, useEffect } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuthToken, isAuthenticated } from "../../utils/auth";
import { createCheckoutSession } from "../../Api/api"; // adjust path


export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get course details from URL params
  const courseId = searchParams.get('courseId');
  const courseTitle = searchParams.get('title');
  const coursePrice = parseFloat(searchParams.get('price')) || 499;

  // Course details (dynamic from URL params)
  const course = {
    id: courseId,
    name: courseTitle || "ADC Part 1 Mastery Program",
    description:
      "Comprehensive 5/10 month program designed by ADC-qualified mentors. Includes one-on-one guidance, curriculum coverage, and practice tests.",
    price: coursePrice, // AUD
  };

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("Please login first to access payment page");
      navigate("/login");
    }
  }, [navigate]);

  const handleApplyCoupon = () => {
    // Real validation should be done on the backend!
    const code = coupon.toLowerCase();

    if (code === "soul10") {
      setDiscount(0.1 * course.price); // 10% discount
      setIsCouponApplied(true);
    } else if (code === "free100") {
      setDiscount(course.price); // 100% discount
      setIsCouponApplied(true);
    }
    else if (code === "dhruv_350") {
      setDiscount(0.6983 * course.price);
      setIsCouponApplied(true);
    }
    else if (code === "test_10") {
      setDiscount(0.9914 * course.price);
      setIsCouponApplied(true);
    } else {
      setDiscount(0);
      setIsCouponApplied(false);
      alert("Invalid coupon code");
    }
  };


  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      if (!isAuthenticated()) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      const payload = {
        courseId: course.id,
        coupon: coupon,
        successUrl: `${window.location.origin}/payment-success?courseId=${course.id}`,
        cancelUrl: `${window.location.origin}/payment-cancel`
      };

      const { data } = await createCheckoutSession(payload);

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert("Failed to start checkout: " + (data.error || data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const finalPrice = course.price - discount;

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <Card className="shadow-lg rounded-4 border-0 w-100" style={{ maxWidth: "600px" }}>
        <Card.Body className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark">Secure Payment</h2>
            <p className="text-muted">Complete your enrollment today</p>
          </div>

          {/* Course Details */}
          <div className="bg-light rounded-3 p-4 mb-4 border">
            <h4 className="fw-semibold text-dark mb-2">{course.name}</h4>
            <p className="text-muted small mb-3">{course.description}</p>
            <p className="fw-bold text-primary mb-0">Price: AUD ${course.price}</p>
          </div>

          {/* Coupon Section */}
          <Form 
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault(); // Prevent form submission on Enter
            }}
          >
            <Form.Label className="fw-medium">Apply Coupon</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={isCouponApplied}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent Enter key from submitting
                  }
                }}
              />
              <Button 
                variant="primary" 
                onClick={handleApplyCoupon}
                disabled={isCouponApplied}
                type="button"
              >
                Apply
              </Button>
            </div>
            {discount > 0 && (
              <p className="text-success mt-2">
                Coupon applied! You saved AUD ${discount.toFixed(2)}
              </p>
            )}
          </Form>

          {/* Final Price */}
          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <span className="fw-bold fs-5">Total</span>
            <span className="fw-bold fs-4 text-primary">AUD ${finalPrice.toFixed(2)}</span>
          </div>

          {/* Payment Button */}
          <div className="mt-4">
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-100 py-2 fw-semibold"
              variant="primary"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  /> Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
