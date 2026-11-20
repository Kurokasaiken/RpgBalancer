# Idee salvate — cassetto spedizione (expedition-ui)

Idee che il Director non ha escluso ma che **oggi non devono comparire** nel cassetto. Non sono requisiti.

## cost-preview — costo in cibo del viaggio
- **Detto (verbatim, 2026-11-17):** *«cost non ho mai detto che esiste in questo componente, non escluso possa esistere in futuro, salva questa idea, aggiungila alla documentazione, ma attualmente non deve esserci.»*
- **Cos'era:** cella `cassetto-cost-slot` (PLAN-119 T3-S2, INV-5 di `hud-real-cassetto`): cibo consumato dal party durante il viaggio = membri × giorni totali × `foodConsumptionPerResidentPerDay` (`expeditionFoodCost`), tono danger se la scorta viva non basta. Veniva dal documento artifact-r004 («consequence preview»), non da una richiesta del Director.
- **Stato:** non renderizzata in `HudRealCassetto`; `quest.costPreview` resta come campo opzionale nel tipo (non letto); `HudRealCassettoDetail` e l'host lab non lo calcolano più. Il bottom sheet (≤1100 px) conserva ancora la sua cella segnaposto vuota (non toccata).
- **Se tornasse:** probabile casa = blocco SUPPLIES o Detail dei viveri («Food · N»), mai tra Risk e Rewards; da decidere col Director.

## ghiera-draghi — drago al centro dello slot (ARCHIVIATO, non scartato)
- **Detto (2026-11-17):** *«il drago al centro degli slot è bello, salviamolo e teniamolo da parte, ma un simbolo al secondo del tipo slot è meglio.»*
- **Dove vive:** asset `public/assets/ui/hud-real/ghiera-draghi.webp` (fascia con disco e drago) e preset `draghi` in `SlotV12Renderer.tsx` — **intatti**. Il cassetto usa il nuovo preset `draghiGlifo` (stessa ghiera, disco ripulito: `ghiera-draghi-clean.webp`) con il glifo del ruolo (`SLOT_ROLE_GLYPHS`).
