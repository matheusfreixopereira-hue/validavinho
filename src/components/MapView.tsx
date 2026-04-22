import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";

// Ícone padrão do Leaflet (fix para bundlers)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapSelection {
  type: "radius" | "polygon";
  center: { lat: number; lng: number };
  radiusMeters?: number;
  geojson?: GeoJSON.Feature;
  numTowers?: number;
}

interface MapViewProps {
  center: { lat: number; lng: number };
  marker?: { lat: number; lng: number; label?: string };
  onSelectionChange: (selection: MapSelection | null) => void;
  numTowersHint?: number;
}

export function MapView({
  center,
  marker,
  onSelectionChange,
  numTowersHint = 1,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const towersRef = useRef(numTowersHint);

  useEffect(() => {
    towersRef.current = numTowersHint;
  }, [numTowersHint]);

  // init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);

    const drawControl = new (L as any).Control.Draw({
      position: "topright",
      edit: { featureGroup: drawn, remove: true },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#6b1818", weight: 3, fillOpacity: 0.18 },
        },
        circle: {
          shapeOptions: { color: "#3d0a0a", weight: 2, fillOpacity: 0.15 },
        },
        polyline: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      drawn.clearLayers();
      drawn.addLayer(e.layer);
      emitSelection(e.layer, map);
    });
    map.on((L as any).Draw.Event.EDITED, () => {
      const layers = drawn.getLayers();
      if (layers[0]) emitSelection(layers[0] as L.Layer, map);
    });
    map.on((L as any).Draw.Event.DELETED, () => {
      onSelectionChange(null);
    });

    mapRef.current = map;
    drawnItemsRef.current = drawn;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update marker + center
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], 16);
    if (marker) {
      if (markerRef.current) {
        markerRef.current.setLatLng([marker.lat, marker.lng]);
        if (marker.label) markerRef.current.bindPopup(marker.label).openPopup();
      } else {
        markerRef.current = L.marker([marker.lat, marker.lng]).addTo(map);
        if (marker.label) markerRef.current.bindPopup(marker.label).openPopup();
      }
    }
  }, [center.lat, center.lng, marker?.lat, marker?.lng, marker?.label]);

  function emitSelection(layer: L.Layer, map: L.Map) {
    if (layer instanceof L.Circle) {
      const c = layer.getLatLng();
      onSelectionChange({
        type: "radius",
        center: { lat: c.lat, lng: c.lng },
        radiusMeters: Math.round(layer.getRadius()),
      });
    } else if (layer instanceof L.Polygon) {
      const c = (layer as L.Polygon).getBounds().getCenter();
      const geojson = (layer as any).toGeoJSON() as GeoJSON.Feature;
      onSelectionChange({
        type: "polygon",
        center: { lat: c.lat, lng: c.lng },
        geojson,
        numTowers: towersRef.current,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border shadow-[var(--shadow-soft)]"
    />
  );
}
