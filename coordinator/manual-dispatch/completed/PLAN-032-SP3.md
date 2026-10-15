# Manual Task: PLAN-032-SP3

## Title
Mercante (schermata mock) + marker gated Director — PLAN-032 SP-3

## Description
Implementare SP-3 di PLAN-032 secondo la spec vincolante
`plans/PLAN-032-SP-3-merchant-panel.md` (artifact r003, sha256
`7497a638f6e469742adf296ecaea1ae5d47a466c9c58904ff87dd19986b29a65`).

Invariante: nessuna interazione nel pannello muta stato di gioco o
persistenza. Pezzi:
- `merchantConfig.ts` (Zod, offers 3-4, deep-frozen, countdownLabelKey
  qualitativa senza pattern orario)
- `MerchantPanel.tsx` (HudPlaque, ul/li, priceLine ICU, Preview badge reale)
- `MockBuyControl.tsx` (button disabled nativo, zero prop callback,
  label-in-name + tooltip + caption aria-describedby)
- `merchantOfferIcons.tsx` (mappa icone offerta → engraved)
- Marker `building-merchant` gated da Director action `merchantmarker`
  (default OFF, convenzione poiDemo); `poiToPanel` += merchant
- Focus return: stessa regola generica SP-2 (opener → panels-trigger),
  nessun secondo focus manager
- i18n `gameFrame.merchant.*` en+it; isolation test AST import-graph
  (merchant-owned ⊆ allowlist, fail-closed, no barrel re-export di
  merchantConfig)

## Out of scope
MarketEngine, economia, acquisti, stock, persistenza, Esc handling.

## Timestamp
Dispatched 2026-10-14T15:00:00Z

## Executor
manual (Devin session)
