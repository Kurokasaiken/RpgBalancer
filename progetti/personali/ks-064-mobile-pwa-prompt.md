| KS-064 Mobile PWA Accessibility Fix | Non assegnato | - | - | - | ```text
AGENT: ChatGPT Codex 5.1
OBIETTIVO: Risolvere accessibilità mobile PWA: aggiornare manifest scope, title, icons, e screenshots per rendere l'app installabile e navigabile da mobile.
FILE TARGET: public/manifest.webmanifest, index.html, public/assets/icons/app/ (creare se mancanti), public/assets/screenshots/ (creare se mancanti)
DIPENDENZE: -
OPERAZIONI DA ESEGUIRE:
  1. Analizzare configurazione PWA attuale e identificare problemi mobile
  2. Aggiornare manifest.webmanifest:
     - Cambiare scope da "/punch-club" a "/" per coprire tutta l'app
     - Aggiornare name/short_name/description per "RPG Balancer - Idle Village Sandbox"
     - Verificare e aggiornare icon paths per mobile (192x192, 512x512, maskable)
     - Aggiornare screenshots per mobile sandbox
  3. Aggiornare index.html:
     - Cambiare title da "progetti-personali" a "RPG Balancer - Idle Village Sandbox"
     - Aggiungere meta tags PWA mancanti (theme-color, apple-mobile-web-app-capable)
     - Verificare viewport e manifest link
  4. Creare/aggiornare icon PNG per mobile se mancanti:
     - Icon-192.png e icon-512.png con design Gilded Observatory
     - Maskable versions per iOS
  5. Creare screenshot mobile sandbox se mancante
  6. Testare PWA installabilità su mobile browser
  7. Verificare che Punch Club sia ancora accessibile come sub-route
OPERAZIONI VIETATE:
  - Non rimuovere funzionalità Punch Club esistenti
  - Non modificare logica core dell'app, solo configurazione PWA
  - Non hardcodare valori nei componenti, usare sempre manifest/meta
ASSUNZIONI:
  - L'app deve essere installabile come PWA completa da mobile
  - Punch Club deve rimanere accessibile come sub-route /punch-club
  - Design icons deve seguire tema Gilded Observatory
  - Screenshots devono mostrare UI mobile reale
KANBAN SAFETY:
  - **GUIDELINES OBBLIGATORIE**: Segui `docs/coordinator/agent_execution_guidelines.md` per lock, safeguard suite, evidence collection, e completamento Kanban.
  - Prima di iniziare, esegui `npm run prompt:check -- KS-064` per verifica disponibilità.
  - Dopo completamento, esegui safeguard suite (test + build + lint) e aggiorna Kanban secondo le guidelines.
OUTPUT ATTESI:
  - Segui safeguard suite da `agent_execution_guidelines.md` (test + build + lint)
  - Evidence log in `test-results/` secondo le guidelines
  - Report finale con lock, safeguard, e Kanban update evidence
DOCUMENTAZIONE DA AGGIORNARE:
  - README.md (sezione PWA/mobile)
  - docs/strategy/punch_club_playtest.md (se necessario)
  - agent_assignments.md (stato KS-064)
REGRESSION SAFEGUARDS:
  - `npm run lint`
  - `npm run build:check`
  - `npm run test:e2e` (subset mobile se esistente)
  - Se qualsiasi safeguard fallisce, fermati e segnala il blocco nel Kanban.
NOTE:
  - Priorità alta: questo blocca accessibilità mobile dell'intero progetto
  - Verificare che il dev server sia esposto su rete locale per test mobile
  - Documentare passaggi per test PWA installazione su Android/iOS
``` |
| KS-001 Placeholder 2 | Non assegnato | - | - | (blocco template) |
| KS-002 Placeholder 3 | Non assegnato | - | - | (blocco template) |
