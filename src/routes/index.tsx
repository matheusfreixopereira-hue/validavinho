import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AddressSearch } from "@/components/AddressSearch";
import { MapViewClient as MapView, type MapSelection } from "@/components/MapViewClient";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { SpaceSidebar } from "@/components/SpaceSidebar";
import type { MapType } from "@/components/MapView";

export const Route = createFileRoute("/")({
  component: Index,
});

const DEFAULT_CENTER = { lat: -22.999, lng: -43.36 }; // Barra da Tijuca

function Index() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [marker, setMarker] = useState<{ lat: number; lng: number; label?: string } | undefined>();
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [address, setAddress] = useState<string | undefined>();
  const [towersHint, setTowersHint] = useState(1);
  const [historyKey, setHistoryKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapType, setMapType] = useState<MapType>("osm");
  const [googleApiKey, setGoogleApiKey] = useState<string>("");

  const handleSelectionChange = useCallback((s: MapSelection | null) => {
    setSelection(s);
    if (s) setPanelOpen(true);
  }, []);

  const handleTowersChange = useCallback((n: number) => {
    setTowersHint(n);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[oklch(0.96_0.005_350)]">
      <SpaceSidebar />

      <main className="relative flex flex-1 flex-col">
        {/* Search bar — top */}
        <div className="absolute left-1/2 top-3 z-[1000] w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="rounded-full bg-white/95 shadow-[var(--shadow-elegant)] backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-[oklch(0.38_0.19_350)]" />
              <div className="flex-1">
                <AddressSearch
                  onSelect={(r) => {
                    const c = { lat: r.lat, lng: r.lng };
                    setCenter(c);
                    setMarker({ ...c, label: r.displayName });
                    setAddress(r.displayName);
                    setSelection({ type: "radius", center: c, radiusMeters: 500 });
                    setPanelOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2">
          <MapView
            center={center}
            marker={marker}
            onSelectionChange={handleSelectionChange}
            numTowersHint={towersHint}
            mapType={mapType}
            onMapTypeChange={setMapType}
            googleApiKey={googleApiKey}
            onGoogleApiKeyChange={setGoogleApiKey}
          />
        </div>

        {/* Watermark ValidaVinho */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[900] flex items-center gap-2 rounded-md bg-[oklch(0.38_0.19_350)]/90 px-3 py-1.5 shadow">
          <img
            src="https://iili.io/BSf2Wmv.webp"
            alt="Vinho24h"
            className="h-4 w-auto object-contain brightness-0 invert"
          />
          <span className="text-[10px] font-semibold text-white/80">ValidaVinho · OpenStreetMap</span>
        </div>

        {!panelOpen && selection && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute right-4 top-1/2 z-[900] -translate-y-1/2 rounded-l-lg bg-white px-2 py-3 text-xs shadow-[var(--shadow-elegant)] hover:bg-[oklch(0.96_0.005_350)]"
          >
            ◀ Análise
          </button>
        )}
      </main>

      {panelOpen && (
        <AnalysisPanel
          selection={selection}
          address={address}
          onTowersChange={handleTowersChange}
          onSaved={() => setHistoryKey((k) => k + 1)}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}
