import React, { useState, useEffect } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";
import { createMockCheckoutSession, validateDiscountCode } from "../../Api/api";

export default function MockPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get mock details from URL params
  const mockId = searchParams.get('mockId');
  const mockTitle = searchParams.get('title');
  const mockPrice = parseFloat(searchParams.get('price')) || 0;
  
  // Mock details (dynamic from URL params)
  const mock = {
    id: mockId,
    name: mockTitle || "Mock Exam",
    description: "Comprehensive mock exam to test your knowledge and exam readiness.",
    price: mockPrice, // AUD
  };

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("Please login first to access payment page");
      navigate("/login");
    }

    if (!mockId) {
      alert("Invalid mock exam selected");
      navigate("/mocks");
    }
  }, [navigate, mockId]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const { data } = await validateDiscountCode(coupon.trim());
      const pct = data.discountPercent;
      setDiscountPercent(pct);
      setDiscount((pct / 100) * mock.price);
      setIsCouponApplied(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid or expired coupon code";
      setCouponError(msg);
      setDiscount(0);
      setDiscountPercent(0);
      setIsCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon("");
    setDiscount(0);
    setDiscountPercent(0);
    setIsCouponApplied(false);
    setCouponError("");
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      if (!isAuthenticated()) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      // Check if user came from student portal (via referrer or state)
      const isFromStudentPortal = document.referrer.includes('/student/mocks');
      const successUrl = isFromStudentPortal 
        ? `${window.location.origin}/payment-success?mock_id=${mock.id}&redirect=student`
        : `${window.location.origin}/payment-success?mock_id=${mock.id}`;
      const cancelUrl = isFromStudentPortal
        ? `${window.location.origin}/student/mocks?payment=cancelled`
        : `${window.location.origin}/payment-cancel`;

      const payload = {
        mockId: mock.id,
        coupon: coupon,
        successUrl,
        cancelUrl,
      };

      const { data } = await createMockCheckoutSession(payload);

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

  const finalPrice = mock.price - discount;

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <Card className="shadow-lg rounded-4 border-0 w-100" style={{ maxWidth: "600px" }}>
        <Card.Body className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark">Secure Payment</h2>
            <p className="text-muted">Complete your mock exam purchase</p>
          </div>

          {/* Mock Details */}
          <div className="bg-light rounded-3 p-4 mb-4 border">
            <h4 className="fw-semibold text-dark mb-2">{mock.name}</h4>
            <p className="text-muted small mb-3">{mock.description}</p>
            <p className="fw-bold text-primary mb-0">Price: AUD ${mock.price.toFixed(2)}</p>
          </div>

          {/* Coupon Section */}
          <Form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isCouponApplied) handleApplyCoupon();
            }}
          >
            <Form.Label className="fw-medium">Apply Discount Code</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter discount code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                disabled={isCouponApplied}
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              />
              {isCouponApplied ? (
                <Button variant="outline-secondary" onClick={handleRemoveCoupon} type="button">
                  Remove
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleApplyCoupon}
                  type="button"
                  disabled={couponLoading || !coupon.trim()}
                >
                  {couponLoading ? <Spinner size="sm" /> : "Apply"}
                </Button>
              )}
            </div>
            {couponError && <p className="text-danger mt-2 small">{couponError}</p>}
            {isCouponApplied && discount > 0 && (
              <p className="text-success mt-2 small fw-medium">
                ✓ {discountPercent}% discount applied — you save AUD ${discount.toFixed(2)}
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

          {/* Info Note */}
          <div className="mt-4 text-center">
            <small className="text-muted">
              💡 Tip: Purchase any course to get FREE access to ALL mock exams!
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
