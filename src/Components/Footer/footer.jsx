import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./footer.css";
import logo from "../../assets/logo.png"; // Import logo from src/assets

const Footer = () => {
    return (
        <footer className="footer  pt-5">
            <div className="container-fluid px-5"> 
                <div className="row">
                    {/* Logo & About */}
                    <div className="col-md-3 mb-4">
                        <img src={logo}
                             alt="Logo"
                             width="140"
                             className="mb-3" />
                        <p>
                            Lorem Ipsum is simply dummy text of the printing and typesetting
                            industry. Lorem Ipsum has been the industry’s standard dummy text
                            ever since.
                        </p>
                    </div>

                    {/* Company */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold">Company</h6>
                        <ul className="list-unstyled">
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">How to work?</a></li>
                            <li><a href="#">Popular Course</a></li>
                            <li><a href="#">Service</a></li>
                        </ul>
                    </div>

                    {/* Courses */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold">Courses</h6>
                        <ul className="list-unstyled">
                            <li><a href="#">Categories</a></li>
                            <li><a href="#">Offline Course</a></li>
                            <li><a href="#">Video Course</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="col-md-2 mb-4">
                        <h6 className="fw-bold">Support</h6>
                        <ul className="list-unstyled">
                            <li><a href="#">FAQ</a></li>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Career</a></li>
                            <li><a href="#">Privacy</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-md-3 mb-4">
                        <h6 className="fw-bold">Contact Info</h6>
                        <ul className="list-unstyled">
                            <li>+1-177155-400</li>
                            <li>wonbon@hotmail.com</li>
                            <li>C-4 Dwarka, New Coimbatore<br />Punjab-110037</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom line */}
                <div className="text-center py-3 border-top">
                    <small>© SoulADC All Rights Reserved 2025</small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
