import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { fetchBusinesses, type Business } from "@/lib/overpass";
import { BusinessChat } from "./BusinessChat";
import type { MapSelection } from "./MapView";

interface Props {
  selection: MapSelection | null;
}

export function BusinessPanel({ selection }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const selKey = useMemo(() => {
    if (!selection) return null;
    if (selection.type === "radius")
      return `r:${selection.center.lat},${selection.center.lng},${selection.radiusMeters}`;
    return `p:${JSON.stringify(selection.geojson)}`;
  }, [selection]);

  useEffect(() => {
    if (!selKey || !selection) return;
    setLoading(true);
    setError(null);
    setBusinesses([]);
    const q =
      selection.type === "radius"
        ? {
            type: "radius" as const,
            lat: selection.center.lat,
            lng: selection.center.lng,
            radiusMeters: selection.radiusMeters ?? 500,
          }
        : {
            type: "polygon" as const,
            coords: (
              (selection.geojson?.geometry as GeoJSON.Polygon | undefined)?.coordinates[0] ?? []
            ).map(([lng, lat]) => [lat, lng]),
          };
    fetchBusinesses(q)
      .then(setBusinesses)
      .catch((e) => {
        const msg = e?.message ?? "";
        setError(
          msg.includes("fetch") || msg === ""
            ? "Nao foi possivel conectar ao OpenStreetMap. Verifique sua conexao e tente novamente."
            : msg
        );
      })
      .finally(() => setLoading(false));
  }, [selKey, retryCount]);

  if (!selection) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground px-4">
        <Search className="h-8 w-8 opacity-30" />
        <p>Selecione uma area no mapa para descobrir as atividades economicas da regiao.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Buscando atividades via OpenStreetMap...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2 text-sm text-red-700 mx-1">
        <p>{error}</p>
        <button
          onClick={() => setRetryCount((n) => n + 1)}
          className="underline text-xs hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground px-4">
        Nenhuma atividade encontrada nessa area no OpenStreetMap.
      </div>
    );
  }

  return <BusinessChat businesses={businesses} total={businesses.length} />;
}
