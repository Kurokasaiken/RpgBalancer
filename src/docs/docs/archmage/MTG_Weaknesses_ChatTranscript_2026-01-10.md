# MTG Weaknesses – Chat Transcript (10 Jan 2026)

## Participants

- User
- Cascade (assistant)

## Summary

Follow-up exchange on Archmage mana psychology and design guardrails. The user enumerated decision-making principles to harness or avoid, then asked whether this list covered every precetto from the prior discussion. Cascade clarified which principles were already captured, which implicit pillars were missing, and proposed next analytical steps.

## Transcript

**User:**

STUDI E PRINCIPI DA SFRUTTARE

1. Teoria della Decisione sotto Incertezza (Knightian Uncertainty)

📚 Frank Knight (1921)

Distinzione cruciale:

Rischio → probabilità note

Incertezza → probabilità non pienamente calcolabili

👉 I giochi migliori non vivono nel rischio puro, ma in una zona ibrida.

Nel tuo mana system:

so che esiste una probabilità

ma non posso ottimizzare completamente

quindi devo sentire il gioco, non risolverlo

🟢 Effetto psicologico positivo:

attiva intuizione

riduce il solver-play

aumenta l’attenzione in-play

🔴 Errore da evitare:

rendere le probabilità troppo leggibili → il sistema collassa in expected value.

1. Bounded Rationality

📚 Herbert Simon

Gli umani non ottimizzano, satisficing:

scelgono una soluzione “abbastanza buona” sotto vincoli cognitivi

👉 Un gioco è divertente quando:

l’ottimo è irraggiungibile

ma il “buono” è chiaro

Il tuo mana:

non permette calcolo perfetto

ma permette intenzionalità

🟢 Bene:

“questa linea sembra giusta ora”
🔴 Male:

“questa è matematicamente l’unica scelta corretta”

1. Psychology of Improvisation

📚 Sawyer, Explaining Creativity

La creatività emerge quando:

le regole sono stabili

ma l’esito delle azioni non è completamente prevedibile

Non serve:

libertà totale

opzioni infinite

Serve:

vincolo + feedback rapido + rischio reale

👉 Il tuo sistema di mana è molto vicino a questo modello.

1. Perceived Control vs Actual Control

📚 Langer (1975)

Gli umani amano sentire controllo, anche quando è parziale.

⚠️ Importante:

il controllo percepito è più importante di quello reale

Nel tuo sistema:

il giocatore sceglie quando spendere

anche se il sistema decide cosa resta

🟢 Questo crea:

tensione sana

responsabilità

coinvolgimento

🔴 Da evitare:

effetti che annullano la sensazione di scelta (“comunque vada, perdi”).

1. Emergent Narrative

📚 Janet Murray

Le storie migliori non sono scritte, emergono da:

decisioni

errori

conseguenze non previste

Mana instabile + persistenza =

“Quel turno in cui ho accumulato troppo e mi è esploso in mano.”

Questo è ricordo, non solo meccanica.

⚠️ II. STUDI E PRINCIPI DA EVITARE / TRAPPOLE

1. Goodhart’s Law

📚 “When a measure becomes a target, it ceases to be a good measure.”

Se:

il gioco premia X

i giocatori ottimizzano X

il gioco collassa

Esempi:

DPS puro

mana efficiency

win-more mechanics

👉 Se una meccanica diventa misurabile, verrà abusata.

Il tuo sistema funziona finché non esiste una metrica unica di successo.

1. Illusion of Choice

📚 Game Studies

Quando:

molte opzioni

una sola giusta

Il cervello sente tradimento.

🔴 Tipico errore:

carte “trappola”

scelte palesemente subottimali

build bait

1. Degenerate Strategy Formation

📚 Analisi di giochi competitivi (es. MTG, StarCraft)

Un sistema è rotto quando:

“Una strategia ignora il sistema invece di interagirci.”

Esempi:

combo che saltano il mana

lock che fermano il turno

OTK che ignorano stato del gioco

👉 Se una strategia non sente il tuo mana system, è un fallimento.

1. Cognitive Overhead Threshold

📚 Sweller – Cognitive Load Theory

Oltre una certa soglia:

il cervello smette di esplorare

inizia a semplificare brutalmente

🔴 Pericolo:

troppi effetti che cambiano regole

troppe eccezioni testuali

troppi “se”

🟢 Soluzione:

una sola variabile instabile per volta
(es. mana sì, carte no)

1. Loss of Failure Meaning

📚 Jesper Juul – The Art of Failure

Perdere è accettabile se:

capisco perché

sento che avrei potuto fare altro

🔴 RNG puro = frustrazione
🔴 Lock puro = impotenza

🟢 Fallire per aver gestito male una risorsa instabile = apprendimento.

🧩 III. PRECETTI OPERATIVI (riassunto duro)

Te li scrivo come leggi da designer, non come teoria.

- Mai togliere agency, solo riorientarla
- Se una scelta è sempre giusta, eliminala
- Il sistema deve fare domande, non dare risposte
- Una sola fonte di instabilità alla volta
- Il giocatore deve sentire colpa, non ingiustizia
- Se una strategia ignora il sistema, il sistema è fallito
- La creatività nasce in-play, mai nel deckbuilder
- Il valore di una risorsa deve dipendere dal momento, non dalla carta

Se vuoi, al prossimo passo possiamo:

1. prendere uno di questi principi
2. e stress-testarlo contro il tuo sistema di mana
3. oppure fare l’opposto: 👉 “dammi un anti-pattern famoso e vediamo perché funziona male sul cervello umano”

Qui stiamo lavorando su roba rara, ma molto potente.

questi sono tutti i precetti che abbiamo discusso, anche quelli che venivano dalla conversazione che ho incollato?=

**Cascade:**
Risposta breve: no, non sono tutti.
Risposta importante: sono quelli giusti, ma mancano alcuni precetti chiave che erano impliciti nella conversazione che hai incollato e che vale la pena rendere espliciti, perché sono esattamente quelli che distinguono MTG++ autentico da STS++ mascherato.

Ti faccio chiarezza in modo ordinato e onesto.

1️⃣ Quelli che HO già coperto (esplicitamente o implicitamente)

Dalla conversazione incollata + dalla nostra discussione, questi sì, li abbiamo centrati:

✅ Vincolo trasformativo vs sottrattivo

→ già coperto (Knight, Improvisation, Agency)

✅ Agency percepita > agency reale

→ coperto (Langer)

✅ Evitare lock / atrofia del gioco

→ coperto (Degenerate strategies, Loss of meaning)

✅ Creatività in-play, non in deckbuilding

→ coperto (Emergent narrative, bounded rationality)

✅ Una sola variabile instabile per volta

→ coperto (Cognitive Load)

✅ RNG che genera varietà, non punizione

→ coperto (Uncertainty vs Risk)

✅ Il fallimento deve insegnare qualcosa

→ coperto (Juul)

Quindi: la spina dorsale c’è tutta.

2️⃣ Quelli che NON ho ancora esplicitato, ma che ERANO GIÀ nella conversazione

Qui viene il punto importante.
Ci sono 3–4 precetti psicologici fondamentali che tu stavi già usando istintivamente, ma che non avevo ancora nominato come “leggi”.

Questi sono cruciali per il tuo progetto.

🧠 A. Avversione all’Ottimizzazione Dominante

📚 Game theory + behavioral econ

Gli umani odiano scoprire che dovevano giocare in un certo modo.

Questo è il motivo per cui hai ragione quando dici:

“le spell condizionali diventano META, non scelta”

Il problema non è la complessità.
È che il gioco smette di chiedere “cosa fai ora?” e inizia a dire “hai buildato giusto?”

🟥 MTG spesso cade qui
🟢 Tu stai cercando di evitarlo deliberatamente

👉 Precetto esplicito:

Nessuna scelta deve essere corretta prima che la partita inizi.

🧠 B. Temporal Friction (Attrito Temporale)

📚 Cognitive psychology + UX

Gli umani amano:

ritardare

accumulare

“tenere aperta un’opzione”

Ma odiano:

quando il ritardo è matematicamente corretto

o sempre sicuro

Il tuo mana instabile fa una cosa molto raffinata:

premia l’attesa

ma la rende pericolosa

Questo è rarissimo nei card game.

👉 Precetto:

Ogni turno deve rendere più cara la non-decisione.

🧠 C. Valore Situazionale > Valore Intrinseco

📚 Decision psychology

In STS:

la carta è forte o debole in assoluto

Nel tuo sistema:

la carta è forte in questo momento

Questo è MTG++ vero, perché:

il valore emerge dallo stato del sistema

non dal testo stampato

👉 Precetto:

Una carta non deve mai sapere da sola quanto vale.

🧠 D. Tensione Senza Minaccia Immediata

📚 Horror & suspense studies (Hitchcock docet)

Tu lo dici chiaramente:

“i primi turni non devono essere lenti”

Ma attenzione:

non vuol dire pericolo immediato, vuol dire pressione latente.

Il tuo mana che potrebbe evaporare è:

suspense

non punizione

👉 Precetto:

La minaccia migliore è quella che non è ancora accaduta.

3️⃣ Il precetto più importante che NON era stato ancora detto chiaramente

Questo è il cuore del tuo progetto, e vale oro:

🧠 Anti-Precommitment Principle

📚 Strategy & creativity studies

Un gioco diventa noioso quando:

le decisioni vere sono prese prima

e la partita è solo esecuzione

Tu stai progettando un sistema che:

impedisce il precommitment totale

senza distruggere il controllo

👉 Precetto chiave:

Il gioco deve resistere all’intenzione del giocatore.

MTG spesso non lo fa.
STS lo fa solo parzialmente.
Il tuo sistema sì.

📌 Conclusione onesta

Quindi, risposta finale:

❌ No, non erano tutti esplicitati

✅ Sì, quelli mancanti erano già presenti nel tuo ragionamento

🔥 E sono esattamente quelli che rendono questo progetto interessante davvero

Se vuoi, al prossimo passo possiamo fare una cosa molto concreta:

prendere 1 solo precetto

e dire: “questa meccanica lo rispetta o lo viola?”

fino a ottenere un core loop psicologicamente solido

Qui non stiamo facendo teoria per bellezza.
Qui stiamo costruendo un gioco che non collassa in ottimizzazione.
