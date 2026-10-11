import React from 'react';
import RoleCard from './RoleCard';

const RolesSection = () => {
  const roles = [
    {
      icon: '🏢',
      title: 'Business (Founder)',
      description: 'Founders and enterprise operators seeking capital, mentorship, and growth partnerships.',
      highlightColor: '#0A0A0A',
      features: [
        'Create and update comprehensive business profiles',
        'Showcase financial targets, funding stages, and traction',
        'Receive direct expressions of interest from verified investors',
        'Manage incoming pitch discussions in real-time'
      ]
    },
    {
      icon: '💼',
      title: 'Investor',
      description: 'Angel investors, syndicates, and venture funds looking to back promising businesses.',
      highlightColor: '#C0C0C0',
      features: [
        'Explore curated marketplace of verified businesses',
        'Filter listings by sector, capital target, and location',
        'Express investment interest with customized notes',
        'Save business profiles for due diligence follow-up'
      ]
    }
  ];

  return (
    <section className="roles-section">
      <div className="section-heading">
        <h2 className="section-title">Built for Two Marketplace Roles</h2>
        <p className="section-subtitle">
          MeuLink simplifies the fundraising process by aligning founders and capital providers.
        </p>
      </div>
      <div className="roles-grid">
        {roles.map((role) => (
          <RoleCard
            key={role.title}
            icon={role.icon}
            title={role.title}
            description={role.description}
            features={role.features}
            highlightColor={role.highlightColor}
          />
        ))}
      </div>
    </section>
  );
};

export default RolesSection;
