import json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy.spatial import cKDTree
from shapely.geometry import shape
import os, sys
IM=os.environ.get('SCREENSHOT_DIR', '.')  # folder holding the client's screenshot (13.jpg)
city=shape(json.load(open('city.geojson')))
def merc(lon,lat): return np.radians(lon), np.log(np.tan(np.pi/4+np.radians(lat)/2))
# dense boundary samples
pts=[]
for poly in getattr(city,'geoms',[city]):
    ring=poly.exterior
    n=int(ring.length/0.0003)+1
    for i in range(n):
        p=ring.interpolate(i/n, normalized=True); pts.append((p.x,p.y))
P=np.array(pts); MX,MY=merc(P[:,0],P[:,1])
red=np.load('red13.npy'); red[:30]=False
ys,xs=np.where(red); R=np.column_stack([xs,ys]).astype(float)
# init from x-range and bottom
s=(xs.max()-xs.min())/(MX.max()-MX.min()); tx=xs.min()-s*MX.min(); ty=ys.max()+s*MY.min()
for it in range(40):
    proj=np.column_stack([s*MX+tx, -s*MY+ty])
    tree=cKDTree(proj); dist,idx=tree.query(R)
    thr=max(4, np.percentile(dist,80)) if it<10 else 6
    ok=dist<thr
    A=np.zeros((2*ok.sum(),3)); bvec=np.zeros(2*ok.sum())
    mx=MX[idx[ok]]; my=MY[idx[ok]]
    A[0::2]=np.column_stack([mx, np.ones_like(mx), np.zeros_like(mx)]); bvec[0::2]=R[ok,0]
    A[1::2]=np.column_stack([-my, np.zeros_like(my), np.ones_like(my)]); bvec[1::2]=R[ok,1]
    s,tx,ty=np.linalg.lstsq(A,bvec,rcond=None)[0]
proj=np.column_stack([s*MX+tx, -s*MY+ty]); dist,_=cKDTree(proj).query(R)
print(f'fit: median {np.median(dist):.2f}px, 90% {np.percentile(dist,90):.2f}px, inliers<6px {np.mean(dist<6)*100:.0f}%')
km_per_px=(1/s)*6371*math.cos(math.radians(41.3))
print(f'scale: {km_per_px*1000:.1f} m per px')
json.dump({'s':s,'tx':tx,'ty':ty}, open('fit13.json','w'))
im=Image.open(f'{IM}/13.jpg').convert('RGB'); d=ImageDraw.Draw(im)
for poly in getattr(city,'geoms',[city]):
    c=np.array(poly.exterior.coords); mx,my=merc(c[:,0],c[:,1])
    d.line(list(zip(s*mx+tx, -s*my+ty)), fill=(0,170,0), width=3)
im.resize((1000,766)).save('fit13.png')
