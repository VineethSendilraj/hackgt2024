import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import './Map.scss';  // Import CSS file for custom styling

const Direction = () => {
  const mapContainerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeGeometry, setRouteGeometry] = useState(null);

  const geocodingClient = MapboxGeocoding({
    accessToken: 'pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ',
  });

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ';
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [84.3885, 33.7501], // Default center
      zoom: 12,
    });

    if (routeGeometry) {
      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: routeGeometry,
          },
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b9ddd",
            "line-width": 6,
          },
        });

        map.fitBounds(routeGeometry.coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds()
        ), {
          padding: 50,
        });
      });
    }
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
      />
    </div>
  );
};

export default Direction;
