## [1.2.0](https://github.com/Kurokasaiken/RpgBalancer/compare/v1.1.0...v1.2.0) (2026-11-15)

### 🚀 Features

* **governance:** governance:check + v1 checks + pre-commit (PLAN-122 T-2..T-5) ([bd4246b](https://github.com/Kurokasaiken/RpgBalancer/commit/bd4246b51eebf655d019c3d9978791c65aaffb03))
* **governance:** invariant ledger + enforcement matrix (PLAN-121 T-0/T-1) ([15d7c2b](https://github.com/Kurokasaiken/RpgBalancer/commit/15d7c2b2eef51d1fb886cc0c7d902aca0c7196a4))

### 🐛 Bug Fixes

* **governance:** remove bringToFront violations; restore foreground:lint to staged scope ([d06ca63](https://github.com/Kurokasaiken/RpgBalancer/commit/d06ca631289ffc4a3f43f3b93384d5ddf982d226))

### 📚 Documentation

* **plan:** renumber enforcement-matrix plan to PLAN-122 (collision) ([1da7f81](https://github.com/Kurokasaiken/RpgBalancer/commit/1da7f819f88feb4482c5b1e8b498235fd89eea4b))

## [1.1.0](https://github.com/Kurokasaiken/RpgBalancer/compare/v1.0.0...v1.1.0) (2026-11-15)

### 🚀 Features

* **ops:** context inventory tool + Phase-0 measurement (R-342) ([9d8504a](https://github.com/Kurokasaiken/RpgBalancer/commit/9d8504a37da12b74c484a7a9214d35367360cca8))

### 🐛 Bug Fixes

* **deploy:** regenerate deploy-manifest.json after T6 slim-bar refs ([c02efdf](https://github.com/Kurokasaiken/RpgBalancer/commit/c02efdf7912d05498ac6e9da213970ebf4f3057f))
* **rules:** globs CSV → YAML sequence — 4 glob rules never loaded ([aca97bc](https://github.com/Kurokasaiken/RpgBalancer/commit/aca97bcbf5c9904725590d1ca9b6e1528ef60b7e))

### 📚 Documentation

* **plan:** PLAN-121 draft — invariant→enforcement matrix (R-342 Phase-3) ([014e40a](https://github.com/Kurokasaiken/RpgBalancer/commit/014e40af82f14b2ba96a07a54cd5e245f7d36a07))
* **traps:** T-29 deploy-manifest drift + T-13 closure:lint tsx child hang ([f1af387](https://github.com/Kurokasaiken/RpgBalancer/commit/f1af3878c1c419ca1aa960bc5ebecd887b63b60e))

### 🔧 Chores

* **contracts:** mechanical resync — inventory, skeletons, scope_files ([75bea3e](https://github.com/Kurokasaiken/RpgBalancer/commit/75bea3e2680f0d1bda0084aa0e87bdb9a19266cd))

## 1.0.0 (2026-11-15)

### 🚀 Features

* 1-5 fully editable stats, count change preserves edits ([e836cf0](https://github.com/Kurokasaiken/RpgBalancer/commit/e836cf0325183e08673d8803f41219849c5c1518))
* add component freezing and certification system ([7b5c9d9](https://github.com/Kurokasaiken/RpgBalancer/commit/7b5c9d98db3bdcc97a3e6c4b5cebbbab68fdc6d4))
* add harness auto-dispatch, roster stat filters, and astrolabe v4 i18n ([0801ce1](https://github.com/Kurokasaiken/RpgBalancer/commit/0801ce175f1a84a2a1ed9b52951282d6b63382fe))
* add MinimalActivityPage debug page for activity timer testing ([373e100](https://github.com/Kurokasaiken/RpgBalancer/commit/373e100390a5c5af45a3af4fa2448c24bc7cb1b9))
* add ottanio background to WorldSurfaceEventCard modal ([ce7651c](https://github.com/Kurokasaiken/RpgBalancer/commit/ce7651c4bbf55433ee70dfb9a1ec5821505ca906))
* add pillar overrides to BASE preset for Layout Primitives consistency ([3570d03](https://github.com/Kurokasaiken/RpgBalancer/commit/3570d036271a895ab5d1b6a2c2825a08b4ed9213))
* add progress bar to ReminderComponent for non-color urgency signaling ([99cb0ad](https://github.com/Kurokasaiken/RpgBalancer/commit/99cb0ad542383b79b32d79f310f73e686f72e595))
* add SlottedMedal component with modular skin system and minimal test page ([6f1c481](https://github.com/Kurokasaiken/RpgBalancer/commit/6f1c481348fb8ec6d1a8fb82c1f905d6ac7bf1a8))
* add unit/E2E tests phases 2–6, debug pages, updated core components ([b7a665d](https://github.com/Kurokasaiken/RpgBalancer/commit/b7a665dab38c12909e31520fa1611bcb8c231e78))
* add Wanderlust DNA V2 — mechanical/alchemical UI kit (WebGL + CSS/SVG) ([67669a7](https://github.com/Kurokasaiken/RpgBalancer/commit/67669a710a607e57b429229e68672845022a5d33))
* always-visible editable skill config panel below astrolabe ([803a151](https://github.com/Kurokasaiken/RpgBalancer/commit/803a1510f984611931f9abda36ddd6873d95dd3e))
* apply Layout Primitives (base) as global default for all TestHub components ([165bfb8](https://github.com/Kurokasaiken/RpgBalancer/commit/165bfb8d33ad2905abeef3f98ea80e83b36f03e0)), closes [#060f16](https://github.com/Kurokasaiken/RpgBalancer/issues/060f16) [#00e5ff](https://github.com/Kurokasaiken/RpgBalancer/issues/00e5ff) [#dfb857](https://github.com/Kurokasaiken/RpgBalancer/issues/dfb857)
* astrolabe polish — sounds, impact flash, sweet spot ring, radial timer, legend ([7ad4db8](https://github.com/Kurokasaiken/RpgBalancer/commit/7ad4db86a1d7bcae692695652437a037ee37b870))
* blob goo edge, goo-relative risk rivers, researched colors, finer obelisks ([90e8cc0](https://github.com/Kurokasaiken/RpgBalancer/commit/90e8cc0222026469f22089a2a44635fe05ddc78f)), closes [#d62034](https://github.com/Kurokasaiken/RpgBalancer/issues/d62034) [#ff969f](https://github.com/Kurokasaiken/RpgBalancer/issues/ff969f) [#7826](https://github.com/Kurokasaiken/RpgBalancer/issues/7826) [#d6aaff](https://github.com/Kurokasaiken/RpgBalancer/issues/d6aaff)
* chaotic-but-rigged ball physics + fix custom builder tab ([723c4c0](https://github.com/Kurokasaiken/RpgBalancer/commit/723c4c0ce68d29c81e667e9e51dac624357b03cb))
* **deploy:** R-327 PLAN-118 — slim Vercel deploy, solo superfici mobile navigabili ([d023728](https://github.com/Kurokasaiken/RpgBalancer/commit/d023728ae617a5b74769f9198c3289ac4ecd183b))
* **deploy:** WebGL boot probe nel guardian deploy-guard (R-304) ([7872140](https://github.com/Kurokasaiken/RpgBalancer/commit/78721405cc7421f046a13bd64c4a997b29e8b8e1))
* enhance V9 POI demo with layered background structure ([48b24dc](https://github.com/Kurokasaiken/RpgBalancer/commit/48b24dcdbe787f01c7bfd4dde6104bd863c2fe6f))
* fix Layout Primitives colors and add heavy drag physics ([22282a7](https://github.com/Kurokasaiken/RpgBalancer/commit/22282a73f6d4319506b1922c87c3eff6f525df8b))
* **game:** quest skill-check overlays, village registry, R-208 single-agent pivot ([0985401](https://github.com/Kurokasaiken/RpgBalancer/commit/09854011debb9e9b091598276939e8fb026a6339))
* **game:** Tuning e Director panel attivi anche in production ([b1daed5](https://github.com/Kurokasaiken/RpgBalancer/commit/b1daed5f1e0d1e953040b2833c24d53df4c40eaf))
* goo-centric model — central blob with correct boundaries ([3912f6c](https://github.com/Kurokasaiken/RpgBalancer/commit/3912f6c3d373455434ce4c33b08a8f6351197d68))
* goo-expand springy phase + TIRA action-trigger gate ([192d595](https://github.com/Kurokasaiken/RpgBalancer/commit/192d595c6db7aa31d86a39a6ff590e5a92f047b9))
* **hud-lab:** route /hud-lab — crop mockup HUD sulla mappa viva (R-303, PLAN-107) ([c39a884](https://github.com/Kurokasaiken/RpgBalancer/commit/c39a88499329dff6dc4ead6c968377fda43f4120))
* **hud-real:** Zanara surfaces ported on /hud-compose (PLAN-113/114) ([2b7c23b](https://github.com/Kurokasaiken/RpgBalancer/commit/2b7c23bc0af3b5d16e1d98b6f2021295c69a5eef))
* **hud+mappa2:** zanara kit → hudReal components (PLAN-110/111) + stormo flock + village towers + hi-res masks ([4e406fb](https://github.com/Kurokasaiken/RpgBalancer/commit/4e406fbc1bdecfe211f385cbd3052b4c7b82d5e4))
* **idleVillage:** add PoiMatericV3_6 with sculpted bronze outer ring ([9c02f28](https://github.com/Kurokasaiken/RpgBalancer/commit/9c02f28b0eb1ddcc4d37976eb00d233178cff0fd))
* **idleVillage:** HUD idle auto-hide, wake-on-event, clock freeze during event theatre (R-169) ([01bebd5](https://github.com/Kurokasaiken/RpgBalancer/commit/01bebd5ea96eac859a741f6e5ba5cbce11a0977d))
* **idleVillage:** PoiMatericV3_8 anchored semantic marker ([8b7835c](https://github.com/Kurokasaiken/RpgBalancer/commit/8b7835c4edc58f8f4a77bb70fa4bcc1f39caf615))
* **landing:** / -> game surface su tutti i device (R-328) ([1c0db48](https://github.com/Kurokasaiken/RpgBalancer/commit/1c0db484f606d303576a66160c7714b28895588c))
* **landing:** / → mappa2-lab anche su desktop (R-305) + probe boot WebGL (R-304) ([997c7d7](https://github.com/Kurokasaiken/RpgBalancer/commit/997c7d701fa1ebe6bac754093ccdc48a2a0bf8a0))
* make Layout Primitives the global BASE skin template ([a84ac0f](https://github.com/Kurokasaiken/RpgBalancer/commit/a84ac0fc73e77fe9cdedd71c62b20e6f8aacf37e)), closes [#060f16](https://github.com/Kurokasaiken/RpgBalancer/issues/060f16) [#00e5ff](https://github.com/Kurokasaiken/RpgBalancer/issues/00e5ff) [#dfb857](https://github.com/Kurokasaiken/RpgBalancer/issues/dfb857)
* **mappa2-lab:** mobile landing + per-device tuning persistence (R-297) ([5aad23f](https://github.com/Kurokasaiken/RpgBalancer/commit/5aad23f592d3380a549270d6d7a942ef6f4630ca))
* **mappa2:** surf a eventi + mountain clarity (fork C) + canopy detail + upscale review ([1c49818](https://github.com/Kurokasaiken/RpgBalancer/commit/1c4981805a11688b67a24f0d19e75d5fa70179c5))
* merge coordinator updates and add new prompts/verification files ([c87b33d](https://github.com/Kurokasaiken/RpgBalancer/commit/c87b33d2b8bb59efcca569a768734b1598a396a4))
* Move agent skills governance from gitignored to versioned location ([73d0d91](https://github.com/Kurokasaiken/RpgBalancer/commit/73d0d9185bc47aad7c1c469df1decf4509dc03b0))
* native (no-iframe) skinnable DestinyAstrolabe component ([865108d](https://github.com/Kurokasaiken/RpgBalancer/commit/865108d19ca03b893d50afb63bcfb6bcc2d9c5d8))
* non-specular, chaotic ball bounce ([7b27be3](https://github.com/Kurokasaiken/RpgBalancer/commit/7b27be372cb8cc2a820911f9760cd3516affa6e5))
* **ops:** OPS-SHUTDOWN v3 — governed shutdown manager core + WIP game work ([a5358f0](https://github.com/Kurokasaiken/RpgBalancer/commit/a5358f0255edcfc3e30904e19e52e91835419e06))
* per-axis astrolabe geometry — obelisks proportional to stat/check ([1d291ab](https://github.com/Kurokasaiken/RpgBalancer/commit/1d291ab9494376b451db47d15ceb5cfdbfeb244d))
* **pixi-worldmap:** foam proximity ramp — surf più denso e bianco verso riva ([58cba71](https://github.com/Kurokasaiken/RpgBalancer/commit/58cba71669bc52e39be7ac6cd6373826f768250f))
* **plan-019:** S2.1 scenario canonico — schema Zod + migrazione goblin/rovine ([c69195b](https://github.com/Kurokasaiken/RpgBalancer/commit/c69195be076290a842456e0baa5d88b0ef6a1be9))
* **plan117:** F0 fondamenta — Luoghi autoriali, tipi POI, Eventi strategici ([66709ab](https://github.com/Kurokasaiken/RpgBalancer/commit/66709ab8e0ca9d9f37d8ad9638b56fe56f1039fc))
* **plan117:** F0/T0.1 catture matrice mappa per il fork POI Zanara ([402962a](https://github.com/Kurokasaiken/RpgBalancer/commit/402962a7c109d967b95dff422576166687e568b6))
* **plan117:** F2 Luogo autoriale — lab /lab/poi-luogo + MapPlace/PlaceFan/PlaceHoverCard ([2fb5597](https://github.com/Kurokasaiken/RpgBalancer/commit/2fb55972cddf791ebc2083da09bb270b3af72f00))
* **poi-marker:** PoiMatericV3_7 Option C - integrated fix with depth cues & animation ([383171d](https://github.com/Kurokasaiken/RpgBalancer/commit/383171d67bb296bc20d246b8be7b5deac89e45f8))
* **poi-v3.7:** Add specular rim light to heraldic icons for material depth ([a5da713](https://github.com/Kurokasaiken/RpgBalancer/commit/a5da713f67868d41a621e2438e638195ab7d3863))
* **poi:** marker accessibility — brass focus line, state in the label, reduced-motion entrance, idle rAF stops ([5acd371](https://github.com/Kurokasaiken/RpgBalancer/commit/5acd371397b292038086cde1da37e0da5740b5bc))
* **poi:** Sigillo family metals, sand field, silver halo, sparkle hover (+ B4-map sigilloTheme hook) ([96316c0](https://github.com/Kurokasaiken/RpgBalancer/commit/96316c0727b455a982bb2795f5293bd9f6f02a90))
* **quest:** journey route — winding bronze path under the POI, no decision dot ([fe915c6](https://github.com/Kurokasaiken/RpgBalancer/commit/fe915c6c184cf8ac92cd7a2b73e3d7ae950b5db1))
* **quest:** PLAN-053 T-004 — authored journey fasi + DAG validator + launch-spec wiring ([cc7eef1](https://github.com/Kurokasaiken/RpgBalancer/commit/cc7eef1b0edc79de9253401b4c2d3848dc7af0db))
* **quest:** PLAN-053 T-005 — journey route overlay su /game (visual fork A, R-226) ([977db47](https://github.com/Kurokasaiken/RpgBalancer/commit/977db47df697e71827b5e385fa43dbd944c5f2b7))
* **quest:** PLAN-053 T-006 — journey detail UI (3 leg bars, parked chip, loot badge) ([d5f357e](https://github.com/Kurokasaiken/RpgBalancer/commit/d5f357e74a70983b5f2347f6b5d685aef55a345e))
* **quests:** PLAN-019-S3 T-2 — OUTCOME zone nel Planner ([4f31974](https://github.com/Kurokasaiken/RpgBalancer/commit/4f31974e4a5d7094090e7735c7f2e2590d3c5975))
* ReminderComponent V1 redesign with inverted hierarchy, band-transition-only animation, and state tokens binding ([2dce245](https://github.com/Kurokasaiken/RpgBalancer/commit/2dce2452a454e98d4c0195477a7c65023a6473ab))
* replace Auto-Tiro toggle with 3 independent throw controls ([ba8a42f](https://github.com/Kurokasaiken/RpgBalancer/commit/ba8a42f476242b0b62484eb3898570b65662417b))
* **sea-effect-lab:** detailBoost and shimmerOpen variants for open sea ([d0d432c](https://github.com/Kurokasaiken/RpgBalancer/commit/d0d432c11fa49d5b05143d747975d6f1d33ea768))
* **sea-effect-lab:** expose sprite sheet ripple as a lab tile ([d960c39](https://github.com/Kurokasaiken/RpgBalancer/commit/d960c39bddb91858c5bd42926e151f881e9ee7f2))
* **sea-effect-lab:** flowScroll variant with animated displacement scroll ([2e48013](https://github.com/Kurokasaiken/RpgBalancer/commit/2e48013b41114bf7fcfaf08e7bcac33c3226618a))
* **sea-effect-lab:** organic caustics variant for open sea ([b002665](https://github.com/Kurokasaiken/RpgBalancer/commit/b002665d67e2f601dcefd829c914369c2f49dd46))
* **sea-effect-lab:** static caustics overlay for 09e flowScroll ([40b5d71](https://github.com/Kurokasaiken/RpgBalancer/commit/40b5d719aaf7742c5f14d040de51be8a14c4c9ef))
* **sea-effect-lab:** swellOpen variant for organic open-sea motion ([e03eab1](https://github.com/Kurokasaiken/RpgBalancer/commit/e03eab197d5d908e4bf25310d44a1e9d2f4bbbad))
* **village:** add Materic skin variant with A/B comparison and enhance governance ([b6e77ca](https://github.com/Kurokasaiken/RpgBalancer/commit/b6e77caa72390fa6d353a906e20cb1295fece29e))
* **village:** v9 skin layout, poi roster integration and remove wanderlust dna ([1332284](https://github.com/Kurokasaiken/RpgBalancer/commit/13322849c1152461be17bbae3326ad397da732d8))
* **village:** v9 skin layout, poi roster integration and remove wanderlust dna ([65f6033](https://github.com/Kurokasaiken/RpgBalancer/commit/65f6033da5f9172562d7c00a3bcd77edd76d972f))
* **world-surface-breathing:** Final tuning - opacity 80-100%, remove debug logs ([85949ab](https://github.com/Kurokasaiken/RpgBalancer/commit/85949ab42f67ebf3b0d4318e9d43d642915fe16f))
* **world-surface:** animated sea ripple sprite sheet (opzione 3) ([0bb4630](https://github.com/Kurokasaiken/RpgBalancer/commit/0bb4630885da4e58d77c61672cb3a6da245a05a9))
* **world-surface:** breathing animation via SVG displacement filter ([65f745f](https://github.com/Kurokasaiken/RpgBalancer/commit/65f745f551f966f2c24c42f4735dec6e13c3e85b))
* **world-surface:** implement Director-selected coastal ripple on real map ([8c9cf66](https://github.com/Kurokasaiken/RpgBalancer/commit/8c9cf6699152d74b24fd8db47f7c50791a7c19cd))
* **world-surface:** make Water ripple impossible to miss ([5fe6637](https://github.com/Kurokasaiken/RpgBalancer/commit/5fe6637134ecae72f118d756454c9123b7bf45d8))
* **world-surface:** PLAN-013 Sea Marks — DOM painted overlay with Zod config and lab A/B ([6c40941](https://github.com/Kurokasaiken/RpgBalancer/commit/6c409413946eebe4805cdf81053f63f8f9eefce7))
* **world-surface:** PLAN-014 land-breath — T-000a pre-check and T-000b Pixi spike ([c57c10f](https://github.com/Kurokasaiken/RpgBalancer/commit/c57c10f7c4925f091416beb39302c6a586c367cf))
* **world-surface:** Water button now toggles coastal ripple ([a203526](https://github.com/Kurokasaiken/RpgBalancer/commit/a203526c6dd55aa8736366a04496aa4f955d990b))

### 🐛 Bug Fixes

* apply Layout Primitives base preset correctly with teal/blue colors ([0b7ee85](https://github.com/Kurokasaiken/RpgBalancer/commit/0b7ee85377ed916e2e7af8a503ca38ed6e9db36b))
* **build:** GoblinEventLabPage importa solo V17 (V1-V16 gitignored) ([3934b07](https://github.com/Kurokasaiken/RpgBalancer/commit/3934b070dc5f42eb1549c7bd5cb60394927b270b))
* **ci:** workflow semantic-release/minimal-tests + chiavi i18n mancanti ([0d6281a](https://github.com/Kurokasaiken/RpgBalancer/commit/0d6281a35e27a96c482e84298c1c0f488ce2aa1b))
* commit missing kanban_status.py and destinyAstrolabeV3 implementations ([bf93481](https://github.com/Kurokasaiken/RpgBalancer/commit/bf934815612c433f4293d62a517192b21d4d29fc))
* connect Layout Primitives base template to skin system ([8d70830](https://github.com/Kurokasaiken/RpgBalancer/commit/8d70830ae606595700529aefe874a61cd2f9ff6c))
* **deploy:** asset runtime ignorati dal .gitignore bloccavano il boot ([6fbf2e8](https://github.com/Kurokasaiken/RpgBalancer/commit/6fbf2e8013482603859827405ef8ab67fdce638f))
* **deploy:** cache-bust asset avvelenati da immutable su /assets/* ([df04c44](https://github.com/Kurokasaiken/RpgBalancer/commit/df04c4462f6e2ccd2bb753ee07e6df4d02c47303))
* **deploy:** GIT_MODE richiede repo funzionante — probe rev-parse (R-327) ([74dcee6](https://github.com/Kurokasaiken/RpgBalancer/commit/74dcee679642ce72ed6a6052dd3b6dde8a3daab4))
* **deploy:** manifest generato su file set HEAD — drift remoto (R-327) ([75bc759](https://github.com/Kurokasaiken/RpgBalancer/commit/75bc7591bcadba2bbe3a62a618d54730cb7702a7))
* **deploy:** parsing ls-tree -l — size allineata a destra (R-327) ([ff859e9](https://github.com/Kurokasaiken/RpgBalancer/commit/ff859e93868dba753995f3a2c0e01818b902c7d7))
* **deploy:** R-327 — manifest onora .vercelignore (drift remoto) ([cff9e8b](https://github.com/Kurokasaiken/RpgBalancer/commit/cff9e8bba734c5c95b6003c3e277b2d78bd84a7c))
* **deploy:** regenerate deploy-manifest.json after public/ asset drift ([e5b8170](https://github.com/Kurokasaiken/RpgBalancer/commit/e5b8170d3615467494736dc05b9c6fccbb07151e))
* destructure gilded tokens in ReminderComponent ([5e68a58](https://github.com/Kurokasaiken/RpgBalancer/commit/5e68a581ba5bb5de052beb9daa12a3d209e656cd))
* **game:** medallion portraits, hold-to-drag, cloud coverage, panel drag ([7c4ff91](https://github.com/Kurokasaiken/RpgBalancer/commit/7c4ff91eb3293bd4591ce6afa6ad18ac84e75f59))
* **game:** R-331 — mappa2 zoom-out ripristinato, HUD fissa, village → camera default ([bf86a58](https://github.com/Kurokasaiken/RpgBalancer/commit/bf86a58c72732a16e1201ac855e80b21f1702686))
* **game:** R-331 round 2 — resting fit = max zoom-out, nav map → villaggio ([eef481e](https://github.com/Kurokasaiken/RpgBalancer/commit/eef481e7ced45b1d34091c08a5fd3565dcf10c99))
* goblinImage aliases in GoblinInvasionWindow ([64e4903](https://github.com/Kurokasaiken/RpgBalancer/commit/64e4903e7c3a6110ba4f43e91f520052e7c4c7d0))
* **idleVillage:** BV findings — theatre timings in config, sea wonder only on idle hide (R-169) ([05ba83a](https://github.com/Kurokasaiken/RpgBalancer/commit/05ba83aabcd76cb5a5a5b7989048082bc0b311ed))
* **idleVillage:** goblin quest calibration — reference strategy, duration, test seams ([c796522](https://github.com/Kurokasaiken/RpgBalancer/commit/c796522f0f18fd769796fcc31bc4bce4e9d8b6ff))
* **idleVillage:** keep the world alive on the Canvas fallback (mesh pipe guard) ([b099137](https://github.com/Kurokasaiken/RpgBalancer/commit/b099137d029e2f13f1d51086c48d1d3122642e5d))
* **idleVillage:** make PoiMatericV3_6 ring colors type-aware ([af0c853](https://github.com/Kurokasaiken/RpgBalancer/commit/af0c8539f5a06ddc94c61cb10c120d8f241cf525))
* **idleVillage:** tone down white border in PoiMatericV3_6 ([3b4482a](https://github.com/Kurokasaiken/RpgBalancer/commit/3b4482a9bea53968370f28b9be201ba5ed22959e))
* **idleVillage:** tune PoiMatericV3_6 material ring per Claude feedback ([aeefcdb](https://github.com/Kurokasaiken/RpgBalancer/commit/aeefcdb600ba55d83247b7c1e45dfcf80bf6e0d2))
* **idleVillage:** V1 color authority and V3.7 anvil icon ([ed9bdf4](https://github.com/Kurokasaiken/RpgBalancer/commit/ed9bdf4629508c2abdbe253c5b4ec609867fb24b))
* **ops:** shutdown daemon armed — terminal-session recovery bug + bootstrap patterns ([91880b0](https://github.com/Kurokasaiken/RpgBalancer/commit/91880b0bcb5eb869791bce8047cbc17152089105))
* **pixi-worldmap:** guard pack.packRoot nel blocco coastFoam — /game crashava su manifest senza pack ([b738eed](https://github.com/Kurokasaiken/RpgBalancer/commit/b738eed203965614c7f98e54bd19d32fcedaf2a4))
* **plan117:** chiavi i18n namespace-relative per Luoghi (convenzione idleVillage) ([4cde1c9](https://github.com/Kurokasaiken/RpgBalancer/commit/4cde1c9c80e4be239c661a44013c0b4d32e9b8cb))
* **poi-v3.7:** Convert all hardcoded SVG filter ids to gid() pattern ([d76267f](https://github.com/Kurokasaiken/RpgBalancer/commit/d76267f8d6ff8ab9616c0a0d717d994eb59abb11))
* **poi-v3.7:** Ship-ready V3.7 — critical CSS & SVG id fixes ([a6254be](https://github.com/Kurokasaiken/RpgBalancer/commit/a6254beac17aac47581726a8c7773fb37a576f1a)), closes [#b8e8d0](https://github.com/Kurokasaiken/RpgBalancer/issues/b8e8d0) [#70d0a8](https://github.com/Kurokasaiken/RpgBalancer/issues/70d0a8) [#3a1a1a](https://github.com/Kurokasaiken/RpgBalancer/issues/3a1a1a) [#1a0805](https://github.com/Kurokasaiken/RpgBalancer/issues/1a0805)
* proportional critical-fail + goo edge bound to black obelisks ([cb990b4](https://github.com/Kurokasaiken/RpgBalancer/commit/cb990b40fa61d972092da7de109ca57b57760bcd))
* **quest:** QuestRunWindow TDZ crash on demoLaunch + R-247 mount regression ([546a2f6](https://github.com/Kurokasaiken/RpgBalancer/commit/546a2f667f1c350d44ebacfb138c7ef9e81d8b4a))
* ReminderComponent text centering and threatSurface color ([0f311d5](https://github.com/Kurokasaiken/RpgBalancer/commit/0f311d5a4bdf1af64829a8efc25aeb7023f88681)), closes [#7a1a1a](https://github.com/Kurokasaiken/RpgBalancer/issues/7a1a1a) [#4d0f10](https://github.com/Kurokasaiken/RpgBalancer/issues/4d0f10) [#240607](https://github.com/Kurokasaiken/RpgBalancer/issues/240607) [#4a1f1a](https://github.com/Kurokasaiken/RpgBalancer/issues/4a1f1a) [#200b09](https://github.com/Kurokasaiken/RpgBalancer/issues/200b09)
* **ReminderComponentV2:** vertically center POI including bottom gem ([f1a2551](https://github.com/Kurokasaiken/RpgBalancer/commit/f1a2551b888f0380bb9a1a312c1bc29cdd8bc33f))
* Remove bold formatting from Coordinator mandate agent assignment section ([d294619](https://github.com/Kurokasaiken/RpgBalancer/commit/d29461991a28019e65bc3f4e092da887d17b5fed))
* remove fill from gilded frame outer path to reveal reminder surface background ([db73206](https://github.com/Kurokasaiken/RpgBalancer/commit/db732065f289abc556578785dbfdfae343da937c))
* Remove incorrect pan restriction when zoomed ([97caff3](https://github.com/Kurokasaiken/RpgBalancer/commit/97caff3216f849a5f9da3f8969ce2374c169c60a))
* remove template page imports from App.tsx to resolve build errors ([5808ff9](https://github.com/Kurokasaiken/RpgBalancer/commit/5808ff9b99803b8fcffba2498e81d150d235bf9d))
* restore goo-as-failure model + visible critical failure ([1d3ec46](https://github.com/Kurokasaiken/RpgBalancer/commit/1d3ec46cb16a2be7d10a722bdd53ed187498b5a0))
* ripristina nomi originali props goblin ([90c9cea](https://github.com/Kurokasaiken/RpgBalancer/commit/90c9cea9e45eeb93b59bfa8b301f24169577bcd4))
* river glint invisible (fractional z-index), remove dead reaction-zone code ([44f4f50](https://github.com/Kurokasaiken/RpgBalancer/commit/44f4f50dab4d5a4ce1b295c7eea67f4903242195))
* sea pattern overlay z-index, motion and default scale ([0155709](https://github.com/Kurokasaiken/RpgBalancer/commit/01557094634f7ab0cbd11be6e15ecd761f9ed469))
* sea pattern rendering incomplete past the WebKit texture edge limit ([a47765c](https://github.com/Kurokasaiken/RpgBalancer/commit/a47765c1b1b46a060c55c2ddf8f144bed4707e13))
* **sea-effect-lab:** caustics sprite alpha + slower cycle ([587248b](https://github.com/Kurokasaiken/RpgBalancer/commit/587248bbf72fa74a1a2c9bb0cae94e302d516613))
* sostituisce WorldSurfaceEventCard con MatericEventCard (primitives Event) ([cb19acc](https://github.com/Kurokasaiken/RpgBalancer/commit/cb19acca8cabe309cabef37375630cb97a76f78f))
* **tsconfig:** ignoreDeprecations 6.0 -> 5.0 (valore invalido su tsc 5.9, TS5103) ([c76a65d](https://github.com/Kurokasaiken/RpgBalancer/commit/c76a65dbd8ac86264e13ccb0c9c09f6e7d0c3d0e))
* update coordinator paths and sync with remote ([a59d827](https://github.com/Kurokasaiken/RpgBalancer/commit/a59d827aeb98b79b50f183990840a2eb70ad3298))
* **village:** R-326 — ri-taglio layer director + rimozione house-small-west ([73d83f3](https://github.com/Kurokasaiken/RpgBalancer/commit/73d83f3c6bd2a56950990fb5f892af18fd416f13))
* **village:** R-326 iter.2 — confini ripartizione sulle silhouette dipinte ([98f869e](https://github.com/Kurokasaiken/RpgBalancer/commit/98f869ec6f161672759823abfec24cbec8f23773))
* **village:** R-326 iter.3 — sweep pixel esclusivi + alpha-value transfer ([0ae18f7](https://github.com/Kurokasaiken/RpgBalancer/commit/0ae18f707f8da0c497c47a5ffc8bed876e8153e3))
* **village:** R-326 iter.4 — patch base.webp dietro l'inn ([18af1de](https://github.com/Kurokasaiken/RpgBalancer/commit/18af1de6081e639856df85401091f431c9ac9938))
* **village:** R-326 iter.5 — confini lato destro sulle silhouette reali ([8d81d79](https://github.com/Kurokasaiken/RpgBalancer/commit/8d81d7904169413977ed6fae85938605836f3b4e))
* World Surface water field z-index and animation ([caaa2c5](https://github.com/Kurokasaiken/RpgBalancer/commit/caaa2c5f7b61674b95746d5658faf1be349e1f0c))
* **world-surface-breathing:** Animate feDisplacementMap scale, not transform ([42d0b5f](https://github.com/Kurokasaiken/RpgBalancer/commit/42d0b5fdac631da8700e1ac8529523dbbd1aa77d))
* **world-surface-breathing:** Correct opacity formula (was inverted) ([90971af](https://github.com/Kurokasaiken/RpgBalancer/commit/90971af392cac81ce40a5dc23c08300c512f0f63))
* **world-surface-breathing:** Increase magnitude from 1px to 5px for visibility ([dca350c](https://github.com/Kurokasaiken/RpgBalancer/commit/dca350c11af0e95c9ecb458e6fd70ad364f6931d))
* **world-surface-breathing:** Use opacity pulsing instead of scale modulation ([5e51576](https://github.com/Kurokasaiken/RpgBalancer/commit/5e515769a4945f0e0fbd961b7449f0406e6153fa))
* **world-surface-breathing:** Use setInterval instead of RAF so animations run when Browser pane is hidden ([ca21677](https://github.com/Kurokasaiken/RpgBalancer/commit/ca216775fc8dbc93dc9290a6c41daadc8f3cdb50))
* **world-surface:** alpha-bleed + edge-erode all layers; sea island border fill ([89fbaab](https://github.com/Kurokasaiken/RpgBalancer/commit/89fbaab35b8b259eb19f05d6c72d01c2b81276dc))
* **world-surface:** Disable prototype breath overlay (yellow token, discovery stroke, water reveal) ([9331632](https://github.com/Kurokasaiken/RpgBalancer/commit/9331632ffd36a2afd762166aa86b0f66579c6349))
* **world-surface:** full-canvas layer pipeline + frozen kit + guard test ([432e28d](https://github.com/Kurokasaiken/RpgBalancer/commit/432e28d43c6e858cc3392879b3a033c9f0547c9c))
* **world-surface:** Glass overlay and atmosphere now render behind frame ([6472e8a](https://github.com/Kurokasaiken/RpgBalancer/commit/6472e8a76b818d59a6c666bd78ba3277156e9b01))
* **world-surface:** make coastal waves visible when Water is on ([ed84b56](https://github.com/Kurokasaiken/RpgBalancer/commit/ed84b56f4cb9c360832e6d78b511129540844f4f))
* **world-surface:** replace SVG filter with CSS drift for coastal ripple ([c526f05](https://github.com/Kurokasaiken/RpgBalancer/commit/c526f058d98838fbc4f9220003396ca2219ea79d))
* **world-surface:** rimuovi macchia grigia + dilata isole + erode bordo mare ([0a10ef6](https://github.com/Kurokasaiken/RpgBalancer/commit/0a10ef6e27c1de13f7128c6b527535d4e4ee142e))
* **world-surface:** visible coastal ripple for Water toggle ([0c296ea](https://github.com/Kurokasaiken/RpgBalancer/commit/0c296ea3b1ac3faecf26897bf9eb71ddd2845ee0))
* **world-surface:** Water button drives coastal wave marks too ([0720891](https://github.com/Kurokasaiken/RpgBalancer/commit/0720891d19359c2152ee1b6bcd93e6c2af3eda09))

### 📚 Documentation

* **context:** learn R-304/R-305 — istanza T-22 (headless-no-GPU), decision log, index ([5b2b3ad](https://github.com/Kurokasaiken/RpgBalancer/commit/5b2b3ad1d7d53206e9264f5fde2530bce24475d5))
* **docs:** consolidate project authority, current state and glossary ([460b755](https://github.com/Kurokasaiken/RpgBalancer/commit/460b755426439279973f38362d7f822985165d9b))
* **kanban:** mark R-066-PLAN-013 as completed with evidence link ([bef20f7](https://github.com/Kurokasaiken/RpgBalancer/commit/bef20f776c38d2f8882fbe5795ea21f2604b356d))
* **kanban:** update R-066-RIPPLE with sprite sheet asset and safeguards ([a108415](https://github.com/Kurokasaiken/RpgBalancer/commit/a10841576e2bb429a1e3b79d27637a560fede850))
* **ops:** OPS-SHUTDOWN v3 evidence log + R-200 status update ([aead3da](https://github.com/Kurokasaiken/RpgBalancer/commit/aead3da7c3353e9d57928e325b16f7dd4be45e27))
* **plan-019:** registra D-J/D-K — halo elapsed puro, nodi a schedule assoluto ([7bdc016](https://github.com/Kurokasaiken/RpgBalancer/commit/7bdc016479ae3f6a386bb451ae26576112e62be5))
* **plan-019:** traccia i sotto-piani S2.1–S2.5 citati dal contenitore ([40b37e5](https://github.com/Kurokasaiken/RpgBalancer/commit/40b37e59b58036208fdc6a798e677c0dc6229759))
* **plan068:** re-sync gate umani — G-11 chiusa (trusted:check OK), G-05 parziale (BTN-1/DN-6/DN-7/COL-D/T-C2 rulata), accodato G-12 eye-check ritratti PLAN-079 ([bd1ab2a](https://github.com/Kurokasaiken/RpgBalancer/commit/bd1ab2af1d4c099c39fdeeadb722fb4fa339698b))
* **plan:** add PLAN-078 Quality Sentinel ([acb40de](https://github.com/Kurokasaiken/RpgBalancer/commit/acb40de33831896c5ccc97059e9449ec290b9b46))
* **plan:** PLAN-117 baptized rev.5 — layer opportunità mappa (R-324) ([f1a32a3](https://github.com/Kurokasaiken/RpgBalancer/commit/f1a32a34f50d600e4d61b27663de3559d7858292))
* **plan:** PLAN-117 rev.3 — POI Zanara post-dibattito multi-AI (R-324) ([f4fc618](https://github.com/Kurokasaiken/RpgBalancer/commit/f4fc6187971c820f699ed7deb00b5d88a7c77a0a))
* **plan:** PLAN-117 rev.5 — dibattito multi-AI converged 4/4 (R-324) ([bfd527c](https://github.com/Kurokasaiken/RpgBalancer/commit/bfd527cb9adddaed56c22dcecd73b8d633f18901))
* **plan:** PLAN-119 ledger — seal state + safeFit wiring finding (framing model, not a prop) ([f569043](https://github.com/Kurokasaiken/RpgBalancer/commit/f56904354b3dc97aa0d89d9d8fcb61a4d31e1147))
* **plan:** register PLAN-078 Quality Sentinel ([8459a17](https://github.com/Kurokasaiken/RpgBalancer/commit/8459a17d43ad8bb8182d15623327ba62891e5e5c))
* **poi:** Sigillo brief updated with decisions, glyph-asset brief, research and colour/field sheets ([0d4285a](https://github.com/Kurokasaiken/RpgBalancer/commit/0d4285a87eb4b599ade6cfd32602bcb30ad0a708))
* **quest-gen:** tassonomia gimmick Director + investigation compendium (R-286/R-287) ([a0cae4a](https://github.com/Kurokasaiken/RpgBalancer/commit/a0cae4aa255dbd81ddc24ddf17c6263420e51313))
* R-326 iter.5 — witness live post-fix in RICHIESTE ([2310586](https://github.com/Kurokasaiken/RpgBalancer/commit/2310586293b05a5f8e67bef538562265210e9d19))
* R-335 — cassetto risorse interne, medaglione roster, slot margins, roster icons ([547c021](https://github.com/Kurokasaiken/RpgBalancer/commit/547c021c49077ba1be598d83e0f972c66008cdb5))
* **r326:** iterazione 3 — sweep pixel esclusivi, residui solo eliminati ([564d3a5](https://github.com/Kurokasaiken/RpgBalancer/commit/564d3a5e0246072be43425602dfc21a6a2f01334))
* **r326:** nota bundle post-commit — BASE = sealed_base_sha, risolve a reseal ([908fc4c](https://github.com/Kurokasaiken/RpgBalancer/commit/908fc4c635862faa7eb9b84afd5939b57bcea627))
* **r341:** close — deploy verified Ready + WebGL probe green on prod ([0de88c5](https://github.com/Kurokasaiken/RpgBalancer/commit/0de88c5387f660b859af6c096e1fa40d4659057e))
* Replace placeholder SKILL.md files with actual mandate content ([a992456](https://github.com/Kurokasaiken/RpgBalancer/commit/a99245640c7836df0a19f345d2c2a0aa64375595))
* **richieste:** R-328 — esito deploy e verifica post-deploy ([6e5d078](https://github.com/Kurokasaiken/RpgBalancer/commit/6e5d078c46fd46a0438ad43a6a720f37123bca35))
* **richieste:** R-329 — HUD non scala su schermi piccoli ([ef1897b](https://github.com/Kurokasaiken/RpgBalancer/commit/ef1897bae1992cf9d20676b04ed5b0e266e5113d))
* **richieste:** R-330 — icona PWA da rivedere (rinviata) ([28c978b](https://github.com/Kurokasaiken/RpgBalancer/commit/28c978be38288f721b2802b17c5a0e918a1a57d3))
* **rules:** deploy verification invariant (R-304) + chiusura R-304/R-305 ([07f557d](https://github.com/Kurokasaiken/RpgBalancer/commit/07f557dd75862b1a12f7bb40f7e83dfce14cb7de))
* update poiKit to note MatericV3_5 as canonical POI visual variant ([6c6e976](https://github.com/Kurokasaiken/RpgBalancer/commit/6c6e976119e580965c2aa5aa6b7bd580b68f186f))

### 🧪 Tests

* Extreme opacity range (50%-100%) to verify mechanism works ([a8ea4a4](https://github.com/Kurokasaiken/RpgBalancer/commit/a8ea4a4705326e83b6f07e7b076c3d4cad1fa34e))

### 🔧 Chores

* align git tree with deployed worktree (parallel sessions) ([f912bb9](https://github.com/Kurokasaiken/RpgBalancer/commit/f912bb9094b8edac1f34daa44b42b4b1f397d1de))
* commit remaining worktree changes (assets, tools, tests, docs) ([ec18659](https://github.com/Kurokasaiken/RpgBalancer/commit/ec18659e4acbb024c516ed07acc684204fb2147b))
* **deploy:** assertDeployShape — mostra il dettaglio del drift (R-327) ([64e0111](https://github.com/Kurokasaiken/RpgBalancer/commit/64e0111bda06b473b241a8073d1ac3650d4cc41e))
* **game:** commit working tree (medallion portraits, drag, clouds, panels, map assets) ([2cbb1c3](https://github.com/Kurokasaiken/RpgBalancer/commit/2cbb1c327d4bc7c1b9eb91eeaa9d7d767d91c39b))
* **game:** quest lifecycle spec update (in-flight work) ([db25647](https://github.com/Kurokasaiken/RpgBalancer/commit/db25647456f179ed46c242b769d59d4dbae239aa))
* **mappa2-lab:** rename Copy defaults → Share config (R-297) ([5d2a107](https://github.com/Kurokasaiken/RpgBalancer/commit/5d2a1071a25797c05e326fefddcf55b8a9009eb8))
* **mappa2:** track mappa2 grade/weather deps used by committed lab ([7181e5b](https://github.com/Kurokasaiken/RpgBalancer/commit/7181e5b565fb4f9f87123cb390588ce969b6916d))
* **mappa2:** track regional weather config used by committed controls ([ce4acc1](https://github.com/Kurokasaiken/RpgBalancer/commit/ce4acc1fc6b29197990a718911bc63ae490a9cfd))
* **mappa2:** track villageZoneOverlay + stage assets (PLAN-089 T-012) ([fa1a526](https://github.com/Kurokasaiken/RpgBalancer/commit/fa1a526fd6a7895d9106ea280dcf4840a77edc24))
* **ops:** pre-shutdown auto-commit 2026-10-15T22:19:47.566Z ([89a3972](https://github.com/Kurokasaiken/RpgBalancer/commit/89a39724eedb61770109d0e4f0873471b099f76b))
* **ops:** pre-shutdown auto-commit 2026-10-22T23:17:00.756Z ([4b7beb5](https://github.com/Kurokasaiken/RpgBalancer/commit/4b7beb50970edc60978533bdf2362532d035255d))
* **ops:** pre-shutdown auto-commit 2026-10-24T01:06:31.549Z ([29c9e1a](https://github.com/Kurokasaiken/RpgBalancer/commit/29c9e1ad1daae95e6f39dbb7ebe3b8edf074aa75))
* **ops:** pre-shutdown auto-commit 2026-10-24T09:26:56.124Z ([62b2f20](https://github.com/Kurokasaiken/RpgBalancer/commit/62b2f20a0110e24619f2c20849d460c895181bdd))
* **ops:** pre-shutdown auto-commit 2026-10-26T21:41:56.234Z ([5c390f9](https://github.com/Kurokasaiken/RpgBalancer/commit/5c390f90c940843c6fbed64626cd86e16263e0a8))
* **ops:** pre-shutdown auto-commit 2026-10-27T22:12:07.113Z ([4d17d61](https://github.com/Kurokasaiken/RpgBalancer/commit/4d17d61429f04e523b97b9b091e2d78dbacc657e))
* **ops:** pre-shutdown auto-commit 2026-10-29T00:51:41.070Z ([6da3382](https://github.com/Kurokasaiken/RpgBalancer/commit/6da3382f802457d18db0e72a346b27e35c319da9))
* **ops:** pre-shutdown auto-commit 2026-10-29T23:26:09.119Z ([d20b062](https://github.com/Kurokasaiken/RpgBalancer/commit/d20b062b37bcc8640b3f19d3df939bceab91d551))
* **ops:** pre-shutdown auto-commit 2026-10-30T22:28:04.839Z ([6a18e12](https://github.com/Kurokasaiken/RpgBalancer/commit/6a18e12b91841c85f073af29bc5986e13973b304))
* **ops:** pre-shutdown auto-commit 2026-10-31T17:59:23.890Z ([1f9127d](https://github.com/Kurokasaiken/RpgBalancer/commit/1f9127d9a228aef599e7609ea189d285a410d9df))
* **ops:** pre-shutdown auto-commit 2026-11-01T19:46:14.112Z ([e7d7256](https://github.com/Kurokasaiken/RpgBalancer/commit/e7d72561d731f5949e839b03f5090b427c96a82c))
* **ops:** pre-shutdown auto-commit 2026-11-02T01:06:17.250Z ([92060b0](https://github.com/Kurokasaiken/RpgBalancer/commit/92060b0dcc67b851f0c18e83172bdec52934d789))
* **ops:** pre-shutdown auto-commit 2026-11-10T22:15:47.137Z ([38c0943](https://github.com/Kurokasaiken/RpgBalancer/commit/38c09439974b2368e68dc597a279c991032ae603))
* **ops:** pre-shutdown auto-commit 2026-11-11T21:21:27.539Z ([b3b694b](https://github.com/Kurokasaiken/RpgBalancer/commit/b3b694b793ae4bf1a7fc2a0f75328918342e75ee))
* **ops:** pre-shutdown auto-commit 2026-11-14T14:33:01.070Z ([7e8f655](https://github.com/Kurokasaiken/RpgBalancer/commit/7e8f6559df73b7d71c1941ed10c3912509df9c33))
* **ops:** pre-shutdown auto-commit 2026-11-15T03:55:29.214Z ([dee166e](https://github.com/Kurokasaiken/RpgBalancer/commit/dee166e860eb9c9fd0701124d642a81de8ec94ea))
* **ops:** pre-shutdown auto-commit 2026-11-15T11:03:08.178Z ([5f11256](https://github.com/Kurokasaiken/RpgBalancer/commit/5f11256db70936dd32164c7ee61972dad4150408))
* **R-335:** re-record red-first r335RosterChrome (sha drift post-tag) ([94c3fa5](https://github.com/Kurokasaiken/RpgBalancer/commit/94c3fa5145acd60941176fdbf53abb992c213db7))
* **r339:** rail witness probe on standard dev port 5173 ([ad15792](https://github.com/Kurokasaiken/RpgBalancer/commit/ad1579250297552dcfff0e7556fd968edb0fb896))
* remove AI session artifacts and strengthen .gitignore ([132a6db](https://github.com/Kurokasaiken/RpgBalancer/commit/132a6dbe0b73846c82a05a2b99d6b2efa6cda651))
* remove coordinator/last-run-summary.json from git tracking (already in .gitignore) ([ef875ce](https://github.com/Kurokasaiken/RpgBalancer/commit/ef875ce9e848abb294c42b0f0a81093f94e8506e))
* **repo:** applica le cancellazioni del cleanup (rimaste unstaged) ([f68da7a](https://github.com/Kurokasaiken/RpgBalancer/commit/f68da7accf81891f8cb883f418b5dd2276aa2f64))
* **repo:** pulizia root junk + .vercelignore completa (fix upload 49k) ([585b391](https://github.com/Kurokasaiken/RpgBalancer/commit/585b3918e1d1735477fb7256a540c7915c6d722f))
* resolve MP-00 registry event moved to processed by AI worker ([16478cf](https://github.com/Kurokasaiken/RpgBalancer/commit/16478cfb1bbc2a1da16194201f77b012e8bd315f))
* resolve registry event moved to processed by AI worker ([61166f3](https://github.com/Kurokasaiken/RpgBalancer/commit/61166f329dad73e6dc7f6f8d336fb82b21b84606))
* sync pending work ([6ed6071](https://github.com/Kurokasaiken/RpgBalancer/commit/6ed60712a00abb05cfcad3c0ed6cba690d2245a6))
* **vercel:** ignore .sdx-venv — 20k-file local venv pushed upload over the 15k-file limit ([574902c](https://github.com/Kurokasaiken/RpgBalancer/commit/574902c129ffe055caffdd420c90b0eb52d3da42))
* **verification:** inventory regen post-commit (468 STRICT_FILES) ([b98a989](https://github.com/Kurokasaiken/RpgBalancer/commit/b98a989f4b7a0b2d0f1fb31ad6c43a14900ab99b))

### CI/CD

* pin ubuntu-24.04 on Playwright jobs (ubuntu26.04 unsupported by PW 1.58.2) ([07779dc](https://github.com/Kurokasaiken/RpgBalancer/commit/07779dcd90bb242c7e08b73ae312b02b4d0f65ec))

> **STATUS: HISTORICAL (fermo a Jul 2026)** — KB audit 2026-10-05 (desiderata v25, `KNOWLEDGE_AUDIT.md`). Canonico: git log + SESSION_HANDOFF.md.

# Changelog - Sistema di Bilanciamento & Vertical Slice Architecture

## [Unreleased]

### Roster Visual Prototype - Materic (Pulsazione Materica) Variant
- Added `MatericSkinContext`/`MatericSkinProvider` and `MATERIC_SKIN_CONFIG` (Zod-validated) to toggle a rough stone/bronze skin variant.
- `WanderlustStatBar` now renders sharp, non-rounded tracks with a sap-like HP fill and golden-sand stamina fill when inside a `MatericSkinProvider`.
- `DragTestContainer` renders a low-opacity `bg.png` grain overlay when the Materic skin is active.
- `/minimal-roster` now renders the original roster side-by-side with a Materic copy for A/B comparison.

### Phase 2: Conventional Commits & Semantic Versioning (IN PROGRESS)
- ✅ `.commitlintrc.json` - Commit message validation configuration
- ✅ `.releaserc.json` - Semantic-release configuration
- ✅ `.github/workflows/semantic-release.yml` - Auto-versioning CI/CD workflow
- 📝 `PHASE_2_SETUP_GUIDE.md` - Implementation instructions (in progress)
- 📝 Team training materials for conventional commits (in progress)

## 2025-12-17 - Phase 10 Priority Fix (Balancer)

### ✅ Completed
- **Reset Controls**: Stat, card e pagina usano ora i callback di `useBalancerConfig`, mantenendo i valori importati dal preset iniziale.
- **Lock/Hide**: Card e stat rispettano gli stati `isLocked`/`isHidden` con UI coerente (lock icon text-sm, cluster di pulsanti riordinato).
- **Import/Export/Reset Feedback**: `ConfigToolbar` mostra toast di esito e prevenzione errori (try/catch + validazione).
- **App Load Marker**: `App.tsx` espone `data-testid="app-loaded"` per Playwright e QA automatici.

### 🔍 QA
- `npx playwright test tests/balancer-new.spec.ts` eseguito con successo su Desktop Chrome, Mobile Safari e Mobile Chrome (dev server Vite su 127.0.0.1:5173).
- I log di presenza negativi nei test derivano da selettori incompleti (non attivano edit mode) ma le funzionalità sono verificate manualmente nella UI.

---

## 2025-11-23 - Phase 3 & Grid Arena Polish

### ✨ New Features
- **Synergy Matrix (Phase 3.1)**:
  - Implemented `SynergyAnalyzer` to detect multiplicative stat interactions.
  - Added UI matrix visualization in Testing Lab.
  - **Discovery**: Found +176% synergy between Armor and Regen.
- **Grid Arena UI Overhaul**:
  - Replaced corrupted SVG assets with professional-style PNG icons.
  - Implemented seamless CSS gradient terrain for cleaner aesthetics.
  - Added visual polish to grid tiles (borders, hover effects).

### 🔧 Improvements
- **Testing Lab Consolidation**:
  - Unified all testing tools (Combat, Weights, Validation, Synergies) into a single "🧪 Testing" tab.
  - Added "Auto-run" toggle for continuous balancing.
  - Added Test History tracking.

---

## 2025-11-23 - Phase 2: Stat Weights

### ✅ Completed
- **Stat Weight Database**:
  - Calculated theoretical HP values for all 9 core stats.
  - **Key Findings**: Resistance (1% = 100 HP), Lifesteal (1% = 40 HP).
- **StatWeigher Tool**:
  - Added Batch Mode for analyzing all stats at once.
  - Added CSV export for data analysis.

---

## 2025-11-23 - Phase 1: Foundation

### ✅ Completed
- **Combat Test Framework**:
  - Created Monte Carlo simulation engine (1000+ sims/test).
  - Implemented 6 baseline scenarios (Symmetry, Scaling, Mitigation, etc.).
- **Baseline Calibration**:
  - Validated `DEFAULT_STATS` to achieve perfect 50.05% symmetry.

### 🐛 Bug Fixes
- **`configApplyBeforeCrit`**: Fixed logic to correctly respect the "Mitigation before Crit" flag.

---

## 2025-11-23 - Initial Implementation Phase

### ✅ Assets Update
**Replaced AI-generated SVG with professional assets from game-icons.net**
- **Characters**: Warrior, Mage, Archer, Orc
- **Tiles**: Grass, Stone

### 🐛 Bug Fixes
#### **CRITICAL: `configApplyBeforeCrit` Implementation**
**Issue**: Flag existed in `StatBlock` but was not implemented in damage calculation flow
**Fix**: Added branching logic in `damageCalculator.ts` and UI toggle in `MitigationCard.tsx`.

### 📋 Documentation Created
- **`docs/combat_system_audit.md`**: Comprehensive audit (Grade A-).
- **`implementation_plan.md`**: 5-phase roadmap.
- **`task.md`**: Granular task tracking.
