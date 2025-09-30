import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <Card className="text-center shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-warning mb-4">
            <i className="bi bi-x-circle" style={{ fontSize: '4rem' }}></i>
          </div>
          <h2 className="text-warning mb-3">Payment Cancelled</h2>
          <p className="text-muted mb-4">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button 
              variant="primary" 
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/studentdashboard')}
            >
              Dashboard
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentCancel;