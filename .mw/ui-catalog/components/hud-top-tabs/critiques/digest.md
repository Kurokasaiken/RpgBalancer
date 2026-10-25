# Digest critiche — hud-top-tabs (round 1, 3/3 image-grounded)

Provider: chatgpt, claude, deepseek — tutti `provider_capable`
(canary-image riecheggiata + observed_facts concreti e corretti sugli
shot del componente; nessun fallback text-only).

## Convergenza forte (tutti e 3)

1. **Le tre placche non leggono come un unico oggetto fisico** — la
   separazione produce "dashboard mascherato", non "attrezzeria appesa".
   Manca la sospensione fisica (chiodi/catene/cerniere/ombra portata) —
   chatgpt: "la cornice ha più autorità del contenuto"; deepseek:
   "dovrebbero essere un unico scrigno"; claude: "sembrano pannelli
   ancorati al bordo con un bel bordo".
2. **Il dato FOOD è una stringa da database** — `2 /20 −6/d · 0 d left`
   senza gerarchia interna (valore / consumo / giorni). Il bordo
   danger è un outline piatto invece di un'incisione/stato materico.
3. **I bottoni velocità sono app-like** — pill arrotondati piatti con
   glow circolare sull'attivo invece di ottone inciso + riflesso.
4. **Scala di stati mancante** — `0 d left` è terminale e dovrebbe
   passare a ferro freddo (rubrica L1) — sequenza
   neutral→warning→danger→terminale deve cambiare *materia*, non tinta.
5. **Glifi piatti** — icone sovrapposte, non incise.

## Disaccordi / punti unici (preservati)

- **Tab evento assente**: deepseek lo considera un errore strutturale
  ("un buco nel cielo — placeholder placca vuota"); claude accetta il
  centro vuoto per contratto ma chiede l'allineamento della baseline
  dichiarato; chatgpt non lo solleva.
- **Emblema circolare nel tab tempo**: solo claude — affordance ambigua
  (occhio/mirino), "o indicatore reale di fase giorno o va via".
- **Densità/target**: solo claude — tasti velocità ~30px, problema touch
  su mobile-fit 390×844 (PLAN-083).
- **DAY label**: solo claude — gerarchia sbilanciata, il numerale può
  respirare di più.

## Proposte (parallele)

- **P-structural dominante** — unificare il cluster: cornice unica con
  scomparti (deepseek "Cornice del Tempo"), oppure catene/ganci in
  ottone che rendono le placche fisicamente appese (deepseek "Velo del
  Cielo", claude "brace/appeso").
- **P-restyle** — stato FOOD materico a gradini: incavo → brace ambra →
  sigillo cera → ferro freddo (claude "Brace sotto la lacca", deepseek
  "Sigillo del Cibo"); bottoni velocità = placche ottone incise.

## Note grounding

- canary (forma+colore) riecheggiata da tutti; observed_facts tutti
  corretti e specifici (bordo salmon FOOD, ×1 glow, DAY 2, cielo fra
  placche) — quorum image-grounded 3/3 per OB-3.
- grok/gemini fuori quorum: text_only / affordance assente (documentato
  in image-probe-results.jsonl — NON contano per OB-3).


## Apprendimenti dal round libero (prompt verbatim Director)

- FOOD chip instabile: larghezza ~3× delle altre → min-width fissa.
- "0 d left" → testo di stato ("Carestia"); transizione critica = pausa
  + CTA verso fonti di cibo (problema→soluzione).
- Etichette GOLD/FOOD/WOOD ridondanti con glifi → spazio al tasso.
- Label ~10-12px sotto soglia → corpo dati chiave più grande.
- Tab evento centrale richiesto dal Director (terzo tab = stabilità
  compositiva, non errore): la critica "buco nel cielo" di deepseek
  era allineata al gusto del Director, non al contratto — contratto
  amendato (renders null → placca sempre presente con stato vuoto).
