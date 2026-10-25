import type {Geometry,Params} from './model';
const base=''; // Legacy local FastAPI adapter; not used by the hosted project studio.
export async function request<T=Record<string,unknown>>(path:string,options:RequestInit={}){const response=await fetch(base+'/api'+path,{...options,signal:AbortSignal.timeout(20000)});if(!response.ok){let detail='Service unavailable';try{const e=await response.json() as {detail?:unknown};detail=typeof e.detail==='string'?e.detail:JSON.stringify(e.detail)}catch{}throw Error(detail)}return response.json() as Promise<T>;}
export const health=()=>request('/health');
export async function upload(file:File,units:string):Promise<Geometry>{const body=new FormData();body.append('file',file);body.append('units',units);return request<Geometry>('/geometry',{method:'POST',body})}
export const estimate=(parameters:Params,geometry:Geometry|null,manual:boolean)=>request('/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parameters,geometry,manual})});
export const explain=(parameters:Params,geometry:Geometry|null,manual:boolean,question:string)=>request('/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parameters,geometry,manual,question})});
