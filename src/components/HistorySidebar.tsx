import { useEffect, useState } from "react";
import { Wine, History, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/viability";
import { toast } from "sonner";

interface SavedAnalysis {
  id: string;
  name: string;
  address: string | null;
  score: number | null;
  potential: number | null;
  recommendation: string | null;
  created_at: string;
  center_lat: number;
  center_lng: number;
}

interface Props {
  onSelect: (a: SavedAnalysis) => void;
  refreshKey?: number;
}

export function HistorySidebar({ onSelect, refreshKey }: Props) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("id,name,address,score,potential,recommendation,created_at,center_lat,center_lng")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setItems(data as SavedAnalysis[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function remove(id: string) {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Removida");
      setItems((p) => p.filter((i) => i.id !== id));
    }
  }

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-border bg-card">
      <header className="border-b border-border bg-[var(--gradient-wine)] px-5 py-4 text-white"
        style={{ background: "var(--gradient-wine)" }}>
        <div className="flex items-center gap-2">
          <img
            src="https://iili.io/BSf2Wmv.webp"
            alt="Vinho24h"
            className="h-5 w-auto object-contain brightness-0 invert"
          />
        </div>
        <p className="mt-1 text-[11px] text-white/70">
          Análise de viabilidade para adegas
        </p>
      </header>

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <History className="h-4 w-4 text-primary" />
          Histórico
        </div>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhuma análise salva ainda.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="group rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <button
                    onClick={() => onSelect(a)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {a.name}
                      </span>
                      {a.score != null && (
                        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {a.score}
                        </span>
                      )}
                    </div>
                    {a.address && (
                      <div className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{a.address}</span>
                      </div>
                    )}
                    {a.potential != null && (
                      <div className="mt-1.5 text-[11px] font-medium text-primary">
                        {formatBRL(Number(a.potential))} / mês
                      </div>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(a.id)}
                    className="mt-1 h-6 w-full text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <footer className="border-t border-border px-4 py-3 text-[10px] text-muted-foreground">
        Mapa: OpenStreetMap · Dados protegidos · Vinho24h
      </footer>
    </aside>
  );
}

export type { SavedAnalysis };
