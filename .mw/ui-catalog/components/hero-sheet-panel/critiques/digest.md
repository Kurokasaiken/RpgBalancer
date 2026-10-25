# Digest critiche — hero-sheet-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-hero-sheet-panel`,
turn T-001, prompt verbatim R-282, 3 shot allegati
(default-ctx-a, default-ctx-b, default-iso-0).

**Provider failure dichiarato:** chatgpt — `ATTACH_FAILED` ("no upload
affordance found"); fallimento sistematico account Free (quota upload
immagini plausibilmente esaurita). Vedi `chatgpt.md`.

Convergenza effettiva = **2/2 provider image-grounded** (claude + deepseek;
fatti osservati corretti: nome "GIGGIOLILLO", "HERO ASSASSIN", "AVAILABLE",
barre HP/STA, tripartizione OFFENSE/DEFENSE/UTILITY, roster laterale).

## Convergenza forte (2/2)

1. **Gerarchia piatta / muro di testo.** Tutto è oro, tutto ha lo stesso
   peso; nessun punto d'ingresso.
   - claude: «Nome, "AVAILABLE", intestazioni di sezione, valori e
     pulsanti hanno lo stesso colore e quasi la stessa taglia. L'occhio
     non ha un punto d'ingresso.»
   - deepseek: «"HP" e "STA" sono uguali in peso visivo a "Evasion" o
     "Agility". Il giocatore deve leggere ogni riga.»
2. **Sistema di icone rotto / incoerente.**
   - claude: «Accuracy e Crit Chance usano la stessa stella. Agility ha
     un puntino al posto dell'icona… Crit Mult. e Move Speed non hanno
     icona… le label nella colonna destra partono da x diverse e la
     griglia sembra "tremare".»
   - deepseek: «Accuracy (30) e Crit Chance (12%)… entrambi hanno la
     stessa icona (una stella). "Damage" ha un'icona a forma di "X" che
     sembra un pulsante di chiusura o un errore.»
3. **Testo troppo piccolo / contrasto.**
   - claude: «label delle stat… attorno agli 11-12 px… sotto il
     riferimento XAG (18 px a 1080p) e vicino al minimo Deck (9 px a
     1280×800); il grigio-azzurro su teal scuro va misurato contro 4.5:1.»
   - deepseek: «font troppo piccola per le risoluzioni moderne… la
     palette oro su blu scuro ha un contrasto insufficiente per le
     etichette secondarie.»
4. **Affordance/controlli ambigui.**
   - claude: «Frecce e pin sono quadrati arrotondati, la X è un cerchio.
     Il pin non comunica il suo stato… la X è l'elemento più forte
     dell'header e batte il nome dell'eroe.»
   - deepseek: «I pulsanti + e > in alto a destra sono ambigui… i pulsanti
     di azione devono essere visivamente distinti dalle icone di
     navigazione.»
5. **Barre HP/STA indistinte.**
   - claude: «Due barre gialle piene, distinguibili solo dalla sigla. Nel
     roster HP è verde e STA è oro: la stessa informazione ha due codici
     colore.» → HP rosso/verde, STA altro colore, numeri dentro.
   - deepseek: «barre grandi e colorate (Rosso per HP, Giallo per STA).»
6. **Manca dati/azioni che il gioco conosce.**
   - claude: «Il livello (Lv 4) è nel roster ma non qui. Non ci sono XP,
     breakdown, delta, né azioni… un pannello senza call-to-action è un
     cul-de-sac.» + zero feedback di stato (fame a 0 non mostrata).
   - deepseek: «sfrutta lo spazio vuoto a sinistra del ritratto… costo in
     risorse o equipaggiamento attuale.»

## Disaccordi / punti di un solo provider (verbatim)

- **Emoji come icone** — deepseek propone «🎯 per Precisione, 💥 per
  Critico, 🛡️ per Evasione, ⚡ per Velocità». claude propone invece un
  registro `STATS` con `icon: IconName` + test di unicità — niente emoji.
  (Nota: emoji in UI violano l'art direction dichiarata — "niente emoji"
  citato da claude nel rerun di hud-corner.)
- **Direzione colore HP/STA** — claude: hp `#6fbf5a` verde / sta `#4fb3d9`
  azzurro (coerente col roster); deepseek: hp rosso `#d9534f` / sta giallo
  `#f0ad4e`. Palette diverse, stessa richiesta (differenziare).
- **Solo claude**: difetti di contesto — «il pannello copre un marker
  sulla mappa», «roster dice 6/6 ma mostra 4 eroi», «dropdown di
  ordinamento troncato a ":"», «"×2,1" vs "×2.1": due code path di
  formattazione», condizioni (affamato/ferito) assenti, XP/CTA
  "Assegna a quest", ghost bar sul danno, container query 2 colonne.
- **Solo deepseek**: tab "Combattimento"/"Utility" per ridurre il
  disordine; pulse sulla barra HP bassa; sfondo grigio scuro neutro
  `#1a1e24` invece del teal.
- **Verdetto** — claude: «il chrome è coerente… Il contenuto è un dump di
  stat… il giocatore legge, ma non decide.» deepseek: «"manoscritto"
  bellissimo ma illeggibile… interfaccia decorativa dove l'estetica ha
  preso il sopravvento.»

## Note

- claude ha assunto correttamente React+TS e citato fonti (XAG, Steam
  Deck, GAG 4.5:1, forum Beamdog, Owlcat). deepseek ha prodotto HTML/CSS
  generico con emoji — riuso parziale.
- Entrambi concordano su "cosa salvare": cornice oro, tripartizione,
  ritratto come ancora.
