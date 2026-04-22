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
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
}

interface NavSection {
  short: string;
  shortColors: [string, string]; // bg + text colors classes
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    short: "A",
    shortColors: ["bg-rose-500/90", "text-white"],
    title: "ANALYTICS",
    items: [
      { icon: Circle, label: "Consulte um raio" },
      { icon: MapPin, label: "Adicione um ponto" },
      { icon: Pencil, label: "Desenhe uma área" },
    ],
  },
  {
    short: "S",
    shortColors: ["bg-emerald-500/90", "text-white"],
    title: "SPACE MANAGER",
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
      { icon: Sparkles, label: "Space AI", badge: "inédito" },
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
    ],
  },
];

export function SpaceSidebar() {
  return (
    <aside className="flex h-full w-[230px] flex-col bg-[oklch(0.22_0.02_260)] text-white/90">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary-glow)]">
          <Wine className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-bold tracking-tight text-white">
            Vinho<span className="text-[var(--primary-glow)]">24h</span>
          </div>
          <div className="text-[9px] uppercase tracking-wider text-white/50">
            Sua adega particular
          </div>
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary-glow)] to-[oklch(0.32_0.12_18)] ring-2 ring-white/10">
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            R
          </div>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-sm font-semibold text-white">
            Rafael
            <Crown className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="mt-0.5 inline-block rounded-sm bg-emerald-500/90 px-1.5 py-px text-[10px] font-bold text-white">
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
              <span className="text-[10px] font-bold tracking-wider text-white/60">
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
                        ? "bg-[oklch(0.32_0.04_140)] font-semibold text-white"
                        : "text-white/85 hover:bg-white/5"
                    }`}
                  >
                    <it.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{it.label}</span>
                    {it.badge && (
                      <span
                        className={`ml-auto rounded-[3px] px-1.5 py-px text-[9px] font-bold uppercase ${
                          it.badge === "inédito"
                            ? "bg-fuchsia-500/90 text-white"
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
    </aside>
  );
}
