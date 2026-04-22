import Anthropic from "@anthropic-ai/sdk";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, system } = await req.json();

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  return new Response(JSON.stringify({ content: text }), {
    headers: { "Content-Type": "application/json" },
  });
}
