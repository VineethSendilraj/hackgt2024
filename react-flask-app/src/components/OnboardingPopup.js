import React from "react";
import "./OnboardingPopup.css"; // Create a CSS file for styling

const OnboardingPopup = ({ onClose }) => {
  return (
    <div className="onboarding-popup">
      <div className="popup-content">
        <h2>Welcome to Safely!</h2>

        <div className="section">
          <h3>Why Safely❓</h3>
          <p>
            In a city grappling with high crime rates, Safely empowers residents
            by transforming how they understand their surroundings. We're
            providing peace of mind, enabling users to generate safer paths and
            navigate Atlanta confidently.
          </p>
        </div>

        <div className="section">
          <h3>How do I use Safely 🤔</h3>
          <p>
            This application allows you to explore crime data in your area. You
            can enter your origin and destination to find safe routes. Click on
            the map to set your destination or use the search bar for quick
            access.
          </p>
        </div>

        <button className="close-button" onClick={onClose}>
          Sounds good 👍
        </button>
      </div>
    </div>
  );
};

export default OnboardingPopup;
