"""Compose 2x2 comparison boards for the fork variants (rule: square grid, labels above)."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = '.mw/runs/20261125-cassetto-fork'

def board(cells, path, cell_w=520, cell_h=300):
    PAD, LABEL = 10, 24
    rows = (len(cells) + 1) // 2
    W = cell_w * 2 + PAD * 3
    H = (cell_h + LABEL) * rows + PAD * (rows + 1)
    im_board = Image.new('RGB', (W, H), (16, 16, 14))
    d = ImageDraw.Draw(im_board)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 15)
    except Exception:
        font = ImageFont.load_default()
    for i, (label, img_path) in enumerate(cells):
        cx = PAD + (i % 2) * (cell_w + PAD)
        cy = PAD + (i // 2) * (cell_h + LABEL + PAD)
        d.text((cx + 4, cy), label, fill=(230, 210, 140), font=font)
        im = Image.open(img_path).convert('RGB')
        im.thumbnail((cell_w, cell_h))
        ox = cx + (cell_w - im.width) // 2
        im_board.paste(im, (ox, cy + LABEL))
    im_board.save(path)
    print('board:', path)

pozzi = [
    ('A — flat nero-teal (attuale)', f'{OUT}/pozzi-A-flat-attuale.png'),
    ('B — marmo smeraldo velato (intensita regolabile)', f'{OUT}/pozzi-B2-marmo-leggibile.png'),
    ('C — velluto + vignettatura (no arte nuova)', f'{OUT}/pozzi-C-velluto-vignetta.png'),
]
if all(os.path.exists(p) for _, p in pozzi):
    board(pozzi, f'{OUT}/board-pozzi.png', cell_h=340)

testo = [
    ('T1 — attuale 11px', f'{OUT}/testo-T1-attuale-11px.png'),
    ('T2 — floor 12px + copy corta (Leader)', f'{OUT}/testo-T2-floor12-copy-corta.png'),
    ('T3 — 11px ma peso/oro piu saliente', f'{OUT}/testo-T3-11px-peso-oro.png'),
]
if all(os.path.exists(p) for _, p in testo):
    board(testo, f'{OUT}/board-testo.png', cell_h=330)
