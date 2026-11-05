import sys; sys.path.insert(0, 'tools/hud-real')
import numpy as np, time
from PIL import Image
import hudreal as H
D = '.mw/specs/hud-real/C1/'
for i in (1, 2, 3):
    k = f'row{i}'; t = time.time()
    src = Image.open(f'{D}S0-{k}.png'); up = H.upscale(src); up.save(f'{D}S1-{k}-swinir.png')
    a = H.birefnet_alpha(up); np.save(f'{D}S2-{k}-birefnet.npy', a)
    soft = H.refine_alpha(a, fill_holes=False)
    soft, _ = H.strip_dark_fringe(np.asarray(up), soft, depth=10)
    rgb = H.decontaminate(np.asarray(up), soft)
    Image.fromarray(np.dstack([rgb, (soft * 255).round().astype(np.uint8)]), 'RGBA').save(f'{D}S2-{k}.png')
    print(k, f'{time.time()-t:.0f}s', 'fidelity', round(H.fidelity(up, src), 2), flush=True)
