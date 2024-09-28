import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import './Map.scss'; // Import CSS file for custom styling
import {Car, Footprints, Bike } from 'lucide-react'; // Import from react-icons

const Direction = () => {
  const mapContainerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [mode, setMode] = useState('walking'); // Default mode is walking
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
      // Clustering logic
      mapRef.current.addSource('crimes', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/VineethSendilraj/hackgt2024/main/react-flask-app/src/components/data_1.geojson',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 75
      });

      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'crimes',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            25, // Increased base size for a modern look
            100,
            35,
            750,
            45
          ],
          'circle-opacity': 0.8, // Slight transparency for a softer look
          'circle-stroke-width': 2, // Adding a stroke width
          'circle-stroke-color': '#fff', // Stroke color
          'circle-stroke-opacity': 0.6 // Slight transparency on the stroke
        }
      });

      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'crimes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14, // Increased text size for better visibility
          'text-color': '#fff' // Modern white text for contrast
        }
      });

      mapRef.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'crimes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 6, // Slightly larger radius for unclustered points
          'circle-opacity': 0.9, // Higher opacity for visibility
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-stroke-opacity': 0.6
        }
      });

      mapRef.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'crimes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 6,
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-stroke-opacity': 0.6
        }
      });
  

      // Inspect a cluster on click
      mapRef.current.on('click', 'clusters', (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current
          .getSource('crimes')
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          });
      });

      // Popup for unclustered points
      mapRef.current.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
      
        // Create HTML content for the popup
        let popupContent = '';
        Object.entries(properties).forEach(([key, value]) => {
          popupContent += `${key}: ${value}<br>`;
        });
      
        // Adjust coordinates for the popup
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
      
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent) // Set the HTML content with all properties
          .addTo(mapRef.current);
      });
      
      // Change cursor style on mouse enter/leave
      mapRef.current.on('mouseenter', 'clusters', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current.on('mouseleave', 'clusters', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });

      // Route geometry
      if (routeGeometry) {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: routeGeometry,
          },
        });

        mapRef.current.addLayer({
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

        mapRef.current.fitBounds(routeGeometry.coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds()
        ), {
          padding: 50,
        });
      }
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

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
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

        <div className="mode-buttons">
          <button
            className={`mode-button ${mode === 'driving' ? 'selected' : ''}`}
            onClick={() => handleModeChange('driving')}
          >
            <Car />
          </button>
          <button
            className={`mode-button ${mode === 'walking' ? 'selected' : ''}`}
            onClick={() => handleModeChange('walking')}
          >
            <Footprints />
          </button>
          <button
            className={`mode-button ${mode === 'cycling' ? 'selected' : ''}`}
            onClick={() => handleModeChange('cycling')}
          >
            <Bike />
          </button>
          <button onClick={calculateRoute}>Get Directions</button>
        </div>

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
