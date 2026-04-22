import { useEffect, useRef, useState } from "react";
import { Send, Download, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportToCsv, type Business } from "@/lib/overpass";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  businesses: Business[];
  total: number;
}

function buildSystem(businesses: Business[]): string {
  const lines = businesses
    .map((b, i) => {
      const parts = [`${i + 1}. ${b.name} (${b.category})`];
      if (b.phone) parts.push(`Tel: ${b.phone}`);
      if (b.email) parts.push(`Email: ${b.email}`);
      if (b.website) parts.push(`Site: ${b.website}`);
      if (b.address) parts.push(`End: ${b.address}`);
      return parts.join(" | ");
    })
    .join("\n");

  return `Voce e o assistente ValidaVinho AI, especializado em analise de viabilidade para franquias de adega autonoma Vinho24h.

O usuario analisou uma regiao e encontrou ${businesses.length} atividades economicas. Dados:

${lines}

Instrucoes:
- Responda sempre em portugues do Brasil, de forma concisa e util
- Quando pedirem contatos (telefone, email) de um tipo, liste so os que tiverem esses dados
- Quando pedirem para exportar, enviar ou baixar dados, inclua um bloco JSON no formato exato: \`\`\`json\n[{"nome":"...","categoria":"...","telefone":"...","email":"..."}]\n\`\`\` para acionar o download automatico
- Para perguntas sobre concorrencia, analise presenca de adegas, livrarias de bebidas, mercados
- Para perguntas sobre perfil da regiao, use as categorias presentes como base`;
}

function parseJsonBlock(text: string): Record<string, string>[] | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return null;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const jsonData = !isUser ? parseJsonBlock(msg.content) : null;
  const displayText = msg.content.replace(/```json[\s\S]*?```/g, "").trim();

  function handleDownload() {
    if (!jsonData) return;
    const businesses = jsonData.map((r, i) => ({
      id: i,
      name: r.nome ?? r.name ?? "",
      category: r.categoria ?? r.category ?? "",
      lat: 0,
      lng: 0,
      phone: r.telefone ?? r.phone,
      email: r.email,
      website: r.site ?? r.website,
      address: r.endereco ?? r.address,
    }));
    exportToCsv(businesses, "contatos-filtrados.csv");
  }

  return (
    <div className={cn("flex gap-2 items-start", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
          isUser ? "bg-[oklch(0.38_0.19_350)]" : "bg-[oklch(0.25_0.06_350)]"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "bg-[oklch(0.38_0.19_350)] text-white rounded-tr-sm"
            : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm"
        )}
      >
        {displayText.split("\n").map((line, i) => (
          <p key={i} className={line === "" ? "h-1.5" : ""}>
            {line.startsWith("- ") ? (
              <span>
                <span className="mr-1 text-[oklch(0.38_0.19_350)]">•</span>
                {line.slice(2)}
              </span>
            ) : (
              line.replace(/\*\*(.*?)\*\*/g, "$1")
            )}
          </p>
        ))}
        {jsonData && (
          <button
            onClick={handleDownload}
            className={cn(
              "mt-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
              "bg-[oklch(0.38_0.19_350)] text-white hover:bg-[oklch(0.32_0.19_350)]"
            )}
          >
            <Download className="h-3 w-3" />
            Baixar CSV ({jsonData.length} registros)
          </button>
        )}
      </div>
    </div>
  );
}

export function BusinessChat({ businesses, total }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plural = businesses.length !== 1;
    setMessages([
      {
        role: "assistant",
        content: `Carregamos **${total}** atividade${total !== 1 ? "s" : ""} na regiao! Posso te enviar o CSV completo, filtrar por categoria ou responder perguntas sobre os negocios. O que voce quer saber?`,
      },
    ]);
  }, [businesses, total]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystem(businesses),
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: "Erro ao conectar com o assistente. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {loading && (
          <div className="flex gap-2 items-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[oklch(0.25_0.06_350)] text-white">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-gray-100 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Pergunte sobre a regiao..."
          disabled={loading}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-[oklch(0.38_0.19_350)] focus:bg-white transition-colors disabled:opacity-50"
        />
        <Button
          size="sm"
          onClick={send}
          disabled={loading || !input.trim()}
          className="h-8 w-8 rounded-full p-0 bg-[oklch(0.38_0.19_350)] hover:bg-[oklch(0.32_0.19_350)]"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
