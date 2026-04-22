import { useEffect, useState, type ComponentType } from "react";
import type { MapSelection, MapType } from "./MapView";

interface Props {
  center: { lat: number; lng: number };
  marker?: { lat: number; lng: number; label?: string };
  onSelectionChange: (selection: MapSelection | null) => void;
  numTowersHint?: number;
  mapType?: MapType;
  onMapTypeChange?: (type: MapType) => void;
  googleApiKey?: string;
  onGoogleApiKeyChange?: (key: string) => void;
}

export function MapViewClient(props: Props) {
  const [Comp, setComp] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    let mounted = true;
    import("./MapView").then((m) => {
      if (mounted) setComp(() => m.MapView);
    });
    return () => { mounted = false; };
  }, []);

  if (!Comp) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        Carregando mapa...
      </div>
    );
  }
  return <Comp {...props} />;
}

export type { MapSelection, MapType };
