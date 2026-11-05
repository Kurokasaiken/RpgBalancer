# Decisioni aperte per il Director (PLAN-110, 2026-11-04)

Stato in breve: 12 componenti costruiti e montati in `/hud-compose` (C1–C12), colore ricalibrato, stress, interazione, italiano e inglese verificati. Verdetto d'insieme: **da ritoccare** (`REVIEW-REPORT.md`). Nessun componente è `verified`. Le voci sotto bloccano il passo successivo; per ognuna c'è la mia raccomandazione, ma la scelta è tua.

| # | Decisione | Opzioni | Raccomandazione | Costo |
|---|---|---|---|---|
| 1 | **Cimiero del roster** (oggi provvisorio: fenice MT-001) | fenice / calice / occhio / arcana / corona / drago (`/hud-library`) | quello che hai già sentito più "tuo"; se nessuno, tieni la fenice | 0 immagini (swap con `build-band-assets.py --crest`) |
| 2 | **Stella a quattro punte ripetuta** (marchio, bussola, astrolabio, scudo Voce, roster) | tenerla solo su astrolabio e bussola e cambiare simbolo su marchio e Voce / lasciare tutto | cambiare marchio e Voce (libreria motivi) | 1–3 immagini |
| 3 | **Gerarchia di peso**: sempre accesi vs per evento | a riposo solo risorse, nav, roster, tempo; Voce, sigillo, pannello per evento / tutto sempre | la prima | 0 immagini, ~2 h codice |
| 4 | **Azione del globo** (C6) | mondo/mappa overview / diario / nessuna (rimuoverlo) | rimuoverlo o assegnare "mappa del mondo" solo se esiste la funzione | 0 |
| 5 | **Piastrina della bussola** (D-5): cosa mostra | coordinate + fase del giorno (oggi) / solo fase / altro | coordinate + fase | 0 |
| 6 | **Consumo del cibo** a vista (`−6/d · 0 d left` in `/game`) | nel chip / solo nel tooltip | nel chip, in forma breve e con il pericolo in evidenza | 0, ~30 min |
| 7 | **Posizione dei comandi tondi** (menu, pannelli, nascondi) | in basso a destra come `/game` / in alto al centro | basso a destra, spostando il globo | 0 |
| 8 | **Icone della nav**: glifi generici oggi | icone incise oro dalla libreria / rigenerare il dock a 4 tondi | icone incise oro (2 tondi esterni vuoti restano, o rigenera) | 0–4 immagini |
| 9 | **Smalto di risorse e sigillo** ancora poco saturo (C 14–16, obiettivo 22–26) | ritoccare per zona / rigenerare / accettare | accettare finché non si vede dal vivo | 0–2 immagini |
| 10 | **Esclusione del lint** su `src/ui/idleVillage/hudReal` (pattern di ignore del progetto) | includere / lasciare | includere | 0 |
| 11 | **Mappa**: la HUD sembra più bella sulla mappa nuova (mappa2) che su quella di `/game` | confermare che la nuova HUD va con la mappa nuova | — | — |

## Cosa serve ancora prima di dichiarare `verified`
Zone di mappa mare e giungla e prima/dopo vero contro `/game` (servono `/game` con la HUD nuova o un parametro di posizione della mappa in `/hud-compose`); hover del globo e del sigillo a vista; collegare i componenti ai dati reali dove sono di esempio (pannello, Voce, sigillo, bussola, tempo). Dopo, la **fase 2** (layout dei componenti reali + linguaggio di skin, `LINGUAGGIO-v2.md` §10).

## Dove guardare
`/hud-compose` (insieme), `/hud-compose?stress` (contenuti estremi), `/hud-library` (motivi), `REVIEW-REPORT.md` (misure, verdetti, costi), `LINGUAGGIO-v2.md` (regole e trappole), `DECISIONS.md` (cronologia delle scelte).
