import { Container, Sprite, Texture } from 'pixi.js';

/**
 * PLAN-094: hinged silhouette rigs built from the Director's top-down art (scripts/build-mappa2-sealife.py).
 * A rig is a body plus separate parts (tail, fins, flippers, head), each hinged at its pivot onto the body.
 * The pieces are white + alpha and tinted at runtime with the deep-sea colour.
 */

export interface RigPartSpec {
  role: string;
  file: string;
  width: number;
  height: number;
  /** Part-local hinge point (px). Absent for the body. */
  pivot?: [number, number];
  /** Where the hinge sits on the body, relative to the body centre (px). */
  attach?: [number, number];
}

export interface RigSpec {
  /** Body length in px (the scale reference). */
  lengthPx: number;
  parts: RigPartSpec[];
}

export type PartKind = 'tail' | 'head' | 'fin' | 'flipperFront' | 'flipperRear';

export interface RigInst {
  /** Animal id in sea-life.json (`manta`, `tartaruga`...), set by the adapter. */
  id: string;
  root: Container;
  lengthPx: number;
  body: Sprite;
  parts: { sp: Sprite; kind: PartKind; side: number; ph: number; baseSx: number; baseSy: number }[];
}

/** Role of a part from where it attaches (head points to +x). */
export function classifyPart(attach: [number, number], len: number): PartKind {
  const ax = attach[0] / len;
  const ay = attach[1] / len;
  if (ax > 0.3 && Math.abs(ay) < 0.15) return 'head';
  if (ax < -0.3 && Math.abs(ay) < 0.2) return 'tail';
  if (Math.abs(ay) > 0.15) return ax > 0 ? 'flipperFront' : 'flipperRear';
  return 'fin';
}

export function buildRig(spec: RigSpec, tex: (file: string) => Texture | undefined, tint: number): RigInst | null {
  const bodySpec = spec.parts.find((p) => p.role === 'body');
  const bodyTex = bodySpec ? tex(bodySpec.file) : undefined;
  if (!bodySpec || !bodyTex) return null;
  const root = new Container();
  root.visible = false;
  root.eventMode = 'none';
  const body = new Sprite(bodyTex);
  body.anchor.set(0.5);
  body.tint = tint;
  root.addChild(body);
  const parts: RigInst['parts'] = [];
  for (const p of spec.parts) {
    if (p.role === 'body' || !p.pivot || !p.attach) continue;
    const t = tex(p.file);
    if (!t) continue;
    const sp = new Sprite(t);
    sp.anchor.set(p.pivot[0] / p.width, p.pivot[1] / p.height);
    const kind = classifyPart(p.attach, spec.lengthPx);
    // tuck flippers and head into the shell so no seam shows while they move
    const inset = kind === 'flipperFront' || kind === 'flipperRear' ? 16 : kind === 'head' ? 8 : 0;
    const dist = Math.hypot(p.attach[0], p.attach[1]) || 1;
    sp.position.set(p.attach[0] * (1 - inset / dist), p.attach[1] * (1 - inset / dist));
    sp.tint = tint;
    // draw the tail/fins under the body so the hinge tab tucks in
    root.addChildAt(sp, 0);
    parts.push({ sp, kind, side: p.attach[1] < 0 ? -1 : 1, ph: (parts.length * 1.7) % (Math.PI * 2), baseSx: 1, baseSy: 1 });
  }
  return { id: '', root, lengthPx: spec.lengthPx, body, parts };
}

/** Swim the hinged parts: tail sway, fin flutter, turtle rowing. `ph` offsets individuals. */
export function animateRig(r: RigInst, t: number, ph = 0, amp = 1): void {
  for (const p of r.parts) {
    const w = t + ph;
    switch (p.kind) {
      case 'tail': {
        // a tail is a wave, not a hinge: modest swing, slower beat, and the piece thins/lengthens a little on each
        // stroke so it reads as flexing instead of a rigid paddle flapping at the side (Director 2026-10-30)
        const sw = Math.sin(w * 3.1 + p.ph);
        p.sp.rotation = 0.2 * amp * sw;
        p.sp.scale.set(p.baseSx * (1 - 0.06 * Math.abs(sw)), p.baseSy * (1 + 0.05 * Math.abs(sw)));
        break;
      }
      case 'head':
        p.sp.rotation = 0.05 * Math.sin(w * 1.3);
        break;
      case 'fin':
        p.sp.rotation = p.side * 0.2 * amp * Math.sin(w * 3 + p.ph);
        break;
      // a sea turtle flaps both front flippers TOGETHER (mirrored): a power stroke back, a slower recovery
      case 'flipperFront': {
        const ph = Math.sin(w * 1.5);
        p.sp.rotation = p.side * (0.08 + 0.26 * (ph > 0 ? ph : ph * 0.6));
        break;
      }
      case 'flipperRear':
        p.sp.rotation = p.side * (0.06 + 0.09 * Math.sin(w * 1.5 + 0.9));
        break;
    }
  }
}
