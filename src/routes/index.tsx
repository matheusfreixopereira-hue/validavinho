import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AddressSearch } from "@/components/AddressSearch";
import { MapView, type MapSelection } from "@/components/MapView";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { HistorySidebar, type SavedAnalysis } from "@/components/HistorySidebar";

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

const DEFAULT_CENTER = { lat: -23.5613, lng: -46.6565 }; // São Paulo (Av. Paulista)

function Index() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [marker, setMarker] = useState<{ lat: number; lng: number; label?: string } | undefined>();
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [address, setAddress] = useState<string | undefined>();
  const [towersHint, setTowersHint] = useState(1);
  const [historyKey, setHistoryKey] = useState(0);

  const handleSelectionChange = useCallback((s: MapSelection | null) => {
    setSelection(s);
  }, []);

  const handleTowersChange = useCallback((n: number) => {
    setTowersHint(n);
  }, []);

  function handleHistorySelect(a: SavedAnalysis) {
    const c = { lat: a.center_lat, lng: a.center_lng };
    setCenter(c);
    setMarker({ ...c, label: a.name });
    if (a.address) setAddress(a.address);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <HistorySidebar onSelect={handleHistorySelect} refreshKey={historyKey} />

      <main className="relative flex flex-1 flex-col">
        <div className="absolute left-1/2 top-4 z-[1000] w-full max-w-xl -translate-x-1/2 px-4">
          <div className="rounded-xl bg-card/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur">
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

        <div className="flex-1 p-3">
          <MapView
            center={center}
            marker={marker}
            onSelectionChange={(s) => {
              handleSelectionChange(s);
              if (s) setHistoryKey((k) => k); // noop, kept for clarity
            }}
            numTowersHint={towersHint}
          />
        </div>

        <div className="absolute bottom-6 left-6 z-[900] max-w-xs rounded-lg bg-card/95 p-3 text-xs text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur">
          <strong className="text-foreground">Como usar:</strong> busque um
          endereço, use as ferramentas de desenho (canto superior direito do
          mapa) para traçar um <em>raio</em> ou <em>polígono</em> de torres,
          preencha os dados na lateral e gere o score.
        </div>
      </main>

      <AnalysisPanel
        selection={selection}
        address={address}
        onTowersChange={handleTowersChange}
        onSaved={() => setHistoryKey((k) => k + 1)}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}
