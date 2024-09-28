import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import "./Map.css";
import { Car, Footprints, Bike } from "lucide-react";

import { Tabs, TabList, Tab } from "@chakra-ui/react";
import { MoonIcon, SunIcon, Search2Icon } from "@chakra-ui/icons";

import {
  FaLocationDot,
  FaLocationCrosshairs,
  FaSatellite,
} from "react-icons/fa6";

const Direction = () => {
  const mapContainerRef = useRef(null);

  // State for map style
  const [mapStyle, setMapStyle] = useState(
    "mapbox://styles/mapbox/streets-v11"
  );

  // State for input text
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");

  // State for coordinates
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  // Other states
  const [mode, setMode] = useState("walking");
  const mapRef = useRef();
  const [directions, setDirections] = useState(null);
  const [showOriginSearch, setShowOriginSearch] = useState(false); // Visibility for origin search icon
  const [showDestinationSearch, setShowDestinationSearch] = useState(false); // Visibility for destination search icon

  const mapToken = process.env.REACT_APP_MAP_TOKEN;

  // Initialize Mapbox Geocoding client
  const geocodingClient = MapboxGeocoding({
    accessToken: mapToken,
  });

  useEffect(() => {
    mapboxgl.accessToken = mapToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-84.3879824, 33.7489954],
      zoom: 12,
      doubleClickZoom: false, // Disable default double-click zoom
    });

    // Add navigation controls to the map (optional)
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    mapRef.current.on("load", () => {
      // Clustering logic
      mapRef.current.addSource("crimes", {
        type: "geojson",
        data: "https://raw.githubusercontent.com/VineethSendilraj/hackgt2024/main/react-flask-app/src/components/data_1.geojson",
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 75,
      });

      mapRef.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "crimes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            100,
            "#f1f075",
            750,
            "#f28cb1",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            25,
            100,
            35,
            750,
            45,
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-stroke-opacity": 0.6,
        },
      });

      mapRef.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "crimes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
      });

      mapRef.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "crimes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#11b4da",
          "circle-radius": 6,
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-stroke-opacity": 0.6,
        },
      });

      // Inspect a cluster on click
      mapRef.current.on("click", "clusters", (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current
          .getSource("crimes")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // Popup for unclustered points
      mapRef.current.on("click", "unclustered-point", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        let popupContent = "";
        Object.entries(properties).forEach(([key, value]) => {
          popupContent += `${key}: ${value}<br>`;
        });

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(mapRef.current);
      });

      // Change cursor style on mouse enter/leave
      mapRef.current.on("mouseenter", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      });
      mapRef.current.on("mouseleave", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "";
      });

      // Add double-click event for setting destination
      mapRef.current.on("dblclick", (event) => {
        (async () => {
          const coords = [event.lngLat.lng, event.lngLat.lat];
          const address = await reverseGeocodeAddress(coords);
          if (address) {
            setDestinationInput(address);
            setDestinationCoords(coords);
            if (originCoords) {
              getRoute(originCoords, coords, mode);
            }
          } else {
            console.error("Reverse geocoding failed for destination.");
          }
        })();
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle, originCoords, mode]);

  useEffect(() => {
    if (originCoords && destinationCoords) {
      getRoute(originCoords, destinationCoords, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, originCoords, destinationCoords]);

  // Function to handle map style changes
  const handleStyleChange = (newStyle) => {
    setMapStyle(newStyle);
  };

  // Function to handle key presses in input fields
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission or other default behavior
      calculateRoute();
    }
  };

  // Function to get the route between two coordinates
  const getRoute = async (start, end, mode) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${mode}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapToken}`,
        { method: "GET" }
      );
      const json = await response.json();

      // Check if routes exist
      if (!json.routes || json.routes.length === 0) {
        console.error("No routes found");
        return;
      }

      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: route,
        },
      };

      // If the route already exists on the map, reset it using setData
      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(geojson);
      } else {
        // Add a new layer to the map
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: geojson,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }

      // Fit the map to the route
      const bounds = new mapboxgl.LngLatBounds();
      route.forEach((coord) => bounds.extend(coord));
      mapRef.current.fitBounds(bounds, {
        padding: 50,
      });

      // Add turn instructions
      const steps = data.legs[0].steps;
      const tripInstructions = steps.map((step) => step.maneuver.instruction);
      setDirections({
        duration: Math.floor(data.duration / 60),
        distance: Math.round((data.distance / 1000) * 10) / 10, // Convert to km and round to 1 decimal place
        instructions: tripInstructions,
      });
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Function to handle input changes
  const handleInputChange = (event, setFunction) => {
    setFunction(event.target.value);
  };

  // Function to handle mode changes
  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
  };

  // Function to calculate route based on input fields
  const calculateRoute = async () => {
    if (!originInput.trim() || !destinationInput.trim()) {
      console.error("Origin and destination cannot be empty.");
      return;
    }

    const originCoordsResult = await geocodeAddress(originInput);
    const destinationCoordsResult = await geocodeAddress(destinationInput);

    if (originCoordsResult && destinationCoordsResult) {
      setOriginCoords(originCoordsResult);
      setDestinationCoords(destinationCoordsResult);
      getRoute(originCoordsResult, destinationCoordsResult, mode);
    } else {
      console.error("Geocoding failed for origin or destination.");
    }
  };

  // Function to geocode address to coordinates
  const geocodeAddress = async (address) => {
    try {
      const response = await geocodingClient
        .forwardGeocode({
          query: address,
          limit: 1,
        })
        .send();

      if (
        response &&
        response.body &&
        response.body.features &&
        response.body.features.length > 0
      ) {
        return response.body.features[0].center;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }
    return null;
  };

  // Function to reverse geocode coordinates to address
  const reverseGeocodeAddress = async (coords) => {
    try {
      const response = await geocodingClient
        .reverseGeocode({
          query: coords,
          limit: 1,
        })
        .send();

      if (
        response &&
        response.body &&
        response.body.features &&
        response.body.features.length > 0
      ) {
        return response.body.features[0].place_name;
      }
    } catch (error) {
      console.error("Error reverse geocoding address:", error);
    }
    return null;
  };

  return (
    <div className="map-container">
      {/* Map Style Selection */}
      <div className="map-mode-buttons">
        <Tabs variant="soft-rounded" colorScheme="green">
          <TabList>
            <Tab
              onClick={() =>
                handleStyleChange("mapbox://styles/mapbox/streets-v12")
              }
            >
              <SunIcon />
            </Tab>
            <Tab
              onClick={() =>
                handleStyleChange("mapbox://styles/mapbox/navigation-night-v1")
              }
            >
              <MoonIcon />
            </Tab>
            <Tab
              onClick={() =>
                handleStyleChange(
                  "mapbox://styles/mapbox/satellite-streets-v12"
                )
              }
            >
              <FaSatellite />
            </Tab>
          </TabList>
        </Tabs>
      </div>

      {/* Controls for Origin and Destination */}
      <div className="controls">
        {/* Origin Input */}
        <div
          className="input-container"
          onMouseEnter={() => setShowOriginSearch(true)}
          onMouseLeave={() => setShowOriginSearch(false)}
        >
          <FaLocationCrosshairs className="input-icon" />
          <input
            type="text"
            id="origin"
            placeholder="Enter origin"
            value={originInput}
            onChange={(e) => handleInputChange(e, setOriginInput)}
            onKeyDown={handleKeyDown}
          />
          {showOriginSearch && ( // Show icon only on hover
            <Search2Icon
              className="search-icon"
              onClick={() => {
                if (originInput.trim()) {
                  calculateRoute();
                }
              }}
              style={{ cursor: "pointer" }} // Change cursor to pointer
            />
          )}
        </div>

        {/* Destination Input */}
        <div
          className="input-container"
          onMouseEnter={() => setShowDestinationSearch(true)}
          onMouseLeave={() => setShowDestinationSearch(false)}
        >
          <FaLocationDot className="input-icon" />
          <input
            type="text"
            id="destination"
            placeholder="Enter destination or double-click on map to set"
            value={destinationInput}
            onChange={(e) => handleInputChange(e, setDestinationInput)}
            onKeyDown={handleKeyDown}
          />
          {showDestinationSearch && ( // Show icon only on hover
            <Search2Icon
              className="search-icon"
              onClick={() => {
                if (destinationInput.trim()) {
                  calculateRoute();
                }
              }}
              style={{ cursor: "pointer" }} // Change cursor to pointer
            />
          )}
        </div>

        {/* Mode Selection and Get Directions Button */}
        <Tabs variant="soft-rounded" colorScheme="green">
          <TabList>
            <Tab onClick={() => handleModeChange("driving")}>
              <Car />
            </Tab>
            <Tab onClick={() => handleModeChange("walking")}>
              <Footprints />
            </Tab>
            <Tab onClick={() => handleModeChange("cycling")}>
              <Bike />
            </Tab>
            {/* <button onClick={calculateRoute} style={{ marginLeft: "10px" }}>
              Get Directions
            </button> */}
          </TabList>
        </Tabs>
      </div>

      {/* Map Display */}
      <div ref={mapContainerRef} className="map" style={{ height: "100vh" }} />

      {/* Directions Display */}
      {directions && (
        <div id="instructions">
          <div className="direction-header">
            <span>
              {mode === "driving" && <Car />}
              {mode === "walking" && <Footprints />}
              {mode === "cycling" && <Bike />}
            </span>
            <p>
              <strong>
                Trip duration: {directions.duration} min ({directions.distance}{" "}
                km)
              </strong>
            </p>
          </div>
          <ol>
            {directions.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default Direction;
