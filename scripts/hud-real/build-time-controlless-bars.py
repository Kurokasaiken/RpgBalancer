#!/usr/bin/env python3
"""Bake control-neutral variants of the Time bars for PLAN-136.

The painted rectangular speed sockets are replaced with dark enamel so the
shared Events-derived round socket can be mounted live in DOM. Deterministic;
geometry is parsed from the generated TS geometry files.
"""
from pathlib import Path
import hashlib, json, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
JOBS = [
    ('src/ui/idleVillage/hudReal/timeGeometry.ts', 'public/assets/ui/hud-real/time/bar.webp', 'public/assets/ui/hud-real/time/bar-controlless.webp'),
    ('src/ui/idleVillage/hudReal/timeSlimGeometry.ts', 'public/assets/ui/hud-real/time/bar-slim.webp', 'public/assets/ui/hud-real/time/bar-slim-controlless.webp'),
]

def blocks(text):
    m = re.search(r'"slots":\s*\[(.*?)\]', text, re.S)
    return [{k: float(v) for k, v in re.findall(r'"(x|y|w|h)":\s*([0-9.]+)', b.group(0))} for b in re.finditer(r'\{[^{}]+\}', m.group(1))]

def enamel_patch(w, h, rect, rng):
    x0,y0,x1,y1 = rect
    ww, hh = x1-x0, y1-y0
    yy = np.linspace(0,1,hh)[:,None]
    top=np.array([9,36,28.],dtype=np.float32); bot=np.array([3,17,15.],dtype=np.float32)
    arr=(top*(1-yy)+bot*yy)[:,None,:].repeat(ww,axis=1)
    arr += rng.normal(0,1.1,(hh,ww,1))
    # inner perimeter shadow
    yy2,xx2=np.mgrid[0:hh,0:ww]
    dist=np.minimum.reduce([xx2,ww-1-xx2,yy2,hh-1-yy2]).astype(np.float32)
    arr -= (np.clip(1-dist/8,0,1)*4)[...,None]
    im=Image.fromarray(np.clip(arr,0,255).astype(np.uint8),'RGB').convert('RGBA')
    mask=Image.new('L',(ww,hh),0); d=ImageDraw.Draw(mask)
    d.rounded_rectangle((0,0,ww-1,hh-1),radius=max(4,min(ww,hh)//4),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(mask)
    return im

def main():
    rng=np.random.default_rng(136)
    report=[]
    for geom_rel,src_rel,out_rel in JOBS:
        geom=(ROOT/geom_rel).read_text(); slots=blocks(geom)
        bar_w=float(re.search(r'"w":\s*([0-9.]+)',geom).group(1)); bar_h=float(re.search(r'"h":\s*([0-9.]+)',geom).group(1))
        im=Image.open(ROOT/src_rel).convert('RGBA'); W,H=im.size; sx=W/bar_w; sy=H/bar_h
        rects=[]
        for sl in slots:
            # Cover the painted rectangular socket plus its outer bevel, but stay inside the gap.
            x0=int(round((sl['x']-1.0)*sx)); y0=int(round((sl['y']-1.0)*sy))
            x1=int(round((sl['x']+sl['w']+1.0)*sx)); y1=int(round((sl['y']+sl['h']+1.0)*sy))
            patch=enamel_patch(W,H,(x0,y0,x1,y1),rng)
            im.alpha_composite(patch,(x0,y0)); rects.append([x0,y0,x1,y1])
        out=ROOT/out_rel; im.save(out,'WEBP',quality=100,method=6)
        report.append({'artifact':out_rel,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':src_rel,'rects':rects})
    prov=ROOT/'.mw/specs/hud-real/refs/plan136-time-controlless-provenance.json'
    prov.write_text(json.dumps({'plan':'PLAN-136','artifacts':report},indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__': main()
