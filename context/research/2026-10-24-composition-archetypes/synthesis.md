# Synthesis — composition archetypes (broadcast 2026-10-23, 3/5 voci utili)

Fonti: gemini (ARCH-01..10 + 5 regole), grok (10 + 7 principi), deepseek (9 + 8
principi — la più rigorosa sui rischi parallax). chatgpt vuota, claude fallita.

## Tassonomia convergente (12 archetipi)

| ID | Nome | Provenienza | Regola geometrica | Mood | Shot |
|---|---|---|---|---|---|
| COULISSE | tunnel/coulisse pair | Lorrain + scenografia | masse scure a ENTRAMBI i bordi + lead diagonale | arrivo, scoperta | push-in, creep |
| SHOULDER | dirty foreground | cinema (Ipcress), Claude | UNA massa near 30-40% lato, resto aperto | intimo, voyerismo | creep |
| VISTA | open frame | Hudson River, western | zero occluder near, step mid + focale lontano | respiro, vastità | pan-lateral |
| CANOPY | overhang | Constable, romantici | massa dal bordo alto, sotto libero | soglia, protezione | hold, push-in |
| ARCH | frame-within-frame | proscenio, noir | cornice interna (arco/varco) col focale dentro | transizione, rivelazione | push-in |
| MONOLITH | hero landmark | key art, Elden Ring | struttura gigante centrale mid-ground | confronto, destino | push-in |
| CASCADE | diagonale scalare | Bibiena vue sur l'angle | lead entra da un angolo, step lungo la diagonale | viaggio, caccia | creep lungo asse |
| ISLAND | detail island | Hudson River | cluster scuro compatto in terzo basso, aria intorno | indizio, contemplazione | hold, push-in dal cluster |
| VOID | silhouette-void | poster/Struzan | silhouette piccola su campo luminoso vasto | mitico, pausa capitolo | hold |
| CHOKE | diagonal choke | Cullen serial vision | muro diagonale taglia 60% frame, varco stretto | soglia, tensione | pan verso reveal |
| GRID | lattice | Cullen, colonnati | elementi ripetuti con focale tra le maglie | rituale, processionale | pan (ritmo) |
| TABLEAUX | high-horizon | paraventi giapponesi, manga | orizzonte in alto/fuori, vista dall'alto a terrazze | sorveglianza, tattica | tilt/push-in verso il basso |

Regole rischio condivise: membri sottili (rami nudi, reticolati, ringhiere) =
smear garantito → solo masse solide o hold-only; masse near a basso contrasto
misbakano; VISTA/VOID senza near = warp sottile, usarli come punteggiatura.

## Regole anti-monotonia (convergenza delle 3 fonti)

1. **Mai archetipi adiacenti uguali**; ritorno "rimato" solo dopo ≥3 scene e
   con ≥2 manopole cambiate (lato, orizzonte, materiale, mossa).
2. **Ritmo chiuso/aperto**: chiusi (COULISSE/SHOULDER/CANOPY/ARCH/GRID) vs
   aperti (VISTA/VOID) vs ibridi (ISLAND/CASCADE) — mai 3 chiusi di fila; gli
   aperti sono punteggiatura (max 2-3 per atto, dopo i più claustrofobici).
3. **Rotazione bordo occluder**: sx → alto → dx → basso/isola → nessuno.
4. **Rotazione orizzonte**: ≤2 scene consecutive nella stessa banda
   (basso <33%, medio, alto >66%).
5. **Rotazione mossa camera** coerente con l'archetipo.
6. **Turno distanza focale**: near → far → mid tra scene consecutive.
7. **Escalation far-zone**: chiarezza del focale lontano cresce lungo l'atto.
8. **Flag lattice** allo stadio brief: GRID/rami nudi/ringhiere = risk-high
   dichiarato prima di generare, non dopo il bake.

## Mappa archetipi → scene goblin (proposta)

- tracce (v2 ok): COULISSE — già generato
- gola: COULISSE+CANOPY hybrid — già generato
- **agguato**: SHOULDER (imboscata = osservare da dietro copertura) o CHOKE
- **bottino**: TABLEAUX o ISLAND (fiction dice "avvistato solo dall'alto")
- **saccheggio**: ISLAND (fagotto = cluster nel terzo basso)
- **carro→fagotto nascosto**: ISLAND/CANOPY
- **assalto**: CASCADE (carica = diagonale d'azione)
- **fuga**: CASCADE esistente (canalone — retune, non regen)
- **accampamento**: ARCH (palizzata = soglia) o MONOLITH (totem centrale)
- **intrusi**: SHOULDER (spiare il filo da dietro un tronco)
- **spoglie/epilogo**: VISTA o VOID (respiro post-battaglia)
- **fine/villaggio**: VISTA (arrivo aperto) o VOID

Copertura attuale keep-set: COULISSE×3 (gola, tracce, andata), SHOULDER×1
(ritorno), — i regen devono pesare SHOULDER/ISLAND/TABLEAUX/CASCADE/VISTA.
