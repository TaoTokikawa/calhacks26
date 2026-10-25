'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {AudioLines,CheckCircle2,Download,Info,KeyRound,LoaderCircle,PhoneCall,Play,Receipt,RotateCcw,Square,TriangleAlert,FileText,Link2} from 'lucide-react';
import type {Inputs} from './demoModel';
import {money,type Geometry} from './model';
import {buildInvoice,demoCustomers,invoiceDefaults,invoiceHtml,invoiceScript,type Customer,type InvoiceSettings,type VoiceInvoice} from './invoiceModel';
import {DEFAULT_VOICE,listVoices,serverKeyConfigured,speak,type Voice,type VoiceConfig} from './voiceClient';
import './voice.css';
type Clip={state:'generating'|'ready'|'playing'|'error';url?:string;script?:string;error?:string};
function NumberInput({label,value,onChange,suffix,step=1}:{label:string;value:number;onChange:(v:number)=>void;suffix?:string;step?:number}){return <label className="field"><span>{label}</span><div className="inputwrap"><input type="number" min={0} step={step} value={Number.isFinite(value)?value:''} onChange={e=>onChange(e.target.valueAsNumber)}/>{suffix&&<small>{suffix}</small>}</div></label>}
export default function VoiceInvoices({p,g,part,config,setConfig,openKeys}:{p:Inputs;g:Geometry|null;part:string;config:VoiceConfig;setConfig:(c:VoiceConfig)=>void;openKeys:()=>void}){
 const [customers,setCustomers]=useState<Customer[]>(demoCustomers);const [settings,setSettings]=useState<InvoiceSettings>(invoiceDefaults);const [selected,setSelected]=useState(demoCustomers[0].id);
 const [scripts,setScripts]=useState<Record<string,string>>({});const [audio,setAudio]=useState<Record<string,Clip>>({});const [running,setRunning]=useState(false);
 const [server,setServer]=useState<boolean|null>(null);const [voices,setVoices]=useState<Voice[]>([]);const [voiceError,setVoiceError]=useState('');
 const player=useRef<HTMLAudioElement|null>(null);const stop=useRef<AbortController|null>(null);const urls=useRef<string[]>([]);
 const keyReady=server===true;
 useEffect(()=>{serverKeyConfigured().then(setServer)},[]);
 useEffect(()=>()=>{stop.current?.abort();player.current?.pause();urls.current.forEach(URL.revokeObjectURL)},[]);
 useEffect(()=>{if(!keyReady)return;let live=true;listVoices().then(v=>{if(!live)return;setVoices(v);setVoiceError('')}).catch(e=>live&&setVoiceError(e instanceof Error?e.message:'Could not load voices.'));return()=>{live=false}},[keyReady]);
 const invoices=customers.map((c,i)=>{try{return {customer:c,invoice:buildInvoice(c,p,g,part,settings,i+1)}}catch(e){return {customer:c,error:e instanceof Error?e.message:'Check estimate inputs.'}}});
 const scriptFor=(inv:VoiceInvoice)=>scripts[inv.customer.id]??invoiceScript(inv,settings);
 const current=invoices.find(x=>x.customer.id===selected)??invoices[0];const currentAudio=audio[current.customer.id];
 const patch=(id:string,a:Clip)=>setAudio(old=>({...old,[id]:a}));
 async function generate(inv:VoiceInvoice,signal?:AbortSignal){const id=inv.customer.id;const script=scriptFor(inv);patch(id,{state:'generating',script});
  try{const blob=await speak(script,config,signal);const url=URL.createObjectURL(blob);urls.current.push(url);const a:Clip={state:'ready',url,script};patch(id,a);return a}
  catch(e){if(signal?.aborted){patch(id,{state:'error',error:'Stopped.'});return null}patch(id,{state:'error',script,error:e instanceof Error?e.message:'Voice generation failed.'});return null}}
 function play(id:string,url:string){return new Promise<void>(resolve=>{player.current?.pause();const el=new Audio(url);player.current=el;setAudio(old=>({...old,[id]:{...old[id],state:'playing'}}));const done=()=>{setAudio(old=>({...old,[id]:{...old[id],state:'ready'}}));resolve()};el.onended=done;el.onpause=done;el.onerror=done;el.play().catch(done)})}
 async function runAll(){const controller=new AbortController();stop.current=controller;setRunning(true);
  for(const x of invoices){if(controller.signal.aborted)break;if(!('invoice' in x)||!x.invoice)continue;setSelected(x.customer.id);const a=fresh(x.invoice)?audio[x.customer.id]:await generate(x.invoice,controller.signal);if(a?.url&&!controller.signal.aborted)await play(x.customer.id,a.url)}
  setRunning(false);stop.current=null}
 function halt(){stop.current?.abort();player.current?.pause()}
 const fresh=(inv:VoiceInvoice)=>{const a=audio[inv.customer.id];return Boolean(a?.url&&a.script===scriptFor(inv))};
 const updateCustomer=(id:string,change:Partial<Customer>)=>setCustomers(cs=>cs.map(c=>c.id===id?{...c,...change}:c));
 return <>
 <div className="section-intro"><PhoneCall size={20}/><p>Invoices are itemized from the current STL geometry and manufacturing specs, then read aloud with Cartesia text-to-speech. The <b>demo line</b> order always matches the estimator’s part and quantity. <b>Demo playback only:</b> customers are fictional and no phone call is placed.</p><span className={'tag '+(keyReady?'green':'amber')}>{server===null?'CHECKING KEY':keyReady?'CARTESIA READY':'CARTESIA KEY NEEDED'}</span></div>
 {!keyReady&&server!==null&&<div className="budget-result negative voice-banner"><KeyRound size={18}/><div><strong>Add a Cartesia API key to hear invoices</strong><small>Invoices still generate below. Voice playback needs CARTESIA_API_KEY in .dev.vars.</small></div><button className="button primary" onClick={openKeys}>Add API key</button></div>}
 <div className="voice-grid">
 <section>
  <article className="card"><div className="cardheading"><h2><Receipt size={16}/>Invoice queue</h2><span className="tag">FROM {part.toUpperCase()}</span></div>
   <div className="voice-queue">{invoices.map(x=>{const a=audio[x.customer.id];const stale=a?.url&&'invoice' in x&&x.invoice&&!fresh(x.invoice);return <div key={x.customer.id} className={'voice-row '+(x.customer.id===current.customer.id?'selected':'')} onClick={()=>setSelected(x.customer.id)}>
    <div className="voice-who"><strong>{x.customer.company} <em>(simulated)</em>{x.customer.matchesEstimate&&<span className="tag green voice-demo">DEMO LINE</span>}</strong><small>Attn. {x.customer.contact} · {x.customer.po}</small></div>
    {x.customer.matchesEstimate?<div className="voice-qty voice-synced" title="Follows the estimator quantity"><Link2 size={11}/>{Number.isFinite(p.quantity)?p.quantity:'—'}<small>parts</small></div>:<label className="voice-qty" onClick={e=>e.stopPropagation()}><input aria-label={`${x.customer.company} quantity`} type="number" min={1} step={1} value={Number.isFinite(x.customer.quantity)?x.customer.quantity:''} onChange={e=>updateCustomer(x.customer.id,{quantity:e.target.valueAsNumber})}/><small>parts</small></label>}
    <b>{'invoice' in x&&x.invoice?money(x.invoice.total):'—'}</b>
    <span className={'tag '+(a?.state==='error'||'error' in x&&x.error?'amber':a?.url&&!stale?'green':'')}>{'error' in x&&x.error?'CHECK INPUTS':a?.state==='generating'?'SYNTHESIZING':a?.state==='playing'?'SPEAKING':a?.state==='error'?'VOICE FAILED':stale?'SCRIPT CHANGED':a?.url?'VOICE READY':'QUEUED'}</span>
   </div>})}</div>
   <div className="keys-actions">{running?<button className="button" onClick={halt}><Square size={14}/>Stop</button>:<button className="button primary" disabled={!keyReady} onClick={runAll}><AudioLines size={15}/>Run automatic voice invoicing</button>}<button className="button quiet" disabled={running} onClick={()=>{setCustomers(demoCustomers);setScripts({});setSettings(invoiceDefaults)}}><RotateCcw size={14}/>Reset queue</button></div>
   <p className="footnote"><Info size={12}/>Every line is priced from the estimator’s stock, material rate, cycle time, finishing and setup at that customer’s quantity, plus your margin. Upload a different STL or change specs on the Single-part estimator page and the invoices update.</p>
  </article>
  <article className="card"><div className="cardheading"><h2>Billing and voice settings</h2><span className="tag amber">EDITABLE</span></div>
   <div className="fields">
    <label className="field"><span>Billing company</span><input value={settings.sender} maxLength={60} onChange={e=>setSettings({...settings,sender:e.target.value})}/></label>
    <NumberInput label="Margin over cost" value={settings.margin} suffix="%" onChange={v=>setSettings({...settings,margin:v})}/>
    <NumberInput label="Sales tax" value={settings.tax} suffix="%" step={.01} onChange={v=>setSettings({...settings,tax:v})}/>
    <NumberInput label="Payment terms" value={settings.terms} suffix="days" onChange={v=>setSettings({...settings,terms:v})}/>
    <label className="field voice-span"><span>Cartesia voice · model {config.model}</span><select value={config.voice} disabled={!keyReady} onChange={e=>setConfig({...config,voice:e.target.value})}>{!voices.some(v=>v.id===config.voice)&&<option value={config.voice}>{config.voice===DEFAULT_VOICE?'Default voice':config.voice}</option>}{voices.map(v=><option key={v.id} value={v.id}>{v.name}{v.description?` — ${v.description}`:''}</option>)}</select></label>
   </div>
   {voiceError&&<p className="error smalltext" role="alert">{voiceError}</p>}
  </article>
 </section>
 <section>
  {'invoice' in current&&current.invoice?<InvoiceCard inv={current.invoice} sender={settings.sender}>
   <div className="voice-script"><div className="cardheading"><h2><AudioLines size={15}/>Voice script</h2>{scripts[current.customer.id]!==undefined&&<button className="textbutton" onClick={()=>setScripts(s=>{const n={...s};delete n[current.customer.id];return n})}>Regenerate from invoice</button>}</div>
    <textarea value={scriptFor(current.invoice)} maxLength={2000} rows={6} onChange={e=>setScripts(s=>({...s,[current.customer.id]:e.target.value}))}/>
    <div className="keys-actions">
     <button className="button primary" disabled={!keyReady||running||currentAudio?.state==='generating'} onClick={async()=>{const inv=current.invoice!;const a=fresh(inv)?currentAudio:await generate(inv);if(a?.url)play(inv.customer.id,a.url)}}>{currentAudio?.state==='generating'?<LoaderCircle size={15} className="spin"/>:<Play size={15}/>}{currentAudio?.state==='generating'?'Synthesizing…':'Speak invoice'}</button>
     {currentAudio?.state==='playing'&&<button className="button" onClick={()=>player.current?.pause()}><Square size={14}/>Stop</button>}
     <button className="button quiet" onClick={()=>downloadInvoice(current.invoice!,settings)}><FileText size={14}/>Download invoice</button>
     {currentAudio?.url&&fresh(current.invoice)&&<a className="button quiet" href={currentAudio.url} download={`${current.invoice.id}-${current.customer.company.replace(/\W+/g,'-')}.mp3`}><Download size={14}/>Download MP3</a>}
    </div>
    {currentAudio?.state==='playing'&&<div className="voice-wave" aria-label="Speaking">{Array.from({length:24},(_,i)=><i key={i} style={{animationDelay:`${(i%8)*.09}s`}}/>)}</div>}
    {currentAudio?.state==='error'&&<p role="alert" className="error smalltext keys-test"><TriangleAlert size={13}/>{currentAudio.error}</p>}
    {currentAudio?.state==='ready'&&fresh(current.invoice)&&<p className="green-text smalltext keys-test"><CheckCircle2 size={13}/>Audio ready · generated by Cartesia</p>}
   </div>
  </InvoiceCard>:<article className="card"><p className="error" role="alert">{'error' in current?current.error:'Invoice unavailable.'}</p></article>}
 </section>
 </div></>;
}
function downloadInvoice(inv:VoiceInvoice,settings:InvoiceSettings){const url=URL.createObjectURL(new Blob([invoiceHtml(inv,settings)],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download=`${inv.id}-${inv.customer.company.replace(/\W+/g,'-')}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function InvoiceCard({inv,sender,children}:{inv:VoiceInvoice;sender:string;children:ReactNode}){
 return <article className="card invoice-doc"><div className="cardheading"><h2><Receipt size={16}/>Invoice {inv.id}</h2><span className="tag">AUTO-GENERATED · NOT SENT</span></div>
  <div className="invoice-parties"><div><small>From</small><b>{sender||'—'}</b></div><div><small>Bill to</small><b>{inv.customer.company} (simulated)</b><span>Attn. {inv.customer.contact} · {inv.customer.po}</span></div><div><small>Issued / due</small><b>{inv.issued}</b><span>Due {inv.due}</span></div></div>
  <div className="invoice-spec"><div><small>Part</small><b>{inv.spec.name}</b><span>{inv.spec.file}</span></div><div><small>Material · process</small><b>{inv.spec.material}</b><span>{inv.spec.process}</span></div><div><small>Envelope</small><b>{inv.spec.dims.join(' × ')} mm</b><span>{inv.spec.volumeCm3} cm³ · {inv.spec.netMassG} g net</span></div><div><small>Purchased material</small><b>{inv.spec.purchased}</b></div><div><small>Tolerance</small><b>{inv.spec.tolerance}</b></div><div><small>Geometry</small><b>{inv.spec.geometry}</b></div></div>
  <div className="invoice-lines"><div className="invoice-line head"><span>Description</span><span>Qty</span><span>Unit</span><span>Amount</span></div>{inv.lines.map(l=><div className="invoice-line" key={l.description}><span>{l.description}<small>{l.detail}</small></span><span>{l.quantity}</span><span>{money(l.unit)}</span><span>{money(l.amount)}</span></div>)}</div>
  <div className="budgetmath"><div><span>Subtotal</span><b>{money(inv.subtotal)}</b></div><div><span>Tax</span><b>{money(inv.tax)}</b></div><div className="budgetmath-total"><span>Total due</span><b>{money(inv.total)}</b></div></div>
  {children}
 </article>;
}
