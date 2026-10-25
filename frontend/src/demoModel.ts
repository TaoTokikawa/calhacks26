import {materials,type Material,type Process,type Geometry} from './model';
export {materials};
export type Inputs={material:Material;process:Process;quantity:number;price:number;rate:number;minutes:number;setup:number;finish:number;stock:number[];usage:number;overhead:number;tolerance:string;balance:number;commitments:number;reserve:number;manual:boolean;volume:number;dimensions:number[]};
export const defaults:Inputs={material:'aluminum',process:'cnc',quantity:100,price:8,rate:60,minutes:30,setup:100,finish:2,stock:[70,50,40],usage:100,overhead:15,tolerance:'',balance:5000,commitments:2000,reserve:1000,manual:false,volume:20436.126814,dimensions:[60,40,35]};
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
export function cost(p:Inputs,g:Geometry|null,q=p.quantity){
 if(!Number.isInteger(q)||q<1||q>1000000)throw Error('Quantity must be a whole number from 1 to 1,000,000.');
 for(const [key,value] of Object.entries(p)){if(typeof value==='number'&&(!Number.isFinite(value)||value<0||value>1e9))throw Error(`${key} must be a finite, nonnegative number.`)}
 if(p.process==='fdm'&&materials[p.material].kind!=='polymer')throw Error('FDM printing requires PLA or ABS.');
 if(p.usage<=0||p.usage>100||p.overhead>500)throw Error('FDM usage must be 1–100% and overhead 0–500%.');
 const dims=p.manual?p.dimensions:g?.dimensions_mm;const volume=p.manual?p.volume:g?.volume_mm3;
 if(!volume||!dims||dims.some(x=>!Number.isFinite(x)||x<=0))throw Error('Reliable volume is unavailable. Enable manual geometry and enter positive measurements.');
 if(volume>dims.reduce((a,b)=>a*b,1)*1.001)throw Error('Part volume cannot exceed bounding-box volume.');
 if(p.stock.length!==3||p.stock.some(x=>!Number.isFinite(x)||x<=0||x>100000))throw Error('Stock dimensions must be positive and no greater than 100,000 mm.');
 if(p.process==='cnc'&&p.stock.some((x,i)=>x<dims[i]))throw Error('Purchased stock must enclose the part along all three axes.');
 const purchased=p.process==='cnc'?p.stock.reduce((a,b)=>a*b,1):volume*p.usage/100*(1+p.overhead/100);
 const mass=volume*1e-9*materials[p.material].density;const purchasedMass=purchased*1e-9*materials[p.material].density;
 const material=cents(purchasedMass*p.price),machine=cents(p.minutes/60*p.rate),finish=cents(p.finish),setup=cents(p.setup);
 const variable=material+machine+finish;const total=variable*q+setup;
 if(!Number.isSafeInteger(total))throw Error('The estimate is too large. Reduce quantity or cost inputs.');
 const rawAvailable=cents(p.balance)-cents(p.commitments)-cents(p.reserve);const available=Math.max(0,rawAvailable);
 const max=rawAvailable<0||available<setup?0:variable===0?q:Math.min(q,Math.floor((available-setup)/variable));
 return {unit:total/q/100,total:total/100,material:material/100,machine:machine/100,finish:finish/100,setup:setup/q/100,mass,purchasedMass,available:available/100,rawAvailable:rawAvailable/100,max,headroom:(rawAvailable-total)/100,shortfall:Math.max(0,total-rawAvailable)/100,affordable:total<=rawAvailable,variable:variable/100};
}
export type Result=ReturnType<typeof cost>;
export function selectMaterial(p:Inputs,m:Material):Inputs{return {...p,material:m,price:materials[m].price,process:p.process==='fdm'&&materials[m].kind==='metal'?'cnc':p.process}}
