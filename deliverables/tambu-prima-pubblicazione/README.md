# Dossier candidatura — Tambù Digital «Prima Pubblicazione»

**Gioco:** Wanderlust: Triumph · **Scadenza:** 21 dicembre 2026, ore 12:00
**Form:** https://www.tambudigital.com/it/prima-pubblicazione/candidatura

| Cartella | Contenuto | Formati |
|---|---|---|
| `01_Project_Description/` | Descrizione progetto (1.897/2.000 car.) | md · docx · pdf |
| `02_GDD_Summary/` | Sintesi GDD (3/5 pagine) | md · docx · pdf |
| `03_Team_and_CV/` | Team + CV del referente | md · docx · pdf |
| `04_Financial_Overview/` | Prospetto economico | md · docx · pdf |
| `05_Production_Plan/` | Piano di produzione (1.478/2.000 car.) | md · docx · pdf |
| `06_Gameplay_Showcase/` | Scaletta video + materiali aggiuntivi | md · docx · pdf |
| `07_Screenshots/` | 6 screenshot JPEG ~1920px | jpg |
| `08_Application_Form_Data/` | Tutti i campi del form pre-compilati | md · docx · pdf |
| `09_Open_Questions/` | Dati mancanti e decisioni aperte | md · docx · pdf |
| `VERIFICA_FINALE.md` | Controllo limiti, coerenza, fatti/stime/ipotesi | md |

**Da fare a mano:** Dichiarazione di Partecipazione firmata digitalmente (PAdES/.p7m), video gameplay, riempimento `[DA CONFERMARE]`, invio.

**Rigenerare DOCX/PDF dopo modifiche ai .md:**
```bash
.mw/venv/bin/python /tmp/md2docs.py <file.md>          # html + docx
node scripts/_tmp-html2pdf.mjs <file.html>              # pdf
```

## ESITO — CANDIDATURA INVIATA

- **Data invio:** 2026-11-16
- **Protocollo:** `PP26-0006`
- **Application ID interno:** `7204c5b9-7f94-4d00-8be0-1878ee24731b`
- Flusso verificato via network log: `action:"start"` → 200 + signed upload URLs → upload Supabase → `action:"complete"` → `{"ok":true,"protocol":"PP26-0006"}`.
- Campo `Website` lasciato **vuoto**: è un honeypot anti-bot — compilarlo fa respingere il POST con HTTP 400 `{"error":"invalid"}`.
- Valori normalizzati rispetto alla prima bozza: telefono `+39 392 0044477`, città `Carpi`, motore senza punteggiatura speciale.
- Facoltativi omessi: video gameplay, cartella materiali extra, social/community, GDD completo, accordi di team.
- Nota: la Dichiarazione è firmata con certificato **self-signed** in formato .p7m CAdES — formato accettato dal form; se Tambù richiedesse firma qualificata, rifirmare via CieSign/SPID e contattare info@tambudigital.com.

## INTEGRAZIONE POST-INVIO (in preparazione)

- **BLOCCO Director (2026-11-16):** niente video automatizzato — il Director registrerà il suo video quando soddisfatto; social/email integrazione in pausa fino ad allora.
- `08_Application_Form_Data/email_integrazione_tambu.md` — bozza email pronta per quando il video esisterà.
