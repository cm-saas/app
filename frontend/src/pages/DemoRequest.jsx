import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function DemoRequest() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    machines: '',
    industry: '',
    preferredDate: '',
    message: ''
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
    console.log('Demo request submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="App">
        <Header />
        <div className="form-page">
          <div className="form-container">
            <div className="success-message">
              <Calendar size={64} className="success-icon" />
              <h1 className="success-title">Demo Request Received!</h1>
              <p className="success-description">
                Thank you for your interest in FluxNex. Our team will reach out to {formData.email} within 24 hours to schedule your personalized demo.
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
            <h1 className="form-title">Book a Demo</h1>
            <p className="form-subtitle">
              See FluxNex in action with a personalized walkthrough for your manufacturing setup
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
                placeholder="10"
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

            <div className="form-group">
              <label htmlFor="preferredDate" className="form-label">Preferred Date (Optional)</label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Additional Information (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="form-textarea"
                rows="4"
                placeholder="Tell us about your current challenges or specific areas you'd like to explore..."
              />
            </div>

            <button type="submit" className="btn-primary form-submit">
              Request Demo
            </button>

            <p className="form-terms">
              We typically respond within 24 hours on business days.
            </p>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
