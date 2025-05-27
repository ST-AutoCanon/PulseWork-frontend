// FeaturesSection.js
import React from 'react';
import './FeaturesSection.css';

const features = [
  {
    title: 'Employee Attendance',
    description: 'Track punch in/out with location, device and face ID.',
  },
  {
    title: 'Leave Management',
    description: 'Apply, approve, and view leave details with status history.',
  },
  {
    title: 'Reimbursements',
    description: 'Submit and manage expense claims with transparency.',
  },
  {
    title: 'Analytics & Reports',
    description: 'Visualize employee productivity and attendance trends.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="features">
      <h2>Platform Features</h2>
      <div className="features-grid">
        {features.map((feat, index) => (
          <div className="feature-card" key={index}>
            <h3>{feat.title}</h3>
            <p>{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
