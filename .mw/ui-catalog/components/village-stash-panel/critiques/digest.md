# Digest critiche — village-stash-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-village-stash-panel`, turn T-001 (+retry T-002
chatgpt), prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarato:** chatgpt — `ATTACH_FAILED` ("no upload
affordance found") su entrambi i tentativi T-001 e T-002. Pattern
persistente del giorno sull'attach immagini di chatgpt web; nessun
ulteriore retry. Convergenza = 2/2 provider image-grounded (claude e
deepseek, entrambi con fatti corretti: "6 OF 24 GOODS IN STORE", righe
item con effetto duplicato, badge ×1). Nota: deepseek risponde in
cinese — verbatim conservato in `deepseek.md`.

## Convergenza forte (2/2)

1. **Ogni riga ripete la stessa informazione due volte.** Titolo +
   descrizione ridondanti ("Strength Bonus — +15 to one check" poi
   "+15 to Strength checks").
   - claude: «6 righe e 12 linee di testo, per 6 informazioni» → nome ed
     effetto separati nei dati, effetto compresso a una riga.
   - deepseek: «重复性文字造成"信息噪声"…把相同的描述写两遍» →
     formato unificato `[icona] +15 [attributo]`.

2. **La capacità è solo testo; deve diventare un meter visivo.**
   - claude: «"6 OF 24 GOODS IN STORE"… Non vedi che mancano 18 slot» →
     barra a tacche (role=meter), footer testuale eliminabile.
   - deepseek: «应当更像一个进度条或高亮的容量指示器，而不是一段附属
     说明» → capacity-bar con fill 25%.

3. **Nessuna categoria né scansione: 6 icone identiche.**
   - claude: «Stessa cornice, stesso oro, glifi piccoli. Non c'è
     categoria (check, cura, infiltrazione), quindi non si scansiona» →
     colore + forma per categoria.
   - deepseek: «缺乏分类与筛选…将 Potion 和 Smoke bomb 平铺在一起» →
     color coding semantico per tipo di effetto.

4. **Testo secondario sotto soglia di leggibilità.**
   - claude: «serif da ~11px, oro-grigio su teal scuro. Probabilmente
     non arrivano a 4.5:1» — pavimento 13px + test di contrasto in CI.
   - deepseek: capacità «在深色背景上的对比度较低», titolo pannello
     «视觉权重过低».

5. **Header sbilanciato: titolo debole, controlli dominanti.**
   - claude: «Il titolo "VILLAGE STASH" è piccolo, mentre minimize e
     close… dominano l'intestazione».
   - deepseek: «标题与内容之间的留白和字号差异不够明显»; inoltre i
     bottoni −/× «过于密集…容易发生误触» (rischio misclick, stesso
     cluster, angolo opposto del problema).

## Disaccordi preservati

- **Lista vs griglia (unico vero fork):** deepseek vuole convertire a
  «分类网格 + 详情面板» (sidebar categorie + griglia 3-col + inspector);
  claude mantiene la lista e riserva la griglia alla sola capacità,
  citando esplicitamente che «la griglia solo se è una scelta
  deliberata» — posizioni opposte sullo stesso pattern ibrido.
- **Badge quantità:** claude sposta ×N dal canto dell'icona a una pill a
  destra («il badge "×1"… è di ~8px e sembra tagliato»); deepseek vuole
  invece mostrare stack count + rarity sull'icona/card.

## Solo claude (nessun riscontro deepseek)

Focus stack tra i due pannelli attaccati (Zustand, pannello non attivo
desaturato); pannello centrale che copre il villaggio → drawer laterale
~380px; modalità sola lettura invisibile («sembrano cliccabili e non lo
sono»); prenotazioni che spariscono senza traccia → riga aggregata (da
ruling Director); tabular-nums; touch target ~42px <44px; note di
contratto i18n/pseudo-localizzazione.

## Solo deepseek

Mancanza di rarity/stack count per giudicare "which one is best" in
0.5s (scansione O(n)→O(1)); codice d'esempio HTML/CSS generico.

## Priorità emersa

P0 condiviso: dedupe delle righe, capacity meter, categorie
colore+forma, testo ≥13px/contrasto 4.5:1. P1: header ribilanciato,
hover/selezione leggibile. P2: posizionamento drawer, tabular-nums,
touch target.
