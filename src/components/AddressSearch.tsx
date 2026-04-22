import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X, MapPin, Hash } from "lucide-react";
import { geocode, type GeocodeResult } from "@/lib/geocode";

interface Props {
  onSelect: (r: GeocodeResult) => void;
}

function detectInputType(q: string): "cep" | "coords" | "address" {
  if (/^\d{5}-?\d{3}$/.test(q.trim())) return "cep";
  if (/^-?\d{1,3}[.,]\d+\s*[,;\s]\s*-?\d{1,3}[.,]\d+$/.test(q.trim())) return "coords";
  return "address";
}

export function AddressSearch({ onSelect }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputType = detectInputType(q);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); setOpen(false); return; }

    // CEP and coords: immediate (no debounce, no min length)
    const isCepOrCoords = inputType === "cep" || inputType === "coords";
    const minChars = isCepOrCoords ? 0 : 3;
    if (trimmed.length < minChars) { setResults([]); setOpen(false); return; }

    const delay = isCepOrCoords ? 100 : 450;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await geocode(trimmed);
        setResults(r);
        setOpen(r.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, inputType]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(r: GeocodeResult) {
    onSelect(r);
    setQ(r.shortName);
    setResults([]);
    setOpen(false);
  }

  const InputIcon =
    inputType === "cep" ? Hash :
    inputType === "coords" ? MapPin :
    Search;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center rounded-full border border-white/20 bg-white/95 shadow-lg backdrop-blur-sm overflow-hidden">
        <InputIcon className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); return; }
            if (e.key === "Enter" && results.length > 0) select(results[0]);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Endereco, bairro, CEP ou -22.97,-43.39..."
          className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-400 shrink-0" />}
        {!loading && q && (
          <button onClick={() => { setQ(""); setResults([]); setOpen(false); }}
            className="mr-1 rounded-full p-1 hover:bg-gray-100">
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => results.length > 0 && select(results[0])}
          className="m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[oklch(0.38_0.19_350)] text-white hover:bg-[oklch(0.32_0.19_350)] transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-64 overflow-auto rounded-xl border border-gray-100 bg-white shadow-xl text-sm">
          {results.map((r, i) => (
            <li key={i} onMouseDown={(e) => { e.preventDefault(); select(r); }}
              className="cursor-pointer border-b border-gray-50 px-4 py-2.5 last:border-0 hover:bg-[oklch(0.97_0.02_350)]">
              <p className="font-medium text-gray-900 truncate">{r.shortName}</p>
              {r.shortName !== r.displayName && (
                <p className="text-[11px] text-gray-400 truncate">{r.displayName}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
