/**
 * Component charter schema — PLAN-131 (battezzato Director 2026-11-21, r004).
 *
 * Un charter = la forma compilata di UN componente battezzato/candidato
 * (livello componente, non pezzo — i pezzi sono `pieces.json`, PLAN-130;
 * non comportamento — quello sono gli INV, v36). Record dati per
 * `componentId` = `LabEntry.id` (join, mai duplicato: l'autorità su
 * id/status/family/provenance è `src/pages/hud-lab/catalog.ts`).
 *
 * Regole di vocabolario (r001): `materials.material` ⊆ enum
 * `pieces.json.materials` — verificato dal gate `INV:hud-charters`, non
 * dallo schema (il charter consuma il vocabolario, non lo edita);
 * `materials.region` ⊆ anatomia del componente ∪ `{'global'}`.
 *
 * Autorità: `ornamentLevel` e `confidence:'director-verified'` esistono
 * SOLO dopo occhio Director — sui seed `reconstructed` la proposta vive
 * fuori dal record (un valore proposto non confermato nel record è la
 * deriva che questo plan cura).
 */
import { z } from 'zod';

/**
 * Chiavi di stato documentabili — fisse (r003): si documentano gli stati
 * che APPLICANO a quel componente, mai inventati per riempire la scheda.
 */
export const CHARTER_STATES = [
  'default',
  'hover',
  'press',
  'focus',
  'disabled',
  'empty',
  'full',
  'error',
] as const;
export type CharterState = (typeof CHARTER_STATES)[number];

/**
 * Tag materiale — vocabolario unico con `pieces.json.materials`
 * (PLAN-130). Tipo nudo: l'appartenenza all'enum è assert del gate
 * `INV:hud-charters`, non dello schema (estensione vocab = amend
 * PLAN-130 via ruling, mai edit da questo record).
 */
export type MaterialTag = string;

/** Sentinella per `materials.region` che vale su tutta la superficie. */
export const GLOBAL_REGION = 'global' as const;

/**
 * Ref a un ruling/sessione/audit che autorizza (`verifiedBy`,
 * `familyOrigin`, `openExploration[].ref`): mai vuota, mai placeholder —
 * «n/a» non passa (r004). Il check è di FORMA, non di autorità: la
 * veridicità procedurale è la stessa di tutti i ruling.
 */
const PLACEHOLDER_RE = /^\s*(n\/?a\.?|none|null|n\.?d\.?|tbd|todo|-|—|\.{3})\s*$/i;
export const rulingRefSchema = z
  .string()
  .min(4, 'ref must name the ruling/session/audit that authorizes')
  .refine((v) => !PLACEHOLDER_RE.test(v), 'ref placeholder («n/a», «—», «tbd») non accettato');

const materialEntrySchema = z
  .object({
    material: z.string().min(1),
    /** Nome di una regione/zona dell'anatomia, o `global`. */
    region: z.string().min(1),
    note: z.string().optional(),
  })
  .strict();

const regionsAnatomySchema = z
  .object({
    kind: z.literal('regions'),
    /** Path repo-root del `<surface>.regions.json` (PLAN-130) — mai ref morti. */
    ref: z.string().min(1),
    /**
     * sha256 letterale del file ref, incollato a compile-time. Il gate
     * stampa il nuovo hash su mismatch: bump = una riga — e un diff che
     * bumpa DEVE aggiornare i campi semantici o registrare il perché del
     * non-impatto in `note` (durevole, non run-scoped).
     */
    hash: z.string().regex(/^[0-9a-f]{64}$/, 'anatomy.hash = sha256 del file ref'),
    note: z.string().optional(),
  })
  .strict();

const zonesAnatomySchema = z
  .object({
    kind: z.literal('zones'),
    zones: z
      .array(
        z
          .object({
            name: z.string().min(1),
            medium: z.enum(['art', 'dom']),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

/**
 * Anatomia della superficie: `regions` = spec PLAN-130 esistente citata
 * per ref+hash (il charter la *cita*, non la riscrive); `zones` = mappa
 * dichiarata delle zone DOM/arte quando la spec non è ancora scritta.
 * Assente ⇒ il catalogo deve avere `status:'candidato'` («spec non ancora
 * scritta», mid-fork) — assert del gate.
 */
export const anatomySchema = z.discriminatedUnion('kind', [
  regionsAnatomySchema,
  zonesAnatomySchema,
]);

const stateEntrySchema = z
  .object({
    /** Cosa cambia: token / filtro / asset / layout. */
    changes: z.string().min(1),
    /** Criterio di leggibilità dichiarato. */
    legibility: z.string().optional(),
    /** Ruling che ha fissato lo stato. */
    ruling: z.string().optional(),
  })
  .strict();

const appreciatedSchema = z
  .object({
    /** PERCHÉ il tratto piace — il motivo del giudizio, non il vincolo
     *  (l'autorità vincolante vive nel `ruling` citato). */
    trait: z.string().min(1),
    ruling: z.string().optional(),
  })
  .strict();

const TYPE_FLOOR_ROLES = ['title', 'subtitle', 'label', 'body', 'numeric'] as const;

const typeFloorEntrySchema = z
  .object({
    role: z.enum(TYPE_FLOOR_ROLES),
    /** Minimo in px alla viewport canonica 1440×900. */
    minPx: z.number().positive().optional(),
    /** Ref GRANULARE (marker/sezione — mai «il documento» intero), citato non duplicato. */
    ref: z.string().optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.minPx === undefined && (e.ref === undefined || e.ref.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `typeFloor/${e.role}: serve minPx O ref — mai entry vacua`,
      });
    }
  });

const proportionsSchema = z
  .object({
    basis: z.enum(['slice-kit', 'dom', 'hybrid']),
    unit: z.string().min(1),
    resize: z.enum(['stretch', 'tile', 'fixed', 'dom-flow']),
    note: z.string().optional(),
  })
  .strict();

const openIssueSchema = z
  .object({
    summary: z.string().min(1),
    ref: z.string().optional(),
  })
  .strict();

const openExplorationSchema = z
  .object({
    /** Dimensione deliberatamente INDECISA: l'agente propone, non decide. */
    dimension: z.string().min(1),
    /** Chi l'ha aperta — obbligatorio; chiusura solo citando il ruling. */
    ref: rulingRefSchema,
    note: z.string().optional(),
  })
  .strict();

const rejectedSchema = z
  .object({
    /** Soluzione PROVATA e scartata dal Director — conoscenza negativa:
     *  un agente che propone varianti non la ripropone. */
    item: z.string().min(1),
    /** Perché scartata / cosa è stato scelto al suo posto. */
    reason: z.string().min(1),
    /** Ref al ruling che l'ha scartata — OBBLIGATORIO (mai orfana). */
    ruling: rulingRefSchema,
  })
  .strict();

export const componentCharterSchema = z
  .object({
    /** = `LabEntry.id` nel catalogo PLAN-129 (join, mai duplicato). */
    componentId: z.string().min(1),
    /** Tassonomia PLAN-113 — deve coincidere con `LabEntry.family`. */
    family: z.string().min(1),
    /**
     * `reconstructed` = compilato retroattivamente a memoria/codice;
     * `director-verified` = solo dopo occhio Director (OB-7). Un seed
     * ricostruito non è un difetto del componente: è «audit pendente».
     */
    confidence: z.enum(['reconstructed', 'director-verified']),
    /**
     * Ref al ruling/lettura che autorizza la verifica — OBBLIGATORIO su
     * `director-verified`; la promozione è un diff avviato dal Director
     * (autopromozione agente = violazione procedurale).
     */
    verifiedBy: z.string().min(1).optional(),
    /**
     * I monumentale · II prezioso · III funzionale. Assegnazione = giudizio
     * estetico → SOLO via ruling Director (v35). OBBLIGATORIO su
     * `director-verified`, VIETATO su `reconstructed` (la proposta vive
     * fuori dal record finché il Director non conferma).
     */
    ornamentLevel: z.enum(['I', 'II', 'III']).optional(),
    /** Materiale per regione anatomica — vocabolario PLAN-130, sentinella `global`. */
    materials: z.array(materialEntrySchema),
    anatomy: anatomySchema.optional(),
    /** Stati che APPLICANO (chiavi ⊆ CHARTER_STATES, sottoinsieme libero;
     *  `default` richiesto su battezzato — gate). */
    states: z.partialRecord(z.enum(CHARTER_STATES), stateEntrySchema),
    appreciated: z.array(appreciatedSchema),
    typeFloor: z.array(typeFloorEntrySchema),
    proportions: proportionsSchema,
    /**
     * Ref alla fork card / ruling che fonda la famiglia — OBBLIGATORIO
     * quando la famiglia ha UN SOLO componente nel catalogo (regola
     * deterministica dal catalogo vivo); persiste quando la famiglia
     * cresce (ancora fondativa, non requisito transitorio).
     */
    familyOrigin: rulingRefSchema.optional(),
    /** Difetti / ruling pendenti noti. */
    openIssues: z.array(openIssueSchema).optional(),
    /** Dimensioni indecise: si propone, non si decide. */
    openExploration: z.array(openExplorationSchema).optional(),
    /** Soluzioni provate e scartate — memoria negativa, non riproporre. */
    rejected: z.array(rejectedSchema).optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.confidence === 'director-verified') {
      if (!c.verifiedBy || PLACEHOLDER_RE.test(c.verifiedBy)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'confidence=director-verified richiede verifiedBy (ref al ruling/lettura che autorizza)',
        });
      }
      if (c.ornamentLevel === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'confidence=director-verified richiede ornamentLevel (giudizio Director, v35)',
        });
      }
    }
    if (c.confidence === 'reconstructed' && c.ornamentLevel !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'ornamentLevel vietato su reconstructed — la proposta vive nelle note di verifica finché il Director non conferma',
      });
    }
  });

export type ComponentCharter = z.infer<typeof componentCharterSchema>;

/* ------------------------------------------------------------------ */
/* Stage estetico — DERIVATO dal gate, mai campo del charter (r002).    */
/* Misura la *documentazione delle decisioni*, non la bontà estetica:    */
/* un converged con 10 openIssues è legittimo. Partizione completa.      */
/* ------------------------------------------------------------------ */

export type CharterStage = 'open' | 'converged' | 'documented' | 'undocumented';

/**
 * Partizione completa a quattro stage (r004):
 * - `open`         = openExploration non vuoto;
 * - `converged`    = openExploration vuoto + appreciated ≥ 1;
 * - `documented`   = openExploration vuoto + appreciated = 0 + openIssues non vuoto;
 * - `undocumented` = tutti e tre vuoti (irraggiungibile via gate:
 *   battezzato ⇒ appreciated ≥1; candidato ⇒ almeno uno dei tre non vuoto).
 */
export function computeCharterStage(c: ComponentCharter): CharterStage {
  if ((c.openExploration ?? []).length > 0) return 'open';
  if (c.appreciated.length > 0) return 'converged';
  if ((c.openIssues ?? []).length > 0) return 'documented';
  return 'undocumented';
}
