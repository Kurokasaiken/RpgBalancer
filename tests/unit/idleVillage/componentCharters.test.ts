/**
 * INV:hud-charters — PLAN-131 gate (battezzato Director 2026-11-21, r004).
 *
 * Il gate certifica STRUTTURA + la spec anatomica (hash), non la fedeltà
 * del codice componente (limite dichiarato §6). Ogni check sotto è una
 * clausola di OB-2 del plan.
 *
 * Stage estetico = derivato da `computeCharterStage` e PINNATO qui
 * (EXPECTED_STAGE): chiudere un nodo estetico = aggiornare charter E pin
 * nello stesso diff.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LAB_CATALOG, type LabEntry } from '@/pages/hud-lab/catalog';
import { CHARTERS, charterFor } from '@/config/hud/charters';
import {
  CHARTER_STATES,
  GLOBAL_REGION,
  componentCharterSchema,
  computeCharterStage,
  type CharterStage,
  type ComponentCharter,
} from '@/config/hud/charterSchema';
import { CharterSection } from '@/pages/hud-lab/charterSection';
import piecesJson from '@/config/hud/pieces.json';

const ROOT = process.cwd();
const PIECES_MATERIALS = new Set((piecesJson as { materials: string[] }).materials);
const PLACEHOLDER_RE = /^\s*(n\/?a\.?|none|null|n\.?d\.?|tbd|todo|-|—|\.{3})\s*$/i;

const catalogEntry = (id: string): LabEntry | undefined => LAB_CATALOG.find((e) => e.id === id);
const coveredEntries = () =>
  LAB_CATALOG.filter((e) => e.kind === 'component' && (e.status === 'battezzato' || e.status === 'candidato'));

/** Nomi di regione ammessi per `materials.region` (anatomia ∪ sentinella). */
const allowedRegions = (c: ComponentCharter): Set<string> => {
  const names = new Set<string>([GLOBAL_REGION]);
  const a = c.anatomy;
  if (!a) return names;
  if (a.kind === 'zones') {
    for (const z of a.zones) names.add(z.name);
    return names;
  }
  const file = resolve(ROOT, a.ref);
  if (!existsSync(file)) return names;
  const regions = JSON.parse(readFileSync(file, 'utf8')) as { regions: { region: string }[] };
  for (const r of regions.regions) names.add(r.region);
  return names;
};

/** Conteggio deterministico dei componenti per famiglia (catalogo vivo). */
const familyComponentCount = (family: string): number =>
  LAB_CATALOG.filter((e) => e.kind === 'component' && e.family === family).length;

/**
 * Stage atteso per componente — snapshot aspirazionale a compile-time,
 * asserito continuativamente dopo. Chiudere un nodo estetico = aggiornare
 * charter E pin nello stesso diff.
 */
const EXPECTED_STAGE: Record<string, CharterStage> = {
  cassetto: 'open',
  nav: 'converged',
  'top-chrome': 'converged',
  'time-sole': 'open',
  roster: 'converged',
  stash: 'converged',
  'victory-reward': 'converged',
  triad: 'open',
};

describe('INV:hud-charters — coverage e join col catalogo PLAN-129', () => {
  // INV:hud-charters — copertura live: ogni componente battezzato/candidato
  // ha un charter (regression OB-2: senza charter un battezzato = rosso).
  it('ogni entry catalogo kind:component con status battezzato|candidato ha un charter', () => {
    const missing = coveredEntries().filter((e) => !charterFor(e.id)).map((e) => e.id);
    expect(missing, `componenti senza charter: ${missing.join(', ')}`).toEqual([]);
  });

  // INV:hud-charters — join: ogni componentId risolve nel catalogo come
  // component e la family coincide (niente doppia fonte).
  it('ogni componentId risolve nel catalogo e la family coincide', () => {
    for (const c of CHARTERS) {
      const e = catalogEntry(c.componentId);
      expect(e, `charter orfano: ${c.componentId} non è nel catalogo`).toBeDefined();
      expect(e!.kind, `${c.componentId}: il join è su un ${e!.kind}, non un component`).toBe('component');
      expect(c.family, `${c.componentId}: family charter (${c.family}) ≠ catalogo (${e!.family})`).toBe(e!.family);
    }
  });
});

describe('INV:hud-charters — schema e vocabolario', () => {
  // INV:hud-charters — ogni charter è conforme allo schema Zod.
  it('ogni entry passa componentCharterSchema', () => {
    for (const c of CHARTERS) {
      const r = componentCharterSchema.safeParse(c);
      expect(r.success, `${c.componentId}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
    }
  });

  // INV:hud-charters — materials ⊆ enum pieces.json (vocabolario unico:
  // estensione solo via amend PLAN-130 + ruling, mai edit del charter).
  it('materials ⊆ enum pieces.json', () => {
    for (const c of CHARTERS) {
      for (const m of c.materials) {
        expect(
          PIECES_MATERIALS.has(m.material),
          `${c.componentId}: materiale «${m.material}» fuori dall'enum pieces.json — serve amend PLAN-130 via ruling`,
        ).toBe(true);
      }
    }
  });

  // INV:hud-charters — materials.region ⊆ anatomia ∪ {'global'} su
  // ENTRAMBI i kind (niente doppia fonte né free-text su zones/hybrid).
  it('materials.region ⊆ regioni/zona anatomia ∪ {global}', () => {
    for (const c of CHARTERS) {
      const allowed = allowedRegions(c);
      for (const m of c.materials) {
        expect(
          allowed.has(m.region),
          `${c.componentId}: materials.region «${m.region}» fuori dall'anatomia (ammessi: ${[...allowed].join(', ')})`,
        ).toBe(true);
      }
    }
  });
});

describe('INV:hud-charters — anatomia e staleness meccanica', () => {
  // INV:hud-charters — kind:'regions' ⇒ ref esiste su disco E hash = sha256
  // del file (il drift sulla spec anatomica è intercettato subito; il
  // failure stampa il nuovo hash — bump = una riga + nota durevole).
  it('anatomy kind=regions: ref esiste e hash coincide col file', () => {
    for (const c of CHARTERS) {
      const a = c.anatomy;
      if (!a || a.kind !== 'regions') continue;
      const file = resolve(ROOT, a.ref);
      expect(existsSync(file), `${c.componentId}: anatomy.ref morto — ${a.ref}`).toBe(true);
      const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
      expect(
        actual,
        `${c.componentId}: anatomy.hash mismatch — il file spec è cambiato, il charter va riletto.\n` +
          `  hash registrato: ${a.hash}\n  hash attuale:    ${actual}\n` +
          `  bump = una riga + note durevole sul perché del non-impatto (o rilettura semantica)`,
      ).toBe(a.hash);
    }
  });

  // INV:hud-charters — kind:'zones' ⇒ validazione solo strutturale:
  // zones[].name non vuote, medium ∈ {art,dom}; niente ref/hash su zones.
  it('anatomy kind=zones: validazione strutturale (nomi non vuoti, medium art|dom)', () => {
    for (const c of CHARTERS) {
      const a = c.anatomy;
      if (!a || a.kind !== 'zones') continue;
      expect(a.zones.length, `${c.componentId}: anatomy zones vuota`).toBeGreaterThan(0);
      for (const z of a.zones) {
        expect(z.name.trim().length, `${c.componentId}: zone name vuota`).toBeGreaterThan(0);
        expect(['art', 'dom'], `${c.componentId}: medium «${z.medium}» su zona «${z.name}»`).toContain(z.medium);
      }
      expect('ref' in a || 'hash' in a, `${c.componentId}: ref/hash vietati su anatomy kind=zones`).toBe(false);
    }
  });

  // INV:hud-charters — anatomy assente ⇒ status=candidato nel catalogo
  // («spec non ancora scritta», mid-fork).
  it('anatomy assente ⇒ entry catalogo è candidato', () => {
    for (const c of CHARTERS) {
      if (c.anatomy) continue;
      const e = catalogEntry(c.componentId)!;
      expect(
        e.status,
        `${c.componentId}: anatomy assente ma catalogo=${e.status} — anatomy è obbligatoria su battezzato`,
      ).toBe('candidato');
    }
  });
});

describe('INV:hud-charters — stati, floor, ruling', () => {
  // INV:hud-charters — chiavi states ⊆ enum + `default` presente su
  // battezzato (gli stati documentati sono quelli che APPLICANO).
  it('states: chiavi ⊆ enum; default presente su battezzato', () => {
    const allowed = new Set<string>(CHARTER_STATES);
    for (const c of CHARTERS) {
      for (const k of Object.keys(c.states)) {
        expect(allowed.has(k), `${c.componentId}: stato «${k}» fuori dall'enum CharterState`).toBe(true);
      }
      const e = catalogEntry(c.componentId)!;
      if (e.status === 'battezzato') {
        expect(c.states.default, `${c.componentId}: battezzato senza stato «default» documentato`).toBeDefined();
      }
    }
  });

  // INV:hud-charters — typeFloor: ogni entry ha minPx O ref — mai vacua.
  it('typeFloor: ogni entry ha minPx o ref (mai entry vacua)', () => {
    for (const c of CHARTERS) {
      for (const t of c.typeFloor) {
        const ok = t.minPx !== undefined || (t.ref !== undefined && t.ref.trim() !== '');
        expect(ok, `${c.componentId}: typeFloor/${t.role} senza minPx né ref`).toBe(true);
      }
    }
  });

  // INV:hud-charters — battezzato ⇒ anatomy presente + appreciated ≥1 con
  // almeno una ruling valorizzata ([{trait:"bello"}] non passa il gate).
  it('battezzato ⇒ anatomy + appreciated ≥1 con ruling', () => {
    for (const c of CHARTERS) {
      const e = catalogEntry(c.componentId)!;
      if (e.status !== 'battezzato') continue;
      expect(c.anatomy, `${c.componentId}: battezzato senza anatomy`).toBeDefined();
      expect(c.appreciated.length, `${c.componentId}: battezzato senza appreciated`).toBeGreaterThanOrEqual(1);
      const withRuling = c.appreciated.filter((a) => a.ruling && a.ruling.trim() !== '');
      expect(
        withRuling.length,
        `${c.componentId}: battezzato senza neanche una appreciated con ruling valorizzata`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // INV:hud-charters — candidato ⇒ almeno uno dei tre array non vuoto:
  // un candidato non può apparire completo per omissione.
  it('candidato ⇒ ≥1 di appreciated/openIssues/openExploration non vuoto', () => {
    for (const c of CHARTERS) {
      const e = catalogEntry(c.componentId)!;
      if (e.status !== 'candidato') continue;
      const n =
        c.appreciated.length + (c.openIssues?.length ?? 0) + (c.openExploration?.length ?? 0);
      expect(
        n,
        `${c.componentId}: candidato con tutti e tre gli array vuoti — dichiara almeno un tratto, difetto o dimensione aperta`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // INV:hud-charters — director-verified ⇒ verifiedBy + ornamentLevel;
  // reconstructed ⇒ niente ornamentLevel nel record (la proposta vive
  // fuori, nelle note di verifica, finché il Director non conferma).
  it('confidence rules: director-verified ⇒ verifiedBy+ornamentLevel; reconstructed ⇒ no ornamentLevel', () => {
    for (const c of CHARTERS) {
      if (c.confidence === 'director-verified') {
        expect(c.verifiedBy && !PLACEHOLDER_RE.test(c.verifiedBy),
          `${c.componentId}: director-verified senza verifiedBy reale`).toBe(true);
        expect(c.ornamentLevel, `${c.componentId}: director-verified senza ornamentLevel`).toBeDefined();
      }
      if (c.confidence === 'reconstructed') {
        expect(
          c.ornamentLevel,
          `${c.componentId}: ornamentLevel su reconstructed — un valore proposto non confermato nel record è la deriva`,
        ).toBeUndefined();
      }
    }
  });

  // INV:hud-charters — openExploration con ref (chi l'ha aperta): la
  // chiusura di una voce avviene solo citando il ruling nel diff.
  it('openExploration: ogni voce ha un ref non-vuoto e non-placeholder', () => {
    for (const c of CHARTERS) {
      for (const o of c.openExploration ?? []) {
        expect(
          o.ref && o.ref.trim() !== '' && !PLACEHOLDER_RE.test(o.ref),
          `${c.componentId}: openExploration «${o.dimension}» senza ref reale (chi l'ha aperta)`,
        ).toBe(true);
      }
    }
  });

  // INV:hud-charters — familyOrigin obbligatorio su famiglia a componente
  // singolo (regola deterministica dal catalogo vivo); ref non-vuoto
  // stesso pattern di verifiedBy («n/a» non passa).
  it('familyOrigin: richiesto su famiglia a componente singolo, ref non-vuoto', () => {
    for (const c of CHARTERS) {
      const count = familyComponentCount(c.family);
      if (count === 1) {
        expect(
          c.familyOrigin && c.familyOrigin.trim() !== '' && !PLACEHOLDER_RE.test(c.familyOrigin),
          `${c.componentId}: famiglia «${c.family}» a componente singolo senza familyOrigin reale`,
        ).toBe(true);
      } else if (c.familyOrigin !== undefined) {
        // Persiste quando la famiglia cresce (ancora fondativa) — ma resta un ref reale.
        expect(
          c.familyOrigin.trim() !== '' && !PLACEHOLDER_RE.test(c.familyOrigin),
          `${c.componentId}: familyOrigin presente ma placeholder/vuoto`,
        ).toBe(true);
      }
    }
  });

  // INV:hud-charters — rejected = conoscenza negativa (Director-ratified
  // 2026-11-21): ogni voce cita il ruling che l'ha scartata — mai orfana.
  it('rejected: ogni voce ha item+reason+ruling non-placeholder', () => {
    for (const c of CHARTERS) {
      for (const r of c.rejected ?? []) {
        expect(
          r.item.trim() !== '' && r.reason.trim() !== '',
          `${c.componentId}: rejected «${r.item}» senza item/reason`,
        ).toBe(true);
        expect(
          r.ruling.trim() !== '' && !PLACEHOLDER_RE.test(r.ruling),
          `${c.componentId}: rejected «${r.item}» senza ruling reale`,
        ).toBe(true);
      }
    }
  });
});

describe('INV:hud-charters — stage estetico derivato e pinnato', () => {
  // INV:hud-charters — lo stage è CALCOLATO (mai campo del charter) e
  // pinnato nella mappa EXPECTED_STAGE: un mismatch significa che un nodo
  // estetico si è chiuso o che il charter è andato in drift.
  it('stage derivato = pin atteso (EXPECTED_STAGE)', () => {
    for (const c of CHARTERS) {
      const computed = computeCharterStage(c);
      const pinned = EXPECTED_STAGE[c.componentId];
      expect(
        computed,
        `${c.componentId}: computed «${computed}», pinned «${pinned ?? '(nessun pin)'}» — ` +
          `aggiorna il pin SOLO se un ruling ha chiuso il nodo, altrimenti correggi il charter`,
      ).toBe(pinned);
    }
  });
});

describe('INV:hud-charters — OB-5: scheda nella card lab', () => {
  // INV:hud-charters — OB-5(b): predicato FISSO valutato a chiusura —
  // `test -f src/pages/hud-lab/index.tsx` (o il file pagina effettivo se
  // rinominato) decide se l'assert DOM si esegue. Il predicato è nel
  // contratto, non rinegoziato a runtime.
  const PAGE_EXISTS =
    existsSync(resolve(ROOT, 'src/pages/hud-lab/index.tsx')) ||
    existsSync(resolve(ROOT, 'src/pages/hud-lab.tsx'));

  it('la sezione charter esiste a forma fissa: verdetto → appreciated → openIssues → openExploration → tecnici', () => {
    if (!PAGE_EXISTS) return; // predicato del contratto: pagina assente ⇒ niente assert DOM
    const c = charterFor('cassetto')!;
    const html = renderToStaticMarkup(createElement(CharterSection, { charter: c }));
    const order = [
      'data-charter-verdict',
      'data-charter-appreciated',
      'data-charter-open-issues',
      'data-charter-open-exploration',
      'data-charter-technical',
    ];
    let last = -1;
    for (const marker of order) {
      const idx = html.indexOf(marker);
      expect(idx, `sezione ${marker} assente nel markup`).toBeGreaterThan(-1);
      expect(idx, `${marker} fuori ordine nella forma fissa`).toBeGreaterThan(last);
      last = idx;
    }
    // niente accordion/disclosure: la forma è fissa e sempre visibile
    expect(html).not.toContain('<details');
    expect(html).not.toContain('aria-expanded');
    // riga verdetto = stage calcolato + confidence
    expect(html).toContain('open'); // stage cassetto
    expect(html).toContain('director-verified'); // confidence — promosso OB-7 2026-11-21
    expect(html).toContain('orn. II'); // ornamentLevel dal ruling OB-7
  });
});
