#!/usr/bin/env python3
"""sync-preview.py — regenerate the generated parts of preview/index.html from
the canonical files, so the preview always shows exactly what gets uploaded.

Reads  copy/{en,it}/about.bbcode, copy/{en,it}/short-description.txt (last
       non-empty line), upload/copy/tags.txt, upload/screenshots/*.png.
Writes preview/index.html (About blocks, short description + variants, tags,
       screenshot carousel, asset paths → upload/).
Usage: python3 -I marketing/steam/tools/sync-preview.py  (from the repo root
or from marketing/steam).
"""
import glob, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
os.chdir(ROOT)

def js(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

def last_line(path):
    return [l for l in open(path).read().split('\n') if l.strip()][-1].strip()

def bb2html(path):
    out = []
    for line in open(path).read().split('\n'):
        l = line.strip()
        if not l:
            continue
        m = re.match(r'\[img\]\{STEAM_CLAN_IMAGE\}/(.+?)\[/img\]', l)
        if m:
            g = m.group(1)
            if os.path.exists(f'upload/about-gifs/{g}'):
                out.append(f'<img src="../upload/about-gifs/{g}" alt="{g}">')
            else:
                out.append(f'<div class="note" style="padding:40px 10px;text-align:center">GIF da produrre: <code>{g}</code> (&lt;5 MB, 616 px)</div>')
            continue
        l = l.replace('[h2]', '<h2>').replace('[/h2]', '</h2>').replace('[list]', '<ul>').replace('[/list]', '</ul>')
        if l.startswith('[*]'):
            out.append('<li>' + l[3:] + '</li>')
        elif l.startswith('<'):
            out.append(l)
        else:
            out.append('<p>' + l + '</p>')
    return '\n        '.join(out)

h = open('preview/index.html').read()

for lang in ('en', 'it'):
    style = ' style="display:none"' if lang == 'it' else ''
    block = f'<div class="about" id="about-{lang}"{style}>\n        {bb2html(f"copy/{lang}/about.bbcode")}\n      </div>'
    h = re.sub(rf'<div class="about" id="about-{lang}"[^>]*>.*?\n      </div>', lambda m: block, h, count=1, flags=re.S)

EN, IT = last_line('copy/en/short-description.txt'), last_line('copy/it/short-description.txt')
h = re.sub(r'const DESC = \{.*?\n\};', lambda m: 'const DESC = {\n  en: "%s",\n  it: "%s"\n};' % (js(EN), js(IT)), h, count=1, flags=re.S)
h = re.sub(r'const VARIANTS = `.*?`;', lambda m: 'const VARIANTS = `SHORT DESCRIPTION (da copy/*/short-description.txt)\n\nEN (%d char):\n%s\n\nIT (%d char):\n%s`;' % (len(EN), EN, len(IT), IT), h, count=1, flags=re.S)

tags = [re.sub(r'^\d+\.\s*', '', l).strip() for l in open('upload/copy/tags.txt') if l.strip()]
h = re.sub(r'const TAGS = \[.*?\];', lambda m: 'const TAGS = [' + ','.join('"%s"' % t for t in tags) + '];', h, count=1, flags=re.S)

shots = sorted(os.path.basename(p) for p in glob.glob('upload/screenshots/*.png'))
h = re.sub(r'const SHOTS = \[.*?\];', lambda m: 'const SHOTS = [' + ','.join('"%s"' % s for s in shots) + '];', h, count=1, flags=re.S)
h = re.sub(r'/\* Media del Director:.*?\*/\nconst MEDIA = \[.*?\n\];', lambda m: (
    '/* Slot 1 = trailer (non ancora pronto: si carica in Steamworks quando c\'è).\n * Per ora il carosello mostra solo gli screenshot reali. */\n'
    'const MEDIA = [\n  ...SHOTS.map(s => ({ t:\'i\', s:`../upload/screenshots/${s}` })),\n];'), h, count=1, flags=re.S)

# asset paths → upload/
rep = {
    '../assets/candidates/from-keyart/main-1232x706.png': '../upload/capsules/main_capsule_1232x706.png',
    '../assets/candidates/from-keyart/header-920x430.png': '../upload/capsules/header_capsule_920x430.png',
    '../assets/candidates/from-keyart/small-462x174.png': '../upload/capsules/small_capsule_462x174.png',
    '../assets/candidates/from-keyart/vertical-748x896.png': '../upload/capsules/vertical_capsule_748x896.png',
    '../assets/candidates/from-keyart/library-capsule-600x900.png': '../upload/library/library_capsule_600x900.png',
    '../assets/candidates/from-keyart/event-capsule-800x450.png': '../upload/capsules/optional_event_capsule_800x450.png',
    '../assets/candidates/from-keyart/library-hero-3840x1240.png': '../upload/library/library_hero_3840x1240.png',
    '../assets/candidates/from-keyart/page-background-1438x810.png': '../upload/library/page_background_1438x810.png',
    '../assets/candidates/from-keyart/library-logo.png': '../upload/library/library_logo_1050x720.png',
    '../assets/community-icon-184x184.png': '../upload/icons/community_icon_184x184.png',
}
for a, b in rep.items():
    h = h.replace(a, b)

# carousel: first shot, no video element
h = re.sub(r'<img class="carousel-main" id="carousel-main" src="[^"]*" alt="media" style="display:none">',
           f'<img class="carousel-main" id="carousel-main" src="../upload/screenshots/{shots[0]}" alt="media">', h, count=1)
h = re.sub(r'\n\s*<video class="carousel-main" id="carousel-video"[^>]*></video>', '', h, count=1)
if 'id="trailer-note"' not in h:
    h = h.replace('<div class="thumbs" id="thumbs"></div>',
                  '<div class="thumbs" id="thumbs"></div>\n      <div class="note" id="trailer-note">Slot 1 — <b>trailer</b>: non ancora pronto. Si carica in Steamworks (i primi due trailer vengono prima degli screenshot).</div>', 1)
open('preview/index.html', 'w').write(h)
print('synced:', len(shots), 'screenshots,', len(tags), 'tags')
