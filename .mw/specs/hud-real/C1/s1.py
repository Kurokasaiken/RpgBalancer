import sys; sys.path.insert(0, 'tools/hud-real')
import time, json
from PIL import Image
import hudreal as H
D = '.mw/specs/hud-real/C1/'
out = {}
for k in ('top', 'row0', 'bottom'):
    src = Image.open(f'{D}S0-{k}.png')
    for name in ('SwinIR-M_x4_classical.pth', 'RealESRGAN_x4plus.pth'):
        t = time.time(); up = H.upscale(src, name)
        tag = 'swinir' if 'Swin' in name else 'esrgan'
        up.save(f'{D}S1-{k}-{tag}.png'); out[f'{k}-{tag}'] = {'size': up.size, 'mad1x': round(H.fidelity(up, src), 2), 's': round(time.time() - t, 1)}
        print(k, tag, out[f'{k}-{tag}'], flush=True)
json.dump(out, open(D + 'S1-fidelity.json', 'w'), indent=2)
