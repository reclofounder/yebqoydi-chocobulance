import json, math, heapq
import numpy as np
from scipy.spatial import cKDTree
from shapely.geometry import shape, LineString, Point, Polygon, mapping
from shapely.ops import split, nearest_points
import shapely
lat0=41.3; KX=111320*math.cos(math.radians(lat0)); KY=110540
m=lambda lon,lat:(lon*KX, lat*KY)
ll=lambda x,y:(x/KX, y/KY)
city=shape(json.load(open('city.geojson')))
parts=sorted(getattr(city,'geoms',[city]), key=lambda p:-p.area)
print('city parts areas', [round(p.area,5) for p in parts], 'second centroid', [round(c,4) for c in parts[1].centroid.coords[0]] if len(parts)>1 else None)
main=parts[0]
blue=shape(json.load(open('blue13.geojson')))
runs=json.load(open('runs13.json'))['runs']; a,b=runs[0]
bc=list(blue.exterior.coords)
run=LineString([m(*p) for p in bc[a:b+1]])
# graph
d=json.load(open('feat.json'))
pos={}; adj={}
cls={}
def add_edge(u,v,w,kind):
    adj.setdefault(u,[]).append((v,w,kind)); adj.setdefault(v,[]).append((u,w,kind))
for e in d['elements']:
    t=e['tags']; kind='water' if 'waterway' in t else 'rail' if 'railway' in t else 'road'
    ids=e['nodes']; geo=e['geometry']
    for nid,g in zip(ids,geo): pos[nid]=m(g['lon'],g['lat'])
    for u,v in zip(ids,ids[1:]):
        (x1,y1),(x2,y2)=pos[u],pos[v]
        add_edge(u,v,math.hypot(x2-x1,y2-y1),kind)
ids=list(pos); XY=np.array([pos[i] for i in ids]); tree=cKDTree(XY)
# links between features that cross or touch without sharing a node
links=0
for i,j in tree.query_pairs(60):
    u,v=ids[i],ids[j]
    if any(n==v for n,_,_ in adj.get(u,[])): continue
    add_edge(u,v,float(np.hypot(*(XY[i]-XY[j])))+20,'link'); links+=1
print('graph nodes', len(pos), 'links added', links)
# corridor cost
D0=180.0; DMAX=1200.0
dist_cache={}
def corridor(u):
    if u not in dist_cache: dist_cache[u]=run.distance(Point(pos[u]))
    return dist_cache[u]
def cost(u,v,w):
    dm=(corridor(u)+corridor(v))/2
    if dm>DMAX: return None
    return w*(1+(dm/D0)**2)
start=ids[tree.query(run.coords[0])[1]]; end=ids[tree.query(run.coords[-1])[1]]
print('start/end snap (m):', round(corridor(start)), round(corridor(end)))
dist={start:0.0}; prev={}; pq=[(0.0,start)]
while pq:
    du,u=heapq.heappop(pq)
    if u==end: break
    if du>dist.get(u,1e18): continue
    for v,w,kind in adj.get(u,[]):
        c=cost(u,v,w)
        if c is None: continue
        nd=du+c
        if nd<dist.get(v,1e18): dist[v]=nd; prev[v]=(u,kind); heapq.heappush(pq,(nd,v))
path=[end]; kinds=[]
while path[-1]!=start:
    u,k=prev[path[-1]]; kinds.append(k); path.append(u)
path.reverse(); kinds.reverse()
route=LineString([pos[i] for i in path])
from collections import Counter
seglen=Counter()
for (u,v),k in zip(zip(path,path[1:]),kinds): seglen[k]+=math.hypot(*(np.array(pos[v])-np.array(pos[u])))
print('route km', round(route.length/1000,1), 'by kind km', {k:round(v/1000,1) for k,v in seglen.items()})
print('route vs blue: mean offset m', round(np.mean([run.distance(Point(c)) for c in route.coords])), 'max', round(max(run.distance(Point(c)) for c in route.coords)))
# extend both ends to the city border and split the city
main_m=shapely.transform(main, lambda c: np.column_stack([c[:,0]*KX, c[:,1]*KY]))
bnd=main_m.exterior
p0=nearest_points(bnd, Point(route.coords[0]))[0]; p1=nearest_points(bnd, Point(route.coords[-1]))[0]
def push(p, q, k=1.002):  # a hair past the border so the cut line crosses it
    return (q.x+(q.x-p[0])*0.002, q.y+(q.y-p[1])*0.002)
coords=list(route.coords)
cut=LineString([ (p0.x+(p0.x-coords[0][0])*0.05, p0.y+(p0.y-coords[0][1])*0.05) ]+coords+[ (p1.x+(p1.x-coords[-1][0])*0.05, p1.y+(p1.y-coords[-1][1])*0.05) ])
pieces=list(split(main_m, cut).geoms)
print('pieces', len(pieces), [round(p.area/1e6,1) for p in pieces], 'km2')
chorsu=Point(m(69.2370, 41.3260))
area=[p for p in pieces if p.contains(chorsu)][0]
print('service area km2', round(area.area/1e6,1), 'city km2', round(main_m.area/1e6,1))
area_ll=shapely.transform(area, lambda c: np.column_stack([c[:,0]/KX, c[:,1]/KY]))
json.dump(mapping(area_ll), open('service13.geojson','w'))
json.dump(mapping(shapely.transform(route, lambda c: np.column_stack([c[:,0]/KX, c[:,1]/KY]))), open('route13.geojson','w'))
