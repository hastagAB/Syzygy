"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSearchStore } from "@/lib/store/search-store";

export default function TransitMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const groundTrackLayerRef = useRef<L.LayerGroup | null>(null);

  const location = useSearchStore((s) => s.location);
  const radiusKm = useSearchStore((s) => s.radiusKm);
  const setLocation = useSearchStore((s) => s.setLocation);
  const transits = useSearchStore((s) => s.transits);
  const selectedTransitId = useSearchStore((s) => s.selectedTransitId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [45.46, 9.19],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      setLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    groundTrackLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [setLocation]);

  // Update marker and circle when location/radius changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (location) {
      markerRef.current = L.marker([location.lat, location.lon]).addTo(map);

      circleRef.current = L.circle([location.lat, location.lon], {
        radius: radiusKm * 1000,
        color: "#6366f1",
        fillColor: "#6366f1",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map);

      map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [location, radiusKm]);

  // Render ground tracks for transits
  useEffect(() => {
    const layer = groundTrackLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const transit of transits) {
      const isSelected = transit.id === selectedTransitId;
      const color = transit.target === "sun" ? "#f59e0b" : "#94a3b8";
      const weight = isSelected ? 4 : 2;
      const opacity = isSelected ? 1 : 0.6;

      // Draw centerline
      if (transit.groundTrack.centerline.length >= 2) {
        const latlngs = transit.groundTrack.centerline.map(
          (p) => [p.lat, p.lon] as [number, number],
        );
        L.polyline(latlngs, { color, weight, opacity }).addTo(layer);
      }

      // Draw observation point marker
      const obsPoint = transit.observationPoint;
      L.circleMarker([obsPoint.lat, obsPoint.lon], {
        radius: isSelected ? 8 : 5,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1,
      })
        .bindPopup(
          `<b>${transit.satellite.name}</b><br/>` +
            `${transit.target === "sun" ? "Solar" : "Lunar"} transit<br/>` +
            `Quality: ${transit.quality.score}/100`,
        )
        .addTo(layer);
    }
  }, [transits, selectedTransitId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      data-testid="transit-map"
    />
  );
}
