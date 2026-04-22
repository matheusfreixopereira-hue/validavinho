import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet-draw";
import { Map as MapIcon, Satellite, Globe } from "lucide-react";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type MapType = "osm" | "satellite" | "google-satellite" | "google-roadmap";

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
  mapType?: MapType;
  onMapTypeChange?: (type: MapType) => void;
  googleApiKey?: string;
  onGoogleApiKeyChange?: (key: string) => void;
}

const TILE_LAYERS: Record<MapType, { url: string; attribution: string; maxZoom: number }> = {
  osm: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "OpenStreetMap", maxZoom: 19 },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "ESRI World Imagery", maxZoom: 19 },
  "google-satellite": { url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", attribution: "Google Maps", maxZoom: 21 },
  "google-roadmap": { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", attribution: "Google Maps", maxZoom: 21 },
};

const MAP_OPTIONS = [
  { type: "osm" as MapType, icon: MapIcon, label: "Mapa", group: "OpenStreetMap" },
  { type: "satellite" as MapType, icon: Satellite, label: "Satelite", group: "ESRI (gratis)" },
  { type: "google-satellite" as MapType, icon: Satellite, label: "Google Sat.", group: "Google Maps" },
  { type: "google-roadmap" as MapType, icon: Globe, label: "Google Ruas", group: "Google Maps" },
];

export function MapView({ center, marker, onSelectionChange, numTowersHint = 1, mapType = "osm", onMapTypeChange, googleApiKey = "", onGoogleApiKeyChange }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const towersRef = useRef(numTowersHint);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(googleApiKey);
  const [showApiInput, setShowApiInput] = useState(false);

  useEffect(() => { towersRef.current = numTowersHint; }, [numTowersHint]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [center.lat, center.lng], zoom: 16, zoomControl: true });
    const tileConf = TILE_LAYERS["osm"];
    tileLayerRef.current = L.tileLayer(tileConf.url, { attribution: tileConf.attribution, maxZoom: tileConf.maxZoom }).addTo(map);
    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);
    const drawControl = new (L as any).Control.Draw({
      position: "topright",
      edit: { featureGroup: drawn, remove: true },
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: "#8B1A4A", weight: 3, fillOpacity: 0.18 } },
        circle: { shapeOptions: { color: "#6b1040", weight: 2, fillOpacity: 0.15 } },
        polyline: false, rectangle: false, marker: false, circlemarker: false,
      },
    });
    map.addControl(drawControl);
    map.on((L as any).Draw.Event.CREATED, (e: any) => { drawn.clearLayers(); drawn.addLayer(e.layer); emitSelection(e.layer, map); });
    map.on((L as any).Draw.Event.EDITED, () => { const ls = drawn.getLayers(); if (ls[0]) emitSelection(ls[0] as L.Layer, map); });
    map.on((L as any).Draw.Event.DELETED, () => onSelectionChange(null));
    mapRef.current = map; drawnItemsRef.current = drawn;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; tileLayerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tileConf = TILE_LAYERS[mapType];
    const isG = mapType === "google-satellite" || mapType === "google-roadmap";
    const url = isG && googleApiKey ? tileConf.url + "&key=" + googleApiKey : tileConf.url;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(url, { attribution: tileConf.attribution, maxZoom: tileConf.maxZoom }).addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapType, googleApiKey]);

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
      onSelectionChange({ type: "radius", center: { lat: c.lat, lng: c.lng }, radiusMeters: Math.round(layer.getRadius()) });
    } else if (layer instanceof L.Polygon) {
      const c = (layer as L.Polygon).getBounds().getCenter();
      onSelectionChange({ type: "polygon", center: { lat: c.lat, lng: c.lng }, geojson: (layer as any).toGeoJSON(), numTowers: towersRef.current });
    }
  }

  const isGoogle = mapType === "google-satellite" || mapType === "google-roadmap";
  const activeOpt = MAP_OPTIONS.find((o) => o.type === mapType) ?? MAP_OPTIONS[0];

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full rounded-lg border border-border shadow-[var(--shadow-soft)]" />
      <div className="absolute bottom-10 right-3 z-[1000] flex flex-col items-end gap-1">
        {switcherOpen && (
          <div className="mb-1 flex flex-col gap-1 rounded-xl border border-border bg-white/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur-sm min-w-[175px]">
            <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.38_0.19_350)]">Tipo de mapa</div>
            {MAP_OPTIONS.map((opt) => (
              <button key={opt.type}
                onClick={() => {
                  if ((opt.type === "google-satellite" || opt.type === "google-roadmap") && !googleApiKey) setShowApiInput(true);
                  onMapTypeChange?.(opt.type); setSwitcherOpen(false);
                }}
                className={["flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] transition-colors text-left w-full",
                  mapType === opt.type ? "bg-[oklch(0.38_0.19_350)] text-white font-semibold" : "text-[oklch(0.25_0.05_350)] hover:bg-[oklch(0.96_0.005_350)]",
                ].join(" ")}
              >
                <opt.icon className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{opt.label}</div>
                  <div className={["text-[10px]", mapType === opt.type ? "text-white/70" : "text-[oklch(0.5_0.02_350)]"].join(" ")}>{opt.group}</div>
                </div>
                {(opt.type === "google-satellite" || opt.type === "google-roadmap") && (
                  <span className={["ml-auto rounded-[3px] px-1 py-px text-[9px] font-bold", googleApiKey ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"].join(" ")}>
                    {googleApiKey ? "OK" : "API"}
                  </span>
                )}
              </button>
            ))}
            {showApiInput && (
              <div className="mt-1 border-t border-border pt-2">
                <div className="mb-1 text-[10px] text-[oklch(0.5_0.02_350)]">Chave API Google Maps</div>
                <div className="flex gap-1">
                  <input type="password" placeholder="AIza..." value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                    className="h-7 flex-1 rounded-md border border-border px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-[oklch(0.38_0.19_350)]" />
                  <button onClick={() => { onGoogleApiKeyChange?.(apiKeyInput); setShowApiInput(false); }}
                    className="rounded-md bg-[oklch(0.38_0.19_350)] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[oklch(0.42_0.18_350)]">
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={() => setSwitcherOpen((o) => !o)}
          className={["flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold shadow-[var(--shadow-elegant)] transition-all",
            switcherOpen ? "bg-[oklch(0.38_0.19_350)] text-white" : "bg-white/95 text-[oklch(0.25_0.05_350)] hover:bg-white",
          ].join(" ")}
        >
          <activeOpt.icon className="h-3.5 w-3.5" />
          {activeOpt.label}
          {isGoogle && googleApiKey && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
      </div>
    </div>
  );
}
