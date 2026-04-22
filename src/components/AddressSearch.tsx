import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { geocode, type GeocodeResult } from "@/lib/geocode";
import { toast } from "sonner";

interface Props {
  onSelect: (r: GeocodeResult) => void;
}

export function AddressSearch({ onSelect }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await geocode(q);
      setResults(r);
      if (r.length === 0) toast.info("Nenhum endereço encontrado");
    } catch (e) {
      toast.error("Erro ao buscar endereço");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Digite um endereço, bairro ou cidade..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="bg-background"
        />
        <Button onClick={search} disabled={loading} variant="default">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="max-h-56 overflow-auto rounded-md border border-border bg-card text-sm shadow-[var(--shadow-soft)]">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => {
                onSelect(r);
                setResults([]);
                setQ(r.displayName);
              }}
              className="cursor-pointer border-b border-border px-3 py-2 last:border-0 hover:bg-accent"
            >
              {r.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
