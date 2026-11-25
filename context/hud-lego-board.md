# HUD LEGO board — procedura operativa (PLAN-134 / R-384)

Scope: `/hud-lab` contiene una board di ruling per gli **art piece** di `src/config/hud/pieces.json`. La board è uno strumento decisionale, non una superficie di produzione e non un editor canonico.

## Modello mentale

- **Pezzo rulingable**: entry valida secondo `pieceSchema.ts`, con id immutabile `<slug>-vN`.
- **Baseline**: derivata dallo status canonico (`baptized→approved`, `candidate→undecided`, `retired→rejected`). È solo display e non entra mai nell'export.
- **Ruling touched**: decisione esplicita del Director in memoria. Solo queste decisioni entrano nel packet.
- **Unresolved**: asset/entry non riconciliati con il registry. Sono visibili nella lane dedicata ma non hanno controlli di ruling.
- **Control pattern**: composizioni osservate (tab, scroll band, righe, controlli). In v1 sono audit read-only, non oggetti canonici.

`inventoryRev` è SHA-256 della serializzazione canonica di: pezzi validi (`id/kind/status`), mapping Lab→piece, classificazioni unresolved, inclusi i difetti di schema del registry. Qualunque cambio a questi input invalida i packet già esportati.

## Difetto registry noto: `time-disc-v1`

`time-disc-v1` è battezzato nel lavoro parallelo sul tempo ma non valida contro lo schema PLAN-130 corrente: usa `assets.sun`/`assets.moon` e `provenance.sha256_sun`/`sha256_moon` invece di `assets.master` + `provenance.sha256`. Decisione PLAN-134 (2026-11-25): la board **non** estende lo schema al multi-asset e **non** riscrive/splitta il pezzo dentro questo plan, perché entrambe sono mutazioni canoniche fuori scope. La voce resta quindi nella lane unresolved come inventory defect non-rulingable; una canonizzazione futura richiede ruling/plan dedicato (split in revisioni immutabili oppure amend esplicito dello schema multi-asset).

## Uso della board

1. Aprire `/hud-lab` sul dev server canonico.
2. Filtrare per kind, stato canonico o stato review.
3. Copiare l'id stabile dal pulsante sulla card quando serve citare un pezzo.
4. Per ogni pezzo: `approve`, `reject` oppure `reset` per tornare alla baseline.
5. Un reject richiede sempre motivo; se il motivo è `other`, serve una nota non vuota. Il campo constraint è opzionale e deve esprimere una condizione riutilizzabile.
6. Prima di chiudere o ricaricare, esportare il JSON. La selezione è solo in memoria e il warning persistente in testa alla board lo ricorda.

## Export ruling packet v1

Il packet JSON contiene solo decisioni touched:

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO date",
  "inventoryRev": "64 hex chars",
  "decisions": [
    {
      "entityType": "piece",
      "id": "piece-id-v1",
      "decision": "approved",
      "previousStatus": "candidate",
      "decidedAt": "ISO date"
    }
  ]
}
```

Campi opzionali per reject: `reason`, `note`, `constraint`. Il riepilogo Markdown mostrato accanto al JSON deriva dallo stesso oggetto e non è una seconda fonte di verità.

## Procedura di apply successiva

La board non scrive canon. Una apply futura deve essere un task separato e usare `preflightRulingPacket` prima di toccare `pieces.json`:

1. caricare il packet esportato;
2. validare schema v1;
3. ricalcolare `inventoryRev` sull'inventory corrente;
4. esito `stale` → stop, ribasare/chiarire il packet;
5. esito `conflict` → stop, risolvere ID/status divergenti;
6. esito `invalid` → stop, packet non conforme;
7. esito `applicable` → applicare solo le transizioni previste con test e provenance:
   - `candidate + approved → baptized`;
   - `candidate + rejected → retired`;
   - `baptized + approved → no-op`;
   - `baptized + rejected → retired`;
   - `retired + rejected → no-op`;
   - `retired + approved → conflict` (un id ritirato non si revive; creare una nuova revisione).

La apply deve essere committata come mutazione canonica separata, con ruling/provenance e safeguard completi. L'export inline non è mai una apply.

## Verifica permanente

- Audit: `npx tsx scripts/build-hud-lego-audit.ts --check`
- Unit/DOM: `npm run test -- tests/unit/idleVillage/hudLegoBoardInventory.test.ts tests/unit/idleVillage/hudLegoBoardReview.test.ts tests/unit/idleVillage/hudLegoBoard.test.tsx`
- Witness headless: `node scripts/hud-lab-lego-witness.mjs`
