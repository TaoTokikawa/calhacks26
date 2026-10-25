import { CARTESIA_API, cartesiaHeaders, missingKey, serverKey, upstreamError } from "@/lib/cartesia";
export const dynamic = "force-dynamic";
type Voice = { id?: unknown; name?: unknown; description?: unknown; language?: unknown };
export async function GET(request: Request) {
  const key = serverKey();
  if (!key) return missingKey();
  try {
    const response = await fetch(`${CARTESIA_API}/voices?limit=100`, { headers: cartesiaHeaders(key, false), signal: AbortSignal.timeout(15000) });
    if (!response.ok) return upstreamError(response);
    const data = (await response.json()) as Voice[] | { data?: Voice[] };
    const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
    const voices = list
      .filter(v => typeof v.id === "string" && typeof v.name === "string" && (!v.language || v.language === "en"))
      .map(v => ({ id: v.id as string, name: v.name as string, description: String(v.description ?? "").slice(0, 140) }));
    return Response.json({ voices }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not load Cartesia voices." }, { status: 502 });
  }
}
