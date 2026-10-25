export const materials = {
 aluminum: {name:'Aluminum 6061-T6',density:2700,price:8,kind:'metal'},
 stainless: {name:'Stainless Steel 304',density:8000,price:6,kind:'metal'},
 steel: {name:'Mild Steel 1018',density:7870,price:2.5,kind:'metal'},
 abs: {name:'ABS',density:1040,price:22,kind:'polymer'},
 pla: {name:'PLA',density:1240,price:20,kind:'polymer'},
} as const;
export type Material = keyof typeof materials;
export type Process = 'cnc'|'fdm';
export type Geometry = {dimensions_mm:number[];volume_mm3:number|null;surface_area_mm2:number;watertight:boolean;warnings:string[];source:string;triangles:number};
export type Params = {material:Material;process:Process;quantity:number;price:number;rate:number;minutes:number;setup:number;finishing:number;stockAllowance:number;usagePercent:number;overheadPercent:number;tolerance:string;manualVolume:number;manualDimensions:number[]};
export const initial:Params={material:'aluminum',process:'cnc',quantity:25,price:8,rate:75,minutes:45,setup:120,finishing:4,stockAllowance:3,usagePercent:100,overheadPercent:15,tolerance:'±0.10 mm (user target)',manualVolume:40000,manualDimensions:[80,50,40]};
export const money=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
export function compatible(m:Material,p:Process){return p==='cnc'||materials[m].kind==='polymer'}
export function changeMaterial(p:Params,m:Material):Params{return {...p,material:m,price:materials[m].price,process:compatible(m,p.process)?p.process:'cnc'}}
export function changeProcess(p:Params,process:Process):Params {return {...p,process,material:compatible(p.material,process)?p.material:'pla',price:compatible(p.material,process)?p.price:materials.pla.price};}
export function validate(p:Params,g:Geometry|null,manual:boolean):string|null{
 if(!compatible(p.material,p.process))return 'Select a material compatible with this process.';
 if(!Number.isInteger(p.quantity)||p.quantity<1||p.quantity>1000000)return 'Quantity must be a whole number from 1 to 1,000,000.';
 for(const [k,v] of Object.entries(p)) if(typeof v==='number'&&(!Number.isFinite(v)||v<0))return `${k} must be a finite nonnegative number.`;
 if(p.usagePercent<=0||p.usagePercent>100||p.overheadPercent>500)return 'FDM usage must be 0–100% (exclusive of zero); overhead must be at most 500%.';
 const volume=manual?p.manualVolume:g?.volume_mm3;const dims=manual?p.manualDimensions:g?.dimensions_mm;
 if(!volume||volume<=0)return 'Enter a positive manual volume or upload a closed, consistently oriented mesh.';
 if(!dims||dims.length!==3||dims.some(x=>!Number.isFinite(x)||x<=0))return 'Enter three positive dimensions.';
 if(volume>dims.reduce((a,b)=>a*b,1)*1.001)return 'Part volume cannot exceed its bounding-box volume.';
 return null;
}
export function calculate(p:Params,g:Geometry|null,manual=false){
 const error=validate(p,g,manual);if(error)throw Error(error);
 const volume=(manual?p.manualVolume:g!.volume_mm3)!;const dims=manual?p.manualDimensions:g!.dimensions_mm;
 const stock=p.process==='cnc'?dims.reduce((a,b)=>a*(b+2*p.stockAllowance),1):volume*(p.usagePercent/100)*(1+p.overheadPercent/100);
 const density=materials[p.material].density; const mass=volume*1e-9*density;
 const purchasedMass=stock*1e-9*density;
 const material=purchasedMass*p.price;const machine=p.minutes/60*p.rate;const setup=p.setup/p.quantity;const finishing=p.finishing;
 const unit=material+machine+setup+finishing;
 return {unit,total:unit*p.quantity,material,machine,setup,finishing,mass,purchasedMass,stock,netVolume:volume,dimensions:dims};
}
export type Estimate=ReturnType<typeof calculate>;
export function recommendations(p:Params,e:Estimate){
 const q=Math.max(p.quantity*4,100);const saving=e.setup-p.setup/q;
 return [
 {title:'Spread the setup across a larger batch',tag:'Calculated opportunity',text:`At ${q} parts, setup falls from ${money(e.setup)} to ${money(p.setup/q)} per part. Other inputs held fixed.`,saving:Math.max(0,saving)},
 {title:p.process==='cnc'?'Review stock size and workholding':'Validate material usage in your slicer',tag:'Engineering review',text:p.process==='cnc'?`Purchased stock is ${(e.purchasedMass*1000).toFixed(0)} g versus ${(e.mass*1000).toFixed(0)} g net. A closer stock form could reduce waste; confirm access and clamping.`:`Usage is ${p.usagePercent}% of solid volume plus ${p.overheadPercent}% support/scrap. Confirm shell, infill and support mass in the slicer.`,saving:null},
 {title:p.process==='cnc'?'Review radii and noncritical tolerances':'Review orientation and support requirements',tag:'Conditional suggestion',text:p.process==='cnc'?'If internal corners exist, match radii to available tools. Relax only noncritical tolerances after checking fit and function. STL measurements do not confirm these features.':'Choose orientation with load direction, surface quality and supports in mind. Material changes need mechanical and thermal verification.',saving:null}
 ];
}
