import markdown, subprocess, sys
CSS = "body{font-family:Georgia,'Times New Roman',serif;max-width:760px;margin:40px auto;color:#1a1a1a;line-height:1.5;font-size:11pt}h1{font-size:20pt;border-bottom:2px solid #7a5c2e;padding-bottom:6px}h2{font-size:14pt;color:#7a5c2e;margin-top:22px}h3{font-size:12pt}table{border-collapse:collapse;width:100%;font-size:9.5pt}td,th{border:1px solid #999;padding:4px 8px;text-align:left}th{background:#efe6d2}code{background:#f4f4f4;padding:1px 4px;font-size:9.5pt}blockquote{border-left:3px solid #7a5c2e;margin-left:0;padding-left:12px;color:#444}hr{border:none;border-top:1px solid #bbb}"
for f in sys.argv[1:]:
    md = open(f).read()
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{markdown.markdown(md, extensions=["tables"])}</body></html>'
    base = f[:-3]
    open(base + '.html', 'w').write(html)
    subprocess.run(['textutil', '-convert', 'docx', base + '.html'], check=True)
    print('DOCX:', base + '.docx')
