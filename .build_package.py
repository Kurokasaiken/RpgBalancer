import re
from pathlib import Path

BASE = Path('/Users/faustoboni/progetti_personali/RPG')
OUT = BASE / 'forgotten-observatory-package.md'

files = [
    ('src/ui/visualFidelityLab/ForgottenObservatory.tsx', 'tsx'),
    ('src/ui/visualFidelityLab/foundationRecipe.ts', 'ts'),
    ('src/ui/visualFidelityLab/plateVariants.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/index.ts', 'ts'),
    ('src/ui/wanderlust-surface/WanderlustSurface.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/WanderlustSurfaceDefs.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/WanderlustInnerSurface.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/WanderlustMaterialContext.tsx', 'ts'),
    ('src/ui/wanderlust-surface/materialPresets.ts', 'ts'),
    ('src/ui/wanderlust-surface/InsetPanel.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/InsetPanelDelicate.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/useHeavyDrag.ts', 'ts'),
    ('src/ui/wanderlust-surface/layout/index.ts', 'ts'),
    ('src/ui/wanderlust-surface/layout/WanderlustAmbientField.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/layout/WanderlustLayout.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/layout/WanderlustStatBar.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/layout/WanderlustPortrait.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/layout/QuestChronicle.tsx', 'tsx'),
    ('src/ui/wanderlust-surface/MatericSkinContext.tsx', 'ts'),
    ('src/ui/wanderlust-surface/matericSkinConfig.ts', 'ts'),
    ('src/ui/wanderlust-surface/wanderlust-surface.css', 'css'),
    ('src/ui/wanderlust-surface/layout/wanderlust-layout.css', 'css'),
    ('src/ui/visualFidelityLab/fidelity-header.css', 'css'),
    ('src/ui/visualFidelityLab/matericPlate.css', 'css'),
]

with OUT.open('w') as f:
    f.write('# The Forgotten Observatory — Complete Package\n\n')
    f.write('This package contains the source files needed to recreate `<ForgottenObservatory />`.\n\n')
    f.write('## Setup notes\n\n')
    f.write('- React + TypeScript project.\n')
    f.write('- External deps used: `clsx`, `framer-motion` (only in `useHeavyDrag.ts`), `zod` (only in `matericSkinConfig.ts`). Remove those exports if you do not need them.\n')
    f.write('- Replace `@/ui/...` path aliases with relative paths, or configure `@/` to point at `src/`.\n')
    f.write('- Import the Google Fonts **Cinzel** and **EB Garamond**.\n')
    f.write('- Apply the `:root` skin-token CSS block once in your app so `var(--skin-*)` / `var(--wl-*)` render.\n')
    f.write('- Render `<WanderlustSurfaceDefs />` once at the root of your app.\n\n')

    # Extract base skin tokens from skinCssVariables.ts
    f.write('## `skin-tokens.css` — base V9 Obsidian skin variables (`:root`)\n\n')
    f.write('```css\n')
    skin_text = (BASE / 'src/ui/idleVillage/skins/skinCssVariables.ts').read_text()
    m = re.search(r'export const BASE_SKIN_CSS_VARS: SkinCssVarMap = \{([\s\S]*?)\n\};', skin_text)
    if m:
        for line in m.group(1).splitlines():
            line = line.strip()
            if not line or line.startswith('//') or line.startswith('/*'):
                continue
            m2 = re.match(r"'(--[^']+)':\s*(.+?)(?:,)?$", line)
            if m2:
                key, val = m2.group(1), m2.group(2).strip()
                if val.startswith("'") and val.endswith("'"):
                    val = val[1:-1]
                f.write(f'  {key}: {val};\n')
    f.write('```\n\n')

    for rel, lang in files:
        src = BASE / rel
        content = src.read_text()
        f.write(f'## `{rel}`\n\n')
        f.write(f'```{lang}\n')
        f.write(content)
        f.write('\n```\n\n')

    f.write('---\n\n*Package generated from the RPG Balancer repository.*\n')

print(f'Wrote {OUT}')
