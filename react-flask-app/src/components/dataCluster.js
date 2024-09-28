import React, { useState, useRef } from "react";
import ReactMapGL, { Marker } from "react-map-gl";
import useSupercluster from "use-supercluster";
import geojsonData from "./short_data.geojson"; // Adjust path based on your file location
import "./dataCluster.scss";

export default function dataCluster() {
  const [viewport, setViewport] = useState({
    latitude: 52.6376,
    longitude: -1.135171,
    width: "100vw",
    height: "100vh",
    zoom: 12
  });
  const mapRef = useRef();

  // Extract points from the GeoJSON data
  const points = geojsonData.features.map(feature => ({
    type: "Feature",
    properties: {
      cluster: false,
      crimeId: feature.properties.crimeId, // Adjust this based on your properties
      category: feature.properties.category // Adjust this based on your properties
    },
    geometry: {
      type: "Point",
      coordinates: feature.geometry.coordinates
    }
  }));

  const bounds = mapRef.current
    ? mapRef.current
        .getMap()
        .getBounds()
        .toArray()
        .flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <div>
      <ReactMapGL
        {...viewport}
        maxZoom={20}
        mapboxApiAccessToken={"pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ"}
        onViewportChange={newViewport => {
          setViewport({ ...newViewport });
        }}
        ref={mapRef}
      >
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 20}px`,
                    height: `${10 + (pointCount / points.length) * 20}px`
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );

                    mapRef.current.flyTo({
                      center: [longitude, latitude],
                      zoom: expansionZoom,
                      speed: 2, // Adjust fly-to speed (default: 1.42)
                      curve: 1, // Adjust animation curve (default: 1.42)
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker
              key={`crime-${cluster.properties.crimeId}`}
              latitude={latitude}
              longitude={longitude}
            >
              <button className="crime-marker">
                <img src="/custody.svg" alt="crime doesn't pay" />
              </button>
            </Marker>
          );
        })}
      </ReactMapGL>
    </div>
  );
}