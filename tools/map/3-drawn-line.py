import json, math
import numpy as np
from scipy import ndimage
from skimage import measure
from shapely.geometry import shape, Polygon, Point, LineString, mapping
from shapely.ops import transform
fit=json.load(open('fit13.json')); s,tx,ty=fit['s'],fit['tx'],fit['ty']
def px2ll(x,y):
    mx=(x-tx)/s; my=(ty-y)/s
    return math.degrees(mx), math.degrees(2*math.atan(math.exp(my))-math.pi/2)
blue=np.load('blue13.npy')
k=8
closed=ndimage.binary_dilation(blue, iterations=k)
filled=ndimage.binary_fill_holes(closed)
region=ndimage.binary_erosion(filled, iterations=k)
lab,n=ndimage.label(region); sizes=ndimage.sum(region,lab,range(1,n+1))
region=lab==(np.argmax(sizes)+1)
region=ndimage.binary_opening(region, structure=np.ones((3,3),bool), iterations=4)
cont=max(measure.find_contours(region.astype(float), 0.5), key=len)
ll=[px2ll(c[1],c[0]) for c in cont]
blue_poly=Polygon(ll).buffer(0).simplify(0.00005)
print('blue polygon area deg2', round(blue_poly.area,5), 'points', len(blue_poly.exterior.coords), 'bounds', [round(v,4) for v in blue_poly.bounds])
json.dump(mapping(blue_poly), open('blue13.geojson','w'))
city=shape(json.load(open('city.geojson')))
# metric distance: local equirectangular metres
lat0=41.3; kx=111320*math.cos(math.radians(lat0)); ky=110540
to_m=lambda x,y,z=None:(x*kx,y*ky)
city_m=transform(to_m, city); blue_m=transform(to_m, blue_poly)
bnd=city_m.boundary
coords=list(blue_m.exterior.coords)
d=[bnd.distance(Point(c)) for c in coords]
inner=[di>500 for di in d]
# runs
runs=[]; cur=None
for i,f in enumerate(inner):
    if f and cur is None: cur=[i]
    if not f and cur is not None: cur.append(i-1); runs.append(cur); cur=None
if cur is not None: cur.append(len(inner)-1); runs.append(cur)
print('inner runs (vertex index ranges):', runs, 'of', len(coords))
for a,b in runs:
    seg=LineString(coords[a:b+1]); print(f'  run {a}-{b}: {seg.length/1000:.1f} km', [round(v,4) for v in blue_poly.exterior.coords[a]], '->', [round(v,4) for v in blue_poly.exterior.coords[b]])
json.dump({'runs':runs}, open('runs13.json','w'))
