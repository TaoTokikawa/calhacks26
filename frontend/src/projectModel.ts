export type PriceBreak={quantity:number;price:number};
export type Source={kind:'assumption'|'manual'|'catalog'|'quote';supplier:string;productId:string;url:string;observedAt:string;availability:string;validUntil:string;reviewed:boolean;breaks:PriceBreak[]};
export type MakeOp={id:string;name:string;minutes:number;rate:number};
export type MakePlan={material:string;stockKg:number;priceKg:number;setup:number;finish:number;operations:MakeOp[];leadDays:number;notes:string};
export type Part={id:string;name:string;revision:string;perUnit:number;inventory:number;scrap:number;route:'make'|'buy';unitPrice:number;packSize:number;moq:number;leadDays:number;source:Source;make:MakePlan;cadName:string;cadVolume:number|null;cadDims:number[]|null;notes:string;alternative:{enabled:boolean;qualified:boolean;unit:number;setup:number;name:string}};
export type Station={id:string;name:string;minutes:number;rate:number;parallel:number;setup:number};
export type Project={version:1;name:string;idea:string;units:number;deadlineDays:number;parts:Part[];stations:Station[];hoursPerDay:number;efficiency:number;balance:number;commitments:number;reserve:number;shipping:number;taxPct:number;contingencyPct:number};
const source=():Source=>({kind:'assumption',supplier:'Demo supplier',productId:'',url:'',observedAt:'',availability:'Not checked',validUntil:'',reviewed:false,breaks:[]});
const make=():MakePlan=>({material:'Aluminum 6061-T6',stockKg:.378,priceKg:8,setup:100,finish:2,operations:[{id:'op1',name:'CNC machining',minutes:30,rate:60}],leadDays:7,notes:'Demonstration stock and time. Confirm process, tooling and workholding.'});
export const newPart=(id:string):Part=>({id,name:'New component',revision:'A',perUnit:1,inventory:0,scrap:0,route:'buy',unitPrice:0,packSize:1,moq:1,leadDays:7,source:source(),make:make(),cadName:'',cadVolume:null,cadDims:null,notes:'Specify dimensions, interfaces and performance requirements.',alternative:{enabled:false,qualified:false,unit:5,setup:20,name:'Alternative process'}});
export function template(kind='robot'):Project{
 const names=kind==='jig'?['Precision assembly fixture','Base plate','Locating brackets','Toggle clamps','Dowel pins','Fasteners','Rubber feet','Inspection gauge']:kind==='sensor'?['Air quality sensor station','Enclosure','Mounting plate','Sensor board','Controller','Fasteners','Cable glands','Power supply']:['Inspection robot','Motor brackets','Chassis plate','TT gear motors','Wheels','Fasteners','Motor driver','Battery pack'];
 const parts=names.slice(1).map((name,i)=>({...newPart('part-'+(i+1)),name,perUnit:[4,1,2,2,16,1,1][i],unitPrice:[0,0,3.5,2.5,.18,8,12][i]}));
 parts[0]={...parts[0],route:'make',inventory:8,cadName:kind==='robot'?'mounting-bracket.stl':'',make:make(),alternative:{enabled:true,qualified:false,unit:5.8,setup:20,name:'FDM PLA prototype (verify load and fit)'}};
 parts[1]={...parts[1],route:'make',make:{...make(),stockKg:.65,priceKg:8,setup:60,finish:1,operations:[{id:'cut',name:'Cut and drill plate',minutes:12,rate:60}],leadDays:5},alternative:{enabled:true,qualified:false,unit:12,setup:40,name:'Alternate plate supplier (quote required)'}};
 if(kind==='robot')parts[2].source={...source(),supplier:'Adafruit',productId:'3777'};
 return {version:1,name:names[0],idea:kind==='robot'?'Build a small wheeled inspection robot for indoor testing.':kind==='jig'?'Build a fixture to locate parts consistently during assembly.':'Build a stationary enclosure for an environmental sensor.',units:20,deadlineDays:21,parts,stations:[{id:'assembly',name:'Mechanical assembly',minutes:20,rate:30,parallel:1,setup:30},{id:'wiring',name:'Wiring and electronics',minutes:15,rate:30,parallel:1,setup:15},{id:'test',name:'Inspection and functional test',minutes:10,rate:35,parallel:1,setup:20}],hoursPerDay:8,efficiency:85,balance:12000,commitments:3000,reserve:2000,shipping:60,taxPct:0,contingencyPct:10};
}
export const money2=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
function nonnegative(v:number,label:string){if(!Number.isFinite(v)||v<0||v>1e8)throw Error(`${label}: enter a finite number from 0 to 100,000,000.`)}
function whole(v:number,label:string,min=0,max=1e6){nonnegative(v,label);if(!Number.isInteger(v)||v<min||v>max)throw Error(`${label}: enter a whole number from ${min} to ${max}.`)}
export function validateProject(p:Project){
 whole(p.units,'Build quantity',1,5000);whole(p.deadlineDays,'Target days',1,3650);
 for(const k of ['balance','commitments','reserve','shipping','taxPct','contingencyPct','hoursPerDay','efficiency'] as const)nonnegative(p[k],k);
 if(p.taxPct>100||p.contingencyPct>100||p.hoursPerDay<=0||p.hoursPerDay>24||p.efficiency<=0||p.efficiency>100)throw Error('Hours must be 0–24 (exclusive of zero); efficiency 1–100%; tax and contingency 0–100%.');
 if(!p.parts.length||p.parts.length>100)throw Error('Add between 1 and 100 BOM rows.');
 if(new Set(p.parts.map(x=>x.id)).size!==p.parts.length)throw Error('Every BOM row needs a unique ID.');
 for(const part of p.parts){
  if(!part.name.trim())throw Error('Each component needs a name.');
  whole(part.perUnit,`${part.name} per assembly`,1);whole(part.inventory,'Inventory');whole(part.packSize,'Pack size',1);whole(part.moq,'Minimum order',1);
  for(const k of ['unitPrice','leadDays','scrap'] as const)nonnegative(part[k],`${part.name} ${k}`);
  if(part.scrap>=100)throw Error('Scrap allowance must be below 100%.');
  if(part.route!=='make'&&part.route!=='buy')throw Error('Route must be make or buy.');
  for(const k of ['stockKg','priceKg','setup','finish','leadDays'] as const)nonnegative(part.make[k],`${part.name} ${k}`);
  for(const op of part.make.operations){nonnegative(op.minutes,'Operation time');nonnegative(op.rate,'Operation rate')}
  for(const b of part.source.breaks){whole(b.quantity,'Price break quantity',1);nonnegative(b.price,'Price break price')}
  if(part.source.validUntil&&Number.isNaN(Date.parse(part.source.validUntil)))throw Error('Quote expiry must be a valid date.');
  nonnegative(part.alternative.unit,'Alternative unit cost');nonnegative(part.alternative.setup,'Alternative setup');
 }
 if(!p.stations.length||p.stations.length>20)throw Error('Add 1–20 assembly stations.');
 for(const s of p.stations){nonnegative(s.minutes,'Station time');nonnegative(s.rate,'Labor rate');whole(s.parallel,'Parallel staffed stations',1,100);nonnegative(s.setup,'Station setup');if(s.minutes<=0)throw Error('Station cycle time must be positive.')}
}
export function rowCost(part:Part,units:number,alternative=false){
 const net=part.perUnit*units;const gross=Math.ceil(net/(1-part.scrap/100));const need=Math.max(0,gross-part.inventory);
 let purchased=0,price=0,setup=0,cost=0,method=part.route==='make'?'Manufacture':'Purchase';
 if(part.route==='buy'){
  purchased=need?Math.ceil(Math.max(need,part.moq)/part.packSize)*part.packSize:0;
  price=part.unitPrice;
  for(const b of [...part.source.breaks].sort((a,b)=>a.quantity-b.quantity))if(purchased>=b.quantity)price=b.price;
  price=money2(price);cost=money2(price*purchased);
 }else{
  purchased=need;
  if(alternative&&part.alternative.enabled&&part.alternative.qualified){price=money2(part.alternative.unit);setup=need?money2(part.alternative.setup):0;method=part.alternative.name}
  else{price=money2(part.make.stockKg*part.make.priceKg)+part.make.operations.reduce((sum,op)=>sum+money2(op.minutes/60*op.rate),0)+money2(part.make.finish);setup=need?money2(part.make.setup):0}
  cost=money2(purchased*price+setup);
 }
 const risk=part.route==='buy'&&need>0?part.source.kind==='assumption'?'Estimated price':part.source.kind==='quote'&&part.source.validUntil&&new Date(part.source.validUntil+'T23:59:59Z').getTime()<Date.now()?'Expired quote':part.source.kind==='quote'&&!part.source.reviewed?'Quote scope unreviewed':part.source.kind==='catalog'&&!part.source.reviewed?'Compatibility unreviewed':part.source.kind==='catalog'&&part.source.availability.toLowerCase().includes('out of stock')?'Stock unavailable':part.source.kind==='catalog'&&part.source.observedAt&&Date.now()-Date.parse(part.source.observedAt)>86400000?'Catalog >24h old':'':part.route==='make'&&need?'Process estimate':'';
 return {id:part.id,name:part.name,net,gross,need,purchased,price:money2(price),setup,cost,surplus:purchased-need,inventoryUsed:Math.min(gross,part.inventory),leadDays:need?(part.route==='make'?part.make.leadDays:part.leadDays):0,method,risk};
}
export function projectCost(p:Project,units=p.units,alternative=false){
 validateProject({...p,units});
 const rows=p.parts.map(part=>rowCost(part,units,alternative));
 const purchased=money2(rows.filter((r,i)=>p.parts[i].route==='buy').reduce((a,r)=>a+r.cost,0));
 const manufacturing=money2(rows.filter((r,i)=>p.parts[i].route==='make').reduce((a,r)=>a+r.cost,0));
 const laborVariable=p.stations.reduce((a,s)=>a+money2(s.minutes/60*s.rate),0);
 const labor=money2(laborVariable*units+p.stations.reduce((a,s)=>a+money2(s.setup),0));
 const bom=money2(purchased+manufacturing);const tax=money2(bom*p.taxPct/100);const shipping=bom>0?money2(p.shipping):0;
 const base=money2(bom+labor+tax+shipping);const contingency=money2(base*p.contingencyPct/100);const total=money2(base+contingency);
 if(!Number.isSafeInteger(Math.round(total*100)))throw Error('Project total is too large. Reduce quantities or assumptions.');
 const raw=money2(p.balance-p.commitments-p.reserve);const available=Math.max(0,raw);
 const capacity=p.stations.map(s=>({id:s.id,name:s.name,perDay:60*p.hoursPerDay*p.efficiency/100*s.parallel/s.minutes}));const bottleneck=capacity.reduce((a,b)=>a.perDay<b.perDay?a:b);
 const assemblyDays=Math.ceil(units/bottleneck.perDay);const supplyDays=Math.max(0,...rows.map(r=>r.leadDays));const totalDays=Math.ceil(supplyDays+assemblyDays);
 return {units,rows,purchased,manufacturing,labor,tax,shipping,contingency,total,perProduct:money2(total/units),available,headroom:money2(raw-total),affordable:total<=raw,capacity,bottleneck,assemblyDays,supplyDays,totalDays,onTime:totalDays<=p.deadlineDays,riskCount:rows.filter(r=>r.risk).length,base};
}
export function maxAffordable(p:Project){validateProject(p);let max=0;for(let q=1;q<=p.units;q++){if(projectCost(p,q).affordable)max=q}return max}
export function parseCSV(text:string):Part[]{
 if(text.length>1e6)throw Error('CSV must be smaller than 1 MB.');
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw Error('CSV has an unclosed quoted field.');row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error('CSV needs a header and at least one component.');
 const headers=rows.shift()!.map(x=>x.trim().toLowerCase());for(const key of ['name','per_unit','unit_price'])if(!headers.includes(key))throw Error(`Missing CSV column: ${key}`);
 return rows.map((r,i)=>{const get=(k:string,d='')=>headers.includes(k)?r[headers.indexOf(k)]?.trim()??d:d;const price=Number(get('unit_price'));if(!Number.isFinite(price)||price<0)throw Error('Invalid unit_price');const route=get('route','buy');if(route!=='buy'&&route!=='make')throw Error('CSV route must be buy or make');const part={...newPart('import-'+(i+1)),name:get('name'),perUnit:Number(get('per_unit')),unitPrice:price,inventory:Number(get('inventory','0')),packSize:Number(get('pack_size','1')),moq:Number(get('moq','1')),leadDays:Number(get('lead_days','7')),route:route as 'make'|'buy',notes:get('notes')};part.source={...source(),kind:'manual',supplier:get('supplier','User import')};return part})
}
export function decisionNotes(p:Project){const c=projectCost(p);const notes:{title:string;detail:string;kind:string;partId?:string}[]=[];const largest=[...c.rows].sort((a,b)=>b.cost-a.cost)[0];if(largest)notes.push({title:`Review ${largest.name} first`,detail:`${largest.name} accounts for $${largest.cost.toFixed(2)} of the new component spend. Review its quantity, stock and operation assumptions before optimizing minor items.`,kind:'Calculated',partId:largest.id});for(const part of p.parts){const r=c.rows.find(r=>r.id===part.id)!;if(r.surplus>0)notes.push({title:`Avoid hidden excess in ${part.name}`,detail:`Need ${r.need}, but MOQ and packaging require ${r.purchased}. ${r.surplus} remain after the run. Do not count the whole purchase as consumed material.`,kind:'Calculated',partId:part.id});if(part.alternative.enabled&&!part.alternative.qualified)notes.push({title:`Alternative for ${part.name} needs review`,detail:`${part.alternative.name} is excluded from savings until an engineer confirms fit, loads, environment and production requirements.`,kind:'Engineering review',partId:part.id})}
 notes.push({title:`Capacity is limited by ${c.bottleneck.name}`,detail:`Ideal adjusted throughput is ${c.bottleneck.perDay.toFixed(1)} products/day. Adding parallel staffed stations here may improve throughput; labor per product remains unchanged.`,kind:'Capacity assumption'});return notes}
