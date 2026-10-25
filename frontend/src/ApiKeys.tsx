'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,Info,KeyRound,LoaderCircle,ShieldCheck,TriangleAlert,Volume2} from 'lucide-react';
import {MODELS,serverKeyConfigured,speak,type VoiceConfig} from './voiceClient';
import './voice.css';
export default function ApiKeys({config,setConfig}:{config:VoiceConfig;setConfig:(c:VoiceConfig)=>void}){
 const [server,setServer]=useState<boolean|null>(null);const [test,setTest]=useState<{state:'idle'|'busy'|'ok'|'error';message?:string}>({state:'idle'});
 useEffect(()=>{serverKeyConfigured().then(setServer)},[]);
 async function runTest(){setTest({state:'busy'});try{const blob=await speak('ForgeAI voice check. Cartesia is connected and ready to read invoices.',config);const url=URL.createObjectURL(blob);const audio=new Audio(url);audio.onended=()=>URL.revokeObjectURL(url);await audio.play();setTest({state:'ok',message:'Voice is working.'})}catch(e){setTest({state:'error',message:e instanceof Error?e.message:'Test failed.'})}}
 return <>
 <div className="section-intro"><KeyRound size={20}/><p>API keys stay on the server. The browser bundle, localStorage and exports never contain them.</p><span className={'tag '+(server?'green':'amber')}>{server===null?'CHECKING':server?'SERVER KEY ACTIVE':'NO KEY'}</span></div>
 <div className="budget-grid">
 <article className="card"><div className="cardheading"><h2><ShieldCheck size={16}/>Cartesia · server secret</h2><span className={'tag '+(server?'green':'amber')}>{server===null?'CHECKING':server?'CONFIGURED':'NOT SET'}</span></div>
  <p className="bodycopy">Create a <code>.dev.vars</code> file in the ForgeAI root (it is gitignored) and restart <code>npm run dev</code>:</p>
  <pre className="keys-code">CARTESIA_API_KEY=sk_car_…</pre>
  <p className="bodycopy">A template is in <code>.dev.vars.example</code>. For a deployed site, set <code>CARTESIA_API_KEY</code> as a host secret (for example <code>npx wrangler secret put CARTESIA_API_KEY</code>). Never use a <code>VITE_</code> variable: those are shipped to every visitor.</p>
  <p className="footnote"><Info size={12}/>Server code reads the key and calls Cartesia itself. The browser only receives audio.</p>
 </article>
 <article className="card"><div className="cardheading"><h2><Volume2 size={16}/>Voice check</h2><span className="tag">CARTESIA SONIC</span></div>
  <label className="field"><span>Cartesia model</span><select value={config.model} onChange={e=>setConfig({...config,model:e.target.value as VoiceConfig['model']})}>{MODELS.map(m=><option key={m} value={m}>{m}</option>)}</select></label>
  <button className="button full" disabled={!server||test.state==='busy'} onClick={runTest}>{test.state==='busy'?<LoaderCircle size={15} className="spin"/>:<Volume2 size={15}/>}Test voice</button>
  {test.message&&<p role={test.state==='error'?'alert':'status'} className={'keys-test '+(test.state==='error'?'error':'green-text')}>{test.state==='error'?<TriangleAlert size={13}/>:<CheckCircle2 size={13}/>}{test.message}</p>}
 </article>
 </div>
 </>;
}
