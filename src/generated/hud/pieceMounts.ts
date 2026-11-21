// GENERATED barrel — PLAN-130: unica via di montaggio dei pezzi non-spec.
// Scritto dallo script di risoluzione piece-kit; i componenti importano
// pieceRef("<slug>-vN"), MAI l'asset diretto né path CSS a mano.
// Vuoto di proposito finché il pilota non monta il primo pezzo.
export const pieceMounts = {} as const;

export function pieceRef(id: string): string {
  const entry = (pieceMounts as Record<string, string>)[id];
  if (!entry) throw new Error(`pieceRef: unknown piece ${id}`);
  return entry;
}
