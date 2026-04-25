export interface MapBoardShellProps {
  /** Title displayed above the primary board card. */
  boardTitle?: string;
  /** Optional custom body rendered inside the board card; defaults to a dashed placeholder. */
  boardBody?: React.ReactNode;
  /** Optional button element used to open the theater overlay. */
  openButton?: React.ReactNode;
  /** Optional button element used to close the theater overlay. */
  closeButton?: React.ReactNode;
}

/**
 * Structural wrapper that keeps the board preview and Ancillary panels aligned with the
 * Prompt 3 plan. Encapsulates the shared layout so future agents can swap board content
 * without touching the sandbox page.
 */
const MapBoardShell: React.FC<MapBoardShellProps> = ({
  boardTitle = 'Board',
  boardBody,
  openButton,
  closeButton,
}) => {
  const renderedBoardBody =
    boardBody ?? <div className="h-64 rounded border border-dashed border-slate-700 bg-slate-900/40" />;

  return (
    <section className="default-card space-y-4" data-testid="map-board-shell">
      <div className="flex justify-between gap-4">
        <div className="text-[11px] uppercase tracking-[0.35em] text-slate-500">{boardTitle}</div>
        <div className="flex gap-2">
          {openButton}
          {closeButton}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">{renderedBoardBody}</div>
    </section>
  );
};

export default MapBoardShell;
