import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import type {BufferGeometry} from 'three';
import type {Geometry} from './model';
export const MAX_BYTES=10*1024*1024;
export function parseSTL(buffer:ArrayBuffer,scale:number):{mesh:BufferGeometry;geometry:Geometry}{
 if(buffer.byteLength>MAX_BYTES)throw Error('STL files must be 10 MB or smaller.');
 const mesh=new STLLoader().parse(buffer);const pos=mesh.getAttribute('position');
 if(!pos||pos.count<12||pos.count%3||pos.count/3>200000)throw Error('Invalid STL or mesh exceeds 200,000 triangles.');
 mesh.scale(scale,scale,scale);mesh.computeBoundingBox();const b=mesh.boundingBox!;
 const dimensions=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];
 if(dimensions.some(x=>!Number.isFinite(x)||x<=0||x>100000))throw Error('Invalid or excessive dimensions. Check the STL units.');
 const origin=[b.min.x,b.min.y,b.min.z];const edges=new Map<string,{count:number,balance:number}>();let volume=0,area=0,degenerate=false;
 const tolerance=Math.max(...dimensions)*1e-7;
 const key=(v:number[])=>v.map(x=>Math.round(x/tolerance)).join(',');
 for(let i=0;i<pos.count;i+=3){
 const v=[0,1,2].map(j=>[pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)]);
 if(v.flat().some(x=>!Number.isFinite(x)))throw Error('STL contains non-finite vertices.');
 const [a,b,c]=v.map(v=>v.map((x,j)=>x-origin[j]));
 const u=b.map((x,j)=>x-a[j]),w=c.map((x,j)=>x-a[j]);const cross=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
 const ar=Math.hypot(...cross)/2;area+=ar;if(ar<=tolerance*tolerance)degenerate=true;
 volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
 const keys=v.map(key);for(let j=0;j<3;j++){const x=keys[j],y=keys[(j+1)%3],k=x<y?x+'|'+y:y+'|'+x;const e=edges.get(k)??{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(k,e);}
 }
 const closed=!degenerate&&[...edges.values()].every(e=>e.count===2&&e.balance===0)&&volume>0;
 const reliable=closed&&volume<=dimensions.reduce((a,b)=>a*b,1)*1.001;
 return {mesh,geometry:{dimensions_mm:dimensions,volume_mm3:reliable?volume:null,surface_area_mm2:area,watertight:closed,warnings:reliable?['Mesh checks do not rule out all self-intersections or manufacturing defects.']:['Mesh is open, inconsistently oriented, degenerate, or has unreliable volume. Use manual volume to estimate.'],source:'Browser mesh checks',triangles:pos.count/3}};
}
