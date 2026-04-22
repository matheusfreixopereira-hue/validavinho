import type { AnalysisResult } from "@/lib/viability";
import { cn } from "@/lib/utils";

const STYLES: Record<AnalysisResult["level"], { bg: string; label: string }> = {
  alta: { bg: "bg-[oklch(0.55_0.15_145)] text-white", label: "Alta viabilidade" },
  media: { bg: "bg-[oklch(0.72_0.16_75)] text-[oklch(0.2_0.05_60)]", label: "Média viabilidade" },
  baixa: { bg: "bg-[oklch(0.55_0.22_27)] text-white", label: "Baixa viabilidade" },
};

export function ScoreBadge({ result }: { result: AnalysisResult }) {
  const s = STYLES[result.level];
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-[var(--shadow-soft)]",
        s.bg,
      )}
    >
      <div>
        <div className="text-xs uppercase tracking-wide opacity-90">Score</div>
        <div className="font-display text-3xl font-semibold leading-none">
          {result.score}
        </div>
      </div>
      <div className="text-right text-sm font-medium">{s.label}</div>
    </div>
  );
}
