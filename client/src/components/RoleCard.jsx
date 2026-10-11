import React from 'react';

const RoleCard = ({ icon, title, description, features, highlightColor }) => {
  return (
    <div className="role-card" style={{ borderTop: `4px solid ${highlightColor}` }}>
      <div className="role-icon">{icon}</div>
      <h3 className="role-name">{title}</h3>
      <p className="role-description">{description}</p>
      <ul className="role-features">
        {features.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>
    </div>
  );
};

export default RoleCard;
