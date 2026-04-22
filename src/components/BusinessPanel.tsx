import { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchBusinesses, exportToCsv, CATEGORY_MAP, type Business } from "@/lib/overpass";
import { lookupCnpj, formatCnpj, type CnpjData } from "@/lib/cnpj";
import type { MapSelection } from "./MapView";

interface Props {
  selection: MapSelection | null;
}

const ALL = "Todos";

export function BusinessPanel({ selection }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(ALL);

  const selKey = useMemo(() => {
    if (!selection) return null;
    if (selection.type === "radius") return `r:${selection.center.lat},${selection.center.lng},${selection.radiusMeters}`;
    return `p:${JSON.stringify(selection.coords)}`;
  }, [selection]);

  useEffect(() => {
    if (!selKey || !selection) return;
    setLoading(true);
    setError(null);
    setBusinesses([]);
    setFilter(ALL);
    const q = selection.type === "radius" ? { type: "radius" as const, lat: selection.center.lat, lng: selection.center.lng, radiusMeters: selection.radiusMeters ?? 500 } : { type: "polygon" as const, coords: ((selection.geojson?.geometry as GeoJSON.Polygon | undefined)?.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]) }; fetchBusinesses(q)
      .then(setBusinesses)
      .catch((e) => { const msg = e?.message ?? ""; setError(msg.includes("fetch") || msg === "" ? "Não foi possível conectar ao OpenStreetMap. Verifique sua conexão e tente novamente." : msg); })
      .finally(() => setLoading(false));
  }, [selKey]);

  const categories = useMemo(() => {
    const set = new Set(businesses.map((b) => b.category));
    return [ALL, ...Array.from(set).sort()];
  }, [businesses]);

  const visible = useMemo(
    () => (filter === ALL ? businesses : businesses.filter((b) => b.category === filter)).slice(0, 100),
    [businesses, filter]
  );

  if (!selection) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground px-4">
        <Search className="h-8 w-8 opacity-30" />
        <p>Selecione uma área no mapa para descobrir as atividades econômicas da região.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Buscando atividades via OpenStreetMap…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mx-1">
        {error}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground px-4">
        Nenhuma atividade encontrada nessa área no OpenStreetMap.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {businesses.length} atividade{businesses.length !== 1 ? "s" : ""} encontrada{businesses.length !== 1 ? "s" : ""}
          {businesses.length > 100 ? " (mostrando 100)" : ""}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => exportToCsv(businesses)}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border",
              filter === cat
                ? "bg-[oklch(0.38_0.19_350)] text-white border-[oklch(0.38_0.19_350)]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[oklch(0.38_0.19_350)] hover:text-[oklch(0.38_0.19_350)]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Business cards */}
      <div className="space-y-2">
        {visible.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
    </div>
  );
}

function BusinessCard({ business: b }: { business: Business }) {
  const [open, setOpen] = useState(false);
  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjData, setCnpjData] = useState<CnpjData | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  async function handleCnpjLookup() {
    setCnpjError(null);
    setCnpjData(null);
    setCnpjLoading(true);
    try {
      const data = await lookupCnpj(cnpjInput);
      setCnpjData(data);
    } catch (e: unknown) {
      setCnpjError(e instanceof Error ? e.message : "Erro ao consultar CNPJ");
    } finally {
      setCnpjLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm text-sm">
      <div className="p-2.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-gray-900 leading-tight">{b.name}</span>
          <span className="shrink-0 rounded-full bg-[oklch(0.95_0.03_350)] text-[oklch(0.38_0.19_350)] px-2 py-0.5 text-[10px] font-medium">
            {b.category}
          </span>
        </div>
        {b.address && <p className="text-xs text-gray-500">{b.address}</p>}
        {b.openingHours && <p className="text-xs text-gray-400">{b.openingHours}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {b.phone && (
            <a href={`tel:${b.phone}`} className="text-blue-600 hover:underline">
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className="text-blue-600 hover:underline truncate max-w-[160px]">
              {b.email}
            </a>
          )}
          {b.website && (
            <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[160px]">
              {b.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* CNPJ accordion */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-500 border-t border-gray-100 hover:bg-gray-50 transition-colors"
      >
        Consultar CNPJ (Receita Federal)
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-gray-50">
          <div className="flex gap-1.5 mt-2">
            <Input
              value={cnpjInput}
              onChange={(e) => setCnpjInput(formatCnpj(e.target.value))}
              placeholder="00.000.000/0001-00"
              className="h-7 text-xs"
              maxLength={18}
            />
            <Button
              size="sm"
              className="h-7 text-xs bg-[oklch(0.38_0.19_350)] hover:bg-[oklch(0.32_0.19_350)] text-white"
              onClick={handleCnpjLookup}
              disabled={cnpjLoading}
            >
              {cnpjLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buscar"}
            </Button>
          </div>

          {cnpjError && <p className="text-xs text-red-600">{cnpjError}</p>}

          {cnpjData && (
            <div className="space-y-1 text-xs rounded-md bg-gray-50 p-2">
              <p className="font-semibold text-gray-800">{cnpjData.razaoSocial}</p>
              {cnpjData.nomeFantasia && <p className="text-gray-500">{cnpjData.nomeFantasia}</p>}
              <p>
                Situação:{" "}
                <span
                  className={cn(
                    "font-medium",
                    cnpjData.situacao.toLowerCase().includes("ativa") ? "text-green-600" : "text-red-500"
                  )}
                >
                  {cnpjData.situacao}
                </span>
              </p>
              {cnpjData.cnaeDescricao && <p className="text-gray-500">CNAE: {cnpjData.cnaeDescricao}</p>}
              {cnpjData.telefone && <p>Tel: {cnpjData.telefone}</p>}
              {cnpjData.email && <p>Email: {cnpjData.email}</p>}
              {cnpjData.endereco && <p>{cnpjData.endereco}</p>}
              {cnpjData.municipio && <p>{cnpjData.municipio}{cnpjData.uf ? ` / ${cnpjData.uf}` : ""}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}