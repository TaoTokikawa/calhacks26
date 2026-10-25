import {describe,it,expect} from 'vitest';
import {cost,defaults,selectMaterial} from './demoModel';
const g={dimensions_mm:[60,40,35],volume_mm3:20436.1268,surface_area_mm2:9851,watertight:true,warnings:[],source:'fixture',triangles:808};
describe('manufacturing affordability model',()=>{
 it('matches the reference quantities and budget boundary',()=>{expect(cost(defaults,g).total).toBe(3602);expect(cost(defaults,g).shortfall).toBe(1602);expect(cost(defaults,g).max).toBe(54);expect(cost(defaults,g,50).total).toBe(1851);expect(cost(defaults,g,50).headroom).toBe(149);expect(cost(defaults,g,54).affordable).toBe(true);expect(cost(defaults,g,55).affordable).toBe(false)});
 it('charges purchased stock instead of net volume',()=>{const r=cost(defaults,g);expect(r.material).toBe(3.02);expect(r.purchasedMass).toBeCloseTo(.378);expect(r.mass).toBeCloseTo(.05517754)});
 it('rejects invalid quantity, unavailable volume and undersized stock',()=>{expect(()=>cost({...defaults,quantity:0},g)).toThrow();expect(()=>cost(defaults,{...g,volume_mm3:null})).toThrow();expect(()=>cost({...defaults,stock:[1,1,1]},g)).toThrow()});
 it('blocks incompatible material and process combinations',()=>{expect(()=>cost({...defaults,process:'fdm'},g)).toThrow();expect(selectMaterial({...defaults,process:'fdm',material:'pla'},'steel').process).toBe('cnc')});
 it('allows polymer printing with explicit usage',()=>{const r=cost({...defaults,material:'pla',process:'fdm',price:20},g);expect(r.purchasedMass).toBeCloseTo(g.volume_mm3*1e-9*1240*1.15)});
 it('caps free production at demand and blocks an existing reserve breach',()=>{const p={...defaults,price:0,rate:0,setup:0,finish:0};expect(cost(p,g).max).toBe(100);expect(cost({...p,balance:0},g).max).toBe(0);expect(cost({...p,balance:0},g).affordable).toBe(false)});
});
