import React from "react";
import "./OnboardingPopup.css"; // Create a CSS file for styling

const OnboardingPopup = ({ onClose }) => {
  return (
    <div className="onboarding-popup">
      <div className="popup-content">
        {/* Banner for crime data limitation */}
        <div className="data-limitation-banner">
          ⚠️ Currently, the crime data is limited to the Atlanta area.
        </div>

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
            Safely allows you to confidently and safely *pun intended* explore
            crime data in your area. Here are the steps to get started:
          </p>
          <ol>
            <li>
              Enter your origin and destination, or double click on the map, in
              the search bar.
            </li>
            <li>Filter for specific crimes to narrow down the data.</li>
            <li>
              Visualize the map in 3D by right-clicking and dragging while
              zoomed in.
            </li>
          </ol>
        </div>

        <button className="close-button" onClick={onClose}>
          Sounds good 👍
        </button>
      </div>
    </div>
  );
};

export default OnboardingPopup;
