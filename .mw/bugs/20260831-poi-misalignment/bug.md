# POI misalignment in ReminderComponentV2

## Description
The POI medallion in `ReminderComponentV2` appears visually misaligned with its magic circle / surrounding frame. The center of the POI does not coincide with the perceived center of the card.

## Reproduction
1. Open `/primitives`.
2. Switch to the `Reminder V2` tab.
3. Observe the POI medallion on the left side.

## Expected
The POI should sit centered in the left area, with the magic circle concentric to the medallion, and the bottom gem aligned to the vertical center.

## Actual
The POI appears shifted or the magic circle not concentric with the medallion body.

## Affected files
- `src/ui/idleVillage/components/ReminderComponentV2.tsx`
- `src/ui/idleVillage/components/poi/PoiMatericV3_5.tsx`
- `src/balancing/config/idleVillage/poiMatericV4Tokens.ts`

## Notes
- Possibly caused by the `poiv3_5__gem` absolutely positioned at `left: 50%`, `bottom: -14px` which assumes a specific wrapper size.
- The `ReminderComponentV2` scales the POI via `v2.poiScale` and uses a flex/absolute layout; the gem may bleed or shift the perceived center.
