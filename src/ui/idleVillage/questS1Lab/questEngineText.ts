/**
 * questEngineText — it-IT for the texts the quest ENGINE writes itself (PLAN-067 T-A13b, R-234).
 *
 * `questContentLocale` covers authored scenario prose. The engine also composes its own lines:
 * wounds and deaths, check results («Strength → WIN (62 vs roll 40)»), loot, end-of-run reasons,
 * the opening line, option labels. ~200 distinct strings, many with parameters.
 *
 * The CATALOGUE is keyed by the exact English template (`{0}`, `{1}`… stand for the interpolated
 * values) with the Italian beside it. Why match English instead of passing keys from every call
 * site: the engine, its persistence and ~700 tests all rely on the English text, which therefore stays
 * byte-identical; one function (`engineText`) at the sinks is the whole integration.
 *
 * `engineText(text)`:
 *   - English (or unknown) locale → the text itself, untouched;
 *   - exact/templated match → the Italian template with captures re-translated recursively
 *     (a loot name inside a «{0}: {1}» line, a reason inside «+2 days — …»);
 *   - several sentences → each translated on its own (composed endings);
 *   - nothing matches (already Italian authored text, a name…) → unchanged.
 * `{N|map}` in the Italian side maps capture N through a word table (verdict, stats, day/days).
 *
 * A test reads every player-facing literal in `questRun.ts` with the TypeScript parser and fails on
 * any that has no entry here (`questEngineText.test.ts`): a new engine line cannot ship untranslated.
 */
import { getQuestContentLocale } from '@/balancing/config/idleVillage/quests/questContentLocale';

export type EngineTextEntry = readonly [english: string, italian: string];

export const ENGINE_TEXT_IT: readonly EngineTextEntry[] = [
  ['{0} falls, and does not get back up{1}.', '{0} cade e non si rialza più{1}.'],
  [' — at «{0}»', ' — presso «{0}»'],
  ['{0} (−{1} HP).', '{0} (−{1} PV).'],
  ['{0} holds on only because there is nothing else to do', '{0} resiste solo perché non c’è altro da fare'],
  ['{0} staggers: blood on their side', '{0} barcolla: sangue lungo il fianco'],
  ['{0} bends, then straightens up', '{0} si piega, poi si raddrizza'],
  ['{0} grits their teeth and stays standing', '{0} stringe i denti e resta in piedi'],
  ['{0} steps in and takes the blow meant for {1}.', '{0} si fa avanti e prende il colpo destinato a {1}.'],
  ['{0} is down… and gets back up. Death save succeeded.', '{0} è a terra… e si rialza. Salvezza dalla morte riuscita.'],
  ['{0} dies{1}.', '{0} muore{1}.'],
  ['{0} is wounded.', '{0} è ferito.'],
  ['{0}’s wound worsens in the unstable zone.', 'La ferita di {0} peggiora nella zona instabile.'],
  ['{0} is wounded in the unstable zone.', '{0} si ferisce nella zona instabile.'],
  ['The collapse hits {0}: wounded.', 'Il crollo colpisce {0}: ferito.'],
  ['No one comes back. Everything is lost.', 'Nessuno torna. Tutto è perduto.'],
  ['The hunt teaches. +{0} XP.', 'La caccia insegna. +{0} PE.'],
  ['The expedition retreats.', 'La spedizione si ritira.'],
  ['The expedition was wiped out.', 'La spedizione è stata annientata.'],
  ['You flee toward the village with what you gathered. The quest has failed.', 'Fuggi verso il villaggio con ciò che hai raccolto. La quest è fallita.'],
  ['The path closed on itself: the expedition returned.', 'Il sentiero si è richiuso su se stesso: la spedizione è tornata.'],
  ['The path closed into a loop ({0}). The expedition returns to the village.', 'Il sentiero si è chiuso in un anello ({0}). La spedizione torna al villaggio.'],
  ['The trophy is on the scales. The village breathes again.', 'Il trofeo è sul piatto della bilancia. Il villaggio torna a respirare.'],
  ['Empty-handed: the trophy stayed in the ditch. The goblins keep the wood.', 'A mani vuote: il trofeo è rimasto nel fosso. I goblin tengono il bosco.'],
  ['You return without completing the extermination. The goblins keep the wood.', 'Torni senza aver completato lo sterminio. I goblin tengono il bosco.'],
  ['The ruins treasure is at the village. The quest is complete — reward earned.', 'Il tesoro delle rovine è al villaggio. La quest è completa — ricompensa ottenuta.'],
  ['Objective brought back to the village. The quest is complete — reward earned.', 'Obiettivo riportato al villaggio. La quest è completa — ricompensa ottenuta.'],
  ['Seed crate brought back to the village. The quest is complete — reward earned.', 'Cassa di semi riportata al villaggio. La quest è completa — ricompensa ottenuta.'],
  ['The treasure returns to the village, but the leader is gone. The quest reward is lost.', 'Il tesoro torna al villaggio, ma il capo è caduto. La ricompensa della quest è perduta.'],
  ['The objective returns to the village, but the leader is gone. The quest reward is lost.', 'L’obiettivo torna al villaggio, ma il capo è caduto. La ricompensa della quest è perduta.'],
  ['The crate returns to the village, but the leader is gone. The quest reward is lost.', 'La cassa torna al villaggio, ma il capo è caduto. La ricompensa della quest è perduta.'],
  ['You return to the village without the treasure. The quest failed, but you are alive.', 'Torni al villaggio senza il tesoro. La quest è fallita, ma sei vivo.'],
  ['You return to the village without the objective. The quest failed, but you are alive.', 'Torni al villaggio senza l’obiettivo. La quest è fallita, ma sei vivo.'],
  ['You return to the village without the crate. The quest failed, but you are alive.', 'Torni al villaggio senza la cassa. La quest è fallita, ma sei vivo.'],
  ['The work at the site is done — the party turns toward home.', 'Il lavoro sul posto è finito — il gruppo si volge verso casa.'],
  ['The expedition is back at the village.', 'La spedizione è tornata al villaggio.'],
  ['You bring home: {0}.', 'Porti a casa: {0}.'],
  ['Experience: +{0} XP.', 'Esperienza: +{0} PE.'],
  ['The goblin trophy stayed in the ditch.', 'Il trofeo goblin è rimasto nel fosso.'],
  ['The seed crate stayed at the camp.', 'La cassa di semi è rimasta al campo.'],
  ['The prisoner you freed is with you.', 'Il prigioniero che hai liberato è con te.'],
  ['The expedition leaves for the ruins beneath the river.', 'La spedizione parte per le rovine sotto il fiume.'],
  ['Departure — objective: bring back the ruins treasure. The road counts in days.', 'Partenza — obiettivo: riportare il tesoro delle rovine. La strada si conta in giorni.'],
  ['The wood has gone quiet. The goblins have not.', 'Il bosco è ammutolito. I goblin no.'],
  ['Assignment — combat quest, based on Strength. The goblin trophy converts to Gold on return.', 'Incarico — quest di combattimento, basata sulla Forza. Il trofeo goblin si converte in oro al ritorno.'],
  ['The expedition departs.', 'La spedizione parte.'],
  ['Departure — objective: complete the mission.', 'Partenza — obiettivo: completare la missione.'],
  ['The expedition leaves for the Crow Pass.', 'La spedizione parte per il Passo del Corvo.'],
  ['Departure — objective: bring back the seed crate.', 'Partenza — obiettivo: riportare la cassa di semi.'],
  ['Potion used: {0} is back in shape.', 'Pozione usata: {0} è di nuovo in forma.'],
  ['Potion used, but no one needed it.', 'Pozione usata, ma a nessuno serviva.'],
  ['The wound closes: {0} recovers 20 HP.', 'La ferita si chiude: {0} recupera 20 PV.'],
  ['The wound closes: {0} recovers {1} HP.', 'La ferita si chiude: {0} recupera {1} PV.'],
  ['The healing helps no one — kept for nothing.', 'La cura non aiuta nessuno — tenuta per niente.'],
  ['The smoke bomb covers your infiltration (+15).', 'Il fumogeno copre la tua infiltrazione (+15).'],
  ['Rope and grappling hook make the climb safer (+15).', 'Corda e rampino rendono la scalata più sicura (+15).'],
  ['{0}: the bonus comes into play (+{1}).', '{0}: il bonus entra in gioco (+{1}).'],
  ['You decide to keep {0} in the bag.', 'Decidi di tenere {0} nella sacca.'],
  ['The intel pays off: {0} (+{1}).', 'L’informazione paga: {0} (+{1}).'],
  ['Strength Bonus', 'Bonus Forza'],
  ['Perception Bonus', 'Bonus Percezione'],
  ['Smoke bomb', 'Fumogeno'],
  ['Rope and grappling hook', 'Corda e rampino'],
  ['you know the guard shifts', 'conosci i turni delle guardie'],
  ['you know when the patrol passes', 'sai quando passa la ronda'],
  ['you have a mental map of the camp', 'hai una mappa mentale del campo'],
  ['the map marks the weak current point', 'la mappa segna il punto debole della corrente'],
  ['you know what they are really guarding', 'sai che cosa stanno davvero proteggendo'],
  ['the map marks the trapdoor slabs', 'la mappa segna le lastre a botola'],
  ['the tracks show how to approach', 'le tracce mostrano come avvicinarsi'],
  ['the tracks give some hints', 'le tracce offrono qualche indizio'],
  ['{0}: {1} → {2} ({3} vs roll {4}).', '{0}: {1|stats} → {2|verdict} ({3} contro tiro {4}).'],
  ['The {0} spared the party (−{1}pp to wound and death).', '{0|verdict}: il gruppo è stato risparmiato (−{1}pp a ferita e morte).'],
  ['Bigwin: every death outcome is downgraded to a wound.', 'Trionfo: ogni esito di morte diventa una ferita.'],
  ['Epicfail: every wound becomes a death.', 'Rovina: ogni ferita diventa una morte.'],
  ['Turn {0}: {1} → {2} ({3} vs roll {4}). {5}', 'Turno {0}: {1|stats} → {2|verdict} ({3} contro tiro {4}). {5}'],
  ['{0} down: {1}. {2} remain.', '{0} abbattuti: {1}. Ne restano {2}.'],
  ['Goblins', 'Goblin'],
  ['Extermination: not one remains.', 'Sterminio: non ne resta nemmeno uno.'],
  ['Turn {0} closed — the goblins still hold the camp ({1} standing).', 'Turno {0} concluso — i goblin tengono ancora il campo ({1} in piedi).'],
  ['The camp is conquered. No goblin left alive.', 'Il campo è conquistato. Nessun goblin lasciato in vita.'],
  ['The camp is conquered. The survivors flee into the woods.', 'Il campo è conquistato. I sopravvissuti fuggono nel bosco.'],
  ['Fight — turn {0}', 'Combatti — turno {0}'],
  ['{0} standing: {1}. They answer blow for blow.', '{0} in piedi: {1}. Rispondono colpo su colpo.'],
  ['Go on.', 'Prosegui.'],
  ['Continue', 'Continua'],
  ['{0} — {1:BIGWIN|WIN|ALMOST|FAIL|EPICFAIL}.', '{0} — {1|verdict}.'],
  ['{0} — {1:BIGWIN|WIN|ALMOST|FAIL|EPICFAIL}. {2}', '{0} — {1|verdict}. {2}'],
  ['No physical consequence.', 'Nessuna conseguenza fisica.'],
  ['The impact booms across the clearing. The enemy line buckles and the din of shields drowns under a volley of blows.', 'L’impatto rimbomba nella radura. La linea nemica cede e il fragore degli scudi annega sotto una raffica di colpi.'],
  ['Iron grates on iron. The shapes in front of you stagger and the first rank falls back into the fire’s uncertain light.', 'Ferro stride su ferro. Le sagome davanti a te barcollano e la prima fila arretra nella luce incerta del fuoco.'],
  ['The blade opens a gap through leather and shields, but at once another shape slips into the space left free.', 'La lama apre un varco tra cuoio e scudi, ma subito un’altra sagoma scivola nello spazio lasciato libero.'],
  ['The blow smashes into wood. A spearhead darts out of the smoke, close enough that you feel its air on your face.', 'Il colpo si schianta sul legno. Una punta di lancia scatta fuori dal fumo, così vicina che ne senti l’aria sul volto.'],
  ['There is no room to raise your weapon. Blows, screams and iron points close on you from every side while the smoke wipes out every landmark.', 'Non c’è spazio per alzare l’arma. Colpi, urla e punte di ferro si chiudono su di te da ogni lato mentre il fumo cancella ogni riferimento.'],
  ['The pole holding the tarp creaks.', 'Il palo che regge il telo scricchiola.'],
  ['The embers still smoulder beneath the blackened canvas; the heat licks at your face.', 'Le braci covano ancora sotto la tela annerita; il calore ti lambisce il volto.'],
  ['A beam tears free with a crash and falls where, an instant before, you were rummaging.', 'Una trave si stacca con uno schianto e cade dove, un istante prima, stavi frugando.'],
  ['{0}: {1}', '{0}: {1}'],
  ['{0} — turn {1}', '{0} — turno {1}'],
  ['{0} — in hand, not safe yet.', '{0} — in mano, ma non ancora al sicuro.'],
  ['{0}{1} gold.', '{0}{1} oro.'],
  ['+{0} {1} — {2}', '+{0} {1|day} — {2}'],
  ['ruins treasure', 'tesoro delle rovine'],
  ['goblin trophy', 'trofeo goblin'],
  ['seed crate', 'cassa di semi'],
  ['goblin chest', 'forziere goblin'],
  ['crate signal', 'segnale della cassa'],
  ['guards’ loot', 'bottino delle guardie'],
  ['camp loot', 'bottino del campo'],
  ['ancient relic', 'antica reliquia'],
  ['war loot', 'bottino di guerra'],
  ['in the flight the treasure weighs too much — you abandon it among the ruins.', 'nella fuga il tesoro pesa troppo — lo abbandoni tra le rovine.'],
  ['in the flight the load slows you too much — you drop it by the roadside.', 'nella fuga il carico ti rallenta troppo — lo lasci a bordo strada.'],
  ['in the flight the crate slows you too much — you drop it at the edge of the camp.', 'nella fuga la cassa ti rallenta troppo — la lasci ai margini del campo.'],
  ['you drop it while running — it stays in the tower.', 'la lasci cadere correndo — resta nella torre.'],
  ['the crate gets stuck in the gap — to get out you must leave it.', 'la cassa si incastra nella fessura — per uscire devi lasciarla.'],
  ['a patrol cuts your way: to escape you drop the crate.', 'una ronda ti taglia la strada: per scappare lasci la cassa.'],
  ['the camp is on you — the crate slows you too much, it stays here.', 'il campo è addosso a te — la cassa ti rallenta troppo, resta qui.'],
  ['the trophy stays in the ditch — the goblins let you pass.', 'il trofeo resta nel fosso — i goblin ti lasciano passare.'],
  ['stays stuck in the breach.', 'resta incastrato nella breccia.'],
  ['lost in the squeeze.', 'perso nella strettoia.'],
  ['too heavy to vanish in silence.', 'troppo pesante per svanire in silenzio.'],
  ['lost in the dark.', 'perso nel buio.'],
  ['lost in the run.', 'perso nella corsa.'],
  ['the current drags you half a mile downstream.', 'la corrente ti trascina mezzo miglio a valle.'],
  ['dragged by the current, climbing back costs time.', 'trascinato dalla corrente, risalire costa tempo.'],
  ['battered against the rocks — you limp out of the water.', 'sbattuto contro le rocce — esci zoppicando dall’acqua.'],
  ['digging out of the trap costs you a day.', 'uscire dalla trappola scavando ti costa un giorno.'],
  ['emptying the deep chamber.', 'svuotare la camera profonda.'],
  ['the vault was already almost empty — digging does not pay.', 'la volta era già quasi vuota — scavare non conviene.'],
  ['shaking off the guards chasing you.', 'seminare le guardie che ti inseguono.'],
  ['crossing the unstable zone.', 'attraversare la zona instabile.'],
  ['the choice made.', 'la scelta fatta.'],
  ['You read him open: «the guards are not protecting the entrance — they are protecting something further on». And he leaves you his rough map.', 'Lo leggi come un libro aperto: «le guardie non proteggono l’ingresso — proteggono qualcosa più avanti». E lui ti lascia la sua mappa approssimativa.'],
  ['The merchant reveals: «the guards are not guarding the entrance. They are guarding something further on.»', 'Il mercante rivela: «le guardie non sorvegliano l’ingresso. Sorvegliano qualcosa più avanti.»'],
  ['You learn no more than what he told you. You will go in almost blind.', 'Non scopri più di quanto ti abbia detto. Entrerai quasi alla cieca.'],
  ['He gives in: «the guards are protecting something further on». He leaves you the rough map and a clotting agent — «for the road, you might need it».', 'Cede: «le guardie proteggono qualcosa più avanti». Ti lascia la mappa approssimativa e un emostatico — «per la strada, potrebbe servirti».'],
  ['He also hands you 10 gold to «keep it quiet».', 'Ti passa anche 10 monete d’oro per «tenere la bocca chiusa».'],
  ['He chases you off with a snarl: no information, and you leave with a bitter taste.', 'Ti scaccia con un ringhio: nessuna informazione, e te ne vai con l’amaro in bocca.'],
  ['They saw you: the pikes chase you to the gallery exit.', 'Ti hanno visto: le picche ti inseguono fino all’uscita della galleria.'],
  ['The guards fall without calling for help: +40 gold loot.', 'Le guardie cadono senza chiamare aiuto: +40 monete d’oro di bottino.'],
  ['The guards are down: +25 gold loot.', 'Le guardie sono a terra: +25 monete d’oro di bottino.'],
  ['You get through, but the pikes made you pay.', 'Passi, ma le picche te l’hanno fatta pagare.'],
  ['You see it: the slab in front of the treasure is a trap. Now you can choose how to move.', 'Lo vedi: la lastra davanti al tesoro è una trappola. Ora puoi scegliere come muoverti.'],
  ['Nothing strange… until the floor gives way under your feet.', 'Niente di strano… finché il pavimento non cede sotto i tuoi piedi.'],
  ['You pull yourselves out of the pit — but part of the treasure ended up under the collapse.', 'Vi tirate fuori dalla fossa — ma parte del tesoro è finita sotto il crollo.'],
  ['You get out of the trap with effort: the treasure is partially damaged.', 'Esci dalla trappola a fatica: il tesoro è in parte danneggiato.'],
  ['What remains after the collapse is worth half.', 'Ciò che resta dopo il crollo vale la metà.'],
  ['Treasure loaded — in hand, not safe yet. Worth about {0} gold.', 'Tesoro caricato — in mano, ma non ancora al sicuro. Vale circa {0} monete d’oro.'],
  ['The treasure is too much for your backs — you carry away only crumbs. You will leave almost empty-handed.', 'Il tesoro è troppo per le vostre schiene — portate via solo briciole. Uscirete quasi a mani vuote.'],
  ['The vault was untouched: +{0} gold and an ancient relic.', 'La volta era intatta: +{0} monete d’oro e un’antica reliquia.'],
  ['The vault pays: +{0} gold.', 'La volta ripaga: +{0} monete d’oro.'],
  ['Someone had been there before you: only scraps remain.', 'Qualcuno c’era stato prima di te: restano solo avanzi.'],
  ['Fresh tracks heading north. You know how to approach (Stealth bonus).', 'Tracce fresche verso nord. Sai come avvicinarti (bonus Furtività).'],
  ['Some confused signs. Better than nothing.', 'Qualche segno confuso. Meglio di niente.'],
  ['The dead branches tear you on the way down. (−10 HP)', 'I rami secchi ti lacerano nella discesa. (−10 PV)'],
  ['The wood stays silent.', 'Il bosco resta in silenzio.'],
  ['From above you see what stays invisible from the ground: a hiding place under a too-regular weave of branches.', 'Dall’alto vedi ciò che dal suolo resta invisibile: un nascondiglio sotto un intreccio di rami troppo regolare.'],
  ['The fall costs you. (−10 HP)', 'La caduta ti costa. (−10 PV)'],
  ['The climb costs you. (−10 HP)', 'La salita ti costa. (−10 PV)'],
  ['You position yourselves behind them. You will strike first.', 'Vi disponete alle loro spalle. Colpirete per primi.'],
  ['A broken branch costs you the perfect vantage.', 'Un ramo spezzato ti costa la posizione perfetta.'],
  ['Stones roll under your feet. The camp has seen you.', 'Le pietre rotolano sotto i tuoi piedi. Il campo ti ha visto.'],
  ['Breaking the line, the first strike is yours.', 'Spezzando la linea, il primo colpo è tuo.'],
  ['You slam into the palisades. No vantage — and aching bones.', 'Ti schianti contro le palizzate. Nessun vantaggio — e ossa doloranti.'],
  ['The charge dies in the mud. No vantage.', 'La carica muore nel fango. Nessun vantaggio.'],
  ['You catch them on the ridge. None remains.', 'Li raggiungi sul crinale. Non ne resta nessuno.'],
  ['They escape by a breath, wounded and scattered. They will be a shadow on the way back.', 'Sfuggono per un soffio, feriti e dispersi. Saranno un’ombra sulla via del ritorno.'],
  ['They flee among the rocks, laughing. They will be waiting on the way back.', 'Fuggono tra le rocce, ridendo. Ti aspetteranno sulla via del ritorno.'],
  ['Under the tarp, something still worth taking. (+{0} gold)', 'Sotto il telo, qualcosa che vale ancora la pena prendere. (+{0} oro)'],
  ['A miserable loot — and one more wound.', 'Un magro bottino — e una ferita in più.'],
  ['Only ash and thorns.', 'Solo cenere e spine.'],
  ['The heads on the judge’s bench: +{0} gold.', 'Le teste sul banco del giudice: +{0} oro.'],
  ['Arrows out of the undergrowth. They had been waiting.', 'Frecce dal sottobosco. Stavano aspettando.'],
  ['Goblin trophy taken — in hand, not safe yet.', 'Trofeo goblin preso — in mano, ma non ancora al sicuro.'],
  ['The merchant: «these are no ordinary goblins… they carry a symbol».', 'Il mercante: «questi non sono goblin comuni… portano un simbolo».'],
  ['+{0} gold.', '+{0} oro.'],
  ['War loot from the hiding place.', 'Bottino di guerra dal nascondiglio.'],
  ['You throw the head into the ditch and run. The quest is lost.', 'Getti la testa nel fosso e scappi. La quest è perduta.'],
  ['{0} worsens: the zone does not forgive those already wounded.', '{0} peggiora: la zona non perdona chi è già ferito.'],
  ['The zone creaks but holds: you pass unharmed — this time.', 'La zona scricchiola ma regge: passi illeso — questa volta.'],
  ['The collapse catches {0}. The rest of the road will be walked with a wound.', 'Il crollo prende {0}. Il resto della strada si farà con una ferita.'],
  ['{0} Something is waking up in the tower.', '{0} Qualcosa si sta svegliando nella torre.'],
  ['{0} The camp wakes: shouts and torches everywhere — checks will be harder.', '{0} Il campo si sveglia: grida e torce ovunque — le prove saranno più dure.'],
  ['{0} Someone in the camp heard something.', '{0} Qualcuno nel campo ha sentito qualcosa.'],
  ['You see everything: the cage with the prisoner, the side door, the shifts, the patrol — and something big sleeping in the tower.', 'Vedi tutto: la gabbia con il prigioniero, la porta laterale, i turni, la ronda — e qualcosa di grosso che dorme nella torre.'],
  ['You glimpse a cage with a prisoner, a side door… and something big in the tower.', 'Intravedi una gabbia con un prigioniero, una porta laterale… e qualcosa di grosso nella torre.'],
  ['You only manage to count the guard shifts.', 'Riesci solo a contare i turni delle guardie.'],
  ['Nothing else: you will go in blind.', 'Nient’altro: entrerai alla cieca.'],
  ['The fight is heard across the camp: it is awake, and it will stay awake.', 'La lotta si sente in tutto il campo: è sveglio, e resterà sveglio.'],
  ['You find the seed crate, still intact. At the top of the tower.', 'Trovi la cassa di semi, ancora intatta. In cima alla torre.'],
  ['The search makes noise and finds nothing certain — you guess your way toward the tower.', 'La ricerca fa rumore e non trova nulla di certo — a tentoni ti dirigi verso la torre.'],
  ['The prisoner follows you in silence. At the village he might stay.', 'Il prigioniero ti segue in silenzio. Al villaggio potrebbe fermarsi.'],
  ['Seed crate taken — in hand, not safe yet.', 'Cassa di semi presa — in mano, ma non ancora al sicuro.'],
  ['The crate slips from your hands — it stays at the camp. Now only getting out alive matters.', 'La cassa ti scivola di mano — resta al campo. Ora conta solo uscire vivi.'],
  ['Goblin chest: +15 gold.', 'Forziere goblin: +15 oro.'],
  ['You run into the night. Behind you the tower crumbles — you were a breath away.', 'Corri nella notte. Dietro di te la torre crolla — eri a un soffio.'],
  ['The escape is a desperate massacre.', 'La fuga è un massacro disperato.'],
  ['The prisoner drags you past the wall: you are out, empty-handed.', 'Il prigioniero ti trascina oltre il muro: sei fuori, a mani vuote.'],
  ['You exit the breach pushed hard — something stays behind.', 'Esci dalla breccia a spintoni — qualcosa resta indietro.'],
  ['Someone looks up at the wrong moment: you slip away, lighter.', 'Qualcuno alza lo sguardo nel momento sbagliato: ti dilegui, più leggero.'],
  ['The chest creaks.', 'Il forziere scricchiola.'],
  ['Duration: {0} days.', 'Durata: {0} giorni.'],
  ['Loot brought back: {0} gold.', 'Bottino riportato: {0} oro.'],
  ['Man-days used: {0} × {1} = {2}.', 'Giorni-uomo impiegati: {0} × {1} = {2}.'],
  ['The traveler you brought to the village owes you a favor.', 'Il viandante che hai portato al villaggio ti deve un favore.'],
  ['The traveler you healed paid you more than due.', 'Il viandante che hai curato ti ha pagato più del dovuto.'],
  ['The treasure stayed in the ruins.', 'Il tesoro è rimasto tra le rovine.'],
  ['The wounded man on the road stayed where you left him.', 'L’uomo ferito sulla strada è rimasto dove lo hai lasciato.'],
  ['{0} did not come back.', 'Non ha fatto ritorno: {0}.'],
  ['{0} of you return.', 'Tornate in {0}.'],
  ['{0}: WOUNDED — unavailable for {1} days.', '{0}: IN CONVALESCENZA — non disponibile per {1} giorni.'],
  ['The stone gives way under {0}: wounded. The cost of the passage.', 'La pietra cede sotto {0}: ferito. Il costo del passaggio.'],
  ['The landslide passes a few metres away: fright, but no harm.', 'La frana passa a pochi metri: spavento, ma nessun danno.'],
];

const MAPS: Record<string, Record<string, string>> = {
  verdict: { BIGWIN: 'TRIONFO', WIN: 'VITTORIA', ALMOST: 'PER UN SOFFIO', FAIL: 'SCONFITTA', EPICFAIL: 'ROVINA' },
  day: { day: 'giorno', days: 'giorni' },
  stat: { Perception: 'Percezione', Intelligence: 'Intelligenza', Strength: 'Forza', Constitution: 'Costituzione', Agility: 'Agilità', Charisma: 'Carisma' },
};
const mapValue = (map: string, value: string): string => {
  if (map === 'stats') return value.split(' + ').map((w) => MAPS.stat[w] ?? w).join(' + ');
  return MAPS[map]?.[value] ?? value;
};

interface Compiled {
  re: RegExp;
  it: string;
  weight: number;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compile = (entries: readonly EngineTextEntry[]): Compiled[] =>
  entries
    .map(([en, it]) => {
      // `{N}` captures anything; `{N:A|B}` captures only one of the listed words (a verdict, …).
      const parts = en.split(/\{(\d+)(?::([^}]*))?\}/);
      let literal = '';
      let constrained = 0;
      let pattern = '';
      for (let i = 0; i < parts.length; i += 3) {
        literal += parts[i];
        pattern += escapeRe(parts[i]);
        if (i + 1 < parts.length) {
          const only = parts[i + 2];
          if (only) constrained += 20;
          pattern += only ? `(${only})` : '(.*?)';
        }
      }
      return { re: new RegExp(`^${pattern}$`, 's'), it, weight: literal.length + constrained };
    })
    // Most specific first: more literal characters win over a generic «{0}: {1}».
    .sort((a, b) => b.weight - a.weight);

let compiled: Compiled[] | null = null;
const catalogue = () => (compiled ??= compile(ENGINE_TEXT_IT));

const MAX_DEPTH = 4;

const fill = (it: string, caps: string[], depth: number): string =>
  it.replace(/\{(\d+)(?:\|(\w+))?\}/g, (_, n: string, map?: string) => {
    const raw = caps[Number(n)] ?? '';
    const inner = raw && depth < MAX_DEPTH ? translate(raw, depth + 1) : raw;
    return map ? mapValue(map, inner) : inner;
  });

/** A template with fewer literal characters than this («{0}: {1}», «{0} — {1}.») is a shape, not a message. */
const GENERIC_BELOW = 6;

const translate = (text: string, depth: number): string => {
  const entries = catalogue();
  // 1. a specific message, matched whole;
  for (const c of entries) {
    if (c.weight < GENERIC_BELOW) break; // sorted by weight: only generic shapes remain
    const m = c.re.exec(text);
    if (m) return fill(c.it, m.slice(1), depth);
  }
  // 2. several sentences (composed endings, «{reason} Something is waking…»): one by one — before the
  //    generic shapes, which would swallow a whole composed ending at its first colon;
  const sentences = text.split(/(?<=[.!?»])\s+(?=[A-Z«{])/);
  if (sentences.length > 1) {
    const out = sentences.map((s) => translate(s, depth));
    return out.some((s, i) => s !== sentences[i]) ? out.join(' ') : text;
  }
  // 3. a generic shape («{0}: {1}», «{0} — {1}.»), its parts translated on their own.
  for (const c of entries) {
    if (c.weight >= GENERIC_BELOW) continue;
    const m = c.re.exec(text);
    if (m) return fill(c.it, m.slice(1), depth);
  }
  return text;
};

/** The text as the player should read it. English: the same string, untouched. */
export function engineText(text: string): string {
  if (!text || getQuestContentLocale() !== 'it-IT') return text;
  return translate(text, 0);
}
