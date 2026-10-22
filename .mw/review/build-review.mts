/**
 * PLAN-068 review page generator — renders the Director-facing review
 * surface (audit schede + D6 kit copy + evidence shots) into a single
 * static HTML page served from the repo root.
 *
 * Usage: npx tsx .mw/review/build-review.mts
 * Output: .mw/review/plan068-round/index.html
 */
import MarkdownIt from 'markdown-it';
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = process.cwd();
const AUDIT = 'src/docs/docs/game_surface_audit';
const OUT_DIR = join(REPO, '.mw/review/plan068-round');
const OUT_FILE = join(OUT_DIR, 'index.html');

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

interface Scheda {
  file: string;
  title: string;
  shotDirs: string[];
  /** Reconciliation vs PLAN-067 status (2026-10-20 sera). */
  status: 'done' | 'partial' | 'open';
  statusNote: string;
}

/** Audit schede presented for the D9 per-component decision (G-05). */
const SCHEDE: Scheda[] = [
  { file: 'F4_documento_finale.md', title: 'F4 — Documento finale (sintesi)', shotDirs: [], status: 'partial', statusNote: 'riepilogo: vedi stato per scheda' },
  { file: 'F2_scheda_skill_check.md', title: 'Skill check', shotDirs: ['skillcheck-f1b', 'skillcheck-fullrun'], status: 'done', statusNote: 'findings fixati (T-A2/A3/A4) + rulings SC-1 A, SC-2 A2 → T-B1/T-B2' },
  { file: 'F3_scheda_hud_fissa.md', title: 'HUD fissa (lastre, nav, menu, cartiglio)', shotDirs: ['hud-f3', 'hud-f3-1280', 'hud-top-r234'], status: 'partial', statusNote: 'T-A5/A10 fix, HUD-1/HUD-2 rulati → T-B5/T-B6; aperti: DN-3 cartiglio, DN-6/7 menu, T-A14/A15' },
  { file: 'F3_scheda_questrunwindow.md', title: 'QuestRunWindow', shotDirs: ['questwindow-f3', 'questwindow-f3-1280', 'questwindow-f3-rm'], status: 'done', statusNote: 'T-A4 fix + QW-1 B/I1 rulati → T-B3; T-A16 (contatore ticks) in coda' },
  { file: 'F3_scheda_quest_cinematica.md', title: 'Quest cinematica', shotDirs: ['cinematics-f3'], status: 'open', statusNote: 'CIN-1/2/3 mai rulati — fuori scope PLAN-067, decisione Director aperta' },
  { file: 'F3_scheda_poi_planner_roster_slot.md', title: 'POI / planner / roster / slot', shotDirs: ['poi-planner-f3', 'poi-planner-f3-1280'], status: 'partial', statusNote: 'T-A5/A9 fix, POI-T B + POI detail rulati → T-B4/T-B10; aperto: ROS-H testata roster a 1280' },
  { file: 'F3_scheda_village_stash.md', title: 'Village stash', shotDirs: ['village-stash-f3', 'village-stash-f3-1280'], status: 'done', statusNote: 'T-A7 fix (capienza+viewport); stile rulato FAM-1 A → T-B7' },
  { file: 'F3_scheda_herosheet_mercante_village.md', title: 'Hero sheet / mercante / village', shotDirs: ['more-f3'], status: 'done', statusNote: 'ruling FAM-1 A → T-B7' },
  { file: 'F5_secondo_giro.md', title: 'F5 — Secondo giro', shotDirs: ['round2'], status: 'partial', statusNote: 'T-A1/A11/A12 (◐) fix parziali; invasione reload risolta (R-119); «Maximum update depth» mai riprodotto; T-A13 i18n in coda' },
  { file: 'F7_village_vs_R202.md', title: 'F7 — Villaggio vs R-202', shotDirs: ['F7'], status: 'open', statusNote: '3 domande Director aperte (villaggio editabile? pin vs regola 6b? ellissi?) + bug b1 dischi neri + conteggio 6/16 vs 11 pin' },
];

const STATUS_LABEL: Record<Scheda['status'], string> = {
  done: '✅ in gran parte chiusa',
  partial: '◐ parzialmente',
  open: '❓ decisione aperta',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shotsFor(dirs: string[]): string {
  const items: string[] = [];
  for (const dir of dirs) {
    const abs = join(REPO, AUDIT, 'shots', dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((x) => x.endsWith('.png')).sort()) {
      const rel = `assets/audit/shots/${dir}/${f}`;
      items.push(
        `<a class="shot" href="${rel}" target="_blank"><img loading="lazy" src="${rel}" alt="${esc(f)}"><span>${esc(f)}</span></a>`,
      );
    }
  }
  return items.length ? `<div class="shots">${items.join('')}</div>` : '';
}

function renderScheda(s: Scheda): string {
  const abs = join(REPO, AUDIT, s.file);
  if (!existsSync(abs)) return `<section class="card"><h3>${esc(s.title)}</h3><p><em>missing: ${esc(s.file)}</em></p></section>`;
  const body = md.render(readFileSync(abs, 'utf8'));
  return `<details class="card" id="scheda-${esc(s.file.replace(/\W+/g, '-'))}">
  <summary><h3>${esc(s.title)}</h3><span class="status ${s.status}">${STATUS_LABEL[s.status]}</span></summary>
  <div class="status-note">${esc(s.statusNote)}</div>
  <div class="md">${body}</div>
  ${shotsFor(s.shotDirs)}
  <div class="ruling-row">Ruling D9 per questo gruppo: <code>keep</code> · <code>redo</code> · <code>merge</code> · <code>remove</code> — dicilo a voce, lo registro io.</div>
</details>`;
}

/** Renders the r002 kit nodes for the D6 copy review (G-08). */
async function renderKit(): Promise<string> {
  const kitPath = join(REPO, 'src/balancing/config/idleVillage/quests/generation/narrated/race-miniera.kit.ts');
  const kit = (await import(kitPath)).MINIERA_RACE_KIT;
  const nodeIds = ['viaA', 'imboscata', 'vetta'];
  const rows = nodeIds
    .map((id) => {
      const en = kit.en?.nodes?.[id];
      const it = kit.it?.nodes?.[id];
      const fmt = (n: any) => {
        if (!n) return '<em>nodo assente</em>';
        const parts: string[] = [`<h4>${esc(n.title ?? id)}</h4>`, `<p>${esc(n.body ?? '')}</p>`];
        if (n.failHint) parts.push(`<p><strong>failHint:</strong> ${esc(n.failHint)}</p>`);
        if (n.option) parts.push(`<p><strong>opzione:</strong> ${esc(n.option.label)} — <em>${esc(n.option.detail ?? '')}</em></p>`);
        if (n.verdictFlavor)
          parts.push(
            `<ul>${Object.entries(n.verdictFlavor)
              .map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(String(v))}</li>`)
              .join('')}</ul>`,
          );
        if (n.outcomeLog)
          parts.push(
            `<ul>${Object.entries(n.outcomeLog)
              .map(([k, v]) => `<li><strong>log ${esc(k)}:</strong> ${esc(String(v))}</li>`)
              .join('')}</ul>`,
          );
        if (n.transit) parts.push(`<p><strong>transit:</strong> ${esc(n.transit)}</p>`);
        return parts.join('');
      };
      return `<tr><th>${esc(id)}</th><td>${fmt(en)}</td><td>${fmt(it)}</td></tr>`;
    })
    .join('');
  return `<p>Kit <code>race-miniera.kit.ts</code> (dominio miniera, gimmick race) — r002 rigenerato con contratto v2. I 3 nodi sotto review sono quelli ricostruiti dopo la critica r001.</p>
<p class="hint">Ruling D6: la copy regge senza rilievi A/B/C? Se sì → kit approvato, diventa voice anchor e la review futura diventa spot-check.</p>
<table class="kit"><thead><tr><th>nodo</th><th>EN (draft)</th><th>IT (re-render facts-locked)</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const poiShots = ['fork-v2-section.png', 'fork-v2-detail.png', 'fork-grayscale.png', 'fork-reveal-mid.png']
  .filter((f) => existsSync(join(REPO, '.mw/runs/plan043-s11-b4-poi-fork', f)))
  .map(
    (f) =>
      `<a class="shot" href="assets/poi-fork/${f}" target="_blank"><img loading="lazy" src="assets/poi-fork/${f}" alt="${f}"><span>${f}</span></a>`,
  )
  .join('');

const kitHtml = await renderKit();
const schedeHtml = SCHEDE.map(renderScheda).join('\n');

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>PLAN-068 — Review round del Director</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  /* Wanderlust: Triumph palette — parchment document, Solar Triumph gold,
     deep teal gem accents (eventReminderTokens / goblinEventModalTokens). */
  :root {
    --bg:#efe3cb;            /* parchment, softened */
    --panel:#fbf3e2;         /* lighter parchment card */
    --ink:#3b2d23;           /* woodDark — body text */
    --muted:#7a6a55;         /* parchmentDim darkened for contrast */
    --gold:#9a7020;          /* Solar Triumph gold darkened for light bg */
    --gold-bright:#c9a14a;   /* frameGradientMid */
    --teal:#1f5a52;          /* gemShadow — headings/links */
    --teal-soft:#2a5b6e;     /* skyBottom — secondary accent */
    --line:#d8c6a8;          /* hairline on parchment */
    --code-bg:#ecdfc4;
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  nav { position:sticky; top:0; z-index:5; background:var(--teal); border-bottom:3px solid var(--gold-bright);
        padding:10px 18px; display:flex; gap:16px; flex-wrap:wrap; align-items:baseline;
        font-family:ui-monospace,Menlo,monospace; font-size:12px; }
  nav, nav strong { color:#f0d58b; }
  nav a { color:#a8e8e0; text-decoration:none; } nav a:hover { text-decoration:underline; }
  nav .deferred { color:#c8b98f; }
  main { max-width:1080px; margin:0 auto; padding:28px 22px 90px; }
  h1 { font-family:Georgia,'Times New Roman',serif; font-size:27px; margin:6px 0 4px; color:var(--ink); }
  h2 { font-family:Georgia,'Times New Roman',serif; font-size:20px; margin:38px 0 12px;
       color:var(--teal); border-bottom:2px solid var(--gold-bright); padding-bottom:7px; }
  h2 .gate { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:#fff;
             background:var(--gold); border-radius:4px; padding:2px 7px; margin-right:4px; }
  h2 small { font-family:inherit; font-weight:normal; color:var(--muted); font-size:14px; }
  .lede { color:var(--muted); max-width:72ch; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px;
          padding:14px 18px; margin:12px 0; box-shadow:0 1px 3px rgba(59,45,35,.08); }
  details.card summary { cursor:pointer; display:flex; justify-content:space-between; align-items:baseline; }
  details.card summary h3 { display:inline; margin:0; font-size:16.5px; font-family:Georgia,serif; }
  details.card[open] summary { border-bottom:1px solid var(--line); padding-bottom:9px; margin-bottom:10px; }
  .md { font-size:14px; } .md img { max-width:100%; }
  .md h1,.md h2,.md h3,.md h4 { font-family:Georgia,serif; color:var(--teal); }
  .md table, table.kit { border-collapse:collapse; width:100%; font-size:13.5px; margin:10px 0; background:#fffdf7; }
  .md th,.md td, table.kit th, table.kit td { border:1px solid var(--line); padding:6px 9px; text-align:left; vertical-align:top; }
  .md th, table.kit th { background:#e8dcc0; color:var(--ink); }
  table.kit td { width:44%; }
  .shots { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; margin:14px 0; }
  .shot { display:block; border:1px solid var(--line); border-radius:6px; overflow:hidden;
          background:#fff; color:var(--muted); text-decoration:none;
          font-family:ui-monospace,Menlo,monospace; font-size:10.5px; }
  .shot img { display:block; width:100%; height:auto; }
  .shot span { display:block; padding:4px 6px; background:#f6ecd8; }
  .ruling-row { margin-top:10px; padding:9px 11px; border-top:1px dashed var(--gold-bright);
                font-size:13px; color:var(--muted); background:#f6ecd8; border-radius:0 0 6px 6px; }
  .status { font-family:ui-monospace,Menlo,monospace; font-size:11.5px; border-radius:4px; padding:2px 8px; white-space:nowrap; }
  .status.done { background:#e3ecd8; color:#4a5d3a; }
  .status.partial { background:#f0e2c0; color:#8a6210; }
  .status.open { background:#e8d5cd; color:#8c2318; }
  .status-note { font-size:12.5px; color:var(--muted); border-left:3px solid var(--gold-bright);
                 padding:6px 10px; margin:8px 0 12px; background:#f6ecd8; }
  table.recon { border-collapse:collapse; width:100%; font-size:13.5px; margin:10px 0; background:#fffdf7; }
  table.recon th, table.recon td { border:1px solid var(--line); padding:7px 10px; text-align:left; vertical-align:top; }
  table.recon th { background:#e8dcc0; }
  .open-q { counter-reset:q; }
  .open-q li { margin:7px 0; }
  .open-q .g { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--gold); font-weight:700; }
  details.q { border:1px solid var(--line); border-radius:6px; background:#fffdf7; margin:8px 0; }
  details.q summary { cursor:pointer; padding:10px 14px; font-size:14.5px; }
  details.q summary .hint { margin-left:8px; }
  details.q[open] summary { border-bottom:1px solid var(--line); background:#f6ecd8; border-radius:6px 6px 0 0; }
  .qbody { padding:12px 16px; font-size:14px; }
  .qbody p { margin:8px 0; } .qbody ol,.qbody ul { margin:6px 0; padding-left:22px; }
  .qbody li { margin:5px 0; }
  .qbody a { color:var(--teal); }
  .hint { color:var(--muted); font-size:12.5px; }
  code { background:var(--code-bg); color:#5a3f18; padding:1px 5px; border-radius:4px; font-size:12.5px; }
  .deferred-list li { margin:4px 0; }
  .deferred-list .g { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--teal-soft); font-weight:600; }
</style>
</head>
<body>
<nav>
  <strong>PLAN-068</strong>
  <a href="#g05">G-05 · D9 componenti</a>
  <a href="#g08">G-08 · D6 kit copy</a>
  <a href="#g11">G-11 · trust-set</a>
  <span class="deferred">differite: G-01 · G-02 · G-03 · G-04 · G-06 · G-07 · G-09 · G-10</span>
</nav>
<main>
<h1>Review round del Director</h1>
<p class="lede">Superficie unica per le decisioni non-visuali del round. Le schede sotto sono i documenti d'audit con gli screenshot reali incorporati; sotto ogni scheda c'è la domanda esatta a cui rispondere. Ruling a voce — li registro in <code>PLAN-068</code>.</p>

<h2 id="g05"><span class="gate">G-05</span> · D9 — destino per componente <small>(PLAN-043-S11)</small></h2>
<p class="lede"><strong>Riconciliazione 2026-10-20 sera:</strong> molte schede descrivono problemi già risolti (PLAN-067 onda A committata) o già rulati (mockup v1–v6). Sotto: lo stato per scheda, poi <strong>solo le decisioni davvero residue</strong>. Le schede restano come evidenza — non serve rileggerle tutte.</p>
<table class="recon"><thead><tr><th>Scheda</th><th>Stato findings</th><th>Residuo per te</th></tr></thead><tbody>
${SCHEDE.map((s) => `<tr><td>${esc(s.title)}</td><td><span class="status ${s.status}">${STATUS_LABEL[s.status]}</span> ${esc(s.statusNote)}</td><td>${s.status === 'open' ? '<strong>decisione</strong>' : s.status === 'partial' ? 'parziale' : '—'}</td></tr>`).join('')}
</tbody></table>

<div class="card"><h3 style="margin-top:0">Decisioni davvero residue — il resto è già rulato o fixato</h3>
<p class="hint" style="margin-top:0">Ogni voce: cos'è, il problema, le opzioni. Apri quella che vuoi decidere — le altre le leggi quando serve.</p>

<details class="q"><summary><b>F7 · Villaggio — 3 domande</b> <span class="hint">vista /game con pin edifici</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> la vista Villaggio è un dipinto che contiene <em>già</em> gli 11 edifici disegnati, con sopra pin interattivi (disco con numero romano / «+» / lucchetto) ed ellissi tratteggiate a terra per i lotti.</p>
<p><strong>Contesto:</strong> R-202 (15 ott) avevi chiesto «immagine pulita + sprite appiccicati»; PLAN-038 ha deviato — il dipinto tiene già gli edifici, gli sprite costerebbero inpainting di ~11 edifici. <strong>Non è mai stato ratificato esplicitamente</strong> se la deviazione ti va bene.</p>
<p><strong>Domande:</strong></p>
<ol>
  <li><strong>Villaggio editabile o dipinto fisso?</strong> Editabile = sprite per edificio, lotti vuoti veri, pin che spariscono a favore dello stato sull'edificio — ma costo alto (inpainting + 11 sprite coerenti, rischio collage). Fisso = com'è oggi, stato comunicato dai pin.</li>
  <li><strong>Pin vs regola 6b?</strong> La tua regola HUD: «niente cerchi con dentro un simbolo». I badge tondi col numero la violano letteralmente. Opzioni: sagoma d'oggetto (bandierina, lucchetto di ferro, ponteggio) invece del disco; una sola forma di pin per tutti; info sul pin vs nel tooltip/registro.</li>
  <li><strong>Ellissi a terra?</strong> Le tratteggiate «costruibile/bloccato» — utili o rumore sul dipinto?</li>
</ol>
<p><strong>Bug confermati (vanno fixati comunque):</strong> 6 pin mostrano dischi neri vuoti (rendering, b1); il plaque dice «6 of 16 built» ma il dipinto mostra 11 pin — i 5 extra vivono solo nel Registro.</p>
<p><a href="assets/audit/shots/F7/village-rest-1440x900.png" target="_blank">→ screenshot villaggio 1440</a> · <a href="assets/audit/shots/F7/pins-sheet.png" target="_blank">→ foglio pin</a></p>
</div></details>

<details class="q"><summary><b>CIN-1/2/3 · Cinematica della quest</b> <span class="hint">mai rulati — fuori scope PLAN-067</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> la finestra quest con la scena illustrata (teatro). Tre fork separati da scegliere:</p>
<ul>
  <li><strong>CIN-1 scala</strong> — A: momenti a tutto schermo (arrivo, primo colpo, verdetto, ritorno prendono il viewport 2–4s). B: il teatro occupa l'intera finestra, testo e scelte come sottotitoli in basso, barre nascoste nei beat.</li>
  <li><strong>CIN-2 montaggio</strong> — A: regia per fase (campo largo → zoom/dettaglio → reazione). B: regia per evento (solo colpi e verdetti hanno taglio, il resto deriva continua).</li>
  <li><strong>CIN-3 tiro in scena</strong> — A: il quadrante appare <em>sopra</em> la scena come oggetto magico (overlay). B: la scena reagisce al tiro (luce, scuotimento, suono) restando in colonna.</li>
</ul>
<p>Scheda con contesto: <a href="assets/audit/F3_scheda_quest_cinematica.md" target="_blank">F3 quest cinematica</a>. Testabile dal vivo su <code>/theater-lab</code>.</p>
</div></details>

<details class="q"><summary><b>ROS-H · Testata roster a 1280px</b> <span class="hint">le icone si impilano</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> nel pannello Roster a larghezza 1280 la testata (filtro, ordinamento, direzione) non ci sta e le icone si impilano. Nomi e badge LV sono già fixati (T-A6); resta solo la testata.</p>
<p><strong>Opzioni (fork visivo):</strong> A: roster più largo a 1280 · B: direzione visibile solo con ordinamento attivo · C: filtro e ordinamento fusi in un solo menu.</p>
</div></details>

<details class="q"><summary><b>BTN-1 · Forma del pulsante principale</b> <span class="hint">la placca CTA è vietata ovunque (~20 usi)</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> hai vietato la placca CTA («SEND EXPEDITION» ecc. — <code>variant="cta"</code>, ~20 componenti). Serve la forma sostitutiva unica per l'azione primaria.</p>
<p><strong>Opzioni nel mockup:</strong> A · lastra di famiglia · B · riga incisa · C · stendardo — mostrati <em>nel punto reale del planner</em> (screenshot 1440×900).</p>
<p><a href="assets/audit/mockups/fork-mockups-v5.html#btn" target="_blank">→ mockup BTN-1</a></p>
</div></details>

<details class="q"><summary><b>v6/T-C2 · Report di fine spedizione — due scelte sui dati</b> <span class="hint">prima del mockup finale</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> EXP A «Lapidi» è già scelto (v3); il mockup v6 (nicchie ad arco, ritratti, ferite, striscia delle tappe) aspetta due decisioni di <em>dati</em>:</p>
<ol>
  <li><strong>Titoli e malattie per persona?</strong> Oggi esistono a livello di gruppo (seam autorato <code>scenario.epilogue</code>). Per persona servirebbe authoring diverso.</li>
  <li><strong>«Carattere» / modifiche caratteriali:</strong> <strong>non esistono nel motore</strong> — mostrare questo dato richiede prima una decisione di gameplay (nuovo attributo residente). Il mockup lo segna «da decidere», non lo inventa.</li>
</ol>
<p><a href="assets/audit/mockups/fork-mockups-v6.html" target="_blank">→ mockup v6</a></p>
</div></details>

<details class="q"><summary><b>DN-3 · Cartiglio obiettivo</b> <span class="hint">nessuna preferenza espressa</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> il cartiglio in alto che mostra l'obiettivo corrente. Domande: resta appeso com'è o entra nella lastra del tempo (nuova famiglia H1)? E che testo deve dire?</p>
</div></details>

<details class="q"><summary><b>DN-6 / DN-7 · Menu di gioco</b></summary>
<div class="qbody">
<p><strong>DN-6:</strong> il tema «Lacquer Atlas» — bocciato il 16 ott — è ancora selezionabile nel menu del giocatore. Togliere dal menu (resta solo via <code>?skin=</code> per dev) o lasciarlo?</p>
<p><strong>DN-7:</strong> le voci disabilitate «Load game / Quit to title / All settings» sono mute. Implementarle, spiegarle (tooltip «presto») o nasconderle in demo?</p>
</div></details>

<details class="q"><summary><b>COL-D · Anello notte del POI</b> <span class="hint">residuo del ruling viola</span></summary>
<div class="qbody">
<p><strong>Cos'è:</strong> il Ferro freddo <code>#93a4ad</code> è già deciso per lo stato morte. Resta da scegliere il colore dell'<strong>anello notte</strong> dei POI giorno/notte (oggi viola, vietato). Candidato naturale: lo stesso ferro freddo, o un teal notturno dalla palette.</p>
</div></details>
</div>

<details class="card"><summary><h3>Schede audit (evidenza — apri solo quelle che ti interessano)</h3></summary>
${schedeHtml}
</details>

<h2 id="g08"><span class="gate">G-08</span> · D6 — review kit narrazione <small>(PLAN-027)</small></h2>
${kitHtml}

<h2 id="g11"><span class="gate">G-11</span> · Approvazione trust-set <small>(PLAN-051)</small></h2>
<div class="card">
<p>Ho modificato <code>scripts/verification/produceBundle.ts</code> (file del trust-set) per validare i manifest con lo schema Zod. Il drift è voluto; serve il tuo sigillo:</p>
<p><code>npm run trusted:seal</code> poi <code>npm run approve -- --kind=trust-set</code></p>
<p class="hint">10 secondi, una volta sola — poi i bundle tornano producibili.</p>
</div>

<h2 id="deferred"><span class="gate">—</span> · Gate visuali differiti <small>(al tuo giro)</small></h2>
<div class="card">
<ul class="deferred-list">
  <li><span class="g">G-01</span> Fork POI B4-map → <code>/poi-marker-lab</code> sezione «Sigillo fork» (dev server) + evidenza:</li>
</ul>
<div class="shots">${poiShots}</div>
<ul class="deferred-list">
  <li><span class="g">G-02 / G-03</span> eye-check PLAN-053 (rotta journey + strip 3 barre) → <code>/game</code> con journey attiva</li>
  <li><span class="g">G-04</span> moto post-entry PLAN-064 → <code>/theater-lab</code> o PNG <code>post-entry-t0/t1</code></li>
  <li><span class="g">G-06 / G-07</span> F1 manuali S1/S2 → <code>/game</code> (scambio slot, calamita, menu, bag, regioni)</li>
  <li><span class="g">G-09</span> profiling WKWebView → hardware reale</li>
  <li><span class="g">G-10</span> playtest quest → <code>/game</code></li>
</ul>
</div>

<h2>Mockup già sottoposti (contesto)</h2>
<div class="card"><ul>
  <li><a href="assets/audit/mockups/fork-mockups-v3.html">fork-mockups-v3</a> (ciclo level-up/sconfitta/eredità, FAM-1, POI-T, INV-1, DEATH-1)</li>
  <li><a href="assets/audit/mockups/fork-mockups-v2.html">fork-mockups-v2</a> (SC-2, icone barra, lastre)</li>
  <li><a href="assets/audit/mockups/poi-fork-v1.html">poi-fork-v1</a> · <a href="assets/audit/mockups/poi-colori-famiglie.html">poi-colori-famiglie</a> · <a href="assets/audit/mockups/poi-glifo-campo.html">poi-glifo-campo</a></li>
  <li><a href="assets/audit/rulings/2026-10-20-fork-rulings.md">rulings registrati</a></li>
</ul></div>
</main>
</body>
</html>`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html);
console.log(`wrote ${relative(REPO, OUT_FILE)}`);
