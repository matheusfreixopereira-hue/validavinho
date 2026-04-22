// Cálculo de viabilidade — fórmulas internas (não exibir ao usuário)
// Nota: pesos e fórmulas simplificados para MVP. Refinar com base em dados reais.

export type SocialClass = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "D" | "E";

export interface AnalysisInput {
  inhabitants: number;
  incomePerCapita: number;
  socialClass?: SocialClass | string;
  avgAge?: number;
  numTowers?: number;
  radiusMeters?: number;
}

export interface AnalysisResult {
  potential: number; // potencial total mensal estimado (R$)
  winePotential: number; // recorte vinho/bebidas
  score: number; // 0–100
  level: "alta" | "media" | "baixa";
  recommendation: string;
  breakdown: {
    populationScore: number;
    incomeScore: number;
    classScore: number;
    ageScore: number;
  };
}

const CLASS_WEIGHT: Record<string, number> = {
  A1: 100,
  A2: 90,
  B1: 78,
  B2: 65,
  C1: 50,
  C2: 38,
  D: 22,
  E: 10,
};

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

export function computeAnalysis(input: AnalysisInput): AnalysisResult {
  const { inhabitants, incomePerCapita, socialClass, avgAge } = input;

  // Potencial bruto (simplificado)
  const potential = Math.max(0, inhabitants * incomePerCapita * 0.03);
  const winePotential = potential * 0.03;

  // Subscores (cada um 0-100)
  const populationScore = clamp(Math.log10(Math.max(1, inhabitants)) * 22);
  const incomeScore = clamp((incomePerCapita / 30000) * 100);
  const classScore = CLASS_WEIGHT[String(socialClass ?? "").toUpperCase()] ?? 40;
  // Idade ideal entre 30 e 50 (público adega)
  const ageScore =
    avgAge == null
      ? 50
      : clamp(100 - Math.abs(40 - avgAge) * 4);

  // Pesos
  const score = Math.round(
    populationScore * 0.25 +
      incomeScore * 0.35 +
      classScore * 0.3 +
      ageScore * 0.1,
  );

  let level: AnalysisResult["level"];
  let recommendation: string;
  if (score >= 70) {
    level = "alta";
    recommendation =
      winePotential > 250000
        ? "Região suporta 2 adegas — alta densidade de consumo."
        : "Região ideal para 1 adega — alta viabilidade.";
  } else if (score >= 45) {
    level = "media";
    recommendation = "Viabilidade média — necessário validar fluxo de pessoas.";
  } else {
    level = "baixa";
    recommendation = "Baixa viabilidade — região fora do perfil ideal.";
  }

  return {
    potential,
    winePotential,
    score,
    level,
    recommendation,
    breakdown: {
      populationScore: Math.round(populationScore),
      incomeScore: Math.round(incomeScore),
      classScore: Math.round(classScore),
      ageScore: Math.round(ageScore),
    },
  };
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
