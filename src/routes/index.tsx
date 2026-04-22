import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AddressSearch } from "@/components/AddressSearch";
import { MapViewClient as MapView, type MapSelection } from "@/components/MapViewClient";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { SpaceSidebar } from "@/components/SpaceSidebar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "validavinho — Análise de viabilidade para adegas" },
      {
        name: "description",
        content:
          "Plataforma de análise geográfica para identificar regiões ideais para abertura de adegas: score de viabilidade, potencial de consumo e recomendações automáticas.",
      },
      { property: "og:title", content: "validavinho" },
      {
        property: "og:description",
        content: "Análise de viabilidade geográfica para adegas e franquias.",
      },
    ],
  }),
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

  const handleSelectionChange = useCallback((s: MapSelection | null) => {
    setSelection(s);
    if (s) setPanelOpen(true);
  }, []);

  const handleTowersChange = useCallback((n: number) => {
    setTowersHint(n);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[oklch(0.96_0.005_260)]">
      <SpaceSidebar />

      <main className="relative flex flex-1 flex-col">
        {/* Search bar — top */}
        <div className="absolute left-1/2 top-3 z-[1000] w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="rounded-full bg-white/95 shadow-[var(--shadow-elegant)] backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-[oklch(0.5_0.02_260)]" />
              <div className="flex-1">
                <AddressSearch
                  onSelect={(r) => {
                    const c = { lat: r.lat, lng: r.lng };
                    setCenter(c);
                    setMarker({ ...c, label: r.displayName });
                    setAddress(r.displayName);
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
          />
        </div>

        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[900] rounded-md bg-amber-500/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
          Estudo de viabilidade Vinho24h — OpenStreetMap
        </div>

        {!panelOpen && selection && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute right-4 top-1/2 z-[900] -translate-y-1/2 rounded-l-lg bg-white px-2 py-3 text-xs shadow-[var(--shadow-elegant)] hover:bg-[oklch(0.96_0.005_260)]"
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
