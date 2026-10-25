export type PurchaseRequest={id:string;part:string;revision:string;material:string;quantity:number;budget:number;estimate:number;requester:string;source:string};
export type SupplierQuote={id:string;supplier:string;revision:string;material:string;quantity:number;unit:number;setup:number;freight:number;days:number;expires:string};
export type Invoice={id:string;poId:string;supplier:string;revision:string;quantity:number;total:number};
export type PurchaseOrder={id:string;request:PurchaseRequest;quote:SupplierQuote;total:number;approvedBy:string};
export const quoteTotal=(q:SupplierQuote)=>Math.round((q.unit*q.quantity+q.setup+q.freight)*100)/100;
export function evaluateQuote(req:PurchaseRequest,q:SupplierQuote,now=new Date()){
 const reasons:{field:string;reason:string}[]=[];
 if(!req.part.trim()||!req.revision.trim()||!req.material.trim()||!Number.isInteger(req.quantity)||req.quantity<1||!Number.isFinite(req.budget)||req.budget<0)reasons.push({field:'request',reason:'Request specification, quantity or budget is invalid.'});
 if(q.revision!==req.revision)reasons.push({field:'revision',reason:`Quote revision ${q.revision} does not match request ${req.revision}.`});
 if(q.material.trim().toLowerCase()!==req.material.trim().toLowerCase())reasons.push({field:'material',reason:`Quoted ${q.material}; requested ${req.material}.`});
 if(q.quantity!==req.quantity)reasons.push({field:'quantity',reason:`Quote quantity ${q.quantity} does not match ${req.quantity}.`});
 if([q.unit,q.setup,q.freight].some(x=>!Number.isFinite(x)||x<0)||!Number.isInteger(q.quantity)||q.quantity<=0)reasons.push({field:'amounts',reason:'Quote amounts and quantity must be valid nonnegative values.'});
 if(!q.supplier.trim())reasons.push({field:'supplier',reason:'Supplier identity is missing.'});
 if(!q.expires||Number.isNaN(Date.parse(q.expires)))reasons.push({field:'expiry',reason:'A valid quote expiry date is required.'});
 else if(Date.parse(q.expires+'T23:59:59Z')<now.getTime())reasons.push({field:'expiry',reason:'The quote has expired.'});
 if(quoteTotal(q)>req.budget)reasons.push({field:'budget',reason:`Total $${quoteTotal(q).toFixed(2)} exceeds request budget $${req.budget.toFixed(2)}.`});
 return {eligible:reasons.length===0,reasons,total:quoteTotal(q)};
}
export function recommend(req:PurchaseRequest,quotes:SupplierQuote[]){return quotes.map(q=>({quote:q,...evaluateQuote(req,q)})).filter(x=>x.eligible).sort((a,b)=>a.total-b.total)[0]??null}
export function approve(req:PurchaseRequest,q:SupplierQuote,actor:string,role:string):PurchaseOrder{
 if(role!=='approver')throw Error('Only the simulated approver role can approve an order.');
 if(actor===req.requester)throw Error('The requester cannot approve their own request.');
 const evaluation=evaluateQuote(req,q);if(!evaluation.eligible)throw Error(evaluation.reasons.map(r=>r.reason).join(' '));
 return {id:'PO-'+Date.now(),request:structuredClone(req),quote:structuredClone(q),total:evaluation.total,approvedBy:actor};
}
export function reconcile(invoice:Invoice,po:PurchaseOrder|null,existing:string[]){
 const reasons:string[]=[];
 if(existing.includes(invoice.id))reasons.push('Duplicate invoice ID: already received.');
 if(!invoice.id.trim())reasons.push('Invoice ID is missing.');
 if(!Number.isFinite(invoice.total)||invoice.total<0)reasons.push('Invoice total is invalid.');
 if(!po)reasons.push('No approved purchase order exists.');
 else{
  if(invoice.poId!==po.id)reasons.push('Invoice purchase order reference does not match.');
  if(invoice.supplier!==po.quote.supplier)reasons.push('Invoice supplier does not match approved supplier.');
  if(invoice.revision!==po.request.revision)reasons.push('Invoice part revision does not match approved revision.');
  if(invoice.quantity!==po.request.quantity)reasons.push('Invoice quantity does not match approved quantity.');
  if(Math.round(invoice.total*100)!==Math.round(po.total*100))reasons.push(`Invoice differs from approved total by $${(invoice.total-po.total).toFixed(2)}.`);
 }
 return {status:reasons.length?'held':'matched',reasons};
}
export function seedFinance(){const expiry=new Date(Date.now()+30*86400000).toISOString().slice(0,10);const req:PurchaseRequest={id:'REQ-BRACKET-100',part:'Mounting bracket',revision:'B',material:'Aluminum 6061-T6',quantity:100,budget:2500,estimate:2400,requester:'Engineering requester',source:'Seeded control scenario; USD; all supplier records simulated'};const quotes:SupplierQuote[]=[{id:'Q-A',supplier:'Atlas Machining (simulated)',revision:'A',material:req.material,quantity:100,unit:16.5,setup:100,freight:50,days:7,expires:expiry},{id:'Q-B',supplier:'Beacon Manufacturing (simulated)',revision:'B',material:req.material,quantity:100,unit:22,setup:150,freight:50,days:10,expires:expiry},{id:'Q-C',supplier:'Cedar Precision (simulated)',revision:'B',material:req.material,quantity:100,unit:25,setup:150,freight:50,days:5,expires:expiry}];return {req,quotes}}
