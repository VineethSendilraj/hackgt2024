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
      // Clustering logic
      mapRef.current.addSource('earthquakes', {
        type: 'geojson',
        data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'earthquakes',
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
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      mapRef.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'earthquakes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Inspect a cluster on click
      mapRef.current.on('click', 'clusters', (e) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current
          .getSource('earthquakes')
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
        const mag = e.features[0].properties.mag;
        const tsunami = e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`)
          .addTo(mapRef.current);
      });

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
