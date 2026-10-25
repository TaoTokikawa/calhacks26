"""Generate a closed L bracket; all dimensions mm. Not a validated engineering design."""
from pathlib import Path
import trimesh
root=Path(__file__).resolve().parents[1]
base=trimesh.creation.box(extents=[80,50,6]);base.apply_translation([0,0,3])
upright=trimesh.creation.box(extents=[80,6,34]);upright.apply_translation([0,-22,23])
bracket=trimesh.boolean.union([base,upright],engine='manifold')
holes=[]
for x in [-27,27]:
 for y in [-9,13]:
  h=trimesh.creation.cylinder(radius=3.5,height=12,sections=40);h.apply_translation([x,y,3]);holes.append(h)
for x in [-27,27]:
 h=trimesh.creation.cylinder(radius=4,height=12,sections=40);h.apply_transform(trimesh.transformations.rotation_matrix(1.5707963267948966,[1,0,0]));h.apply_translation([x,-22,26]);holes.append(h)
bracket=trimesh.boolean.difference([bracket,*holes],engine='manifold')
assert bracket.is_volume
path=root/'frontend/public/samples/mounting-bracket.stl';path.parent.mkdir(parents=True,exist_ok=True);bracket.export(path)
print({'volume_mm3':bracket.volume,'area_mm2':bracket.area,'extents':bracket.extents.tolist(),'triangles':len(bracket.faces)})
