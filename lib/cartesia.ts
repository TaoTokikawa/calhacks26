import { env } from "cloudflare:workers";

// Server-only Cartesia helpers. The key comes from the CARTESIA_API_KEY secret
// (.dev.vars locally, a host secret in production) and never reaches the browser.
export const CARTESIA_API = "https://api.cartesia.ai";
export const CARTESIA_VERSION = "2025-04-16";
export const MODELS = ["sonic-3", "sonic-2", "sonic-turbo"] as const;
export const DEFAULT_VOICE = "694f9389-aac1-45b6-b726-9d9369183238";

export function serverKeyConfigured() {
  return Boolean(env.CARTESIA_API_KEY?.trim());
}

export function serverKey(): string | null {
  return env.CARTESIA_API_KEY?.trim() || null;
}

export function cartesiaHeaders(key: string, json = true): HeadersInit {
  return {
    "X-API-Key": key,
    "Cartesia-Version": CARTESIA_VERSION,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function upstreamError(response: Response) {
  let detail = `Cartesia returned ${response.status}.`;
  try {
    const text = (await response.text()).slice(0, 300);
    if (text) detail += " " + text;
  } catch {}
  const status = response.status === 401 || response.status === 403 ? 401 : 502;
  return Response.json({ error: response.status === 401 ? "Cartesia rejected the API key." : detail }, { status });
}

export const missingKey = () =>
  Response.json(
    { error: "No Cartesia API key. Add CARTESIA_API_KEY to .dev.vars and restart the dev server." },
    { status: 401 },
  );
