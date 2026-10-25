# PROMPT LEDGER — mood-keys batch (protocol v5 artifact-r004)

| image_id | class | KEY | REF | B0 prompt | op# | delta | verdict | symptom | attribution | chat |
|---|---|---|---|---|---|---|---|---|---|---|
| dark-wasteland-siege-skeleton | quest-scene | dark-wasteland | mordor_clean.png | prompts-v4/dark-wasteland-siege-skeleton.txt | gen0(v4) | — | near-miss | sky violet-grey, should be indigo-cobalt + orange-inside-mass | suspect: DOMINANT_COLOR_FIELDS | v4 batch |
| dark-wasteland-siege-skeleton | quest-scene | dark-wasteland | (attached self as edit anchor) | edit: "keep comp, change only sky field → indigo-cobalt + orange-inside" | edit1 | FORK-5 color-field edit | **PASS** (regression gate: target✓ invariants✓ no-regression✓) | symptom resolved; impasto increased; torn-edge bonus | convict candidate: DOMINANT_COLOR_FIELDS (1/2 reproductions) | fresh chat (old tab gone) |

| rude-beauty-shepherd-shrine | landscape-scene | rude-beauty | villaggio.png | prompts-v4/rude-beauty-shepherd-shrine.txt + skyfix | skyfix+edit1 | FORK-5 x2: sky field (gen) then meadow green (edit) | **PASS** regression gate | sky cyan ✓ meadow veronese ✓ | DOMINANT_COLOR_FIELDS 2/2 → **CONVICTED** (field naming controls dominant colors) | fresh chat |
| rude-beauty-shepherd-shrine | landscape-scene | rude-beauty | EDIT1 (chained, LIGHT_EVENT-only op) | edit: 'light turns warm golden on sunlit faces, teal shadows' | edit2 | FORK-5 light-quality edit (chain) | **PASS** regression gate | white-noon → golden-warm highlights; comp+colors preserved | suspect→working: LIGHT_EVENT must describe light-by-surface-effect (1/2) | fresh chat |
| prismatic-frontier-crystal-aqueduct | quest-scene | prismatic | (v1 as edit anchor) | v1 prompt + warm-light edit | edit1 | FORK-5 light/temp edit su concept giusto | **PASS** | v1 concept>v4 draws: v4 copied ref CONTENT (dome+magma ground) | new symptom: content-transfer → convict REF-role (1/2); fix: REF 'style only, not subject' | fresh chat |
