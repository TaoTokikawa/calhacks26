import { CARTESIA_API, DEFAULT_VOICE, MODELS, cartesiaHeaders, missingKey, serverKey, upstreamError } from "@/lib/cartesia";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const key = serverKey();
  if (!key) return missingKey();
  let body: { transcript?: unknown; voice?: unknown; model?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Expected a JSON body." }, { status: 400 }); }
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript || transcript.length > 2000) return Response.json({ error: "Script must be 1–2,000 characters." }, { status: 400 });
  const voice = typeof body.voice === "string" && /^[A-Za-z0-9-]{8,64}$/.test(body.voice) ? body.voice : DEFAULT_VOICE;
  const model = MODELS.includes(body.model as (typeof MODELS)[number]) ? (body.model as string) : MODELS[0];
  try {
    const response = await fetch(`${CARTESIA_API}/tts/bytes`, {
      method: "POST",
      headers: cartesiaHeaders(key),
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model_id: model,
        transcript,
        voice: { mode: "id", id: voice },
        language: "en",
        output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
      }),
    });
    if (!response.ok) return upstreamError(response);
    return new Response(response.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Cartesia request timed out or failed." }, { status: 502 });
  }
}
