// Browser side of the Cartesia proxy. The API key stays on the server (CARTESIA_API_KEY).
export const MODELS=['sonic-3','sonic-2','sonic-turbo'] as const;
export type VoiceConfig={model:(typeof MODELS)[number];voice:string};
export type Voice={id:string;name:string;description:string};
export const DEFAULT_VOICE='694f9389-aac1-45b6-b726-9d9369183238';
export const voiceDefaults:VoiceConfig={model:'sonic-3',voice:DEFAULT_VOICE};
async function failure(response:Response){try{const e=await response.json() as {error?:string};return Error(e.error??`Request failed (${response.status}).`)}catch{return Error(`Request failed (${response.status}).`)}}
export async function serverKeyConfigured(){try{const r=await fetch('/api/integrations');const d=await r.json() as {cartesia?:{configured?:boolean}};return Boolean(d.cartesia?.configured)}catch{return false}}
export async function listVoices():Promise<Voice[]>{const r=await fetch('/api/voice/voices');if(!r.ok)throw await failure(r);return ((await r.json()) as {voices:Voice[]}).voices}
export async function speak(transcript:string,cfg:VoiceConfig,signal?:AbortSignal):Promise<Blob>{const r=await fetch('/api/voice/tts',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript,voice:cfg.voice,model:cfg.model})});if(!r.ok)throw await failure(r);return r.blob()}
