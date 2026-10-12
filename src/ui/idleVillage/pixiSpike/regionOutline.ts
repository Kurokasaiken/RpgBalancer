/**
 * Region outlines as straight-ish polylines, traced from a binary cell mask.
 *
 * The region ink used to be the mask's pixel edge (blur + erosion), so it wobbled stair-step by stair-step along the
 * coast. Here the boundary is walked once on the cell grid, then simplified with Ramer–Douglas–Peucker: the line keeps
 * the real shape of the territory but only the corners that matter, so it reads as a drawn border rather than a trace.
 */

export type OutlinePoint = readonly [number, number];

/** Boundary loops (outer rims and holes) of the cells where `inside` is true, as grid-corner polylines. */
export function traceBoundaryLoops(
  width: number,
  height: number,
  inside: (x: number, y: number) => boolean,
): OutlinePoint[][] {
  const stride = width + 1;
  const vertexKey = (x: number, y: number) => y * stride + x;
  // Directed edges with the inside on the left, so every loop runs one consistent way round.
  const edges: { from: number; to: number; used: boolean; end: OutlinePoint }[] = [];
  const outgoing = new Map<number, number[]>();
  const addEdge = (fx: number, fy: number, tx: number, ty: number) => {
    const from = vertexKey(fx, fy);
    const index = edges.length;
    edges.push({ from, to: vertexKey(tx, ty), used: false, end: [tx, ty] });
    const list = outgoing.get(from);
    if (list) list.push(index);
    else outgoing.set(from, [index]);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      if (!inside(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!inside(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!inside(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!inside(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }

  const loops: OutlinePoint[][] = [];
  for (let start = 0; start < edges.length; start += 1) {
    if (edges[start].used) continue;
    const loop: OutlinePoint[] = [];
    let current = start;
    while (!edges[current].used) {
      const edge = edges[current];
      edge.used = true;
      loop.push(edge.end);
      const next = (outgoing.get(edge.to) ?? []).find((candidate) => !edges[candidate].used);
      if (next === undefined) break;
      current = next;
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}

/** Ramer–Douglas–Peucker on an open polyline: keeps every point farther than `epsilon` from the chord. */
function simplifyOpen(points: readonly OutlinePoint[], epsilon: number): OutlinePoint[] {
  if (points.length < 3) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const length = Math.hypot(dx, dy) || 1;
  let worst = 0;
  let worstIndex = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const distance = Math.abs(dy * px - dx * py + last[0] * first[1] - last[1] * first[0]) / length;
    if (distance > worst) {
      worst = distance;
      worstIndex = i;
    }
  }
  if (worst <= epsilon) return [first, last];
  const left = simplifyOpen(points.slice(0, worstIndex + 1), epsilon);
  const right = simplifyOpen(points.slice(worstIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

/** Simplifies a closed loop: split at its two farthest points so the recursion has real endpoints. */
export function simplifyLoop(loop: readonly OutlinePoint[], epsilon: number): OutlinePoint[] {
  if (loop.length < 4) return [...loop];
  const [ax, ay] = loop[0];
  let far = 0;
  let farDistance = -1;
  for (let i = 1; i < loop.length; i += 1) {
    const d = (loop[i][0] - ax) ** 2 + (loop[i][1] - ay) ** 2;
    if (d > farDistance) {
      farDistance = d;
      far = i;
    }
  }
  const head = simplifyOpen([...loop.slice(0, far + 1)], epsilon);
  const tail = simplifyOpen([...loop.slice(far), loop[0]], epsilon);
  return dropStraightVertices([...head.slice(0, -1), ...tail.slice(0, -1)]);
}

/** Removes vertices that sit exactly on the segment between their neighbours (the loop's start point often does). */
function dropStraightVertices(points: OutlinePoint[]): OutlinePoint[] {
  let result = points;
  let changed = true;
  while (changed && result.length > 3) {
    changed = false;
    const next: OutlinePoint[] = [];
    for (let i = 0; i < result.length; i += 1) {
      const prev = result[(i - 1 + result.length) % result.length];
      const cur = result[i];
      const after = result[(i + 1) % result.length];
      const cross = (cur[0] - prev[0]) * (after[1] - cur[1]) - (cur[1] - prev[1]) * (after[0] - cur[0]);
      if (Math.abs(cross) < 1e-9) changed = true;
      else next.push(cur);
    }
    result = next.length >= 3 ? next : result;
    if (next.length < 3) break;
  }
  return result;
}
