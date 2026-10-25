import {describe,it,expect} from 'vitest';
import {defaults} from './demoModel';
import {buildInvoice,invoiceScript,invoiceHtml,invoiceDefaults,demoCustomers} from './invoiceModel';
const g={dimensions_mm:[60,40,35],volume_mm3:20436.1268,surface_area_mm2:9851,watertight:true,warnings:[],source:'fixture',triangles:808};
const now=new Date('2026-10-24T12:00:00Z');const c={...demoCustomers[1],quantity:50};const file='mounting-bracket.stl';
describe('voice invoice model',()=>{
 it('itemizes each cost driver at the entered margin with setup charged once',()=>{const inv=buildInvoice(c,defaults,g,file,invoiceDefaults,1,now);expect(inv.lines.map(l=>l.unit)).toEqual([3.78,37.5,2.5,125]);expect(inv.lines[3].quantity).toBe(1);expect(inv.subtotal).toBe(2314);expect(inv.total).toBe(2314);expect(inv.id).toBe('INV-20261024-001');expect(inv.due).toBe('2026-11-23')});
 it('describes the STL and specs on the invoice',()=>{const inv=buildInvoice(c,{...defaults,tolerance:'±0.05 mm bores'},g,file,invoiceDefaults,1,now);expect(inv.spec).toMatchObject({name:'mounting bracket',material:'Aluminum 6061-T6',process:'CNC milling',dims:[60,40,35],volumeCm3:20.44,tolerance:'±0.05 mm bores'});expect(inv.lines[0].detail).toContain('70 × 50 × 40 mm stock')});
 it('demo line follows the estimator quantity',()=>{const inv=buildInvoice(demoCustomers[0],defaults,g,file,invoiceDefaults,1,now);expect(inv.quantity).toBe(100);expect(inv.total).toBe(4503);expect(buildInvoice(demoCustomers[0],{...defaults,quantity:7},g,file,invoiceDefaults,1,now).quantity).toBe(7)});
 it('applies tax on the subtotal',()=>{const inv=buildInvoice(c,defaults,g,file,{...invoiceDefaults,tax:8.25},1,now);expect(inv.tax).toBe(190.91);expect(inv.total).toBe(2504.91)});
 it('rejects invalid quantities and settings',()=>{expect(()=>buildInvoice({...c,quantity:0},defaults,g,file,invoiceDefaults,1,now)).toThrow();expect(()=>buildInvoice(c,defaults,g,file,{...invoiceDefaults,margin:-1},1,now)).toThrow()});
 it('writes a spoken script with the part, total and due date',()=>{const inv=buildInvoice(c,defaults,g,file,invoiceDefaults,1,now);const s=invoiceScript(inv,invoiceDefaults);expect(s).toContain('50 units of the mounting bracket');expect(s).toContain('60 by 40 by 35 millimeters');expect(s).toContain('$2,314.00');expect(s).toContain('November 23, 2026')});
 it('escapes user text in the printable invoice',()=>{const html=invoiceHtml(buildInvoice(c,{...defaults,tolerance:'<b>x</b>'},g,file,invoiceDefaults,1,now),invoiceDefaults);expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');expect(html).toContain('$2,314.00')});
});
