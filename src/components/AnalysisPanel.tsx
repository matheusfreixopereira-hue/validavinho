import { useEffect, useState } from "react";
import { Wine, Save, Trash2, Sparkles, Users, DollarSign, Building2, MapPin, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "./ScoreBadge";
import { CsvImport, type CsvRowData } from "./CsvImport";
import { computeAnalysis, formatBRL, type AnalysisInput } from "@/lib/viability";
import type { MapSelection } from "./MapView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  selection: MapSelection | null;
  address?: string;
  onTowersChange: (n: number) => void;
  onSaved?: () => void;
}

const CLASSES = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"];

export function AnalysisPanel({ selection, address, onTowersChange, onSaved }: Props) {
  const [name, setName] = useState("");
  const [inhabitants, setInhabitants] = useState<number | "">(0);
  const [income, setIncome] = useState<number | "">(0);
  const [socialClass, setSocialClass] = useState<string>("B2");
  const [age, setAge] = useState<number | "">(35);
  const [towers, setTowers] = useState<number | "">(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onTowersChange(typeof towers === "number" ? towers : 1);
  }, [towers, onTowersChange]);

  const input: AnalysisInput = {
    inhabitants: Number(inhabitants) || 0,
    incomePerCapita: Number(income) || 0,
    socialClass,
    avgAge: Number(age) || undefined,
    numTowers: Number(towers) || undefined,
    radiusMeters: selection?.radiusMeters,
  };
  const ready = input.inhabitants > 0 && input.incomePerCapita > 0;
  const result = ready ? computeAnalysis(input) : null;

  function handleCsv(rows: CsvRowData[]) {
    // Agrega CSV (soma habitantes/torres, média ponderada de renda/idade)
    const totalInh = rows.reduce((s, r) => s + (r.inhabitants ?? 0), 0);
    const totalTowers = rows.reduce((s, r) => s + (r.numTowers ?? 1), 0);
    const incomeWeighted =
      totalInh > 0
        ? rows.reduce(
            (s, r) => s + (r.incomePerCapita ?? 0) * (r.inhabitants ?? 0),
            0,
          ) / totalInh
        : 0;
    const ageWeighted =
      totalInh > 0
        ? rows.reduce((s, r) => s + (r.avgAge ?? 0) * (r.inhabitants ?? 0), 0) /
          totalInh
        : 0;
    const cls = rows.find((r) => r.socialClass)?.socialClass;
    if (totalInh) setInhabitants(totalInh);
    if (totalTowers) setTowers(totalTowers);
    if (incomeWeighted) setIncome(Math.round(incomeWeighted));
    if (ageWeighted) setAge(Math.round(ageWeighted));
    if (cls) setSocialClass(cls);
    const firstName = rows.find((r) => r.name)?.name;
    if (firstName) setName(firstName);
  }

  async function save() {
    if (!selection || !result) {
      toast.error("Selecione uma área no mapa e preencha os dados");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("analyses").insert({
      name: name || "Análise sem nome",
      address: address ?? null,
      center_lat: selection.center.lat,
      center_lng: selection.center.lng,
      selection_type: selection.type,
      radius_meters: selection.radiusMeters ?? null,
      geojson: (selection.geojson as any) ?? null,
      inhabitants: Number(inhabitants) || 0,
      income_per_capita: Number(income) || 0,
      social_class: socialClass,
      avg_age: Number(age) || null,
      num_towers: Number(towers) || null,
      score: result.score,
      potential: result.potential,
      recommendation: result.recommendation,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar análise");
    } else {
      toast.success("Análise salva");
      onSaved?.();
    }
  }

  function reset() {
    setName("");
    setInhabitants(0);
    setIncome(0);
    setAge(35);
    setTowers(1);
    setSocialClass("B2");
  }

  return (
    <aside className="flex h-full w-[380px] flex-col bg-sidebar text-sidebar-foreground">
      <header className="border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Wine className="h-5 w-5 text-[var(--primary-glow)]" />
          <h2 className="font-display text-lg font-semibold">Análise da área</h2>
        </div>
        <p className="mt-1 text-xs text-sidebar-foreground/70">
          {selection
            ? selection.type === "radius"
              ? `Raio: ${selection.radiusMeters}m`
              : `Polígono (${input.numTowers ?? 1} torre(s))`
            : "Desenhe uma área no mapa para começar"}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-sidebar-accent">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Nome do condomínio / área</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Condomínio Vila Nova"
                className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Habitantes</Label>
                <Input
                  type="number"
                  min={0}
                  value={inhabitants}
                  onChange={(e) =>
                    setInhabitants(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                />
              </div>
              <div>
                <Label className="text-xs">Nº de torres</Label>
                <Input
                  type="number"
                  min={0}
                  value={towers}
                  onChange={(e) =>
                    setTowers(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Renda per capita (R$/mês)</Label>
              <Input
                type="number"
                min={0}
                value={income}
                onChange={(e) =>
                  setIncome(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Classe social</Label>
                <Select value={socialClass} onValueChange={setSocialClass}>
                  <SelectTrigger className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Idade média</Label>
                <Input
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                />
              </div>
            </div>

            <Separator className="bg-sidebar-border" />
            <CsvImport onImport={handleCsv} />
            <p className="text-[11px] leading-relaxed text-sidebar-foreground/60">
              Colunas aceitas: nome, habitantes, renda, classe, idade, torres.
            </p>
          </TabsContent>

          <TabsContent value="resultado" className="mt-4 space-y-4">
            {!result ? (
              <div className="rounded-lg border border-dashed border-sidebar-border p-6 text-center text-sm text-sidebar-foreground/70">
                Preencha habitantes e renda para gerar a análise.
              </div>
            ) : (
              <>
                <ScoreBadge result={result} />

                <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sidebar-foreground/70">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recomendação
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {result.recommendation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Metric
                    icon={<Users className="h-4 w-4" />}
                    label="Habitantes"
                    value={Number(inhabitants).toLocaleString("pt-BR")}
                  />
                  <Metric
                    icon={<Building2 className="h-4 w-4" />}
                    label="Torres"
                    value={String(towers || "—")}
                  />
                  <Metric
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Renda média"
                    value={formatBRL(Number(income) || 0)}
                  />
                  <Metric
                    icon={<MapPin className="h-4 w-4" />}
                    label="Classe"
                    value={socialClass}
                  />
                </div>

                <div className="rounded-xl border border-sidebar-border p-4">
                  <div className="text-xs uppercase tracking-wide text-sidebar-foreground/70">
                    Potencial de consumo (mensal)
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">
                    {formatBRL(result.potential)}
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <Row label="Alimentação (≈ 28%)" value={formatBRL(result.potential * 0.28)} />
                    <Row label="Bebidas (≈ 10%)" value={formatBRL(result.potential * 0.1)} />
                    <Row
                      label="Vinho / adega (≈ 3%)"
                      value={formatBRL(result.winePotential)}
                      highlight
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-sidebar-border p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sidebar-foreground/70">
                    <Activity className="h-3.5 w-3.5" />
                    Indicadores
                  </div>
                  <div className="mt-2 space-y-2">
                    <Bar label="População" v={result.breakdown.populationScore} />
                    <Bar label="Renda" v={result.breakdown.incomeScore} />
                    <Bar label="Classe" v={result.breakdown.classScore} />
                    <Bar label="Idade" v={result.breakdown.ageScore} />
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-sidebar-border bg-sidebar p-4">
        <div className="flex gap-2">
          <Button
            onClick={save}
            disabled={!result || !selection || saving}
            className="flex-1 bg-[var(--primary-glow)] text-white hover:bg-[var(--primary-glow)]/90"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar análise
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </aside>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sidebar-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-sidebar-foreground/70">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sidebar-foreground/70">{label}</span>
      <span className={highlight ? "font-semibold text-[var(--primary-glow)]" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-sidebar-foreground/70">{label}</span>
        <span className="font-medium">{v}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sidebar-accent">
        <div
          className="h-full rounded-full bg-[var(--primary-glow)] transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
