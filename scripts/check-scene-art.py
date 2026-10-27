#!/usr/bin/env python3
"""A14-A16 scene-art gate: run before presenting ANY generated scene.

Usage: python scripts/check-scene-art.py <image.png> [ref.png ...]
Reports per-image global stats + per-zone hue families / complementary
pairs / vibrancy / murk, and (when refs passed) the warm/green/cool
profile of each baptized reference for comparison (A17).
"""

import sys
from PIL import Image
import numpy as np

NAMES=['red','orange','yellow','chart.','green','spring','cyan','azure','blue','violet','magenta','rose']
def hues(px):
    r,g,b = px[...,0],px[...,1],px[...,2]
    mx=px.max(-1);mn=px.min(-1)
    d=mx-mn;h=np.zeros_like(d);m=d>0
    rm=(mx==r)&m;gm=(mx==g)&m;bm=(mx==b)&m
    h[rm]=(60*((g-b)/np.maximum(d,1)))[rm]%360
    h[gm]=(60*((b-r)/np.maximum(d,1))+120)[gm]
    h[bm]=(60*((r-g)/np.maximum(d,1))+240)[bm]
    return h,sat_of(px),mx/255
def sat_of(px):
    mx=px.max(-1);mn=px.min(-1)
    return np.where(mx>0,(mx-mn)/np.maximum(mx,1),0)

def zone_report(px,label):
    h,s,v = hues(px)
    mask=(s>0.4)&(v>0.3); hh=h[mask]
    tot=max(len(hh),1)
    fams={NAMES[i]:round((hh//30==i).mean()*100,1) for i in range(12)}
    fams={k:v for k,v in fams.items() if v>3}
    # complementary contrast: pairs ~150-210° apart both >=6%
    bins=(hh//15).astype(int)%24
    bc=np.bincount(bins,minlength=24)/tot
    comp=[]
    for i in range(24):
        j=(i+10)%24  # ~150°
        if bc[i]>=0.06 and bc[j]>=0.06:
            comp.append(f"{i*15}°+{j*15}°")
    vibrant=((s>0.6)&(v>0.45)).mean()*100
    murk=((v<0.13)&(s<0.35)).mean()*100
    dom = max(fams.values()) if fams else 0
    dflag = ' MONO-FIELD' if dom >= 55 and label != 'sky' else ''
    print(f"  {label}: fams {fams} | comp-pairs {comp[:3]} | vibr {vibrant:.1f}% murk {murk:.1f}%{dflag}")

def check(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h,w,_=a.shape;px=a.reshape(-1,3)
    r,g,b=px[:,0],px[:,1],px[:,2]
    mx=px.max(1);mn=px.min(1)
    sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1),0);val=mx/255
    hue_all,_,_=hues(px)
    murk=((val<0.13)&(sat<0.35)).mean()*100
    brown=((hue_all>15)&(hue_all<45)&(sat>0.25)&(sat<0.75)&(val>0.18)&(val<0.62)).mean()*100
    vibrant=((sat>0.6)&(val>0.45)).mean()*100
    # impasto proxy
    lum=a.mean(2);lv=[lum[y:y+8,x:x+8].std() for y in range(0,h-8,8) for x in range(0,w-8,8) if lum[y:y+8,x:x+8].mean()>20]
    print(f"{path.split('/')[-1]}: murk {murk:.1f} brown {brown:.1f} vibr {vibrant:.1f} val {val.mean():.2f} impasto-std {np.mean(lv):.1f}")
    # green quality split (luminous vs bottle) — A20, moment-aware threshold
    gm=((hue_all>60)&(hue_all<190)&(sat>0.25)&(val>0.15))
    gv=val[gm]
    if len(gv):
        glum=(((gv>0.45)&(sat[gm]>0.4)).mean()*100)
        gdark=((gv<0.35).mean()*100)
        flag='OK' if glum>=M['green_lum']*100 else 'LOW'
        print(f"  GREEN-SPLIT luminous={glum:.0f}% dark={gdark:.0f}% mean-val={gv.mean():.2f} (moment={ar.moment} want>={int(M['green_lum']*100)}% -> {flag})")
    # zones: sky band (top 20%), upper-mid, lower-mid, fg (bottom 25%)
    zone_report(a[:int(h*0.22)],'sky')
    zone_report(a[int(h*0.22):int(h*0.55)],'mid')
    zone_report(a[int(h*0.55):int(h*0.78)],'low')
    zone_report(a[int(h*0.78):],'fg')

import argparse
ap=argparse.ArgumentParser()
ap.add_argument('files',nargs='+')
ap.add_argument('--domain',default='rude-beauty',choices=['rude-beauty','impero-solare','prismatic','dark-wasteland'])
ap.add_argument('--moment',default='day',choices=['dawn','day','golden','dusk','night'])
ar=ap.parse_args()
# moment-aware thresholds: green luminosity + value expectations shift with time
MOMENT={'dawn':dict(green_lum=0.15,min_val=0.30),'day':dict(green_lum=0.20,min_val=0.45),
        'golden':dict(green_lum=0.05,min_val=0.35),'dusk':dict(green_lum=0.05,min_val=0.25),
        'night':dict(green_lum=0.0,min_val=0.10)}
M=MOMENT[ar.moment]
for p in ar.files: check(p)
