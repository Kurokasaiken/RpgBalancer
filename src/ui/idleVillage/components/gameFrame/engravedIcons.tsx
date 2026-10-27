import React from 'react';

/**
 * Engraved icon set — bible §11.6, PLAN-058 T3.2.
 *
 * Solid monochrome glyphs on a 24 grid: `fill="currentColor"`, never a stroke, so the colour
 * comes from the container token exactly like text does. One heavy silhouette per glyph
 * filling ~70–80% of the square, symmetric and centred (D2), no skulls in this engraved set (D3; the painted danger indicator `ui-danger-skull` is a Director-approved exception, 2026-10-27), no
 * circle-with-a-symbol badges and no ticks (D6). Holes are `evenodd` cut-outs, never an
 * overlaid second colour.
 *
 * Ids follow `src/docs/docs/art-direction/icons/registry.yaml`. Ids prefixed `ico-` and
 * the few extras at the bottom are T3.2 extensions the HUD needs beyond the registry's
 * first list (the quest window phases, the epilogue sections). Painted objects (resources,
 * threats) have no engraved twin: they are images, see `HUD_ICON_ASSETS` in `hudIcons.tsx`.
 */
export type EngravedIconId =
  // comandi
  | 'cmd-menu' | 'cmd-pause' | 'cmd-play' | 'cmd-speed' | 'cmd-panels' | 'cmd-eye' | 'cmd-eye-off'
  | 'cmd-close' | 'cmd-filter' | 'cmd-sort' | 'cmd-lock' | 'cmd-recenter' | 'cmd-minimize' | 'cmd-help'
  | 'cmd-chevron-left' | 'cmd-chevron-right' | 'cmd-pin'
  // navigazione
  | 'nav-village' | 'nav-map' | 'nav-shop' | 'nav-tavern' | 'nav-company' | 'nav-bag' | 'nav-chronicle'
  // tipi evento
  | 'evt-quest' | 'evt-expedition' | 'evt-construction' | 'evt-harvest' | 'evt-visit' | 'evt-combat'
  // ruoli e stato
  | 'role-leader' | 'role-member' | 'role-bodyguard' | 'role-scout' | 'status-wound' | 'status-fallen'
  // oggetti usati dalle finestre HUD
  | 'ico-scroll' | 'ico-axe' | 'ico-gust' | 'ico-chest' | 'ico-pouch' | 'ico-cup' | 'ico-vial' | 'ico-spark'
  | 'ico-target' | 'ico-grapnel' | 'ico-salve' | 'ico-banner';

const EO = { fillRule: 'evenodd', clipRule: 'evenodd' } as const;

const GLYPHS: Record<EngravedIconId, React.ReactNode> = {
  'cmd-menu': (
    <>
      <rect x="3" y="4.6" width="18" height="3.4" rx="1" />
      <rect x="3" y="10.3" width="18" height="3.4" rx="1" />
      <rect x="3" y="16" width="18" height="3.4" rx="1" />
    </>
  ),
  'cmd-pause': (
    <>
      <rect x="5.2" y="4" width="5" height="16" rx="1.1" />
      <rect x="13.8" y="4" width="5" height="16" rx="1.1" />
    </>
  ),
  'cmd-play': <path d="M6.6 3.8 20.4 12 6.6 20.2z" />,
  'cmd-speed': <path d="M2.6 5 11.6 12 2.6 19zM12.4 5 21.4 12 12.4 19z" />,
  'cmd-panels': (
    <>
      <path d="M10 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1.4V6.4H8V5a2 2 0 0 1 2-2z" />
      <rect x="3" y="8" width="13" height="13" rx="2" />
    </>
  ),
  'cmd-eye': (
    <path
      {...EO}
      d="M12 5C7 5 3 9.2 1.8 12 3 14.8 7 19 12 19s9-4.2 10.2-7C21 9.2 17 5 12 5zM12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
    />
  ),
  'cmd-eye-off': (
    <>
      <path d="M2.5 9.6C5 14.2 8.3 16 12 16s7-1.8 9.5-6.4l-1.9-1.1C17.6 12 15 13.8 12 13.8S6.4 12 4.4 8.5z" />
      <path d="M11.1 16.2h1.8v4.4h-1.8zM7.7 14.9l1.6.6-1.8 3.8-1.5-.8zM16.3 14.9l-1.6.6 1.8 3.8 1.5-.8z" />
    </>
  ),
  'cmd-close': <path d="M5.4 3.6 12 10.2l6.6-6.6 1.8 1.8L13.8 12l6.6 6.6-1.8 1.8L12 13.8l-6.6 6.6-1.8-1.8L10.2 12 3.6 5.4z" />,
  'cmd-filter': <path d="M3 4.5h18l-6.8 8.1V20H9.8v-7.4z" />,
  'cmd-sort': <path d="M12 3l6.6 7.4H5.4zM12 21l-6.6-7.4h13.2z" />,
  'cmd-lock': (
    <>
      <path
        {...EO}
        d="M6.5 10.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM12 12.9a1.9 1.9 0 0 0-.9 3.6V19h1.8v-2.5a1.9 1.9 0 0 0-.9-3.6z"
      />
      <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11h-2.4V7.5a2.1 2.1 0 0 0-4.2 0V11z" />
    </>
  ),
  'cmd-recenter': (
    <>
      <path {...EO} d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 6.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6z" />
      <circle cx="12" cy="12" r="2.4" />
      <rect x="11" y="1.6" width="2" height="5" rx=".6" />
      <rect x="11" y="17.4" width="2" height="5" rx=".6" />
      <rect x="1.6" y="11" width="5" height="2" rx=".6" />
      <rect x="17.4" y="11" width="5" height="2" rx=".6" />
    </>
  ),
  'cmd-minimize': <rect x="4" y="14.6" width="16" height="3.4" rx="1" />,
  'cmd-help': (
    <>
      <path d="M7.9 8.9C7.9 5.8 9.7 4 12.2 4c2.7 0 4.4 1.7 4.4 4 0 2.1-1.3 3-2.5 3.9-1 .8-1.6 1.3-1.6 2.6v.4h-2.6v-.6c0-2.3 1-3.3 2.1-4.1.9-.7 1.6-1.2 1.6-2.1 0-.9-.6-1.5-1.6-1.5-1.1 0-1.8.7-1.8 2.2z" />
      <circle cx="12.2" cy="19" r="1.7" />
    </>
  ),
  'cmd-chevron-left': <path d="M15.1 4.4 7.5 12l7.6 7.6-1.9 1.9L3.7 12l9.5-9.5z" />,
  'cmd-chevron-right': <path d="M8.9 4.4 16.5 12l-7.6 7.6 1.9 1.9L20.3 12l-9.5-9.5z" />,
  'cmd-pin': (
    <>
      <rect x="7" y="2.4" width="10" height="2.8" rx="1" />
      <path d="M8.6 5.2h6.8l.9 6.2H7.7z" />
      <rect x="5" y="11.4" width="14" height="2.8" rx="1" />
      <path d="M10.9 14.2h2.2v6.2L12 22.4l-1.1-2z" />
    </>
  ),

  'nav-village': (
    <>
      <path d="M12 3.2l9.5 8H19.2v9.3h-5V14.5H9.8v6H4.8v-9.3H2.5z" />
      <rect x="15.6" y="4.4" width="2.6" height="5" />
    </>
  ),
  'nav-map': <path d="M2.8 6.6 8.4 4.5v13L2.8 19.6zM9.8 4.5l4.4 2.1v13l-4.4-2.1zM15.6 6.6l5.6-2.1v13l-5.6 2.1z" />,
  'nav-shop': (
    <>
      <rect x="2" y="2.4" width="2.2" height="19.2" rx=".7" />
      <rect x="4" y="3.4" width="16.6" height="1.8" rx=".7" />
      <rect x="7.2" y="5.2" width="1.4" height="2.8" />
      <rect x="16" y="5.2" width="1.4" height="2.8" />
      <path
        {...EO}
        d="M7 8h10.4a1.4 1.4 0 0 1 1.4 1.4v8.4a1.4 1.4 0 0 1-1.4 1.4H7a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 7 8zM10.6 9.4h3.2l-.6 1.6h-2zM12.2 11.6c2.4 0 4 1.5 4 3.4 0 1.6-1.1 2.6-2.6 2.6h-2.8c-1.5 0-2.6-1-2.6-2.6 0-1.9 1.6-3.4 4-3.4z"
      />
    </>
  ),
  'nav-tavern': (
    <>
      <path d="M5.6 3.6h12.8c.4 1 .7 2 .9 3.4H4.7c.2-1.4.5-2.4.9-3.4z" />
      <path d="M4.6 8.2h14.8c.9 2.5 1.1 5.1 0 7.6H4.6c-1.1-2.5-.9-5.1 0-7.6z" />
      <path d="M4.7 17h14.6c-.2 1.4-.5 2.4-.9 3.4H5.6c-.4-1-.7-2-.9-3.4z" />
    </>
  ),
  'nav-company': (
    <>
      <circle cx="12" cy="7.4" r="3.4" />
      <path d="M5.6 19.4v-1.6c0-2.8 2.9-4.6 6.4-4.6s6.4 1.8 6.4 4.6v1.6z" />
      <circle cx="4.8" cy="10.2" r="2.3" />
      <path d="M.6 19.4v-1.4c0-1.8 1.7-3.1 4.1-3.1.6 0 1.2.1 1.7.2-.9.9-1.4 2-1.4 3.2v1.1z" />
      <circle cx="19.2" cy="10.2" r="2.3" />
      <path d="M23.4 19.4v-1.4c0-1.8-1.7-3.1-4.1-3.1-.6 0-1.2.1-1.7.2.9.9 1.4 2 1.4 3.2v1.1z" />
    </>
  ),
  'nav-bag': (
    <path
      {...EO}
      d="M5.04 2.60 L18.96 2.60 L18.96 3.02 L19.07 3.65 L19.17 4.28 L19.38 4.90 L19.59 5.53 L19.80 6.16 L20.01 6.79 L20.22 7.42 L20.22 8.05 L20.43 9.30 L20.64 9.93 L20.95 10.56 L21.16 11.19 L21.48 11.81 L21.69 12.44 L21.79 13.07 L21.90 13.70 L22.00 14.33 L22.00 14.96 L21.90 15.58 L21.79 16.21 L21.48 16.84 L21.06 17.47 L20.53 18.10 L19.80 18.73 L18.02 19.35 L16.87 19.98 L14.77 20.61 L13.20 21.24 L12.00 21.55 L10.80 21.24 L9.23 20.61 L7.13 19.98 L5.98 19.35 L4.20 18.73 L3.47 18.10 L2.94 17.47 L2.52 16.84 L2.21 16.21 L2.10 15.58 L2.00 14.96 L2.00 14.33 L2.10 13.70 L2.21 13.07 L2.31 12.44 L2.52 11.81 L2.84 11.19 L3.05 10.56 L3.36 9.93 L3.57 9.30 L3.78 8.05 L3.78 7.42 L3.99 6.79 L4.20 6.16 L4.41 5.53 L4.62 4.90 L4.83 4.28 L4.93 3.65 L5.04 3.02 L5.04 2.60zM3.99 8.46 L4.83 9.31 L5.69 10.08 L6.55 10.77 L7.43 11.38 L8.32 11.92 L9.23 12.37 L10.14 12.75 L11.06 13.06 L12.00 13.28 L12.94 13.06 L13.86 12.75 L14.77 12.37 L15.68 11.92 L16.57 11.38 L17.45 10.77 L18.31 10.08 L19.17 9.31 L20.01 8.46 L20.58 9.03 L19.72 9.89 L18.83 10.69 L17.92 11.41 L17.00 12.05 L16.06 12.62 L15.11 13.10 L14.14 13.50 L13.15 13.83 L12.00 14.08 L10.85 13.83 L9.86 13.50 L8.89 13.10 L7.94 12.62 L7.00 12.05 L6.08 11.41 L5.17 10.69 L4.28 9.89 L3.42 9.03zM4.79 3.21 L4.79 7.86 L5.49 8.64 L6.21 9.35 L6.96 9.99 L7.73 10.55 L8.54 11.04 L9.36 11.46 L10.22 11.80 L11.09 12.08 L12.00 12.28 L12.91 12.08 L13.78 11.80 L14.64 11.46 L15.46 11.04 L16.27 10.55 L17.04 9.99 L17.79 9.35 L18.51 8.64 L19.21 7.86 L19.21 3.21zM5.49 3.91 L5.49 7.86 L6.18 8.50 L6.88 9.07 L7.58 9.60 L8.30 10.06 L9.02 10.48 L9.75 10.84 L10.49 11.14 L11.24 11.39 L12.00 11.58 L12.76 11.39 L13.51 11.14 L14.25 10.84 L14.98 10.48 L15.70 10.06 L16.42 9.60 L17.12 9.07 L17.82 8.50 L18.51 7.86 L18.51 3.91zM10.8 14.3h.6v1.3h-.6zM12.6 14.3h.6v1.3h-.6zM10.2 15.6h3.6v2.2h-3.6zM10.8 16.2h2.4v1h-2.4zM10.8 17.8h.6v1.2h-.6zM12.6 17.8h.6v1.2h-.6zM10.8 19h2.4v.5h-2.4zM4.26 16.44 L5.45 17.30 L6.64 18.02 L7.83 18.59 L9.02 19.02 L10.21 19.31 L11.40 19.45 L12.60 19.45 L13.79 19.31 L14.98 19.02 L16.17 18.59 L17.36 18.02 L18.55 17.30 L19.74 16.44 L19.74 17.04 L18.55 17.90 L17.36 18.62 L16.17 19.19 L14.98 19.62 L13.79 19.91 L12.60 20.05 L11.40 20.05 L10.21 19.91 L9.02 19.62 L7.83 19.19 L6.64 18.62 L5.45 17.90 L4.26 17.04z"
    />
  ),
  'nav-chronicle': <path d="M2.8 5.6c3-1.1 6.1-1 8.4.8V20c-2.3-1.6-5.4-1.9-8.4-.8zM21.2 5.6c-3-1.1-6.1-1-8.4.8V20c2.3-1.6 5.4-1.9 8.4-.8z" />,

  'evt-quest': (
    <>
      <path d="M9.2 2.8h5.6l-1 11.4h-3.6z" />
      <circle cx="12" cy="19.2" r="2.3" />
    </>
  ),
  'evt-expedition': (
    <>
      <path d="M12 4.4 22.2 20.6H14.8L12 13.2l-2.8 7.4H1.8z" />
      <rect x="11.4" y="1" width="1.2" height="4.4" />
      <path d="M12.6 1l4.4 1.5-4.4 1.5z" />
    </>
  ),
  'evt-construction': (
    <g transform="rotate(45 12 12)">
      <path d="M5.8 2.6h12.4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5.8a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />
      <rect x="10.6" y="9.4" width="2.8" height="12.4" rx="1" />
    </g>
  ),
  'evt-harvest': (
    <>
      <rect x="11.1" y="8" width="1.8" height="13.8" rx=".6" />
      <ellipse cx="12" cy="4.3" rx="1.8" ry="2.9" />
      <ellipse cx="9.4" cy="8.2" rx="1.8" ry="3.1" transform="rotate(-32 9.4 8.2)" />
      <ellipse cx="14.6" cy="8.2" rx="1.8" ry="3.1" transform="rotate(32 14.6 8.2)" />
      <ellipse cx="9.4" cy="13" rx="1.8" ry="3.1" transform="rotate(-32 9.4 13)" />
      <ellipse cx="14.6" cy="13" rx="1.8" ry="3.1" transform="rotate(32 14.6 13)" />
      <ellipse cx="9.4" cy="17.8" rx="1.8" ry="3.1" transform="rotate(-32 9.4 17.8)" />
      <ellipse cx="14.6" cy="17.8" rx="1.8" ry="3.1" transform="rotate(32 14.6 17.8)" />
    </>
  ),
  'evt-visit': (
    <>
      <path {...EO} d="M4.4 21V10a7.6 7.6 0 0 1 15.2 0v11zM7.6 21h8.8V10.3a4.4 4.4 0 0 0-8.8 0z" />
      <path d="M8.2 10.4 12.8 12.2V19.6L8.2 21z" />
    </>
  ),
  'evt-combat': (
    <g>
      <g transform="rotate(45 12 12)">
        <path d="M12 1.2l1.5 3.2v10h-3V4.4zM8 15.4h8v2H8zM11 17.4h2v3.6h-2z" />
        <circle cx="12" cy="21.8" r="1.2" />
      </g>
      <g transform="rotate(-45 12 12)">
        <path d="M12 1.2l1.5 3.2v10h-3V4.4zM8 15.4h8v2H8zM11 17.4h2v3.6h-2z" />
        <circle cx="12" cy="21.8" r="1.2" />
      </g>
    </g>
  ),

  'role-leader': (
    <>
      <path d="M3.5 16.2V7.4L8 12l4-7.6L16 12l4.5-4.6v8.8z" />
      <rect x="3.5" y="17.6" width="17" height="3.1" rx=".9" />
    </>
  ),
  'role-member': (
    <>
      <circle cx="12" cy="7.6" r="4.2" />
      <path d="M3.8 21c0-5.8 3.6-8.2 8.2-8.2s8.2 2.4 8.2 8.2z" />
    </>
  ),
  'role-bodyguard': (
    <path
      {...EO}
      d="M12 2.4l8 2.8v6.3c0 5-3.5 8.5-8 10.3-4.5-1.8-8-5.3-8-10.3V5.2zM6.6 8.6V11L12 15.2 17.4 11V8.6L12 12.8z"
    />
  ),
  'role-scout': (
    <>
      <path d="M9.8 3.4C18.4 6.4 18.4 17.6 9.8 20.6v-2.2c5.2-2.8 5.2-9.6 0-12.8z" />
      <rect x="9.2" y="3.8" width="1.2" height="16.4" />
      <rect x="3" y="11.4" width="17.4" height="1.2" rx=".3" />
      <path d="M22.8 12 19.8 10.1v3.8z" />
      <path d="M2.6 9.8 5.6 11.4H2.6zM2.6 14.2 5.6 12.6H2.6z" />
    </>
  ),
  'status-wound': <path {...EO} d="M12 2.4C12 2.4 5.4 10 5.4 14.8a6.6 6.6 0 0 0 13.2 0C18.6 10 12 2.4 12 2.4zM8.2 14.2a4 4 0 0 0 2.3 4.1l.7-1.7a2.3 2.3 0 0 1-1.2-2.4z" />,
  'status-fallen': (
    <>
      <path {...EO} d="M5.8 19V9.2a6.2 6.2 0 0 1 12.4 0V19zM11 7.2v2.4H8.6v2H11V16h2v-4.4h2.4v-2H13V7.2z" />
      <rect x="3.8" y="19.8" width="16.4" height="2" rx=".8" />
    </>
  ),

  'ico-scroll': (
    <g transform="rotate(-16 12 12)">
      <path {...EO} d="M5.8 2.6h12.4a2.2 2.2 0 0 1 0 4.4H5.8a2.2 2.2 0 0 1 0-4.4zM17.4 3.8a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
      <path {...EO} d="M7 7.6h10v8.8H7zM9 10v1.2h6V10zM9 13v1.2h4v-1.2z" />
      <path {...EO} d="M5.8 17h12.4a2.2 2.2 0 0 1 0 4.4H5.8a2.2 2.2 0 0 1 0-4.4zM17.4 18.2a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
    </g>
  ),
  'ico-axe': (
    <g transform="rotate(38 12 12)">
      <rect x="10.9" y="1.8" width="2.2" height="20" rx=".8" />
      <circle cx="12" cy="21.6" r="1.4" />
      <path d="M13.1 4.4 18.2 3.6C20 7.6 19.6 11 17.2 14.6l-2.2-2c.2-1.4-.4-2.6-1.9-3z" />
    </g>
  ),
  'ico-gust': (
    <>
      <path d="M3 7.4H12a1.2 1.2 0 1 0-1.2-1.2H8.8A3.2 3.2 0 1 1 12 9.4H3z" />
      <rect x="5.4" y="11" width="12.4" height="2.2" rx="1.1" />
      <path transform="rotate(180 12 12)" d="M3 7.4H12a1.2 1.2 0 1 0-1.2-1.2H8.8A3.2 3.2 0 1 1 12 9.4H3z" />
    </>
  ),
  'ico-chest': (
    <>
      <path d="M3.2 10.4C3.2 5.8 7 3 12 3s8.8 2.8 8.8 7.4z" />
      <path
        {...EO}
        d="M3.2 11.8h17.6v7.8a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4zM12 13.4a1.7 1.7 0 0 0-.8 3.2V19h1.6v-2.4a1.7 1.7 0 0 0-.8-3.2zM6 16a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8zM18 16a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z"
      />
    </>
  ),
  'ico-pouch': (
    <>
      <path d="M8.2 2.2h7.6l-1 3H9.2z" />
      <path d="M12 7.4c5 0 8.6 3.6 8.6 8 0 3.6-2.6 5.8-6 5.8H9.4c-3.4 0-6-2.2-6-5.8 0-4.4 3.6-8 8.6-8z" />
      <path d="M9.2 6.4h5.6l.4 1.6H8.8z" />
    </>
  ),
  'ico-cup': (
    <>
      <path d="M5.4 3.4h13.2c0 5.3-2.4 8.7-6.6 9.4-4.2-.7-6.6-4.1-6.6-9.4z" />
      <rect x="10.8" y="12.6" width="2.4" height="5" />
      <path d="M7.4 21c0-2 1.9-3.4 4.6-3.4s4.6 1.4 4.6 3.4z" />
    </>
  ),
  'ico-vial': (
    <>
      <rect x="8.8" y="1.8" width="6.4" height="3" rx="1" />
      <rect x="10" y="4.4" width="4" height="5" />
      <path
        {...EO}
        d="M12 8.2a7 7 0 1 0 0 14 7 7 0 1 0 0-14zM5.6 15.4Q8.8 13.4 12 15.4T18.4 15.4V17Q15.2 19 12 17T5.6 17zM9.4 18.8a.8.8 0 1 0 0 1.6.8.8 0 1 0 0-1.6z"
      />
    </>
  ),
  'ico-spark': <path d="M12 2.4c.8 5.6 4 8.8 9.6 9.6-5.6.8-8.8 4-9.6 9.6-.8-5.6-4-8.8-9.6-9.6 5.6-.8 8.8-4 9.6-9.6z" />,

  /* R-196 belt items — authored in the set's idiom (solid silhouette, evenodd
   * holes, ~75% fill). target = two rings + centre; grapnel = ring, shaft and
   * twin flukes; salve = lobed heart; banner = swallow-tailed pennant on a pole. */
  'ico-target': (
    <>
      <path {...EO} d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zM12 5.6a6.4 6.4 0 1 1 0 12.8 6.4 6.4 0 0 1 0-12.8z" />
      <circle cx="12" cy="12" r="2.7" />
    </>
  ),
  'ico-grapnel': (
    <>
      <path {...EO} d="M12 1.6a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM12 3.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      <rect x="10.9" y="6.8" width="2.2" height="13.8" rx="0.9" />
      <path {...EO} d="M3.8 12.6l2.8-1.4.4 2.2c.7 3 2.2 4.6 5 5.2 2.8-.6 4.3-2.2 5-5.2l.4-2.2 2.8 1.4-.6 2.4c-1 3.8-3.4 6-7.4 6.8-4-.8-6.4-3-7.4-6.8z" />
    </>
  ),
  'ico-salve': (
    <path d="M12 20.6C6.8 16.6 3.2 13.4 3.2 9.2 3.2 6.2 5.5 4 8.4 4c1.6 0 3 .8 3.6 2 .6-1.2 2-2 3.6-2 2.9 0 5.2 2.2 5.2 5.2 0 4.2-3.6 7.4-8.8 11.4z" />
  ),
  'ico-banner': (
    <>
      <rect x="3.8" y="1.8" width="2.2" height="20.4" rx="0.9" />
      <path d="M6 3h14l-3.4 4.5L20 12H6z" />
    </>
  ),

};

export const ENGRAVED_ICON_IDS = Object.keys(GLYPHS) as EngravedIconId[];

export interface EngravedIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  id: EngravedIconId;
  /** Accessible name. Omit for a decorative glyph that sits next to a visible label. */
  label?: string;
  /** Native tooltip, rendered as the SVG `<title>` (use on glyphs that stand alone in running text). */
  title?: string;
  size?: number | string;
}

/**
 * One engraved glyph. Colour is `currentColor` (the container's token), size is the only
 * dimension; never pass `stroke`/`fill` — the set is solid by contract.
 */
export const EngravedIcon: React.FC<EngravedIconProps> = ({ id, label, title, size = 24, style, children: _children, ...rest }) => {
  const name = label ?? rest['aria-label'];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      focusable="false"
      role={name ? 'img' : undefined}
      aria-hidden={name ? undefined : true}
      data-engraved={id}
      style={{ flexShrink: 0, ...style }}
      {...rest}
      aria-label={name}
    >
      {title ? <title>{title}</title> : null}
      {GLYPHS[id]}
    </svg>
  );
};

export default EngravedIcon;
