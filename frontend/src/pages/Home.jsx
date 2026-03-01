import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, TrendingUp, AlertTriangle, Zap, BarChart3, Shield, Target } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function Home() {
  const [email, setEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setNewsletterSubmitted(true);
    setEmail('');
    setTimeout(() => setNewsletterSubmitted(false), 3000);
  };

  return (
    <div className="App">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div 
          className="hero-background"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxkYXJrJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDB8fHxibGFja3wxNzcxNjExNjc1fDA&ixlib=rb-4.1.0&q=85')`
          }}
        ></div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            Predict & Prevent Delivery Delays<br />with Real Constraint Intelligence
          </h1>
          <p className="hero-subtitle">
            FluxNex calculates machine capacity pressure and delivery risk % in real time — so you can act before customers complain.
          </p>
          <div className="hero-cta-group">
            <Link to="/login" className="btn-primary">
              Start Free 14-Day Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-dark">
        <div className="container-content">
          <h2 className="section-title">Why ERP Is Not Enough</h2>
          
          <div className="problem-list">
            <div className="problem-item">
              <AlertTriangle size={24} className="problem-bullet-icon" />
              <p className="problem-bullet-text">ERP records what happened</p>
            </div>
            <div className="problem-item">
              <AlertTriangle size={24} className="problem-bullet-icon" />
              <p className="problem-bullet-text">ERP does not predict overload</p>
            </div>
            <div className="problem-item">
              <AlertTriangle size={24} className="problem-bullet-icon" />
              <p className="problem-bullet-text">Excel shows data — not consequences</p>
            </div>
            <div className="problem-item">
              <AlertTriangle size={24} className="problem-bullet-icon" />
              <p className="problem-bullet-text">Planners still guess when accepting urgent orders</p>
            </div>
            <div className="problem-item">
              <AlertTriangle size={24} className="problem-bullet-icon" />
              <p className="problem-bullet-text">Machine breakdown impact is calculated manually</p>
            </div>
          </div>

          <div className="comparison-table">
            <div className="comparison-column">
              <div className="comparison-header erp-header">ERP</div>
              <div className="comparison-row">
                <span className="comparison-text">Records transactions</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-text">Shows reports</span>
              </div>
              <div className="comparison-row">
                <span className="comparison-text">Logs breakdowns</span>
              </div>
            </div>
            
            <div className="comparison-column highlighted-column">
              <div className="comparison-header fluxnex-header">FluxNex</div>
              <div className="comparison-row">
                <CheckCircle2 size={18} className="comparison-check" />
                <span className="comparison-text-highlight">Calculates capacity pressure</span>
              </div>
              <div className="comparison-row">
                <CheckCircle2 size={18} className="comparison-check" />
                <span className="comparison-text-highlight">Predicts delivery risk %</span>
              </div>
              <div className="comparison-row">
                <CheckCircle2 size={18} className="comparison-check" />
                <span className="comparison-text-highlight">Simulates breakdown impact</span>
              </div>
              <div className="comparison-row">
                <CheckCircle2 size={18} className="comparison-check" />
                <span className="comparison-text-highlight">Suggests recovery actions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section-dark">
        <div className="container-content">
          <h2 className="section-title">What FluxNex Does Differently</h2>
          
          <div className="features-grid-four">
            <div className="feature-card">
              <div className="feature-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1720036236694-d0a231c52563?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxpbmR1c3RyaWFsJTIwY2FwYWNpdHl8ZW58MHx8fGJsYWNrfDE3NzE2MTE2Nzl8MA&ixlib=rb-4.1.0&q=85"
                  alt="Capacity Intelligence Engine"
                  className="feature-image"
                />
              </div>
              <div className="feature-content">
                <div className="feature-icon">
                  <BarChart3 size={28} />
                </div>
                <h3 className="feature-title">Capacity Intelligence Engine</h3>
                <p className="feature-description">
                  Automatically calculates effective machine capacity based on shifts and efficiency.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1584291527908-033f4d6542c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxkYXRhJTIwdmlzdWFsaXphdGlvbnxlbnwwfHx8YmxhY2t8MTc3MTYxMTY4Nnww&ixlib=rb-4.1.0&q=85"
                  alt="Constraint Pressure Monitoring"
                  className="feature-image"
                />
              </div>
              <div className="feature-content">
                <div className="feature-icon">
                  <Target size={28} />
                </div>
                <h3 className="feature-title">Constraint Pressure Monitoring</h3>
                <p className="feature-description">
                  See which machine is becoming the bottleneck before overload.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-image-container">
                <img 
                  src="https://images.pexels.com/photos/6499014/pexels-photo-6499014.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Breakdown Impact Simulation"
                  className="feature-image"
                />
              </div>
              <div className="feature-content">
                <div className="feature-icon">
                  <Zap size={28} />
                </div>
                <h3 className="feature-title">Breakdown Impact Simulation</h3>
                <p className="feature-description">
                  Simulate 2–3 day breakdowns and instantly see delivery risk increase.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxkYXJrJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDB8fHxibGFja3wxNzcxNjExNjc1fDA&ixlib=rb-4.1.0&q=85"
                  alt="Delivery Risk Percentage"
                  className="feature-image"
                />
              </div>
              <div className="feature-content">
                <div className="feature-icon">
                  <Shield size={28} />
                </div>
                <h3 className="feature-title">Delivery Risk %</h3>
                <p className="feature-description">
                  Know exactly which orders are at risk — in probability terms, not guesses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-dark">
        <div className="container-content">
          <h2 className="section-title">How It Works</h2>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Enter Machine Capacity</h3>
              <p className="step-description">
                Input machine capacity and shift hours for your production facility.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Add Orders</h3>
              <p className="step-description">
                Add orders with cycle time and quantity requirements.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">FluxNex Calculates</h3>
              <p className="step-description">
                Automatically calculates utilization %, identifies bottlenecks, and determines delivery risk %.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <h3 className="step-title">Simulate & Decide</h3>
              <p className="step-description">
                Simulate breakdown or add overtime and see impact instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section className="section-dark">
        <div className="container-content">
          <h2 className="section-title">Operational Clarity Without ERP Replacement</h2>
          
          <div className="value-grid">
            <div className="value-card">
              <CheckCircle2 size={24} className="value-icon" />
              <h3 className="value-title">Improve on-time delivery performance</h3>
            </div>
            <div className="value-card">
              <CheckCircle2 size={24} className="value-icon" />
              <h3 className="value-title">Reduce firefighting in production</h3>
            </div>
            <div className="value-card">
              <CheckCircle2 size={24} className="value-icon" />
              <h3 className="value-title">Make confident order acceptance decisions</h3>
            </div>
            <div className="value-card">
              <CheckCircle2 size={24} className="value-icon" />
              <h3 className="value-title">Protect margins by avoiding overload</h3>
            </div>
            <div className="value-card">
              <CheckCircle2 size={24} className="value-icon" />
              <h3 className="value-title">Works alongside your existing ERP</h3>
            </div>
          </div>

          <div className="erp-statement">
            <p className="erp-statement-text">
              FluxNex does not replace ERP. It makes it intelligent.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-dark">
        <div className="container-content">
          <h2 className="section-title">Simple & Predictable Pricing</h2>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-badge">Free Trial</div>
              <h3 className="pricing-plan">14 Days</h3>
              <p className="pricing-description">Up to 3 Machines</p>
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Capacity intelligence</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Basic risk calculation</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Breakdown simulation</span>
                </li>
              </ul>
              <Link to="/signup" className="btn-secondary pricing-btn">
                Start Free Trial
              </Link>
            </div>

            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge-pro">Pro Plan</div>
              <h3 className="pricing-plan">₹3,999/month</h3>
              <p className="pricing-description">Per plant — Full platform access</p>
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Unlimited machines</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Breakdown impact simulation</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Advanced delivery risk %</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Priority support</span>
                </li>
                <li className="pricing-feature">
                  <CheckCircle2 size={18} />
                  <span>Works with your ERP</span>
                </li>
              </ul>
              <Link to="/signup" className="btn-primary pricing-btn">
                Start Free Trial
              </Link>
            </div>
          </div>

          <div className="pricing-comparison">
            <p className="pricing-comparison-text">
              Traditional ERP costs ₹5L+ upfront.<br />
              FluxNex delivers predictive intelligence monthly.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="section-dark social-proof-section">
        <div className="container-content">
          <h2 className="section-title">Built for Real Manufacturing Environments</h2>
          
          <div className="beta-access-card">
            <h3 className="beta-title">Beta Access Available</h3>
            <p className="beta-description">
              Join manufacturing leaders who are transforming constraint management with real-time intelligence.
            </p>
            <div className="beta-stats">
              <div className="beta-stat">
                <div className="beta-stat-number">10-150</div>
                <div className="beta-stat-label">Machines per plant</div>
              </div>
              <div className="beta-stat">
                <div className="beta-stat-number">Real-time</div>
                <div className="beta-stat-label">Risk calculation</div>
              </div>
              <div className="beta-stat">
                <div className="beta-stat-number">14 days</div>
                <div className="beta-stat-label">Free trial</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-dark newsletter-section">
        <div className="container-content">
          <div className="newsletter-card">
            <h2 className="newsletter-title">Stay Updated</h2>
            <p className="newsletter-description">
              Get the latest insights on manufacturing intelligence and production optimization.
            </p>
            
            {newsletterSubmitted ? (
              <div className="newsletter-success">
                <CheckCircle2 size={24} />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="newsletter-input"
                />
                <button type="submit" className="btn-primary">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="container-content">
          <h2 className="cta-title">Stop Guessing. Start Predicting.</h2>
          <p className="cta-subtitle">Turn machine data into delivery confidence.</p>
          <Link to="/signup" className="btn-primary cta-btn">
            Start Free 14-Day Trial
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
