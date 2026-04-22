import { useEffect, useState } from "react";
import {
  X,
  Bookmark,
  Users,
  TrendingDown,
  TrendingUp,
  Home,
  Info,
  Wrench,
  UtensilsCrossed,
  Wine,
  ShoppingBag,
  Save,
  Upload,
  Building2,
} from "lucide-react";
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
import { CsvImport, type CsvRowData } from "./CsvImport";
import { BusinessPanel } from "./BusinessPanel";
import { computeAnalysis, formatBRL, type AnalysisInput } from "@/lib/viability";
import type { MapSelection } from "./MapView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  selection: MapSelection | null;
  address?: string;
  onTowersChange: (n: number) => void;
  onSaved?: () => void;
  onClose?: () => void;
}

const CLASSES = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"];

// Distribuição visual das classes (estilo Space Data) — proporção visual da barra
const CLASS_DISTRIBUTION: Array<{ key: string; color: string; pct: number }> = [
  { key: "A1", color: "bg-fuchsia-500", pct: 22 },
  { key: "A2", color: "bg-purple-500", pct: 30 },
  { key: "B1", color: "bg-sky-400", pct: 16 },
  { key: "B2", color: "bg-sky-500", pct: 12 },
  { key: "C1", color: "bg-emerald-400", pct: 8 },
  { key: "C2", color: "bg-yellow-400", pct: 6 },
  { key: "D", color: "bg-orange-400", pct: 4 },
  { key: "E", color: "bg-red-500", pct: 2 },
];

export function AnalysisPanel({
  selection,
  address,
  onTowersChange,
  onSaved,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"salvar" | "minhas" | "mais" | "atividades">("minhas");
  const [name, setName] = useState("");
  const [inhabitants, setInhabitants] = useState<number | "">(920);
  const [income, setIncome] = useState<number | "">(26480);
  const [socialClass, setSocialClass] = useState<string>("A2");
  const [age, setAge] = useState<number | "">(34);
  const [towers, setTowers] = useState<number | "">(1);
  const [households, setHouseholds] = useState<number | "">(291);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

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

  // Área (hectares) — aproximação simples
  const areaHa = selection?.radiusMeters
    ? +((Math.PI * selection.radiusMeters ** 2) / 10000).toFixed(2)
    : 0.53;
  const density = areaHa > 0 ? Math.round(Number(inhabitants) / areaHa * 10) / 10 : 0;

  function handleCsv(rows: CsvRowData[]) {
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
      toast.error("Selecione uma área no mapa");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("analyses").insert({
      name: name || `Área de ${areaHa} ha`,
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
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Análise salva");
      onSaved?.();
    }
  }

  const totalPotential = result?.potential ?? 3_600_000;
  const consumption = [
    { icon: UtensilsCrossed, label: "Alimentação", value: totalPotential * 0.124, pct: "12.4%" },
    { icon: UtensilsCrossed, label: "Lanches", value: totalPotential * 0.003, pct: "0.3%" },
    { icon: Home, label: "Outros (moradia)", value: totalPotential * 0.006, pct: "0.6%" },
    { icon: ShoppingBag, label: "Outros", value: totalPotential * 0.002, pct: "0.2%" },
    { icon: Wine, label: "Bebidas alcoólicas", value: totalPotential * 0.001, pct: "0.1%", highlight: true },
  ];

  return (
    <aside className="flex h-full w-[380px] flex-col bg-white text-[oklch(0.18_0.02_260)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[oklch(0.92_0.01_260)] px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-[oklch(0.5_0.02_260)]" />
          <span className="font-medium">
            Área de {areaHa} ha
            <span className="ml-1 text-[oklch(0.5_0.02_260)]">- Analytics</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-[oklch(0.5_0.02_260)] hover:bg-[oklch(0.96_0.005_260)]"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[oklch(0.92_0.01_260)] px-3 py-2 text-[13px]">
        <TabBtn active={tab === "salvar"} onClick={() => setTab("salvar")}>
          <Bookmark className="mr-1 h-3.5 w-3.5" />
          Salvar área
        </TabBtn>
        <TabBtn active={tab === "minhas"} onClick={() => setTab("minhas")}>
          Minhas Áreas
        </TabBtn>
        <TabBtn active={tab === "mais"} onClick={() => setTab("mais")}>
          Mais
        </TabBtn>
        <TabBtn active={tab === "atividades"} onClick={() => setTab("atividades")}>
          <Building2 className="mr-1 h-3.5 w-3.5" />
          Atividades
        </TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {tab === "salvar" && (
          <div className="space-y-3 rounded-lg border border-[oklch(0.92_0.01_260)] bg-[oklch(0.98_0.005_260)] p-3">
            <div>
              <Label className="text-xs">Nome da área</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Condomínio Itapuã"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <CsvImport onImport={handleCsv} />
            <Button onClick={save} disabled={saving} className="w-full h-8 bg-[var(--primary-glow)] text-white hover:bg-[var(--primary-glow)]/90">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar análise
            </Button>
          </div>
        )}

        {/* Habitantes card */}
        <DataCard
          tone="sand"
          icon={<Users className="h-4 w-4" />}
          label="Habitantes"
          value={Number(inhabitants).toLocaleString("pt-BR")}
          editing={editing}
          onChange={(v) => setInhabitants(Number(v) || 0)}
          rawValue={inhabitants}
          extras={
            <>
              <Detail
                icon={<TrendingDown className="h-3 w-3 text-rose-600" />}
                text="Decréscimo de -21%"
              />
              <Detail
                icon={<Users className="h-3 w-3" />}
                text={`${density} hab/hectare densidade`}
              />
            </>
          }
        />

        {/* Renda card */}
        <DataCard
          tone="violet"
          icon={<span className="font-bold">R$</span>}
          label="Renda"
          value={Number(income).toLocaleString("pt-BR")}
          editing={editing}
          onChange={(v) => setIncome(Number(v) || 0)}
          rawValue={income}
          extras={
            <Detail
              icon={<TrendingUp className="h-3 w-3 text-emerald-600" />}
              text="Crescimento real de 1%"
            />
          }
        />

        {/* Domicílios + Classes */}
        <div className="rounded-xl border border-[oklch(0.92_0.01_260)] bg-white p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Home className="h-4 w-4 text-[oklch(0.45_0.04_260)]" />
              {editing ? (
                <Input
                  type="number"
                  value={households}
                  onChange={(e) => setHouseholds(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-6 w-20 px-1 py-0 text-sm"
                />
              ) : (
                <span>{Number(households).toLocaleString("pt-BR")}</span>
              )}
              <span className="text-[oklch(0.5_0.02_260)] font-normal">domicílios</span>
            </div>
            <span className="text-xs text-rose-600 inline-flex items-center gap-0.5">
              Queda -2.3% <TrendingDown className="h-3 w-3" />
            </span>
          </div>

          {/* Class bar */}
          <div className="mt-3 flex h-7 overflow-hidden rounded-md text-[10px] font-bold text-white">
            {CLASS_DISTRIBUTION.map((c) => (
              <div
                key={c.key}
                className={cn("flex items-center justify-center", c.color)}
                style={{ width: `${c.pct}%` }}
                title={`${c.key}: ${c.pct}%`}
              >
                {c.pct >= 8 ? c.key : ""}
                {c.key === "A2" && <span className="ml-0.5">★</span>}
              </div>
            ))}
          </div>

          {/* Class details grid */}
          <div className="mt-3 grid grid-cols-4 gap-y-2 text-[11px]">
            {[
              { n: 24, p: "3.6%" },
              { n: 33, p: "5.1%" },
              { n: 148, p: "41.6%" },
              { n: 43, p: "6.6%" },
              { n: 42, p: "6.4%" },
              { n: 213, p: "13.6%" },
              { n: 130, p: "19.9%" },
              { n: 21, p: "3.2%" },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <Users className="h-3 w-3 text-[oklch(0.5_0.02_260)]" />
                <div className="leading-tight">
                  <div className="font-semibold">{d.n}</div>
                  <div className="text-[oklch(0.5_0.02_260)]">{d.p}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900">
            <span className="font-semibold">Sozinhos</span> · Família Destaque
            <Info className="ml-1 inline h-3 w-3 text-emerald-700" />
          </div>
        </div>

        {/* Potencial */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <div className="font-numeric text-base font-bold text-amber-950 tabular-nums">
              {totalPotential >= 1_000_000
                ? `R$${(totalPotential / 1_000_000).toFixed(1)} MI`
                : formatBRL(totalPotential)}{" "}
              <span className="text-sm font-medium">potencial de consumo mensal</span>
            </div>
            <button
              onClick={() => setEditing((e) => !e)}
              className="rounded-md p-1 text-amber-900 hover:bg-amber-200"
              title="Editar dados"
            >
              <Wrench className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="mt-2 space-y-1 text-[12.5px]">
            {consumption.map((c) => (
              <li
                key={c.label}
                className={cn(
                  "flex items-center gap-1.5",
                  c.highlight && "font-semibold text-[oklch(0.32_0.12_18)]",
                )}
              >
                <c.icon className="h-3.5 w-3.5" />
                <span>{c.label}:</span>
                <span className="font-semibold">{formatBRL(c.value)}</span>
                <span className="text-[oklch(0.5_0.02_260)]">({c.pct})</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Score / Recomendação */}
        {result && (
          <div className="rounded-xl border border-[oklch(0.92_0.01_260)] bg-gradient-to-br from-[oklch(0.32_0.12_18)] to-[oklch(0.22_0.08_16)] p-3 text-white shadow-[var(--shadow-elegant)]">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">
                  Score de viabilidade
                </div>
                <div className="font-numeric text-3xl font-bold leading-none tabular-nums tracking-tight">
                  {result.score}
                  <span className="ml-1 text-xs font-normal text-white/70">/100</span>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                  result.level === "alta" && "bg-emerald-400 text-emerald-950",
                  result.level === "media" && "bg-amber-300 text-amber-950",
                  result.level === "baixa" && "bg-rose-400 text-rose-950",
                )}
              >
                {result.level === "alta"
                  ? "Alta"
                  : result.level === "media"
                  ? "Média"
                  : "Baixa"}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/90">{result.recommendation}</p>
          </div>
        )}

        {/* Editable raw inputs (toggled) */}
        {editing && (
          <div className="rounded-xl border border-dashed border-[oklch(0.85_0.02_260)] bg-[oklch(0.98_0.005_260)] p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.5_0.02_260)]">
              Editar dados da área
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Habitantes" value={inhabitants} onChange={setInhabitants} />
              <Field label="Renda (R$)" value={income} onChange={setIncome} />
              <Field label="Idade média" value={age} onChange={setAge} />
              <Field label="Nº torres" value={towers} onChange={setTowers} />
              <div className="col-span-2">
                <Label className="text-[10px]">Classe social</Label>
                <Select value={socialClass} onValueChange={setSocialClass}>
                  <SelectTrigger className="h-7 text-xs">
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
            </div>
            <CsvImport onImport={handleCsv} />
          </div>
        )}

        {tab === "atividades" && <BusinessPanel selection={selection} />}

        <p className="rounded-md bg-[oklch(0.95_0.005_260)] px-3 py-2 text-[11px] text-[oklch(0.4_0.02_260)]">
          Selecione uma área com atividades econômicas para conferir na análise.
        </p>
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-2 border-t border-[oklch(0.92_0.01_260)] bg-white px-3 py-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing((e) => !e)}
          className="flex-1 h-8 text-xs"
        >
          {editing ? "Concluir edição" : "Editar dados"}
        </Button>
        <Button
          onClick={save}
          disabled={saving || !selection}
          size="sm"
          className="flex-1 h-8 bg-[var(--primary-glow)] text-xs text-white hover:bg-[var(--primary-glow)]/90"
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          Salvar
        </Button>
      </footer>
    </aside>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center rounded-md px-2.5 py-1 transition-colors",
        active
          ? "bg-sky-100 font-semibold text-sky-800"
          : "text-[oklch(0.4_0.02_260)] hover:bg-[oklch(0.96_0.005_260)]",
      )}
    >
      {children}
    </button>
  );
}

interface DataCardProps {
  tone: "sand" | "violet";
  icon: React.ReactNode;
  label: string;
  value: string;
  prefix?: string;
  editing: boolean;
  rawValue: number | "";
  onChange: (v: string) => void;
  extras: React.ReactNode;
}

function DataCard({
  tone,
  icon,
  label,
  value,
  prefix,
  editing,
  rawValue,
  onChange,
  extras,
}: DataCardProps) {
  const toneClasses =
    tone === "sand"
      ? "from-[oklch(0.92_0.04_60)] to-[oklch(0.85_0.06_50)] text-[oklch(0.25_0.05_40)]"
      : "from-[oklch(0.55_0.13_300)] to-[oklch(0.4_0.14_295)] text-white";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[oklch(0.92_0.01_260)] bg-gradient-to-br p-3 shadow-[var(--shadow-soft)]",
        toneClasses,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="opacity-80">{icon}</span>
        <div className="flex items-baseline gap-1">
          {editing ? (
            <Input
              type="number"
              value={rawValue}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-28 px-1.5 py-0 text-lg font-bold bg-white/80 text-[oklch(0.2_0.02_260)]"
            />
          ) : (
            <span className="font-numeric text-2xl font-bold leading-none tabular-nums tracking-tight">
              {prefix}
              {value}
            </span>
          )}
          <span className="text-sm font-medium opacity-90">· {label}</span>
          <Info className="ml-0.5 h-3 w-3 opacity-70" />
        </div>
      </div>
      <div className="mt-2 space-y-1 text-[12px] opacity-95">{extras}</div>
    </div>
  );
}

function Detail({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="h-7 text-xs"
      />
    </div>
  );
}
