/**
 * eventsPanelConfig — visual/geometry contract of the OPEN Events panel
 * (Director reference 2026-11-26, `.mw/specs/hud-eventi/refs/ref-eventi-panel-aperto-2026-11-26.jpg`:
 * «questo è il componente aperto»).
 *
 * The signed art is keyed from magenta and sliced by
 * `scripts/hud-real/build-events-panel.py` into full-width horizontal bands
 * (976px source): `panel-bodytop` (filter slots row, starting below the
 * header band — the collapsed bar stays the visual header), `panel-row`
 * (one row ending with its divider, tiling), `panel-bottom` (closing
 * ornament). Geometry is authored in design px at 2× resolution, the same
 * model as the Events bar, so the panel is 488 wide; production scales it to the shared
 * 419.5px Time-shell width because the collapsed bar no longer forks shell art.
 *
 * Director 2026-11-26: clicking the closed bar stretches "the part below"
 * downward into this panel; the panel can grow longer and show more rows.
 */
import { z } from 'zod';

const circleSchema = z.object({ cx: z.number(), cy: z.number(), r: z.number().positive() }).strict();

export const eventsPanelConfigSchema = z
  .object({
    assets: z
      .object({
        bodytop: z.string().min(1),
        row: z.string().min(1),
        bottom: z.string().min(1),
      })
      .strict(),
    /** Design-px measures (half source px). Width matches the bar exactly. */
    art: z
      .object({
        w: z.number().positive(),
        bodytopH: z.number().positive(),
        rowH: z.number().positive(),
        bottomH: z.number().positive(),
      })
      .strict(),
    /** Circular filter slots inside the bodytop band: first is "all",
     *  the next three are the highest-priority ledger types. */
    slots: z.array(circleSchema).length(4),
    row: z
      .object({
        medallion: circleSchema,
        /** Text field inside a row, clear of medallion and chevron. */
        field: z.object({ x: z.number(), w: z.number() }).strict(),
        iconSizePx: z.number().positive(),
        titleWeight: z.number().positive(),
        countdownWeight: z.number().positive(),
      })
      .strict(),
    behavior: z
      .object({
        /** Rows beyond this cap scroll inside the row stack instead of
         *  growing the panel past the viewport. */
        maxRows: z.number().int().positive(),
        expandMs: z.number().positive(),
        collapseMs: z.number().positive(),
        /** Design-px top of the stretching body inside the events slot. The
         *  collapsed bar is now the shared slim Time shell (54 design px high);
         *  docking at 50 tucks the body just under its lower rail, with no map
         *  showing through between bar and panel. */
        dockTopPx: z.number().positive(),
      })
      .strict(),
    fonts: z.object({ title: z.string().min(1), body: z.string().min(1) }).strict(),
    colors: z
      .object({
        text: z.string().min(1),
        dim: z.string().min(1),
        gold: z.string().min(1),
        shadow: z.string().min(1),
        focus: z.string().min(1),
        slotLit: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type EventsPanelConfig = z.infer<typeof eventsPanelConfigSchema>;

const RAW_EVENTS_PANEL_CONFIG: EventsPanelConfig = {
  assets: {
    bodytop: '/assets/ui/hud-real/events/panel-bodytop.webp',
    row: '/assets/ui/hud-real/events/panel-row.webp',
    bottom: '/assets/ui/hud-real/events/panel-bottom.webp',
  },
  art: { w: 488, bodytopH: 66, rowH: 49.5, bottomH: 44.5 },
  /* Measured on the keyed slices, halved to design px. Slot x-centers
   *  334.5/437.5/540.5/644 source, vertical center ~230-162=68 in the
   *  bodytop slice. */
  slots: [
    { cx: 167.25, cy: 34, r: 22 },
    { cx: 218.75, cy: 34, r: 22 },
    { cx: 270.25, cy: 34, r: 22 },
    { cx: 322, cy: 34, r: 22 },
  ],
  row: {
    medallion: { cx: 100, cy: 24.75, r: 18 },
    field: { x: 128, w: 255 },
    iconSizePx: 18,
    titleWeight: 700,
    countdownWeight: 700,
  },
  behavior: { maxRows: 5, expandMs: 420, collapseMs: 300, dockTopPx: 50 },
  fonts: {
    title: 'Marcellus, "Cardo", serif',
    body: '"Cardo", serif',
  },
  colors: {
    text: 'var(--skin-text-strong, #f3ead0)',
    dim: 'var(--skin-body-color, #cdbf8e)',
    gold: 'var(--skin-icon-color, #f1d88a)',
    shadow: '0 1px 2px rgba(3, 26, 30, 0.9)',
    focus: 'var(--skin-focus-ring, #e8c766)',
    slotLit: 'rgba(76, 217, 168, 0.55)',
  },
};

export const EVENTS_PANEL_CONFIG: EventsPanelConfig = eventsPanelConfigSchema.parse(RAW_EVENTS_PANEL_CONFIG);
