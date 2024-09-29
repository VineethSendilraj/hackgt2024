import React from "react";
import "./OnboardingPopup.css"; // Create a CSS file for styling

const OnboardingPopup = ({ onClose }) => {
  return (
    <div className="onboarding-popup">
      <div className="popup-content">
        <h2>Welcome to Safely!</h2>
        <p>
          This application allows you to explore crime data in your area. You
          can enter your origin and destination to find safe routes. Click on
          the map to set your destination or use the search bar for quick
          access.
        </p>
        <button className="close-button" onClick={onClose}>
          Sounds good 👍
        </button>
      </div>
    </div>
  );
};

export default OnboardingPopup;
