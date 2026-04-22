import { useRef } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CsvRowData {
  inhabitants?: number;
  incomePerCapita?: number;
  socialClass?: string;
  avgAge?: number;
  numTowers?: number;
  name?: string;
}

interface Props {
  onImport: (rows: CsvRowData[]) => void;
}

const KEY_MAP: Record<string, keyof CsvRowData> = {
  habitantes: "inhabitants",
  inhabitants: "inhabitants",
  populacao: "inhabitants",
  população: "inhabitants",
  renda: "incomePerCapita",
  renda_per_capita: "incomePerCapita",
  income: "incomePerCapita",
  classe: "socialClass",
  classe_social: "socialClass",
  social_class: "socialClass",
  idade: "avgAge",
  idade_media: "avgAge",
  age: "avgAge",
  torres: "numTowers",
  num_torres: "numTowers",
  nome: "name",
  name: "name",
};

export function CsvImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows: CsvRowData[] = (res.data as Record<string, string>[]).map(
          (raw) => {
            const out: CsvRowData = {};
            for (const [k, v] of Object.entries(raw)) {
              const key = KEY_MAP[k.trim().toLowerCase()];
              if (!key) continue;
              if (key === "socialClass" || key === "name") {
                (out as any)[key] = String(v).trim();
              } else {
                const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
                if (!Number.isNaN(n)) (out as any)[key] = n;
              }
            }
            return out;
          },
        );
        if (rows.length === 0) {
          toast.error("Nenhuma linha válida no CSV");
          return;
        }
        onImport(rows);
        toast.success(`${rows.length} registro(s) importado(s)`);
      },
      error: () => toast.error("Erro ao ler CSV"),
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        <Upload className="mr-2 h-3.5 w-3.5" />
        Importar CSV
      </Button>
    </>
  );
}
