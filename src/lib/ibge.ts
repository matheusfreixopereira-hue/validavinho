export interface IbgeData {
  municipio: string;
  uf: string;
  codMun: string;
  populacao?: number;
  populacaoTotal?: number;
  municipioAreaKm2?: number;
  rendaPerCapitaMensal?: number;
}

async function getMunicipioFromCoords(lat: number, lng: number): Promise<{ name: string; stateCode: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
    { headers: { "User-Agent": "ValidaVinho/1.0" } }
  );
  if (!res.ok) throw new Error("Nominatim error");
  const data = await res.json();
  // Use CITY (municipio), NOT city_district (bairro/neighborhood like "Barra da Tijuca")
  const name =
    data.address?.city ||
    data.address?.town ||
    data.address?.municipality ||
    data.address?.county;
  if (!name) throw new Error("Municipio nao identificado nas coordenadas");
  // ISO3166-2-lvl4 = "BR-RJ" => extract "RJ"
  const isoCode: string = data.address?.["ISO3166-2-lvl4"] ?? "";
  const stateCode = isoCode.replace("BR-", "");
  return { name, stateCode };
}

async function getMunicipioCod(
  name: string,
  stateCode: string
): Promise<{ cod: string; municipio: string; uf: string }> {
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(name)}`
  );
  if (!res.ok) throw new Error("IBGE localidades error");
  const list = await res.json() as Array<{
    id: number;
    nome: string;
    microrregiao: { mesorregiao: { UF: { sigla: string } } };
  }>;
  if (!list.length) throw new Error(`Municipio "${name}" nao encontrado no IBGE`);
  const match = stateCode
    ? (list.find((m) => m.microrregiao?.mesorregiao?.UF?.sigla === stateCode) ?? list[0])
    : list[0];
  return {
    cod: String(match.id),
    municipio: match.nome,
    uf: match.microrregiao?.mesorregiao?.UF?.sigla ?? "",
  };
}

async function getPopulacaoEArea(
  codMun: string
): Promise<{ pop: number; areaKm2: number } | undefined> {
  // Table 1301: area (var 82) + population (var 93) — try 2022 then 2010
  for (const year of ["2022", "2010"]) {
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v3/agregados/1301/periodos/${year}/variaveis/82|93?localidades=N6[${codMun}]`
      );
      if (!res.ok) continue;
      const data = await res.json() as Array<{ id: string; resultados: Array<{ series: Array<{ serie: Record<string, string> }> }> }>;
      const areaRow = data.find((v) => v.id === "82");
      const popRow = data.find((v) => v.id === "93");
      const areaVal = areaRow?.resultados?.[0]?.series?.[0]?.serie?.[year];
      const popVal = popRow?.resultados?.[0]?.series?.[0]?.serie?.[year];
      if (areaVal && popVal) {
        const areaKm2 = parseFloat(String(areaVal).replace(",", "."));
        const pop = parseInt(String(popVal).replace(/\D/g, ""), 10);
        if (areaKm2 > 0 && pop > 0) return { pop, areaKm2 };
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

async function getPibPerCapita(codMun: string): Promise<number | undefined> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${codMun}]`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const val = data?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2021"];
    return val ? parseFloat(String(val).replace(",", ".")) : undefined;
  } catch {
    return undefined;
  }
}

function polygonAreaHa(coords: number[][]): number {
  // Shoelace formula approximation using lat/lng degrees -> meters
  if (coords.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const latMid = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const scaleX = Math.cos(toRad(latMid));
  let area = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = toRad(coords[i][1]) * R * scaleX;
    const yi = toRad(coords[i][0]) * R;
    const xj = toRad(coords[j][1]) * R * scaleX;
    const yj = toRad(coords[j][0]) * R;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2) / 10000; // m² -> ha
}

export function getSelectedAreaHa(selection: {
  type: string;
  radiusMeters?: number;
  geojson?: { geometry?: { type?: string; coordinates?: number[][][] } };
}): number {
  if (selection.type === "radius" && selection.radiusMeters) {
    return +((Math.PI * selection.radiusMeters ** 2) / 10000).toFixed(2);
  }
  const coords = selection.geojson?.geometry?.coordinates?.[0];
  if (coords?.length) {
    const latLng = coords.map(([lng, lat]) => [lat, lng]);
    return +polygonAreaHa(latLng).toFixed(2);
  }
  return 0.53;
}

export async function fetchIbgeData(
  lat: number,
  lng: number,
  selectedAreaHa: number
): Promise<IbgeData> {
  const { name, stateCode } = await getMunicipioFromCoords(lat, lng);
  const { cod, municipio, uf } = await getMunicipioCod(name, stateCode);

  const [popArea, pibPerCapitaAnual] = await Promise.all([
    getPopulacaoEArea(cod),
    getPibPerCapita(cod),
  ]);

  let populacao: number | undefined;
  if (popArea) {
    const municipioAreaHa = popArea.areaKm2 * 100;
    populacao = Math.min(
      Math.round((selectedAreaHa / municipioAreaHa) * popArea.pop),
      popArea.pop
    );
  }

  const rendaPerCapitaMensal = pibPerCapitaAnual
    ? Math.round((pibPerCapitaAnual * 1000 * 0.6) / 12)
    : undefined;

  return {
    municipio,
    uf,
    codMun: cod,
    populacao,
    populacaoTotal: popArea?.pop,
    municipioAreaKm2: popArea?.areaKm2,
    rendaPerCapitaMensal,
  };
}
