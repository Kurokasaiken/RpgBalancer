#!/usr/bin/env python3
"""PLAN-106 — cut the integrated stone tower out of Gemini's in-plate repaint.

Input: out/village-chain/tower-sprites/tw-stone-integrate-0.png (Gemini repaint
of stone-wall-stone-stone with the towers painted INTO the plate, prompt
prompts/tw-stone-integrate.txt). Mask = silhouette of the canonical slot-2
stamp (known, not diff-keyed), upscaled to Gemini res. Output:
parts/tower-stone-int.png, used by compose-village-towers.py for both slots.
Run BEFORE compose (it reads the current stone-wall-none-none host).
"""
import importlib.util, numpy as np, cv2
spec=importlib.util.spec_from_file_location('cv','scripts/compose-village-towers.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
from PIL import Image
D='out/village-chain/tower-sprites/'
gen=Image.open(D+'tw-stone-integrate-0.png').convert('RGB'); G=np.array(gen); W,H=gen.size; k=W/510
V='public/assets/world/mappa2/base/fx/village/'
host=m.load_rgba('stone-wall-none-none.webp')
# plate-res silhouette of the canonical stamped slot-2 tower
out=host.copy(); m.stamp_foot(out, m.load_tower('parts/tower-stone-gen.png',1,1), m.FEET[2], m.TOWER_SCALE['stone'])
d=(cv2.absdiff(out[...,:3],host[...,:3]).max(2)>10).astype(np.uint8)*255
d=cv2.resize(d,(W,H),interpolation=cv2.INTER_LINEAR)
sil=(d>128).astype(np.uint8)*255
cnts,_=cv2.findContours(sil,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); c=max(cnts,key=cv2.contourArea)
sil=np.zeros_like(sil); cv2.drawContours(sil,[c],-1,255,-1)
a=cv2.GaussianBlur(cv2.erode(sil,np.ones((3,3),np.uint8)),(3,3),0)
ys,xs=np.where(a>0); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
spr=np.dstack([G,a])[y0:y1,x0:x1]
Image.fromarray(spr,'RGBA').save(V+'parts/tower-stone-int.png')
print('sprite', spr.shape, 'scale to plate', round(1/k,4))
# drop Gemini's pale plinth under the base (read as a light wedge on the plate)
spr=np.array(Image.open(V+'parts/tower-stone-int.png'))
h=spr.shape[0]; lum=spr[...,:3].mean(2)
band=np.zeros(spr.shape[:2],bool); band[int(h*0.86):]=True
cut=band&(lum>120)
cut=cv2.dilate(cut.astype(np.uint8),np.ones((3,3),np.uint8))>0
spr[...,3][cut&band]=0
ys=np.where(spr[...,3]>60)[0]; spr=spr[:ys.max()+1]
Image.fromarray(spr,'RGBA').save(V+'parts/tower-stone-int.png'); print('plinth removed px', int(cut.sum()), 'new h', spr.shape[0])
