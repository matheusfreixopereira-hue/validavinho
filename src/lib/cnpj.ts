export interface CnpjData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacao: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  municipio?: string;
  uf?: string;
  cnaeDescricao?: string;
}

export async function lookupCnpj(raw: string): Promise<CnpjData> {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14) throw new Error("CNPJ deve ter 14 dígitos");
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Erro ${res.status}`);
  }
  const d = await res.json();
  const logradouro = [d.logradouro, d.numero, d.complemento, d.bairro].filter(Boolean).join(", ");
  return {
    cnpj: digits,
    razaoSocial: d.razao_social ?? "",
    nomeFantasia: d.nome_fantasia || undefined,
    situacao: d.descricao_situacao_cadastral ?? d.situacao_cadastral ?? "",
    telefone: d.ddd_telefone_1 ? `(${d.ddd_telefone_1}) ${d.telefone_1 ?? ""}`.trim() : undefined,
    email: d.email || undefined,
    endereco: logradouro || undefined,
    municipio: d.municipio || undefined,
    uf: d.uf || undefined,
    cnaeDescricao: d.cnae_fiscal_descricao || undefined,
  };
}

export function formatCnpj(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}