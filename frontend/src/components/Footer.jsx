import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer-dark">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-text-footer">
              FLUX<span className="logo-accent">NEX</span>
            </div>
            <p className="footer-tagline">
              Predictive Manufacturing Intelligence Platform
            </p>
            <p className="footer-erp-statement">
              Works with your ERP
            </p>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Company</h4>
            <Link to="/" className="footer-link">About</Link>
            <a href="mailto:contact@fluxnex.ai" className="footer-link">Contact</a>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Legal</h4>
            <Link to="/" className="footer-link">Privacy Policy</Link>
            <Link to="/" className="footer-link">Terms of Service</Link>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Connect</h4>
            <div className="footer-social">
              <a href="mailto:contact@fluxnex.ai" className="footer-social-link" aria-label="Email">
                <Mail size={20} />
              </a>
              <a href="#" className="footer-social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 FluxNex. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
