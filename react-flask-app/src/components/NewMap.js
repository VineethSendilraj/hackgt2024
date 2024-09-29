import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import "./Map.css";
import { Car, Footprints, Bike } from "lucide-react";

import { Tabs, TabList, Tab } from "@chakra-ui/react";
import { MoonIcon, SunIcon, Search2Icon } from "@chakra-ui/icons";
import { ButtonGroup, Image, Text } from "@chakra-ui/react";

import { GrPowerReset } from "react-icons/gr";

import {
  Button,
  Box,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";

import {
  FaLocationDot,
  FaLocationCrosshairs,
  FaSatellite,
} from "react-icons/fa6";

// Define this mapping outside the Direction component
const crimeTypeLabels = {
  "AGG ASSAULT": "Aggravated Assault",
  "AUTO THEFT": "Auto Theft",
  "LARCENY-FROM VEHICLE": "Larceny (Vehicle)",
  "LARCENY-NON VEHICLE": "Larceny (Non-Vehicle)",
  BURGLARY: "Burglary",
  HOMICIDE: "Homicide",
  ROBBERY: "Robbery",
};

const Direction = () => {
  const mapContainerRef = useRef(null);

  // State for map style
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/standard");

  // State for input text
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");

  // State for suggestions
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  // State for coordinates
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  // Other states
  const [mode, setMode] = useState("walking");

  const mapRef = useRef();
  const [directions, setDirections] = useState(null);
  const [showOriginSearch, setShowOriginSearch] = useState(false); // Visibility for origin search icon
  const [showDestinationSearch, setShowDestinationSearch] = useState(false); // Visibility for destination search icon

  // State to store visible clusters
  const [visibleClusters, setVisibleClusters] = useState([]);

  // Ref to store the latest visible clusters
  const visibleClustersRef = useRef(visibleClusters);

  const [allCrimes, setAllCrimes] = useState([]); // Added state for all crimes
  const [categorizedCrimes, setCategorizedCrimes] = useState({
    "AGG ASSAULT": [],
    "AUTO THEFT": [],
    "LARCENY-FROM VEHICLE": [],
    "LARCENY-NON VEHICLE": [],
    BURGLARY: [],
    HOMICIDE: [],
    ROBBERY: [],
  }); // New state for categorized crimes
  const [filteredCrimes, setFilteredCrimes] = useState([]); // Added state for filtered crimes

  // Initialize all crime types as checked
  const [crimeFilters, setCrimeFilters] = useState({
    "AGG ASSAULT": true,
    "AUTO THEFT": true,
    "LARCENY-FROM VEHICLE": true,
    "LARCENY-NON VEHICLE": true,
    BURGLARY: true,
    HOMICIDE: true,
    ROBBERY: true,
  });

  // Function to handle changes in crime filters
  const handleCrimeFiltersChange = (checkedValues) => {
    const updatedCrimeFilters = {};
    Object.keys(crimeFilters).forEach((crimeType) => {
      updatedCrimeFilters[crimeType] = checkedValues.includes(crimeType);
    });
    setCrimeFilters(updatedCrimeFilters);
  };

  const fetchCrimes = useCallback(async () => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/VineethSendilraj/hackgt2024/main/react-flask-app/src/data/2019_2020.geojson"
      );
      const data = await response.json();
      setAllCrimes(data.features);
      // Categorize crimes
      const tempCategorized = {
        "AGG ASSAULT": [],
        "AUTO THEFT": [],
        "LARCENY-FROM VEHICLE": [],
        "LARCENY-NON VEHICLE": [],
        BURGLARY: [],
        HOMICIDE: [],
        ROBBERY: [],
      };
      data.features.forEach((crime) => {
        const type = crime.properties.Crime_Type;
        if (tempCategorized[type]) {
          tempCategorized[type].push(crime);
        }
      });
      setCategorizedCrimes(tempCategorized);
      setFilteredCrimes(data.features); // Initially, all crimes are visible
      console.log("Fetched and Categorized Crimes Data:", data.features);
    } catch (error) {
      console.error("Error fetching crime data:", error);
    }
  }, []);

  useEffect(() => {
    fetchCrimes(); // Call fetchCrimes when the component mounts
  }, [fetchCrimes]);

  const [currentCenter, setCurrentCenter] = useState([-84.3879824, 33.7489954]);

  // Update the Ref whenever visibleClusters changes
  useEffect(() => {
    visibleClustersRef.current = visibleClusters;
  }, [visibleClusters]);

  // Add this useEffect to log visible clusters (optional)
  useEffect(() => {
    console.log("Visible Clusters:", visibleClusters);
  }, [visibleClusters]);

  const mapToken =
    "pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ";

  // Initialize Mapbox Geocoding client
  const geocodingClient = MapboxGeocoding({
    accessToken: mapToken,
  });

  useEffect(() => {
    mapboxgl.accessToken = mapToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: currentCenter,
      zoom: 14,
      doubleClickZoom: false, // Disable default double-click zoom
    });

    mapRef.current.on("moveend", () => {
      const center = mapRef.current.getCenter();
      setCurrentCenter([center.lng, center.lat]); // Update currentCenter with the new center
    });

    // Add navigation controls to the map (optional)
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Function to fetch visible clusters
    const fetchVisibleClusters = () => {
      if (!mapRef.current) return;

      // Query all rendered features in the 'clusters' layer
      const clusters = mapRef.current.queryRenderedFeatures({
        layers: ["clusters"], // Ensure this matches your clusters layer ID
      });

      // Optional: Process clusters if needed (e.g., extract specific properties)
      const processedClusters = clusters.map((cluster) => ({
        id: cluster.id,
        coordinates: cluster.geometry.coordinates,
        pointCount: cluster.properties.point_count,
        // Add other properties as needed
      }));
      setVisibleClusters(processedClusters);
    };

    mapRef.current.on("load", () => {
      // Add crimes source with initial filteredCrimes
      mapRef.current.addSource("crimes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: filteredCrimes,
        },
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      // Add clustering layers
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

            // Ensure clusters are fetched after the zoom completes
            mapRef.current.once("moveend", () => {
              // Use the Ref to access the latest visibleClusters
              const top50Clusters = [...visibleClustersRef.current]
                .sort((a, b) => b.pointCount - a.pointCount)
                .slice(0, 50);

              console.log("Top 50 clusters:", top50Clusters);

              // Prepare pointsToAvoid from the top 50 clusters
              const pointsToAvoid = top50Clusters
                .map(
                  (cluster) =>
                    `point(${cluster.coordinates[0]} ${cluster.coordinates[1]})`
                )
                .join(",");

              console.log("Points to avoid:", pointsToAvoid);

              if (originCoords) {
                getRoute(originCoords, coords, mode, pointsToAvoid);
              }
            });
          } else {
            console.error("Reverse geocoding failed for destination.");
          }
        })();
      });

      // Fetch visible clusters initially
      fetchVisibleClusters();

      // Set up event listeners to update visible clusters on view changes
      mapRef.current.on("moveend", fetchVisibleClusters);
      mapRef.current.on("zoomend", fetchVisibleClusters);
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off("moveend", fetchVisibleClusters);
        mapRef.current.off("zoomend", fetchVisibleClusters);
        mapRef.current.remove();
      }
    };
  }, [mapStyle, originCoords, mode]); // Removed 'filteredCrimes' from dependencies

  // Update the crimes source when filteredCrimes changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const geojson = {
        type: "FeatureCollection",
        features: filteredCrimes,
      };

      const crimesSource = mapRef.current.getSource("crimes");
      if (crimesSource) {
        crimesSource.setData(geojson);
      }
    }
  }, [filteredCrimes]);

  useEffect(() => {
    if (originCoords && destinationCoords) {
      getRoute(originCoords, destinationCoords, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, originCoords, destinationCoords]);

  useEffect(() => {
    if (originCoords && mapRef.current) {
      // Fly to the origin coordinates from the current center
      mapRef.current.flyTo({
        center: [-84.3879824, 33.7489954], // Use the new origin coordinates
        zoom: 12, // Adjust the zoom level as needed
        essential: true, // This animation is considered essential
        speed: 0.8,
      });
    }
  }, [originCoords]);

  useEffect(() => {
    if (originCoords && destinationCoords) {
      // Use the Ref to access the latest visibleClusters
      const top50Clusters = [...visibleClustersRef.current]
        .sort((a, b) => b.pointCount - a.pointCount)
        .slice(0, 50);

      // Prepare pointsToAvoid from the top 50 clusters
      const pointsToAvoid = top50Clusters
        .map(
          (cluster) =>
            `point(${cluster.coordinates[0]} ${cluster.coordinates[1]})`
        )
        .join(",");

      getRoute(originCoords, destinationCoords, mode, pointsToAvoid);
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
  const getRoute = async (start, end, mode, pointsToAvoid = "") => {
    try {
      // Prepare the base URL
      let url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapToken}`;

      // If pointsToAvoid is provided, include it in the URL
      if (pointsToAvoid) {
        console.log("Excluding VALUE NOW: " + pointsToAvoid);
        const excludeParam = encodeURIComponent(pointsToAvoid);
        url += `&exclude=${excludeParam}`;
      }

      const response = await fetch(url, { method: "GET" });
      const json = await response.json();

      // Check if routes exist
      if (!json.routes || json.routes.length === 0) {
        console.error("No routes found");

        /*
        new mapboxgl.Popup()
          .setLngLat(end)
          .setHTML(
            "<h3>No safe route found</h3><p>Follow the route plotted at your own risk.</p>"
          )
          .addTo(mapRef.current);
        */

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

      // Use the Ref to access the latest visibleClusters
      const top50Clusters = [...visibleClustersRef.current]
        .sort((a, b) => b.pointCount - a.pointCount)
        .slice(0, 50);

      // Prepare pointsToAvoid from the top 50 clusters
      const pointsToAvoid = top50Clusters
        .map(
          (cluster) =>
            `point(${cluster.coordinates[0]} ${cluster.coordinates[1]})`
        )
        .join(",");

      getRoute(
        originCoordsResult,
        destinationCoordsResult,
        mode,
        pointsToAvoid
      );
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

  // Function to handle origin suggestion selection
  const handleOriginSelect = (feature) => {
    setOriginInput(feature.place_name);
    setOriginCoords(feature.center);
    setOriginSuggestions([]);
    setShowOriginSuggestions(false);

    if (destinationCoords) {
      getRoute(feature.center, destinationCoords, mode);
    }
  };

  // Function to handle destination suggestion selection
  const handleDestinationSelect = (feature) => {
    setDestinationInput(feature.place_name);
    setDestinationCoords(feature.center);
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
    // Zoom to the selected destination
    mapRef.current.flyTo({ center: feature.center, zoom: 14 });

    if (originCoords) {
      getRoute(originCoords, feature.center, mode);
    }
  };

  // Fetch origin suggestions with debounce
  useEffect(() => {
    const fetchOriginSuggestions = async () => {
      if (originInput.trim() === "") {
        setOriginSuggestions([]);

        return;
      }

      try {
        const response = await geocodingClient
          .forwardGeocode({
            query: originInput,
            limit: 5,
          })
          .send();

        if (
          response &&
          response.body &&
          response.body.features &&
          response.body.features.length > 0
        ) {
          setOriginSuggestions(response.body.features);
        } else {
          setOriginSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching origin suggestions:", error);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchOriginSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [originInput, geocodingClient]);

  // Fetch destination suggestions with debounce
  useEffect(() => {
    const fetchDestinationSuggestions = async () => {
      if (destinationInput.trim() === "") {
        setDestinationSuggestions([]);
        return;
      }

      try {
        const response = await geocodingClient
          .forwardGeocode({
            query: destinationInput,
            limit: 5,
          })
          .send();

        if (
          response &&
          response.body &&
          response.body.features &&
          response.body.features.length > 0
        ) {
          setDestinationSuggestions(response.body.features);
        } else {
          setDestinationSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching destination suggestions:", error);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchDestinationSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [destinationInput, geocodingClient]);

  // Handle reset button
  const handleReset = () => {
    setOriginInput("");
    setDestinationInput("");
    setOriginCoords([-84.3879824, 33.7489954]);
    setDestinationCoords(null);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setDirections(null);

    // Remove the route layer from the map if it exists
    if (mapRef.current.getSource("route")) {
      mapRef.current.getSource("route").setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  };

  // Derive filteredCrimes using useMemo for optimization
  const derivedFilteredCrimes = useMemo(() => {
    const selectedCrimes = [];

    Object.keys(crimeFilters).forEach((crimeType) => {
      if (crimeFilters[crimeType]) {
        selectedCrimes.push(...categorizedCrimes[crimeType]);
      }
    });

    return selectedCrimes;
  }, [crimeFilters, categorizedCrimes]);

  // Update filteredCrimes state whenever derivedFilteredCrimes changes
  useEffect(() => {
    setFilteredCrimes(derivedFilteredCrimes);
  }, [derivedFilteredCrimes]);

  return (
    <div className="map-container">
      {/* Remove the script and link tags; they should be in your HTML */}
      {/* Map Style Selection */}
      <div className="map-mode-buttons">
        <Tabs variant="soft-rounded" colorScheme="green">
          <TabList>
            <Tab
              onClick={() =>
                handleStyleChange("mapbox://styles/mapbox/standard")
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
                handleStyleChange("mapbox://styles/mapbox/standard-satellite")
              }
            >
              <FaSatellite />
            </Tab>
          </TabList>
        </Tabs>
      </div>

      {/* Controls for Origin and Destination */}
      <div className="controls">
        <div
          className="logo-container"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Text
            fontFamily="Avenir, sans-serif" // or "Avenir Next, sans-serif" if using Google Fonts
            fontSize="24px" // Adjust size as needed
            margin="0"
          >
            safely
          </Text>
          <Image
            borderRadius="full"
            boxSize="50px" // Adjust the size as needed
            src="https://raw.githubusercontent.com/VineethSendilraj/hackgt2024/main/logo-removebg-preview.png"
            alt="Logo"
            paddingLeft="5px"
          />
        </div>
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
            onFocus={() => setShowOriginSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowOriginSuggestions(false), 100)
            } // Delay to allow click
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
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {originSuggestions.map((feature) => (
                <li
                  key={feature.id}
                  onClick={() => handleOriginSelect(feature)}
                  className="suggestion-item"
                >
                  {feature.place_name}
                </li>
              ))}
            </ul>
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
            placeholder="Enter destination or double-click on map"
            value={destinationInput}
            onChange={(e) => handleInputChange(e, setDestinationInput)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDestinationSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowDestinationSuggestions(false), 100)
            } // Delay to allow click
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
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {destinationSuggestions.map((feature) => (
                <li
                  key={feature.id}
                  onClick={() => handleDestinationSelect(feature)}
                  className="suggestion-item"
                >
                  {feature.place_name}
                </li>
              ))}
            </ul>
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

        {/* Crime Filters Accordion */}
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <FormLabel>Crime Involved</FormLabel>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <CheckboxGroup
                value={Object.keys(crimeFilters).filter(
                  (crimeType) => crimeFilters[crimeType]
                )}
                onChange={handleCrimeFiltersChange}
              >
                <SimpleGrid spacing={5} columns={2}>
                  {Object.keys(crimeFilters).map((crimeType) => (
                    <Checkbox key={crimeType} value={crimeType}>
                      {crimeTypeLabels[crimeType] || crimeType}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
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

            {/* Chakra UI Button */}
            <Button className="resetButton" onClick={handleReset}>
              <GrPowerReset />
            </Button>
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