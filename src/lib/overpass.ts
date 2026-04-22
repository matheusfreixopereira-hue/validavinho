export interface Business {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  openingHours?: string;
}

type OverpassQuery =
  | { type: "radius"; lat: number; lng: number; radiusMeters: number }
  | { type: "polygon"; coords: number[][] };

export const CATEGORY_MAP: Record<string, string> = {
  bar: "Bar",
  restaurant: "Restaurante",
  cafe: "Café",
  fast_food: "Fast Food",
  food_court: "Praça de Alimentação",
  pub: "Pub",
  nightclub: "Balada",
  pharmacy: "Farmácia",
  supermarket: "Supermercado",
  convenience: "Conveniência",
  alcohol: "Bebidas / Adega",
  beverages: "Bebidas / Adega",
  wine: "Adega de Vinhos",
  wine_shop: "Adega de Vinhos",
  liquor_store: "Loja de Bebidas",
  bakery: "Padaria",
  butcher: "Açougue",
  greengrocer: "Hortifruti",
  clothes: "Vestuário",
  shoes: "Calçados",
  electronics: "Eletrônicos",
  hardware: "Ferragens",
  furniture: "Móveis",
  beauty: "Beleza",
  hairdresser: "Salão de Beleza",
  gym: "Academia",
  hospital: "Hospital",
  clinic: "Clínica",
  dentist: "Dentista",
  bank: "Banco",
  atm: "Caixa Eletrônico",
  hotel: "Hotel",
  hostel: "Hostel",
  fuel: "Posto de Gasolina",
  car_wash: "Lava-Rápido",
  laundry: "Lavanderia",
  school: "Escola",
  kindergarten: "Creche",
  library: "Biblioteca",
  cinema: "Cinema",
  theatre: "Teatro",
};

function getCategory(tags: Record<string, string>): string {
  if (tags.shop === "alcohol" || tags.shop === "wine" || tags.shop === "wine_shop" || tags.shop === "beverages" || tags.shop === "liquor_store") {
    return CATEGORY_MAP[tags.shop] ?? "Bebidas / Adega";
  }
  if (tags.amenity === "bar" || tags.amenity === "pub" || tags.amenity === "nightclub") {
    return CATEGORY_MAP[tags.amenity] ?? "Bar";
  }
  if (tags.amenity) return CATEGORY_MAP[tags.amenity] ?? tags.amenity;
  if (tags.shop) return CATEGORY_MAP[tags.shop] ?? tags.shop;
  if (tags.tourism) return CATEGORY_MAP[tags.tourism] ?? tags.tourism;
  return "Outro";
}

function buildQuery(q: OverpassQuery): string {
  const timeout = "[out:json][timeout:25]";
  if (q.type === "radius") {
    const around = `around:${q.radiusMeters},${q.lat},${q.lng}`;
    return `${timeout};(node[amenity](${around});node[shop](${around});way[amenity](${around});way[shop](${around}););out center 500;`;
  }
  const poly = q.coords.map((c) => `${c[0]} ${c[1]}`).join(" ");
  return `${timeout};(node[amenity](poly:"${poly}");node[shop](poly:"${poly}");way[amenity](poly:"${poly}");way[shop](poly:"${poly}"););out center 500;`;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export async function fetchBusinesses(q: OverpassQuery): Promise<Business[]> {
  const query = buildQuery(q);
  let lastError: Error = new Error("Nenhum servidor Overpass disponível");
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const json = await res.json();
  const seen = new Set<number>();
  const businesses: Business[] = [];
  for (const el of json.elements ?? []) {
    if (seen.has(el.id)) continue;
    seen.add(el.id);
    const tags: Record<string, string> = el.tags ?? {};
    const name = tags.name ?? tags["name:pt"] ?? tags["name:en"] ?? "(sem nome)";
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;
    businesses.push({
      id: el.id,
      name,
      category: getCategory(tags),
      lat,
      lng,
      phone: tags.phone ?? tags["contact:phone"],
      email: tags.email ?? tags["contact:email"],
      website: tags.website ?? tags["contact:website"],
      address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"]].filter(Boolean).join(", ") || undefined,
      openingHours: tags.opening_hours,
    });
  }
      return businesses;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError;
}

export function exportToCsv(businesses: Business[], filename = "atividades.csv") {
  const header = ["Nome", "Categoria", "Telefone", "Email", "Website", "Endereço", "Lat", "Lng"];
  const rows = businesses.map((b) => [
    b.name, b.category, b.phone ?? "", b.email ?? "", b.website ?? "", b.address ?? "", String(b.lat), String(b.lng),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}