import json, math
import numpy as np
from PIL import Image
from scipy import ndimage
from shapely.geometry import LineString, Polygon, MultiPolygon, mapping
from shapely.ops import polygonize, unary_union
import os, sys
IM=os.environ.get('SCREENSHOT_DIR', '.')  # folder holding the client's screenshot (13.jpg)
d=json.load(open('city-full.json'))
nodes={e['id']:(e['lon'],e['lat']) for e in d['elements'] if e['type']=='node'}
ways={e['id']:e for e in d['elements'] if e['type']=='way'}
rel=[e for e in d['elements'] if e['type']=='relation' and e['id']==2216724][0]
lines=[LineString([nodes[n] for n in ways[m['ref']]['nodes']]) for m in rel['members'] if m['type']=='way' and m['role']=='outer']
polys=list(polygonize(unary_union(lines)))
city=unary_union(polys)
print('city polygons', len(polys), 'type', city.geom_type, 'area deg2', round(city.area,5), 'bounds', [round(v,4) for v in city.bounds])
json.dump(mapping(city), open('city.geojson','w'))

im=np.array(Image.open(f'{IM}/13.jpg').convert('RGB')).astype(int)
H,W=im.shape[:2]; print('image', W, H)
r,g,b=im[...,0],im[...,1],im[...,2]
red=(r>200)&(g<110)&(b<100)&(r-g>110)
lab,n=ndimage.label(red, structure=np.ones((3,3)))
sizes=ndimage.sum(red,lab,range(1,n+1))
# the boundary line is long and thin; the pin is a compact blob around (740,500)
keep=np.zeros_like(red)
for i,sz in enumerate(sizes, start=1):
    ys,xs=np.where(lab==i)
    w,h=xs.max()-xs.min()+1, ys.max()-ys.min()+1
    if sz>40 and max(w,h)>60 and sz/(w*h)<0.25: keep|= lab==i
print('red px kept', int(keep.sum()), 'of', int(red.sum()))
np.save('red13.npy', keep)
blue=(b>200)&(r<90)&(g>90)&(g<170)
np.save('blue13.npy', blue)
print('blue px', int(blue.sum()))
vis=np.full(im.shape,255,np.uint8); vis[keep]=[220,30,30]; vis[blue]=[30,90,230]
Image.fromarray(vis).resize((1000,766)).save('strokes13.png')
