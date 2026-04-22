export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
}

function formatShortName(data: {
  display_name: string;
  address?: Record<string, string>;
}): string {
  const a = data.address ?? {};
  const name =
    a.amenity ||
    a.building ||
    a.leisure ||
    a.tourism ||
    a.road ||
    a.suburb ||
    a.hamlet ||
    data.display_name.split(",")[0];
  const city = a.city || a.town || a.village || a.municipality || "";
  const state = a.state ?? "";
  return [name, city, state].filter(Boolean).join(", ");
}

// Detect "-22.9720, -43.3862" or "-22.9720 -43.3862"
function parseCoords(q: string): GeocodeResult | null {
  const m = q.trim().match(/^(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1].replace(",", "."));
  const lng = parseFloat(m[2].replace(",", "."));
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat,
    lng,
    displayName: `${lat}, ${lng}`,
    shortName: `Coordenadas ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

// Detect CEP "22775-040" or "22775040"
function isCep(q: string): string | null {
  const digits = q.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

async function geocodeCep(cep: string): Promise<GeocodeResult[]> {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  if (!res.ok) return [];
  const d = await res.json();
  if (!d.latitude || !d.longitude) return [];
  const parts = [d.street, d.neighborhood, d.city, d.state].filter(Boolean);
  return [{
    lat: parseFloat(d.latitude),
    lng: parseFloat(d.longitude),
    displayName: parts.join(", "),
    shortName: [d.street || d.neighborhood || `CEP ${cep}`, d.city, d.state].filter(Boolean).join(", "),
  }];
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  // Coordinates
  const coords = parseCoords(query);
  if (coords) return [coords];

  // CEP
  const cep = isCep(query);
  if (cep) return geocodeCep(cep);

  // Address via Nominatim
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("dedupe", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "ValidaVinho/1.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao buscar endereco");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }>;
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name,
    shortName: formatShortName(d),
  }));
}
