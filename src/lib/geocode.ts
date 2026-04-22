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

export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
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
