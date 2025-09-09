import React from 'react';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-white pt-5 pb-3 mt-auto shadow-sm">
     <Container className="footer-smaller-text">
        <Row className="mb-4">
          {/* Column 1: Logo and Social Media */}
          <Col md={3} className="mb-4">
            <img 
              src={logo}
              alt="Soul ADC Logo" 
              className="img-fluid mb-3" 
              style={{ maxWidth: '200px', height: 'auto' }}
            />
            <p className="text-secondary fs-7">
              Empowering future Australian dentists with expert ADC Part 1 preparation. Your success is our mission.
            </p>
            <div className="d-flex gap-2 mt-3">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                <Button
                  key={i}
                  variant="outline-secondary"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px', fontSize: '12px' }}
                >
                  <Icon />
                </Button>
              ))}
            </div>
          </Col>

          {/* Column 2: Quick Links */}
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <Nav className="flex-column">
              {['Home', 'About Us', 'Course', 'Mentors', 'Contact'].map((item, idx) => (
                <Nav.Link key={idx} href="#" className="text-secondary p-0 mb-1 small">
                  {item}
                </Nav.Link>
              ))}
            </Nav>
          </Col>

          {/* Column 3: Course Info */}
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">Course Info</h6>
            <Nav className="flex-column">
              {['ADC Part 1 Prep', 'Study Materials', 'Practice Tests', 'Success Stories', 'FAQ'].map((item, idx) => (
                <Nav.Link key={idx} href="#" className="text-secondary p-0 mb-1 small">
                  {item}
                </Nav.Link>
              ))}
            </Nav>
          </Col>

          {/* Column 4: Contact Us */}
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">Contact Us</h6>
            <Nav className="flex-column mb-3 small">
              <Nav.Link href="mailto:info@adcpreppro.com" className="text-secondary p-0 mb-2 d-flex align-items-center">
                <FaEnvelope className="me-2" /> info@adcpreppro.com
              </Nav.Link>
              <Nav.Link href="tel:+61400123456" className="text-secondary p-0 mb-2 d-flex align-items-center">
                <FaPhone className="me-2" /> +61 400 123 456
              </Nav.Link>
              <Nav.Link href="#" className="text-secondary p-0 mb-2 d-flex align-items-center">
                <FaMapMarkerAlt className="me-2" /> Sydney, Australia
              </Nav.Link>
            </Nav>
            <Button style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }} className="text-white fw-bold py-2 px-4 small">
              Get Started Today
            </Button>
          </Col>
        </Row>

        <hr />

        {/* Bottom Bar */}
        <Row className="align-items-center mt-3">
          <Col md={6} className="text-center text-md-start">
            <p className="text-secondary mb-0 small">&copy; 2024 ADC Prep Pro. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <Nav className="justify-content-center justify-content-md-end">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item, idx) => (
                <Nav.Link key={idx} href="#" className="text-secondary small">
                  {item}
                </Nav.Link>
              ))}
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
