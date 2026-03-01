import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    machines: '',
    industry: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="App">
        <Header />
        <div className="form-page">
          <div className="form-container">
            <div className="success-message">
              <CheckCircle2 size={64} className="success-icon" />
              <h1 className="success-title">Welcome to FluxNex!</h1>
              <p className="success-description">
                Your free trial has been activated. We've sent setup instructions to {formData.email}.
              </p>
              <Link to="/" className="btn-primary">
                <ArrowLeft size={20} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      
      <div className="form-page">
        <div className="form-container">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="form-header">
            <h1 className="form-title">Start Your Free Trial</h1>
            <p className="form-subtitle">
              14 days free access • No credit card required • Up to 3 machines
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company" className="form-label">Company Name</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Your Company"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Work Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="you@company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="machines" className="form-label">Number of Machines</label>
              <input
                type="number"
                id="machines"
                name="machines"
                value={formData.machines}
                onChange={handleChange}
                required
                min="1"
                className="form-input"
                placeholder="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry" className="form-label">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select your industry</option>
                <option value="automotive">Automotive</option>
                <option value="electronics">Electronics</option>
                <option value="machinery">Machinery</option>
                <option value="plastics">Plastics & Injection Molding</option>
                <option value="metalworking">Metal Working</option>
                <option value="packaging">Packaging</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn-primary form-submit">
              Start Free Trial
            </button>

            <p className="form-terms">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
