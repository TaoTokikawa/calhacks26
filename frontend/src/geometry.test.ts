import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseSTL} from './geometry';
it('extracts the sample bracket geometry with declared units',()=>{const bytes=readFileSync(new URL('../public/samples/mounting-bracket.stl',import.meta.url));const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);const r=parseSTL(buffer,1);expect(r.geometry.watertight).toBe(true);expect(r.geometry.dimensions_mm).toEqual([60,40,35]);expect(r.geometry.volume_mm3).toBeCloseTo(20436.1268,1);r.mesh.dispose();const inch=parseSTL(buffer,25.4);expect(inch.geometry.dimensions_mm[0]).toBeCloseTo(1524);inch.mesh.dispose()});
it('rejects invalid data gracefully',()=>{expect(()=>parseSTL(new TextEncoder().encode('invalid data').buffer,1)).toThrow()});
