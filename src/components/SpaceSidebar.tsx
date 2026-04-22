import {
  Wine,
  Crown,
  Circle,
  MapPin,
  Pencil,
  Bookmark,
  FolderOpen,
  CircleDot,
  Map as MapIcon,
  Library,
  Users,
  DollarSign,
  Home,
  Layers,
  Split,
  CalendarClock,
  GraduationCap,
  Sparkles,
  Globe,
  Crosshair,
  Activity,
  Building2,
  BarChart3,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
}

interface NavSection {
  short: string;
  shortColors: [string, string];
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    short: "A",
    shortColors: ["bg-[oklch(0.42_0.18_350)]", "text-white"],
    title: "ANALYTICS",
    items: [
      { icon: Circle, label: "Consulte um raio" },
      { icon: MapPin, label: "Adicione um ponto" },
      { icon: Pencil, label: "Desenhe uma área" },
    ],
  },
  {
    short: "V",
    shortColors: ["bg-emerald-500/90", "text-white"],
    title: "VALIDAVINHO",
    items: [
      { icon: Bookmark, label: "Meus pontos" },
      { icon: FolderOpen, label: "Minhas áreas" },
      { icon: CircleDot, label: "Zonas", badge: "novo" },
      { icon: Library, label: "Totens Santa Ca…" },
      { icon: MapIcon, label: "Adegas Vinho24h" },
    ],
  },
  {
    short: "Ci",
    shortColors: ["bg-orange-500/90", "text-white"],
    title: "CIDADE",
    items: [
      { icon: Users, label: "População" },
      { icon: DollarSign, label: "Renda", badge: "novo", active: true },
      { icon: Users, label: "Famílias", badge: "novo" },
      { icon: Home, label: "Moradias" },
      { icon: Layers, label: "Classes" },
      { icon: Building2, label: "Verticalização" },
      { icon: Split, label: "Segregação" },
      { icon: CalendarClock, label: "Idade" },
      { icon: GraduationCap, label: "Educação" },
      { icon: Sparkles, label: "ValidaVinho AI", badge: "inédito" },
    ],
  },
  {
    short: "Mo",
    shortColors: ["bg-teal-500/90", "text-white"],
    title: "MOVIMENTOS",
    items: [
      { icon: Globe, label: "Fluxo" },
      { icon: Crosshair, label: "Alcance" },
      { icon: Sparkles, label: "Concentração" },
    ],
  },
  {
    short: "Co",
    shortColors: ["bg-fuchsia-500/90", "text-white"],
    title: "ECONOMIA",
    items: [
      { icon: Building2, label: "Atividades" },
      { icon: Activity, label: "Consumo" },
      { icon: BarChart3, label: "Viabilidade" },
    ],
  },
];

export function SpaceSidebar() {
  return (
    <aside className="flex h-full w-[230px] flex-col bg-[oklch(0.15_0.04_350)] text-white/90">
      {/* Brand */}
      <div className="flex items-center justify-center border-b border-white/10 px-4 py-3.5">
        <img
          src="https://iili.io/BSf2Wmv.webp"
          alt="Vinho24h"
          className="h-8 w-auto max-w-[130px] object-contain brightness-0 invert"
        />
      </div>

      {/* Subtítulo */}
      <div className="border-b border-white/10 px-4 py-2">
        <div className="text-center text-[9px] uppercase tracking-wider text-white/40 font-semibold">
          ValidaVinho · Análise de Viabilidade
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-[oklch(0.42_0.18_350)] to-[oklch(0.28_0.14_350)] ring-2 ring-white/10">
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            R
          </div>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-sm font-semibold text-white">
            Rafael
            <Crown className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="mt-0.5 inline-block rounded-sm bg-[oklch(0.42_0.18_350)]/90 px-1.5 py-px text-[10px] font-bold text-white">
            Vinho24h
          </span>
        </div>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
        {SECTIONS.map((section) => (
          <div key={section.title} className="px-2 py-1.5">
            <div className="flex items-center gap-2 px-2 py-1">
              <span
                className={`flex h-4 min-w-[1rem] items-center justify-center rounded-[3px] px-1 font-mono text-[10px] font-bold ${section.shortColors[0]} ${section.shortColors[1]}`}
              >
                {section.short}
              </span>
              <span className="text-[10px] font-bold tracking-wider text-white/50">
                {section.title}
              </span>
            </div>
            <ul className="mt-0.5">
              {section.items.map((it) => (
                <li key={it.label}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ${
                      it.active
                        ? "bg-[oklch(0.42_0.18_350)]/30 font-semibold text-white"
                        : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <it.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{it.label}</span>
                    {it.badge && (
                      <span
                        className={`ml-auto rounded-[3px] px-1.5 py-px text-[9px] font-bold uppercase ${
                          it.badge === "inédito"
                            ? "bg-[oklch(0.42_0.18_350)]/90 text-white"
                            : "bg-teal-500/90 text-white"
                        }`}
                      >
                        {it.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="text-[9px] text-white/30 leading-tight text-center">
          SUA ADEGA PARTICULAR,<br />A QUALQUER HORA
        </div>
      </div>
    </aside>
  );
}
