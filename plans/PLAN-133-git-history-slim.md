# PLAN-133 — Slim delle history git (RPG 8.4G + mind-weaver 5.2G)

**Stato:** draft — richiede via esplicita Director e finestra senza sessioni parallele.
**Parent:** R-381/R-382 (cernita artefatti; `.git` lasciato fuori scope).
**Documentation impact:** REQUIRED — plans/INDEX, evidence post-run.

## Perché

- RPG `.git` pack = **8.4G**; i 30 blob più grossi sono binari committati:
  `out/medallion-edit/pylib/cv2/cv2.abi3.so` 42M, `marketing/steam/*.mov` 24M,
  HDR 4K 23M, PNG research 16-19M (campionato via `git rev-list --objects --all`).
- mind-weaver `.git` = **5.2G**, **nessun remote** (locale-only → più sicuro).
- Cancellare i file oggi non li toglie dalla history: serve riscrivere.

## Prerequisiti (gate, tutti blocking)

1. **Nessuna sessione parallela** sui due repo: worktree puliti (`git status`
   vuoto), niente uncommitted work altrove — riscrivere con lavoro volante
   in giro lo perde. (T-13 — oggi c'erano file modificati di sessioni vive.)
2. **Backup**: clone mirror `git clone --mirror` di entrambi in
   `~/progetti_personali/cleanup-salvage-2026-11-24/git-mirror/` prima di toccare.
3. **Vercel/CI**: RPG ha `origin` GitHub + deploy Vercel — dopo la riscrittura
   serve `git push --force-with-lease` (solo se il Director accetta il force-push
   sul repo pubblico) e re-deploy pulito. MW: no remote, solo locale.
4. **Altri clone**: nessun clone locale noto dopo la rimozione worktree
   (verificare `find ~ -name .git -type f` prima del run).

## Metodo (dry-run prima, SEMPRE)

```bash
git clone --mirror <repo> backup.git
cd <repo>
git filter-repo --analyze           # report: cosa pesa nella history
git filter-repo --strip-blobs-bigger-than 10M   # candidato default
# alternativa chirurgica: --path out/medallion-edit/pylib --invert-paths ecc.
git gc --prune=now --aggressive
```

- Soglia proposta: blob >10MB fuori `public/assets/**` correnti (l'HDR 4K e
  asset di gioco servono ancora → la lista dei path da strippare si decide
  dal report `--analyze`, non a priori).
- `filter-repo` rimuove automaticamente remote/origin refs → re-add `origin`
  + push --force-with-lease su approvazione.
- Stima recupero: RPG ~4-6G, MW ~2-3G (da misurare post-analyze).

## Contratto di chiusura

- OB-1: mirror backup esistente e `git fsck` pulito su entrambi.
- OB-2: du `.git` prima/dopo registrato in `test-results/cleanup/evidence.md`.
- OB-3: `npm run build:check` + `closure:lint` verdi su RPG post-rewrite;
  MW: `pytest`/`ruff` smoke sui test del progetto.
- Human-eye: report `filter-repo --analyze` + lista path strippati firmata
  dal Director prima del run reale.
