import {materials,type Geometry} from './model';
import {cost,type Inputs} from './demoModel';
// Customers are fictional. No phone numbers are stored: voice invoices play in the browser only.
// A customer with `matchesEstimate` is the demo line: it always orders the estimator's quantity.
export type Customer={id:string;company:string;contact:string;quantity:number;po:string;matchesEstimate?:boolean};
export type InvoiceSettings={sender:string;margin:number;tax:number;terms:number};
export type InvoiceLine={description:string;detail:string;quantity:number;unit:number;amount:number};
export type PartSpec={file:string;name:string;material:string;process:string;dims:number[];volumeCm3:number;netMassG:number;purchased:string;geometry:string;tolerance:string};
export type VoiceInvoice={id:string;customer:Customer;quantity:number;issued:string;due:string;spec:PartSpec;lines:InvoiceLine[];subtotal:number;tax:number;total:number};
export const invoiceDefaults:InvoiceSettings={sender:'Forge Precision Manufacturing',margin:25,tax:0,terms:30};
export const demoCustomers:Customer[]=[
 {id:'demo',company:'Vertex Line Robotics',contact:'Alex',quantity:0,po:'PO-VLR-1001',matchesEstimate:true},
 {id:'c1',company:'Northwind Robotics',contact:'Dana',quantity:40,po:'PO-NW-2210'},
 {id:'c2',company:'Juniper Ridge Aerospace',contact:'Marco',quantity:120,po:'PO-JRA-0381'},
 {id:'c3',company:'Bluefin Automation',contact:'Priya',quantity:15,po:'PO-BFA-7745'},
];
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
const isoDate=(d:Date)=>d.toISOString().slice(0,10);
const usd=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
export const partName=(file:string)=>file.replace(/\.stl$/i,'').replace(/[-_]+/g,' ').trim()||'custom part';
export function partSpec(p:Inputs,g:Geometry|null,file:string):PartSpec{
 const r=cost(p,g);const m=materials[p.material];const dims=p.manual?p.dimensions:g?.dimensions_mm??[];const volume=(p.manual?p.volume:g?.volume_mm3)??0;
 return {file,name:partName(file),material:m.name,process:p.process==='cnc'?'CNC milling':'FDM 3D printing',dims:dims.map(x=>Math.round(x*10)/10),volumeCm3:Math.round(volume/10)/100,netMassG:Math.round(r.mass*10000)/10,
  purchased:p.process==='cnc'?`${p.stock.join(' × ')} mm stock · ${r.purchasedMass.toFixed(3)} kg/part`:`${p.usage}% solid usage + ${p.overhead}% support/scrap · ${(r.purchasedMass*1000).toFixed(1)} g/part`,
  geometry:p.manual?'Manual geometry entry':g?`${file} · ${g.triangles.toLocaleString('en-US')} triangles · ${g.watertight?'closed mesh':'open mesh'}`:'—',tolerance:p.tolerance.trim()||'Standard shop tolerance'};
}
/** Prices one customer's order from the estimator inputs: each cost driver becomes a line, marked up by the margin. */
export function buildInvoice(customer:Customer,p:Inputs,g:Geometry|null,file:string,settings:InvoiceSettings,seq:number,now=new Date()):VoiceInvoice{
 const q=customer.matchesEstimate?p.quantity:customer.quantity;
 if(!Number.isInteger(q)||q<1)throw Error(`${customer.company}: quantity must be a whole number of at least 1.`);
 for(const [key,value] of Object.entries({margin:settings.margin,tax:settings.tax,terms:settings.terms}))if(!Number.isFinite(value)||value<0||value>1000)throw Error(`Invoice ${key} must be between 0 and 1,000.`);
 const r=cost(p,g,q);const spec=partSpec(p,g,file);const markup=1+settings.margin/100;const price=(c:number)=>Math.round(cents(c)*markup);
 const lines=[
  {description:`Raw material · ${spec.material}`,detail:p.process==='cnc'?`${p.stock.join(' × ')} mm stock, ${r.purchasedMass.toFixed(3)} kg/part @ ${usd(p.price)}/kg`:`${(r.purchasedMass*1000).toFixed(1)} g/part incl. support and scrap @ ${usd(p.price)}/kg`,quantity:q,unit:price(r.material)},
  {description:`${spec.process} · ${spec.name}`,detail:`${p.minutes} min/part @ ${usd(p.rate)}/hr · ${spec.dims.join(' × ')} mm part`,quantity:q,unit:price(r.machine)},
  {description:'Finishing and inspection',detail:spec.tolerance,quantity:q,unit:price(r.finish)},
  {description:'Setup and programming',detail:'Charged once per production batch',quantity:1,unit:price(p.setup)},
 ].filter(l=>l.unit>0).map(l=>({...l,unit:l.unit/100,amount:l.unit*l.quantity/100}));
 const subtotal=lines.reduce((s,l)=>s+cents(l.amount),0);const tax=Math.round(subtotal*settings.tax/100);
 const due=new Date(now.getTime()+Math.round(settings.terms)*86400000);
 return {id:`INV-${isoDate(now).replace(/-/g,'')}-${String(seq).padStart(3,'0')}`,customer,quantity:q,issued:isoDate(now),due:isoDate(due),spec,lines,subtotal:subtotal/100,tax:tax/100,total:(subtotal+tax)/100};
}
const spokenDate=(iso:string)=>new Date(iso+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
/** Text sent to Cartesia. Short reference numbers are spaced so the voice reads them digit by digit. */
export function invoiceScript(inv:VoiceInvoice,settings:InvoiceSettings){
 const spell=(s:string)=>s.split('').join(' ');const s=inv.spec;
 return `Hello ${inv.customer.contact}, this is the automated billing assistant for ${settings.sender}, calling for ${inv.customer.company}. `+
 `We've issued invoice ${spell(inv.id.slice(-3))} for ${inv.quantity} ${inv.quantity===1?'unit':'units'} of the ${s.name}, ${s.process==='CNC milling'?'CNC machined':'3D printed'} in ${s.material}, ${s.dims.join(' by ')} millimeters, against purchase order ${spell(inv.customer.po.split('-').pop()??'')}. `+
 `The total due is ${usd(inv.total)}${inv.tax?`, including ${usd(inv.tax)} in tax`:''}, payable by ${spokenDate(inv.due)}. `+
 `An itemized copy with the part specification is in your accounts payable inbox. Thank you for building with us. Goodbye!`;
}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Standalone printable invoice a shop can save or send. */
export function invoiceHtml(inv:VoiceInvoice,settings:InvoiceSettings){
 const s=inv.spec;const row=(a:string,b:string)=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(inv.id)}</title><style>body{font:14px/1.5 system-ui,sans-serif;color:#1d241d;max-width:820px;margin:40px auto;padding:0 24px}h1{font-size:26px;margin:0}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #dde3da;vertical-align:top}.n{text-align:right}small{color:#667a62}.parties{display:flex;gap:40px;margin:24px 0}.total td{font-weight:700;font-size:17px;border:0}.spec th{width:34%;color:#4c5e48;font-weight:500}</style></head><body>`+
 `<h1>Invoice ${esc(inv.id)}</h1><small>Issued ${inv.issued} · Due ${inv.due} · Net ${Math.round(settings.terms)}</small>`+
 `<div class="parties"><div><small>FROM</small><br><b>${esc(settings.sender)}</b></div><div><small>BILL TO</small><br><b>${esc(inv.customer.company)}</b><br>Attn. ${esc(inv.customer.contact)} · ${esc(inv.customer.po)}</div></div>`+
 `<h3>Part specification</h3><table class="spec">${row('Part',`${s.name} (${s.file})`)}${row('Material / process',`${s.material} · ${s.process}`)}${row('Envelope',`${s.dims.join(' × ')} mm`)}${row('Volume / net mass',`${s.volumeCm3} cm³ · ${s.netMassG} g per part`)}${row('Purchased material',s.purchased)}${row('Geometry source',s.geometry)}${row('Tolerance',s.tolerance)}${row('Quantity',String(inv.quantity))}</table>`+
 `<table><tr><th>Description</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Amount</th></tr>${inv.lines.map(l=>`<tr><td>${esc(l.description)}<br><small>${esc(l.detail)}</small></td><td class="n">${l.quantity}</td><td class="n">${usd(l.unit)}</td><td class="n">${usd(l.amount)}</td></tr>`).join('')}`+
 `<tr><td colspan="3" class="n">Subtotal</td><td class="n">${usd(inv.subtotal)}</td></tr><tr><td colspan="3" class="n">Tax</td><td class="n">${usd(inv.tax)}</td></tr><tr class="total"><td colspan="3" class="n">Total due</td><td class="n">${usd(inv.total)}</td></tr></table>`+
 `<small>Prepared by ForgeAI from STL geometry and entered manufacturing assumptions. Demonstration document; customer is simulated.</small></body></html>`;
}
