import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from 'react-bootstrap';
import { getAuthToken } from '../../utils/auth';
import { PaymentSuccessApi, MockPaymentSuccessApi } from '../../Api/api'; // adjust path as needed

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [itemType, setItemType] = useState('course'); // 'course' or 'mock'

  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
const handlePaymentSuccess = async () => {
  const sessionId = searchParams.get('session_id');
  const courseIdParam = searchParams.get('course_id') || searchParams.get('courseId');
  const mockIdParam = searchParams.get('mock_id') || searchParams.get('mockId');

  // Determine if this is a course or mock purchase
  const isMockPurchase = !!mockIdParam;
  const itemIdParam = isMockPurchase ? mockIdParam : courseIdParam;

  if (!sessionId || !itemIdParam) {
    setLoading(false);
    return;
  }

  try {
    let data;
    if (isMockPurchase) {
      const response = await MockPaymentSuccessApi(sessionId, mockIdParam);
      data = response.data;
      setItemType('mock');
    } else {
      const response = await PaymentSuccessApi(sessionId, courseIdParam);
      data = response.data;
      setItemType('course');
    }

    if (data.success) {
      setSuccess(true);
      setItemId(itemIdParam);
      // Check if approval is pending
      if (data.approvalPending) {
        setIsPending(true);
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  } finally {
    setLoading(false);
  }
};
    handlePaymentSuccess();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Processing...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <Card className="text-center shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-5">
          {success ? (
            <>
              {isPending ? (
                // Pending Approval UI
                <>
                  <div className="text-warning mb-4">
                    <i className="bi bi-clock-history" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h2 className="text-warning mb-3">Payment Received!</h2>
                  <p className="text-muted mb-4">
                    Thank you for your payment. Your {itemType === 'mock' ? 'mock exam' : 'course'} access is pending admin approval.
                    You will be notified once your access is granted.
                  </p>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>What's next?</strong><br/>
                    Our team is reviewing your payment. You'll receive {itemType === 'mock' ? 'mock exam' : 'course'} access within 24 hours.
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(itemType === 'mock' ? '/student/mocks' : '/courses')}
                  >
                    Return to {itemType === 'mock' ? 'My Mocks' : 'Courses'}
                  </Button>
                </>
              ) : (
                // Immediate Access UI (for backward compatibility)
                <>
                  <div className="text-success mb-4">
                    <i className="bi bi-check-circle" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h2 className="text-success mb-3">Payment Successful!</h2>
                  <p className="text-muted mb-4">
                    Thank you for your purchase. You now have access to your {itemType === 'mock' ? 'mock exam' : 'course'} content.
                  </p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Button 
                      variant="success" 
                      onClick={() => navigate(
                        itemType === 'mock' 
                          ? '/student/mocks' 
                          : (itemId ? `/mycourse/${itemId}` : '/studentdashboard')
                      )}
                    >
                      {itemType === 'mock' ? 'Go to My Mocks' : 'Access Course'}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => navigate('/studentdashboard')}
                    >
                      Dashboard
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="text-warning mb-4">
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '4rem' }}></i>
              </div>
              <h2 className="text-warning mb-3">Payment Verification Failed</h2>
              <p className="text-muted mb-4">
                We couldn't verify your payment. Please contact support if you were charged.
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/studentdashboard')}
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentSuccess;