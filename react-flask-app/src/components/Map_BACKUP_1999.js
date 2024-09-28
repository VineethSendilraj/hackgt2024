import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import './Map.scss'; // Import CSS file for custom styling

const Direction = () => {
  const mapContainerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeGeometry, setRouteGeometry] = useState(null);
  const mapRef = useRef();
  const geocodingClient = MapboxGeocoding({
    accessToken: 'pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ',
  });

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ';
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-84.3879824, 33.7489954], // Default center
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      // Clustering logic, route drawing, etc.
      // Same as in your current setup
    });

    return () => mapRef.current.remove();
  }, [routeGeometry, mapStyle]);

  const handleInputChange = (event, setFunction) => {
    setFunction(event.target.value);
  };

  const calculateRoute = async () => {
    if (origin && destination) {
      try {
        const originResponse = await geocodingClient.forwardGeocode({
          query: origin,
          limit: 1,
        }).send();

        const destinationResponse = await geocodingClient.forwardGeocode({
          query: destination,
          limit: 1,
        }).send();

        const originCoordinates = originResponse.body.features[0].center;
        const destinationCoordinates = destinationResponse.body.features[0].center;

        const directionsResponse = await axios.get(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates.join(',')};${destinationCoordinates.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );

        const route = directionsResponse.data.routes[0].geometry;
        setRouteGeometry(route);
      } catch (error) {
        console.error("Error calculating route:", error);
      }
    }
  };

  return (
    <div className="map-container">
      <div className="controls">
        <input
          type="text"
          id="origin"
          placeholder="Enter origin"
          value={origin}
          onChange={(e) => handleInputChange(e, setOrigin)}
        />
        <input
          type="text"
          id="destination"
          placeholder="Enter destination"
          value={destination}
          onChange={(e) => handleInputChange(e, setDestination)}
        />
        <button onClick={calculateRoute}>Get Directions</button>
      </div>
      <div
        ref={mapContainerRef}
        className="map"
        style={{ height: '100vh' }} // Ensure the map takes full height
      />
    </div>
  );
};

export default Direction;
