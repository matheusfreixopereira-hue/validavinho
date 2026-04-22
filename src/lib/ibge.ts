export interface IbgeData {
  municipio: string;
  uf: string;
  codMun: string;
  populacao?: number;
  rendaPerCapitaMensal?: number;
  pibPerCapitaAnual?: number;
}

async function getMunicipioFromCoords(lat: number, lng: number): Promise<{ name: string; state: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
    { headers: { "User-Agent": "ValidaVinho/1.0" } }
  );
  if (!res.ok) throw new Error("Nominatim error");
  const data = await res.json();
  const name =
    data.address?.city_district ||
    data.address?.city ||
    data.address?.town ||
    data.address?.municipality ||
    data.address?.county;
  if (!name) throw new Error("Municipio nao encontrado nas coordenadas");
  return { name, state: data.address?.state ?? "" };
}

async function getMunicipioCod(name: string, state: string): Promise<{ cod: string; municipio: string; uf: string }> {
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(name)}`
  );
  if (!res.ok) throw new Error("IBGE localidades error");
  const list = await res.json() as Array<{ id: number; nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } }>;
  if (!list.length) throw new Error(`Municipio "${name}" nao encontrado no IBGE`);
  const stateAbbr = state.slice(-2).toUpperCase();
  const match =
    list.find((m) => m.microrregiao?.mesorregiao?.UF?.sigla === stateAbbr) ??
    list[0];
  return {
    cod: String(match.id),
    municipio: match.nome,
    uf: match.microrregiao?.mesorregiao?.UF?.sigla ?? "",
  };
}

async function getPopulacao(codMun: string): Promise<number | undefined> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${codMun}]`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const val = data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2022"];
    return val ? parseInt(String(val).replace(/\D/g, ""), 10) : undefined;
  } catch {
    return undefined;
  }
}

async function getPibPerCapita(codMun: string): Promise<number | undefined> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${codMun}]`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const val = data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2021"];
    return val ? parseFloat(String(val)) : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchIbgeData(lat: number, lng: number): Promise<IbgeData> {
  const { name, state } = await getMunicipioFromCoords(lat, lng);
  const { cod, municipio, uf } = await getMunicipioCod(name, state);

  const [populacao, pibPerCapitaAnual] = await Promise.all([
    getPopulacao(cod),
    getPibPerCapita(cod),
  ]);

  // PIB per capita (R$ mil/ano) → renda mensal estimada (fator ~0.6 de transferencia)
  const rendaPerCapitaMensal = pibPerCapitaAnual
    ? Math.round((pibPerCapitaAnual * 1000 * 0.6) / 12)
    : undefined;

  return { municipio, uf, codMun: cod, populacao, rendaPerCapitaMensal, pibPerCapitaAnual };
}
