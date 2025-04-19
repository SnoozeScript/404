import React, { useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapPanel = ({ latitude, longitude, onLocationChange }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("mapid").setView([latitude || 20.5937, longitude || 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }
    if (markerRef.current) {
      markerRef.current.remove();
    }
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true })
        .addTo(mapRef.current)
        .on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });
      mapRef.current.setView([latitude, longitude], 12);
    }
    // Click to set marker
    mapRef.current.on("click", (e) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    });
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [latitude, longitude]);

  return (
    <div id="mapid" style={{ height: "350px", width: "100%", borderRadius: "12px", overflow: "hidden" }}></div>
  );
};

export default MapPanel;
