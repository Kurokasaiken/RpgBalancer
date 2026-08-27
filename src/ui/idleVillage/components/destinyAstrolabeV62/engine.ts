/* V6.2 — clone of the V6 engine (originally auto-generated from
   public/destiny-astrolabe.html) with ONE change: the challenge surface is no
   longer a flat Path2D fill but a viscous tar mass — WebGL2 SDF smooth-min
   field (see ./tarGooRenderer) driven by a per-angle spring simulation with
   heavy damping (R-032). Falls back to the V6 flat drawing when WebGL2 is
   unavailable. Everything else (timeline, verdicts, physics wall) is V6. */
/* eslint-disable */
// @ts-nocheck

import { tarGooConfig } from '@/balancing/config/idleVillage/tarGooConfig';
import { createTarGooRenderer } from './tarGooRenderer';

export interface AstrolabeSkill { name: string; stat: number; difficulty: number; }
export interface AstrolabeConfig { crit?: number; wound?: number; dead?: number; mode?: string;
  tSlam?: number; tBurst?: number; tPour?: number; tSpin?: number; tSnap?: number; }
export interface AstrolabeResult { verdict: string; roll: number; riskRoll: number;
  skillIndex: number; skillName: string; wounded: boolean; dead: boolean; }
export interface AstrolabeEngineOpts {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig;
  onResolve?: (r: AstrolabeResult) => void;
  /** raw state-machine state on every transition */
  onState?: (state: string) => void;
  /** true when the TIRA button should be shown (armed), false on throw / new roll */
  onArmed?: (armed: boolean) => void;
}
export interface AstrolabeEngineHandle {
  roll: () => void;
  /** start the spin (TIRA). Warps past any still-playing reveal. */
  throw: () => void;
  setConfig: (skills: AstrolabeSkill[], config?: AstrolabeConfig) => void;
  destroy: () => void;
}

export function createDestinyAstrolabeV62Engine(root: HTMLElement, opts: AstrolabeEngineOpts): AstrolabeEngineHandle {
  console.log('[engine] createDestinyAstrolabeV62Engine called, skills=', opts.skills?.map(s=>`${s.name}:${s.stat}/${s.difficulty}`));
  const DUMMY: any = new Proxy(function(){}, {
    get(_t, p){ if(p==='style'||p==='classList'||p==='dataset') return DUMMY;
      if(p==='value') return '0'; if(p==='textContent'||p==='innerHTML') return ''; return DUMMY; },
    set(){ return true; }, apply(){ return DUMMY; },
  });
  const $id = (id: string): any => root.querySelector('#'+id) || (root.querySelector('[data-'+id+']') || DUMMY);

/* =========================================================================
   CONFIG — bound to the tweak panel
   ========================================================================= */
/* config + skills injected by the React host */
const cfg=Object.assign({stat:60,req:55,crit:5,wound:10,dead:5,tSlam:tarGooConfig.timing.seedMs,tBurst:1100,tPour:720,tSpin:2600,tSnap:650,mode:'random'}, opts.config||{});
let skills=(opts.skills&&opts.skills.length)?opts.skills.slice():[{name:'Skill',stat:60,difficulty:50}];
let skillAxes=[];
function recomputeSkillAxes(){
  if(skills.length===1) skillAxes=[5];
  else if(skills.length===2) skillAxes=[3,2];
  else if(skills.length===3) skillAxes=[2,2,1];
  else if(skills.length===4) skillAxes=[2,1,1,1];
  else skillAxes=[1,1,1,1,1].slice(0,skills.length);
}
recomputeSkillAxes();

const W=800, CX=400, CY=400, R=362;       // arena disc
const AXES=5;
const TIP=i=>-Math.PI/2 + i*(2*Math.PI/AXES);
const ALMOST_W=16;                        // bronze rim band (visual)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
const normAng=a=>{a%=TAU; if(a<-Math.PI)a+=TAU; if(a>Math.PI)a-=TAU; return a;};

const geo={
  tst:55,            // target success threshold
  rTip:200,          // star tip radius  (∝ TST)
  rValley:90,
  rCore:46,          // 12-layer core ring (Big Win)
  epicW:14,          // epic-fail outer band thickness (∝ crit%)
  axisTip:[200,200,200,200,200],    // per-axis star tip radius (white obelisk = stat)
  axisCheck:[300,300,300,300,300],  // per-axis failure inner radius (black obelisk = check)
  axisSkill:[0,0,0,0,0],
  wedges:{           // risk sectors, anchored at the upper rim — never overlapping
    dead:{a0:0,a1:0}, wound:{a0:0,a1:0},
  },
};

/* Determine skill index from ball position (angle)
   Skills are arranged as equal segments around the circle.
   E.g. 2 skills = 180° each, 3 skills = 120° each, etc. */
function getSkillIndexFromAngle(x,y){
  if(skills.length===0) return 0;
  if(skills.length===1) return 0;
  const angle=normAng(angOf(x,y)+Math.PI/2);  // Normalize to 0..TAU starting from top
  const segmentSize=TAU/skills.length;
  const skillIndex=Math.floor(angle/segmentSize);
  return Math.min(skillIndex, skills.length-1);
}

/* map a 0..100 value to a radius from core outward (white=stat, black=check) */
function rOf(v){ return geo.rCore + clamp(v,1,99)/100*(R-22-geo.rCore); }

function recomputeGeometry(skillIndex=0){
  geo.rCore=Math.max(30,R*0.12);
  /* assign each of the 5 axes to a skill, per the punte distribution */
  geo.axisSkill=[];
  for(let s=0;s<skillAxes.length;s+=1){ for(let n=0;n<skillAxes[s];n+=1) geo.axisSkill.push(s); }
  while(geo.axisSkill.length<AXES) geo.axisSkill.push(geo.axisSkill.length%Math.max(1,skills.length));
  /* per-axis radii: white obelisk = stat, black obelisk = check */
  geo.axisTip=[]; geo.axisCheck=[];
  for(let i=0;i<AXES;i+=1){
    const sk=skills[geo.axisSkill[i]]||{stat:60,difficulty:50};
    geo.axisTip[i]=rOf(sk.stat);        // success star reaches the white obelisk (stat)
    geo.axisCheck[i]=rOf(sk.difficulty);// failure goo reaches the black obelisk (check)
  }
  /* save the original stat/difficulty radii for obelisk display (before area solve) */
  geo.obeliskTip=geo.axisTip.slice();   // white obelisks stay on the stat
  geo.obeliskCheck=geo.axisCheck.slice();// black obelisks stay on the difficulty
  /* the star will be rescaled by area-solve but keep the stat silhouette */
  geo.starTip=geo.axisTip.slice();      // star shape comes from stat, rescaled for probability
  /* keep a single tst for the verdict roll (needed before the area solve) */
  {
    const sk0=skills.length>0?skills[Math.min(skillIndex,skills.length-1)]:{stat:60,difficulty:55};
    geo.tst=clamp(50+(sk0.stat-sk0.difficulty),1,99);
  }
  /* ── GEOMETRIA DIRETTA ────────────────────────────────────────────
     Non c'è nessun solve: le due forze sono poste dai numeri e la probabilità
     è ciò che ne RISULTA.

       punta stella[i] = rOf(stat[i])        — dove cade l'obelisco bianco
       bordo goo[i]    = rOf(difficoltà[i])  — dove cade l'obelisco nero
       probabilità     = area(stella ∩ goo) / area(goo)

     Il tentativo precedente risolveva la scala della stella per forzare
     l'area a valere `tst = 50+(stat-diff)`. Era sovradeterminato: con la scala
     consumata dal solve, la punta non era più pilotabile e finiva al 34..98%
     della stat (mai al 100%). Inoltre `tst` deriva da UNA sola skill, quindi su
     un board multi-skill il bersaglio era mal posto per costruzione.

     L'unico parametro di forma resta la profondità delle valli, regolata dal
     margine del PG rispetto allo skill check: valli basse = stella affilata
     quando stat >= difficoltà, valli alte = fiore dai petali arrotondati quando
     il PG è sotto. */
  const sCfg=tarGooConfig.star;
  const range=sCfg.transitionR*R;
  const margins=geo.starTip.map((s,i)=>s-geo.axisCheck[i]);
  const minMargin=Math.min(...margins);
  const t=clamp((minMargin+range)/range,0,1);
  geo.valleyF=sCfg.valleyFlower+(sCfg.valleyStar-sCfg.valleyFlower)*t;
  geo.starTip=geo.obeliskTip.slice();   // la punta È l'obelisco bianco
  /* probabilità reale, misurata sulla geometria che il giocatore vede.
     Stessa formula di inStar: min(stella, muro) — il muro taglia la stella. */
  {
    const SEG=360, dA=TAU/SEG;
    let starA=0, arenaA=0;
    geo.tarRMax=0;
    for(let i=0;i<SEG;i+=1){
      const a=-Math.PI/2+i*dA;
      const w=rCheckAt(a,1);
      geo.tarRMax=Math.max(geo.tarRMax,w);
      const r=Math.min(Math.max(rStarAt(a),geo.rCore),w);
      starA+=0.5*r*r*dA; arenaA+=0.5*w*w*dA;
    }
    geo.probPct=arenaA>0?clamp(starA/arenaA*100,0,100):0;
  }
  /* cosmetic aggregate radii (halo/gradients) */
  geo.rTip=Math.max(...geo.starTip);
  geo.rValley=Math.min(...geo.starTip)*geo.valleyF;
  /* critical-fail band thickness — purely proportional to the arena radius and
     scaled by crit% (like the wound/death sectors). No fixed pixel values. */
  geo.epicW=(R-3)*clamp(cfg.crit/100,0.04,0.5);
  /* Wound corona: outer band thickness ∝ wound%, from goo edge inward */
  geo.woundW=(R-3)*clamp(cfg.wound/100,0.04,0.4)*0.65;
  /* Death void: strip depth just outside star edge in valleys, ∝ dead% */
  geo.deathDepth=(geo.rValley||80)*clamp(cfg.dead/100,0.02,0.3)*4.5;
}
/* interpolate a per-axis radius array around the wheel (tips at TIP(i)) */
function radialFromAxes(theta,arr,scale){
  const t=((normAng(theta+Math.PI/2)%TAU)+TAU)%TAU;   // 0 at first tip (axis 0)
  const seg=TAU/(AXES*2);                             // 36°
  const k=Math.floor(t/seg), f=(t-k*seg)/seg;
  const tipR=i=>arr[((i%AXES)+AXES)%AXES]*scale;      // radius at star point i
  const vF=(geo.valleyF===undefined?0.3675:geo.valleyF);   // profondità delle valli
  if(k%2===0){                                        // tip → valley
    const a=tipR(k/2), b=Math.min(tipR(k/2),tipR(k/2+1))*vF;
    return a+(b-a)*f;
  } else {                                            // valley → tip
    const b=tipR((k+1)/2), a=Math.min(tipR((k-1)/2),tipR((k+1)/2))*vF;
    return a+(b-a)*f;
  }
}
/* star radius (success boundary) — per-axis flower, reaches the white obelisk (stat) */
function rStarAt(theta,scale=1){ return radialFromAxes(theta,geo.starTip,scale); }
/* GOO EDGE = failure boundary = the ball's physical wall. A SMOOTH blob that
   touches each black obelisk (the check) and interpolates smoothly between
   adjacent ones (no deep star valleys), so the goo's area is bounded exactly by
   the dark obelisks. This is both the visible goo rim and the ball's container. */
/* organic blob deformation — deterministic low-freq lobes so the goo edge is an
   irregular blob, never a clean circle (stable per angle for physics + drawing).
   V6.2: lobe amplitude scales with `rev` so the tar starts as a small circle
   and grows its strange edges as it pours outward. */
function gooBlob(theta, rev=1){
  const amp = rev;
  return 1 + amp*(0.035*Math.sin(theta*3+0.7) + 0.022*Math.sin(theta*5-1.3) + 0.014*Math.sin(theta*7+2.1));
}
function rCheckAt(theta,scale=1){
  const t=((normAng(theta+Math.PI/2)%TAU)+TAU)%TAU;   // 0 at axis 0
  const seg=TAU/AXES;                                 // 72° between adjacent obelisks
  const k=Math.floor(t/seg), f=(t-k*seg)/seg;
  const r0=geo.axisCheck[k%AXES], r1=geo.axisCheck[(k+1)%AXES];
  const s=f*f*(3-2*f);                                // smoothstep between neighbours
  /* V6.2: gooBlob lobe amplitude scales with `scale` (=gooReveal) so the seed
     is a small circle and the strange edges grow with the pour. */
  return Math.max(geo.rCore+30, (r0+(r1-r0)*s)*gooBlob(theta,scale))*scale;
}
const dist=(x,y)=>Math.hypot(x-CX,y-CY);
const angOf=(x,y)=>Math.atan2(y-CY,x-CX);
/* La stella è SEMPRE tagliata dall'arena: dove premerebbe oltre il muro,
   si appiattisce contro di esso. Vale per il disegno e per il verdetto, così
   l'area che l'occhio misura è esattamente quella che spatialVerdict risolve. */
const inStar=(x,y,s=1)=>{const a=angOf(x,y);return dist(x,y)<=Math.min(rStarAt(a,s),rCheckAt(a));};
const inCore=(x,y)=>dist(x,y)<=geo.rCore;
/* almost = thin margin just past the flower (success edge) */
const inAlmost=(x,y)=>{const a=angOf(x,y),d=dist(x,y),rs=rStarAt(a);return d>rs&&d<=rs+ALMOST_W;};
/* critical failure = the BORDER of the goo (its outermost band, against the wall) */
const inEpic=(x,y)=>{const a=angOf(x,y),d=dist(x,y),e=rCheckAt(a);return d>e-geo.epicW&&d<=e;};
/* FERITA zone: outer band of goo (just inside goo edge), proportional to wound% */
const inWoundZone=(x,y)=>{const a=angOf(x,y),d=dist(x,y),starR=rStarAt(a);if(d<=starR)return false;const e=rCheckAt(a);return d>=e-geo.woundW&&d<=e;};
/* MORTE zone: strip just outside star edge in valley directions, proportional to dead% */
const inDeathZone=(x,y)=>{const a=angOf(x,y),d=dist(x,y),starR=rStarAt(a);if(d<=starR)return false;return d<=starR+geo.deathDepth;};

/* =========================================================================
   SPATIAL RESOLUTION — verdict determined by ball position, no D100 pre-roll.
   The Challenge Surface (rCheckAt) is the ball's physical container.
   The Player Star (rStarAt) is the success zone.
   Where the ball stops determines the outcome.
   ========================================================================= */
function spatialVerdict(x,y){
  if(inCore(x,y))       return 'bigwin';
  if(inStar(x,y))       return 'win';
  if(inAlmost(x,y))     return 'almost';
  if(inDeathZone(x,y))  return 'fail_dead';
  if(inWoundZone(x,y))  return 'fail_wound';
  if(inEpic(x,y))       return 'epicfail';
  return 'fail';
}
function spatialRiskRoll(){
  const riskRoll=1+Math.floor(Math.random()*100);
  const dead=riskRoll<=cfg.dead;
  const wounded=!dead&&riskRoll<=cfg.dead+cfg.wound;
  return {riskRoll,dead,wounded};
}

/* =========================================================================
   SCENE STATE — choreography data (presentation)
   ========================================================================= */
const scene={
  state:'idle',
  t0:0,
  res:null, target:null,
  blackPillars:[], whitePillars:[],     // {ang,r,drop:0..1,flash,landed}
  axisAlpha:1,
  gooFullMs:0,
  starScale:0,
  pourP:0, streamAlpha:0,
  ball:{x:CX,y:CY,vx:0,vy:0,r:9,trail:[],on:false},
  snapFrom:null,
  shocks:[], rimHits:[], sparks:[],
  gooRipple:0,                          // boosts displacement scale
  gooReveal:0,                          // 0 in idle → goo wells up cinematically
  ringReveal:0,                         // 0 until the bronze ring locks in
  motes:Array.from({length:22},()=>({x:Math.random()*W,y:Math.random()*W,r:.5+Math.random()*1.5,
    sp:2.5+Math.random()*6,ph:Math.random()*TAU,sw:Math.random()*TAU})),
  stars:Array.from({length:42},()=>({x:Math.random()*W,y:Math.random()*W,
    r:.4+Math.random()*1.2,ph:Math.random()*TAU,sp:.4+Math.random()*1.1})),
};
function buildPillars(){
  /* per axis: white obelisk at the stat radius, black obelisk at the check
     radius — both on the SAME spoke so the star reaches white and the goo
     reaches black on that axis */
  scene.whitePillars=Array.from({length:AXES},(_,i)=>({
    ang:TIP(i), r:geo.axisTip[i], drop:0, flash:0, landed:false}));
  /* black obelisks sit exactly ON the (blobby) goo edge at their spoke */
  scene.blackPillars=Array.from({length:AXES},(_,i)=>({
    ang:TIP(i), r:rCheckAt(TIP(i)), drop:0, flash:0, landed:false}));
}

/* =========================================================================
   TIMELINE — strict data-state pipeline
   idle → threat-slam → agency-burst → risk-pour → the-spin → magnetic-snap → resolution
   ========================================================================= */
const suite=$id('suite');
const stage=$id('stage');
const stateChip=$id('stateChip');
/* host hooks — present when embedded by the React component (opts), no-op in
   the standalone HTML (typeof guard so the page still runs on its own) */
function emitState(s){ try{ if(typeof opts!=='undefined'&&opts&&opts.onState) opts.onState(s); }catch(e){} }
function emitArmed(b){ try{ if(typeof opts!=='undefined'&&opts&&opts.onArmed) opts.onArmed(b); }catch(e){} }
let armed=false;                 // true while the TIRA button should be shown
function setState(s){
  scene.state=s; scene.t0=performance.now();
  suite.dataset.state=s;
  stateChip.textContent=s;
  emitState(s);
  if(s==='threat-slam'){ resetDrops(scene.t0); }
}
function phaseT(durMs){ return clamp((performance.now()-scene.t0)/durMs,0,1); }
const easeOutCubic=t=>1-Math.pow(1-t,3);
const easeInCubic=t=>t*t*t;
const easeOutBack=t=>{const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const smoothstep=(t,a,b)=>{ if(t<=a)return 0; if(t>=b)return 1; const m=(t-a)/(b-a); return m*m*(3-2*m); };
/* V6.2 tar-pour curve: pooled seed → slow spread → settle, no overshoot.
   Follows an S-curve (smoothstep) so the mass has time to look heavy. */
const tarPour=t=> tarGooConfig.timing.seedReveal
  + (1-tarGooConfig.timing.seedReveal)*(t*t*(3-2*t));
const easeOutHeavy=t=>1-Math.pow(1-t,3.5);         // kept for other uses
const easeElastic=t=>t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(TAU/3))+1;

const GOO_MS=tarGooConfig.timing.pourMs;           // V6.2: main tar pour duration

function shake(kind){
  stage.classList.remove('shake-hard','shake-low','shake-slam');
  void stage.offsetWidth;
  stage.classList.add(kind);
}

function launchRoll(){
  /* clear previous resolution */
  card.classList.remove('show','triumph','win','almost','fail','epic');
  suite.dataset.tone='';
  $id('flare').classList.remove('fire');
  $id('launch').classList.remove('pulse');
  /* recompute geometry, build obelisks, reset all scene state */
  recomputeGeometry();
  buildPillars();
  scene.starScale=0; scene.pourP=0; scene.streamAlpha=0; scene.axisAlpha=1; scene.gooFullMs=0;
  scene.gooReveal=0; scene.ringReveal=0;
  scene.ball={x:CX,y:CY,vx:0,vy:0,r:9,trail:[],on:false};
  scene.warp=0;
  scene.shocks.length=0; scene.rimHits.length=0; scene.sparks.length=0;
  armed=false; emitArmed(false);
  /* panel result removed */
  /* ACT 0 — the Sun-Bronze ring slams into place like an ancient telescope lens */
  scene.ringShaken=false;
  setState('ring-lock');
}

/* THROW (TIRA) — starts the spin. If clicked mid-reveal it WARPS: the reveal
   snaps complete (no hard cut) and the ball fires immediately. */
function throwBall(){
  const s=scene.state;
  if(s==='idle'||s==='the-spin'||s==='magnetic-snap'||s==='resolution') return;
  armed=false; emitArmed(false);
  /* warp: snap any still-playing reveal so we never fire from an empty scene */
  scene.gooReveal=1; scene.starScale=1; scene.pourP=1; scene.streamAlpha=0.34; scene.axisAlpha=1; scene.gooFullMs=performance.now();
  scene.blackPillars.concat(scene.whitePillars).forEach(pl=>{ pl.drop=1; pl.landed=true; });
  if(s!=='action-trigger'){ scene.warp=1; scene.gooRipple=1; }   // visual warp flash when skipping
  setState('the-spin'); fireBall();
}
const RING_MS=140;   // V6: la ghiera non esiste più, resta solo un beat tecnico
const AXIS_READ_MS=560;  // V6: pausa per leggere i 5 assi prima che entri il PG

/* advance choreography (called every frame) */
function tickTimeline(){
  const s=scene.state;
  if(s==='idle') return;

  if(s==='ring-lock'){
    const p=phaseT(RING_MS);
    scene.ringReveal=clamp(p/0.68,0,1);     // ring fades/locks into being
    scene.ringShaken=true;                  // V6: nessuno shake per la ghiera rimossa
    if(p>=1){ scene.ringReveal=1; setState('threat-slam'); }
  }
  else if(s==='threat-slam'){
    const p=phaseT(cfg.tSlam);
    /* V6.2 tar seed: no central pool yet — seed drops fall from above and
       merge while the black obelisks slam. The main rim stays at 0. */
    scene.gooReveal=0;
    scene.blackPillars.forEach((pl,i)=>{
      const local=clamp((p-(i*0.13))/0.4,0,1);
      const prev=pl.drop;
      pl.drop=easeInCubic(local);
      if(prev<1&&pl.drop>=1&&!pl.landed){
        pl.landed=true; pl.flash=1;
        scene.gooRipple=1; shake('shake-slam');
        addShock(pl,'rgba(200,134,46,.9)');
      }
    });
    if(p>=1) setState('goo-expand');
  }
  else if(s==='goo-expand'){
    /* V6.2 TAR POUR — the seeded pool spreads outward like a slow colata.
       Curve: S-curve (smoothstep) from seed to full, so the mass is readable
       at every stage and never snaps like water. */
    const p=phaseT(GOO_MS);
    scene.gooReveal=tarPour(p);
    /* Calm swell in the middle of the pour: the mass pushes, then settles. */
    const swell=0.24*(1-Math.abs(2*p-1));
    scene.gooRipple=Math.max(scene.gooRipple,swell);
    if(p>=1){
      scene.gooReveal=1;
      scene.gooFullMs=performance.now();    // mark when the tar becomes fully revealed
      setState('axis-read');           // V6: beat di lettura prima della risposta del PG
    }
  }
  else if(s==='axis-read'){
    /* BEAT DI LETTURA — la difficoltà è posata e misurabile, niente si muove.
       È l'unico momento in cui il giocatore può leggere i 5 assi da soli. */
    if(phaseT(AXIS_READ_MS)>=1) setState('agency-burst');
  }
  else if(s==='agency-burst'){
    const p=phaseT(cfg.tBurst);
    /* Pillars drop first (compressed into first 65% of phase) */
    scene.whitePillars.forEach((pl,i)=>{
      const local=clamp((p-(i*0.07))/0.26,0,1);
      const prev=pl.drop;
      pl.drop=easeInCubic(local);
      if(prev<1&&pl.drop>=1&&!pl.landed){
        pl.landed=true; pl.flash=1; shake('shake-slam');
        addShock(pl,'rgba(255,242,200,.95)');
      }
    });
    /* Star appears AFTER all pillars are landed (p≥0.65), grows with overshoot */
    const STAR_START=0.65;
    scene.starScale=easeOutBack(clamp((p-STAR_START)/(1-STAR_START),0,1));
    if(p>=1){
      scene.starScale=1;
      armed=true; emitArmed(true);     // arm the THROW button after star finishes expanding
      setState('risk-pour');
    }
  }
  else if(s==='risk-pour'){
    const p=phaseT(cfg.tPour);
    /* Dopo che la clip del fiore e' terminata, obelischi e scala scompaiono. */
    scene.whitePillars.forEach((pl,i)=>{
      const local=clamp((p-(i*0.05))/0.75,0,1);
      pl.drop=1-easeInCubic(local);
    });
    scene.blackPillars.forEach((pl,i)=>{
      const local=clamp((p-(i*0.05))/0.75,0,1);
      pl.drop=1-easeInCubic(local);
    });
    scene.axisAlpha=1-easeInCubic(clamp(p/0.85,0,1));
    scene.pourP=easeOutCubic(p);
    scene.streamAlpha=0.5;
    if(p>=1){ scene.streamAlpha=0.34; setState('action-trigger'); }   // GATE: wait for TIRA
  }
  else if(s==='action-trigger'){
    /* WAITING_FOR_INPUT — hold here until the player throws (throwBall). The
       button is already armed; the spin will not start on its own. */
  }
  else if(s==='the-spin'){
    const p=phaseT(cfg.tSpin);
    stepBall(p);
    /* when ball effectively stops, resolve immediately rather than waiting */
    const spd=Math.hypot(scene.ball.vx,scene.ball.vy);
    if(p>=1||(p>0.7&&spd<0.4)){ resolve(); }
  }
  /* decay one-shot fx */
  scene.gooRipple=Math.max(0,scene.gooRipple-0.02);
  scene.blackPillars.concat(scene.whitePillars).forEach(pl=>pl.flash=Math.max(0,pl.flash-0.03));
}
function addShock(pl,color){
  scene.shocks.push({x:CX+Math.cos(pl.ang)*pl.r,y:CY+Math.sin(pl.ang)*pl.r,t:0,dur:600,c:color});
}

/* =========================================================================
   THE BALL — pinball + hidden progressive magnetism + bullet-time snap
   ========================================================================= */
/* Compute a target position for the ball based on forced verdict mode.
   Returns {x,y} in canvas space, or null for random. */
function computeTargetPos(){
  const mode=cfg.mode||'random';
  if(mode==='bigwin') return {x:CX+4,y:CY-6};
  if(mode==='win'){
    const a=TIP(0)*0.55+TIP(1)*0.45;
    const r=geo.axisTip[0]*0.68;
    return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r};
  }
  if(mode==='almost'){
    const a=TIP(2)+0.1;
    const r=rStarAt(a)+ALMOST_W*0.5;
    return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r};
  }
  if(mode==='fail'){
    const a=TIP(1)+Math.PI/AXES;
    const starR=rStarAt(a), checkR=rCheckAt(a);
    const r=starR+(checkR-starR)*0.5;
    return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r};
  }
  if(mode==='fail_wound'){
    /* outer band of failure gap near goo edge */
    const a=TIP(0)+0.22;
    const checkR=rCheckAt(a);
    const r=Math.max(geo.rCore+40, checkR-geo.woundW*0.4);
    return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r};
  }
  if(mode==='fail_dead'){
    /* valley floor just past star edge */
    const valleyAng=TIP(0)+Math.PI/AXES;
    const starR=rStarAt(valleyAng);
    const r=starR+Math.max(14,geo.deathDepth*0.45);
    return {x:CX+Math.cos(valleyAng)*r,y:CY+Math.sin(valleyAng)*r};
  }
  if(mode==='epicfail'){
    const a=TIP(3)+0.3;
    const checkR=rCheckAt(a);
    const r=Math.max(geo.rCore+30,checkR-geo.epicW*0.4);
    return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r};
  }
  return null;
}

function fireBall(){
  const b=scene.ball;
  b.on=true; b.x=CX; b.y=CY;
  const tp=computeTargetPos();
  scene.targetPos=tp;
  /* Target-aware kick: aim roughly toward target with wide jitter (still chaotic) */
  const baseAngle=tp ? Math.atan2(tp.y-CY,tp.x-CX) : Math.random()*TAU;
  const jitter=(Math.random()*2-1)*Math.PI*0.85;
  const a=baseAngle+jitter;
  const sp=28+Math.random()*8;
  b.vx=Math.cos(a)*sp; b.vy=Math.sin(a)*sp;
}
let lastBallT=performance.now();
function stepBall(p){
  const b=scene.ball;
  if(!b.on) return;
  const now=performance.now();
  let dt=Math.min(40,now-lastBallT); lastBallT=now;
  const f=dt/16.7;

  /* Cinematic deceleration + optional target magnetism (for forced verdicts). */
  const decayStart=0.30;
  const grip=clamp((p-decayStart)/(1-decayStart),0,1);
  const fric=Math.pow(0.9996-0.025*grip,f);
  b.vx*=fric; b.vy*=fric;
  /* Magnetic pull toward target zone — grows from 0 at p=0.55 to max at p=1 */
  if(grip>0.45 && scene.targetPos){
    const mag=clamp((grip-0.45)/0.55,0,1)*0.022;
    b.vx+=(scene.targetPos.x-b.x)*mag*f;
    b.vy+=(scene.targetPos.y-b.y)*mag*f;
  }
  b.x+=b.vx*f; b.y+=b.vy*f;
  /* scatter amount: full early, fades as ball slows */
  const chaos=1-grip*0.6;

  /* NON-SPECULAR bounce — reflect + random scatter so no clean mirror paths */
  const chaoticBounce=(nx,ny,extra)=>{
    const dot=b.vx*nx+b.vy*ny;
    if(extra&&dot>=0) return false;
    b.vx-=2*dot*nx; b.vy-=2*dot*ny;
    const ang=(Math.random()*2-1)*0.55*chaos;
    const cs=Math.cos(ang), sn=Math.sin(ang);
    const rvx=b.vx*cs-b.vy*sn, rvy=b.vx*sn+b.vy*cs;
    b.vx=rvx; b.vy=rvy;
    const tx=-ny, ty=nx;
    const spin=(Math.random()*2-1)*2.6*chaos;
    b.vx+=tx*spin; b.vy+=ty*spin;
    const rest=0.92+Math.random()*0.08;
    b.vx*=rest; b.vy*=rest;
    const od=b.vx*nx+b.vy*ny;
    if(od>0){ b.vx-=2*od*nx; b.vy-=2*od*ny; }
    return true;
  };

  /* CHALLENGE SURFACE bounce — ball is strictly confined inside rCheckAt */
  const d=dist(b.x,b.y);
  const aB=angOf(b.x,b.y), edge=rCheckAt(aB)-b.r;
  if(d>edge){
    const nx=(b.x-CX)/d, ny=(b.y-CY)/d;
    chaoticBounce(nx,ny,false);
    b.x=CX+nx*edge; b.y=CY+ny*edge;
    scene.rimHits.push({ang:Math.atan2(ny,nx),life:600});
    addSpark(b.x,b.y);
  }

  /* pillar bounce (skip when ball is nearly stopped) */
  if(grip<0.9){
    scene.blackPillars.concat(scene.whitePillars).forEach(pl=>{
      if(!pl.landed) return;
      const px=CX+Math.cos(pl.ang)*pl.r, py=CY+Math.sin(pl.ang)*pl.r;
      const dx=b.x-px, dy=b.y-py, dd=Math.hypot(dx,dy);
      if(dd<24){
        const nx=dx/(dd||1), ny=dy/(dd||1);
        if(chaoticBounce(nx,ny,true)!==false){ b.x=px+nx*24; b.y=py+ny*24; pl.flash=1; addSpark(b.x,b.y); }
      }
    });
  }

  b.trail.push({x:b.x,y:b.y,life:480});
  for(let i=b.trail.length-1;i>=0;i-=1){
    b.trail[i].life-=dt;
    if(b.trail[i].life<=0) b.trail.splice(i,1);
  }
  if(b.trail.length>90) b.trail.splice(0,b.trail.length-90);
  for(let i=scene.sparks.length-1;i>=0;i-=1){
    const s=scene.sparks[i]; s.life-=dt;
    if(s.life<=0){scene.sparks.splice(i,1);continue;}
    s.x+=s.vx; s.y+=s.vy; s.vy+=0.04;
  }
  for(let i=scene.rimHits.length-1;i>=0;i-=1){
    scene.rimHits[i].life-=dt;
    if(scene.rimHits[i].life<=0) scene.rimHits.splice(i,1);
  }
}
function addSpark(x,y){
  for(let i=0;i<6;i+=1){
    const a=Math.random()*TAU, sp=1+Math.random()*2.4;
    scene.sparks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      r:1+Math.random()*2,life:280+Math.random()*220,max:500,
      c:Math.random()>0.4?'#fce890':'#34d4b8'});
  }
}

/* =========================================================================
   RESOLUTION
   ========================================================================= */
const card=$id('card');
const VERDICT_TEXT={
  bigwin:{title:'TRIONFO',seal:'★',cls:'triumph',sub:'Il sole stesso firma la tua impresa.'},
  win:{title:'VITTORIA',seal:'★',cls:'win',sub:'La vetta si inchina al tuo passo.'},
  almost:{title:'PER UN SOFFIO',seal:'◐',cls:'almost',sub:'La sfera danza sul bronzo… e scivola oltre.'},
  fail:{title:'SCONFITTA',seal:'✕',cls:'fail',sub:'La montagna respinge i mortali.'},
  epicfail:{title:'ROVINA',seal:'✕',cls:'epic',sub:'L’abisso reclama ciò che osa troppo.'},
};
function resolve(){
  const b=scene.ball;
  /* Verdict = ball position in 2D space relative to the two surfaces */
  const _d=Math.hypot(b.x-CX,b.y-CY);
  console.log(`[resolve] ball=(${(b.x-CX).toFixed(1)},${(b.y-CY).toFixed(1)}) dist=${_d.toFixed(1)} rStar=${rStarAt(Math.atan2(b.y-CY,b.x-CX)).toFixed(1)} rCheck=${rCheckAt(Math.atan2(b.y-CY,b.x-CX)).toFixed(1)} spd=${Math.hypot(b.vx,b.vy).toFixed(2)}`);
  const _sv=spatialVerdict(b.x,b.y);
  const forced=(cfg.mode&&cfg.mode!=='random'&&['bigwin','win','almost','fail','epicfail'].includes(cfg.mode))?cfg.mode:null;
  let verdict=forced||_sv;
  let dead=false, wounded=false, riskRoll=0;
  if(verdict==='fail_dead'){verdict='fail';dead=true;riskRoll=1;}
  else if(verdict==='fail_wound'){verdict='fail';wounded=true;riskRoll=cfg.dead+1;}
  else{const rr=spatialRiskRoll();dead=rr.dead;wounded=rr.wounded;riskRoll=rr.riskRoll;}
  const skillIndex=getSkillIndexFromAngle(b.x,b.y);
  recomputeGeometry(skillIndex);
  scene.res={verdict,roll:0,riskRoll,skillIndex,wounded,dead};
  const res=scene.res;
  setState('resolution');
  scene.whitePillars.forEach(p=>p.drop=0);
  scene.blackPillars.forEach(p=>p.drop=0);
  scene.axisAlpha=0;
  const V=VERDICT_TEXT[verdict];
  /* title: split into letters for the crumble effect */
  const titleEl=$id('cardTitle');
  titleEl.innerHTML=[...V.title].map(ch=>{
    if(ch===' ') return '<span class="ch">&nbsp;</span>';
    const dx=(Math.random()*8-4).toFixed(1), dy=(6+Math.random()*12).toFixed(1);
    const rot=(Math.random()*10-5).toFixed(1), del=(0.05+Math.random()*0.35).toFixed(2);
    return `<span class="ch" style="--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--del:${del}s">${ch}</span>`;
  }).join('');
  $id('cardSeal').textContent=V.seal;
  $id('cardSub').textContent=V.sub;
  const posZone=inStar(b.x,b.y)?'Nella Stella':'Fuori dalla Stella';
  $id('cardNums').textContent=posZone;
  const chips=$id('cardChips');
  chips.innerHTML='';
  if(res.wounded) chips.innerHTML+='<span class="chip wounded">Ferito</span>';
  if(res.dead) chips.innerHTML+='<span class="chip dead">Caduto</span>';
  card.classList.remove('triumph','win','almost','fail','epic');
  card.classList.add(V.cls);
  void card.offsetWidth;
  card.classList.add('show');
  /* tone per verdict */
  const isLoss=(res.verdict==='fail'||res.verdict==='epicfail');
  if(res.verdict==='bigwin'||res.verdict==='win'){
    suite.dataset.tone='triumph';
    $id('flare').classList.remove('fire');
    void $id('flare').offsetWidth;
    $id('flare').classList.add('fire');
  } else if(res.verdict==='almost'){
    suite.dataset.tone='';
  } else {
    suite.dataset.tone=(res.verdict==='epicfail')?'grim':'doom';
  }
  /* SOLAR CLIMAX — blinding burst from the core + massive unified screen punch,
     fired the same millisecond the typography appears */
  const climax=$id('climax');
  climax.classList.remove('burst','cold');
  if(isLoss) climax.classList.add('cold');
  void climax.offsetWidth;
  climax.classList.add('burst');
  shake('shake-resolve');
  $id('launch').classList.add('pulse');
  /* panel result removed */
  /* Post result to parent window */
  if(opts.onResolve){
    const skillName=skills.length>0?skills[skillIndex].name:'Skill';
    opts.onResolve({verdict,roll:0,riskRoll,skillIndex,skillName,wounded,dead});
  }
}

/* =========================================================================
   RENDER — Wanderlust canvas painting
   ========================================================================= */
const cv=$id('cv');
const ctx=cv.getContext('2d',{alpha:true});

/* =========================================================================
   V6.2 TAR GOO — viscous spring simulation + WebGL2 SDF layer (R-032).
   The rim is a ring of radial springs chasing rCheckAt(θ)·reveal with heavy
   damping: the mass surges, lags and settles like tar, never like water.
   Crawling droplets merge into the rim through smooth-min bridges.
   ========================================================================= */
const gooRenderer=createTarGooRenderer(W,tarGooConfig);
const gooSim=(()=>{
  const simCfg=tarGooConfig.simulation;
  const N=simCfg.rimSamples;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const drops=Array.from({length:simCfg.dropletCount},(_,i)=>({
    ang:0.0,
    w:0.0,
    rr:0.0,
    ph:0.0,
    mode:'crawl',
    x:0.0,
    y:0.0,
    vy:0.0,
    startT:0.0,
  })) as ({ang:number,w:number,rr:number,ph:number,mode:'fall'|'crawl',x:number,y:number,vy:number,startT:number})[];
  return {
    N,
    r:new Float32Array(N),                 // current sprung radius per sample
    v:new Float32Array(N),                 // radial velocity per sample
    blobs:new Float32Array(simCfg.dropletCount*3),
    blobCount:0,
    drops,
    lastMs:0,
  };
})();

function resetDrops(t0:number){
  const simCfg=tarGooConfig.simulation;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  gooSim.r.fill(0); gooSim.v.fill(0);
  for(let i=0;i<gooSim.drops.length;i+=1){
    const d=gooSim.drops[i];
    d.ph=Math.random()*TAU;
    if(i<simCfg.seedDropCount){
      d.mode='fall';
      d.x=CX+rnd(-simCfg.seedDropScatter,simCfg.seedDropScatter);
      d.y=CY-simCfg.seedDropHeight;
      d.vy=0;
      d.startT=t0+i*simCfg.seedDropStagger;
      d.rr=rnd(simCfg.seedDropRadius[0],simCfg.seedDropRadius[1]);
      d.w=rnd(simCfg.dropletCrawlSpeed[0],simCfg.dropletCrawlSpeed[1])*(Math.random()<0.5?-1:1);
    }else{
      d.mode='crawl';
      d.ang=Math.random()*TAU;
      d.w=rnd(simCfg.dropletCrawlSpeed[0],simCfg.dropletCrawlSpeed[1])*(Math.random()<0.5?-1:1);
      d.rr=rnd(simCfg.dropletRadius[0],simCfg.dropletRadius[1]);
      d.x=CX; d.y=CY; d.vy=0; d.startT=0;
    }
  }
}
function tickGooSim(now){
  const simCfg=tarGooConfig.simulation;
  const dt=gooSim.lastMs?Math.min(50,now-gooSim.lastMs):16.7;
  gooSim.lastMs=now;
  const k=dt/16.7;                                   // frame-rate normalizer
  const rev=clamp(scene.gooReveal,0,1.0);
  /* Idle simmer: a slow, gentle boil on the tar rim once it has been fully
     revealed for at least 0.5s, so it never looks frozen in any post-pour state. */
  const sinceFull=now-(scene.gooFullMs||0);
  if(rev>0.99 && sinceFull>500){
    const idle=0.12+0.06*Math.sin(now/900);
    scene.gooRipple=Math.max(scene.gooRipple*0.98, idle);
  }
  const damp=Math.pow(simCfg.damping,k);
  /* Invasion front: a single tar wave that grows outward from the core.
     Each axis reaches its own final radius when the front passes it, so
     short arms fill first and the long arms keep pushing — like real tar. */
  const front=rev<=0.001?0:rev*geo.tarRMax;
  for(let i=0;i<gooSim.N;i+=1){
    const theta=i/gooSim.N*TAU;
    const rFinal=rev<=0.001?0:rCheckAt(theta,1);
    /* End-of-pour hard lock: once the tar is fully revealed, pin the rim to
       its final shape and kill any residual spring velocity so it never
       rebounds past the target. */
    if(rev>=0.999){
      gooSim.r[i]=rFinal;
      gooSim.v[i]=0;
      continue;
    }
    const target=Math.min(rFinal,front);
    let vel=(gooSim.v[i]+(target-gooSim.r[i])*simCfg.stiffness*k)*damp;
    const vMax=simCfg.maxSpeed*k*(1+2*(scene.gooRipple||0));
    if(vel>vMax)vel=vMax; else if(vel<-vMax)vel=-vMax;
    const next=gooSim.r[i]+vel*k;
    /* Sticky non-overshoot: viscous tar must not rebound. If the next frame
       would cross the target, or the sample is already past it and not moving
       back, snap to the target and kill the spring. */
    const cross=(vel>0 && next>=target) || (vel<0 && next<=target);
    const away=(gooSim.r[i]>target && vel>=0) || (gooSim.r[i]<target && vel<=0);
    if(cross || away){
      gooSim.r[i]=target;
      gooSim.v[i]=0;
    }else{
      gooSim.r[i]=Math.max(0,next);
      gooSim.v[i]=vel;
    }
  }
  /* Droplets: the first seedDropCount fall from above and merge; the rest
     crawl on the rim once it exists. */
  const t=now/1000;
  let active=0;
  for(let i=0;i<gooSim.drops.length;i+=1){
    const d=gooSim.drops[i];
    if(d.mode==='fall'){
      if(now>=d.startT){
        d.vy += simCfg.seedDropGravity*dt;
        d.vy *= Math.pow(simCfg.seedDropDamping, k);
        d.y += d.vy*dt;
        /* landing: when the drop reaches / passes the centre plane */
        if(d.y >= CY-d.rr*0.5){
          d.y=Math.min(d.y,CY+d.rr*0.5);
          d.mode='crawl';
          d.ang=Math.atan2(d.y-CY,d.x-CX);
          scene.gooRipple=Math.max(scene.gooRipple,0.65);
        }
      }
      if(now>=d.startT){
        gooSim.blobs[active*3]=d.x;
        gooSim.blobs[active*3+1]=d.y;
        gooSim.blobs[active*3+2]=d.rr;
        active+=1;
      }
    }else{
      d.ang+=d.w*dt/1000;
      const idx=Math.round((d.ang/TAU)*gooSim.N)%gooSim.N;
      const rim=rev<=0.001?0:gooSim.r[idx];
      const bulge=Math.sin(t*0.3+d.ph)*simCfg.dropletOvershoot;
      const rad=Math.max(geo.rCore*0.6,rim-d.rr*0.8+bulge);
      gooSim.blobs[active*3]=CX+Math.cos(d.ang)*rad;
      gooSim.blobs[active*3+1]=CY+Math.sin(d.ang)*rad;
      gooSim.blobs[active*3+2]=d.rr;
      active+=1;
    }
  }
  gooSim.blobCount=active;
  scene.gooRipple=Math.max(0,scene.gooRipple*0.95);
}

/* ---- procedural material textures (generated once) ---- */
const stoneTex=(()=>{                 // porous volcanic basalt
  const c=document.createElement('canvas'); c.width=c.height=96;
  const x=c.getContext('2d');
  const img=x.createImageData(96,96);
  for(let i=0;i<img.data.length;i+=4){
    const v=18+Math.random()*48;
    img.data[i]=v*.9; img.data[i+1]=v*.95; img.data[i+2]=v*1.18; img.data[i+3]=255;
  }
  x.putImageData(img,0,0);
  for(let i=0;i<80;i+=1){             // pores & erosions
    x.fillStyle=`rgba(3,2,7,${.25+Math.random()*.45})`;
    x.beginPath(); x.arc(Math.random()*96,Math.random()*96,.6+Math.random()*2,0,TAU); x.fill();
  }
  return c;
})();
const marbleTex=(()=>{                // ancient translucent marble with vein noise
  const c=document.createElement('canvas'); c.width=c.height=96;
  const x=c.getContext('2d');
  const img=x.createImageData(96,96);
  for(let i=0;i<img.data.length;i+=4){
    const v=198+Math.random()*57;
    img.data[i]=v; img.data[i+1]=v*.97; img.data[i+2]=v*.89; img.data[i+3]=255;
  }
  x.putImageData(img,0,0);
  for(let k=0;k<8;k+=1){              // wandering mineral veins
    x.strokeStyle=`rgba(148,124,84,${.16+Math.random()*.2})`;
    x.lineWidth=.5+Math.random()*.9;
    x.beginPath();
    let px=Math.random()*96, py=-4;
    x.moveTo(px,py);
    for(let s=0;s<7;s+=1){ px+=(Math.random()-.5)*28; py+=16; x.lineTo(px,py); }
    x.stroke();
  }
  return c;
})();

function drawBackdrop(now){
  const t=now/1000;
  /* V2-style teal-azure base fill — brightness from tarGooConfig.backdrop */
  const bd=tarGooConfig.backdrop;
  ctx.save();
  const _bg=ctx.createRadialGradient(CX,CY,0,CX,CY,R*1.15);
  _bg.addColorStop(0,bd.inner);
  _bg.addColorStop(1,bd.outer);
  ctx.fillStyle=_bg;
  ctx.beginPath(); ctx.arc(CX,CY,R*1.12,0,TAU); ctx.fill();
  /* azure light-leak from top-left (V9 signature) */
  const _leak=ctx.createRadialGradient(CX-R*.7,CY-R*.7,0,CX-R*.7,CY-R*.7,R*1.4);
  _leak.addColorStop(0,bd.leakCore);
  _leak.addColorStop(.5,bd.leakMid);
  _leak.addColorStop(1,bd.leakEdge);
  ctx.fillStyle=_leak;
  ctx.beginPath(); ctx.arc(CX,CY,R*1.12,0,TAU); ctx.fill();
  ctx.restore();
  /* cosmic dust: starlit gold + teal grains over astral ink */
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  scene.stars.forEach((s,i)=>{
    const tw=.5+.5*Math.sin(t*s.sp+s.ph);
    const a=.18+.55*tw;
    const gold=(i%3!==0);
    ctx.globalAlpha=a;
    ctx.fillStyle=gold?'#ffe9a8':'#d0dcff';
    if(tw>.82){ ctx.shadowColor=gold?'#fce890':'#a8b8ff'; ctx.shadowBlur=6+6*tw; } else ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r*(.8+.5*tw),0,TAU); ctx.fill();
  });
  ctx.shadowBlur=0; ctx.globalAlpha=1;
  ctx.restore();
  /* astrolabe engraving */
  for(let ri=1;ri<=3;ri+=1){
    ctx.strokeStyle=ri===3?'rgba(201,162,39,.13)':'rgba(110,90,220,.10)';
    ctx.lineWidth=ri===3?1.2:.8;
    ctx.beginPath(); ctx.arc(CX,CY,R*ri/3,0,TAU); ctx.stroke();
  }
  for(let i=0;i<AXES;i+=1){
    const a=TIP(i), dx=Math.cos(a), dy=Math.sin(a);
    const g=ctx.createLinearGradient(CX,CY,CX+dx*R,CY+dy*R);
    g.addColorStop(0,'rgba(110,90,220,.05)');
    g.addColorStop(.7,'rgba(90,120,255,.14)');
    g.addColorStop(1,'rgba(252,232,144,.26)');
    ctx.strokeStyle=g; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.moveTo(CX,CY); ctx.lineTo(CX+dx*R,CY+dy*R); ctx.stroke();
  }
}
function drawMotes(now,dt){
  const t=now/1000;
  scene.motes.forEach(m=>{
    m.y-=m.sp*dt/1000; m.x+=Math.sin(t*.7+m.sw)*.12;
    if(m.y<-4){m.y=W+4;m.x=Math.random()*W;}
    ctx.globalAlpha=.1+.18*(.5+.5*Math.sin(t*1.3+m.ph));
    ctx.fillStyle='#fce890';
    ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,TAU); ctx.fill();
  });
  ctx.globalAlpha=1;
}

/* challenge surface path — polygon bounded by rCheckAt (difficulty mesh) */
function gooBlobPath(rev,shrink){
  const P=new Path2D();
  const SEG=160;
  for(let i=0;i<=SEG;i+=1){
    const a=i/SEG*TAU, r=Math.max(0,rCheckAt(a,rev)-(shrink||0));
    const x=CX+Math.cos(a)*r, y=CY+Math.sin(a)*r;
    if(i===0) P.moveTo(x,y); else P.lineTo(x,y);
  }
  P.closePath();
  return P;
}

/* SUPERFICIE SFIDA V6.2 — the tar mass. WebGL2 SDF layer composited at the
   exact z-slot of the old flat fill; the physics wall stays rCheckAt (the
   simulation converges onto it, so obelisks keep sitting ON the edge). */
function drawChallengeSurface(now){
  const rev=scene.gooReveal;
  tickGooSim(now);
  if(rev<=0.001 && gooSim.blobCount===0) return;
  if(gooRenderer){
    const layer=gooRenderer.render({
      radii:gooSim.r,
      blobs:gooSim.blobs,
      blobCount:gooSim.blobCount,
      timeMs:now,
      reveal:clamp(rev,0,1),
      ripple:clamp(scene.gooRipple||0,0,1),
    });
    ctx.drawImage(layer,0,0);
    return;
  }
  /* Fallback (no WebGL2): V6 flat drawing — deep void fill + single border. */
  const path=gooBlobPath(rev,0);
  ctx.save();
  const fill=ctx.createRadialGradient(CX,CY,0,CX,CY,geo.rTip*rev*1.5);
  fill.addColorStop(0,'rgba(1,3,14,0.97)');
  fill.addColorStop(0.6,'rgba(3,5,20,0.95)');
  fill.addColorStop(1,'rgba(2,3,16,0.90)');
  ctx.fillStyle=fill; ctx.fill(path);
  ctx.strokeStyle=`rgba(30,25,35,${(0.72*rev).toFixed(3)})`;
  ctx.lineWidth=4;
  ctx.stroke(path);
  ctx.restore();
}

/* ASSI COME STRUMENTI DI MISURA — ogni vettore è una scala 0-100 con 10 tacche.
   Le tacche fino al bordo del goo sono accese (= quanto arriva la difficoltà su
   quell'asse), quelle oltre sono spente: l'asse si legge come "8 su 10".
   Quando la stella esiste, una seconda tacca calda segna la stat del PG. */
const AXIS_TICKS=10;
function drawAxisRig(now){
  const rev=scene.gooReveal;
  if(rev<=0.001 || scene.axisAlpha<=0.001) return;
  const rMax=rOf(100);
  ctx.save();
  ctx.globalAlpha=clamp(scene.axisAlpha,0,1);
  for(let i=0;i<AXES;i+=1){
    const a=TIP(i);
    const ca=Math.cos(a), sa=Math.sin(a);
    const rDiff=rCheckAt(a,rev);                       // dove arriva la difficoltà
    const rStat=geo.axisTip[i]*Math.min(1,scene.starScale||0);

    /* asta dell'asse */
    ctx.lineWidth=1.4;
    ctx.strokeStyle=`rgba(150,210,200,${0.34*rev})`;
    ctx.beginPath();
    ctx.moveTo(CX+ca*geo.rCore,CY+sa*geo.rCore);
    ctx.lineTo(CX+ca*rMax,CY+sa*rMax);
    ctx.stroke();

    /* 10 tacche perpendicolari all'asse */
    for(let j=1;j<=AXIS_TICKS;j+=1){
      const rj=rOf(j*(100/AXIS_TICKS));
      const on=rj<=rDiff;
      const half=on?(j%5===0?13:9):(j%5===0?9:6);
      const px=CX+ca*rj, py=CY+sa*rj;
      ctx.lineWidth=on?3:1.8;
      ctx.strokeStyle=on
        ? `rgba(196,255,240,${(0.92*rev).toFixed(3)})`
        : `rgba(140,195,188,${(0.42*rev).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(px-sa*half,py+ca*half);
      ctx.lineTo(px+sa*half,py-ca*half);
      ctx.stroke();
    }

    /* cursore della stat: compare con la stella, caldo */
    if(rStat>geo.rCore){
      const sx=CX+ca*rStat, sy=CY+sa*rStat;
      ctx.lineWidth=4;
      ctx.strokeStyle=`rgba(255,240,170,${(0.95*Math.min(1,scene.starScale)).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(sx-sa*17,sy+ca*17);
      ctx.lineTo(sx+sa*17,sy-ca*17);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* star path sampled from the same radial function used for membership */
function starPath(scale){
  const p=new Path2D();
  const SEG=80;
  for(let i=0;i<=SEG;i+=1){
    const a=-Math.PI/2+i/SEG*TAU;
    const r=rStarAt(a,scale);
    const x=CX+Math.cos(a)*r, y=CY+Math.sin(a)*r;
    if(i===0) p.moveTo(x,y); else p.lineTo(x,y);
  }
  p.closePath();
  return p;
}
/* THE 12-LAYER MECHANICAL STAR — white gold & sun-bronze */
function drawStar(now){
  let s=scene.starScale;
  /* In fail/epicfail resolution the star fades to let the card text read */
  if(scene.state==='resolution'&&scene.res){
    const v=scene.res.verdict;
    if(v==='fail'||v==='epicfail') s*=0.35;
    else if(v==='almost') s*=0.65;
  }
  if(s<=0.01) return;
  const t=now/1000;
  const p=starPath(s);
  /* V6.2: il fiore viene CLIPpato al muro del catrame come in V9.
     La faccia e i bordi crescono fino al muro; ciò che eccede resta
     solo contorno tratteggiato, così le punte non coprono board/confini. */
  const face=ctx.createRadialGradient(CX-30,CY-46,6,CX,CY,geo.rTip*s);
  face.addColorStop(0,'#ffffff'); face.addColorStop(.42,'#fdf8e9'); face.addColorStop(1,'#ecd49a');

  /* Il fiore nasce intero; il catrame lo clippa solo verso la fine della
     sua espansione. La maschera morfa da un cerchio grande (nessun clip) alla
     forma del muro del catrame. */
  const clipReveal=smoothstep(0.6,1.0,s);
  const rLarge=R*1.6;
  const ap=new Path2D();
  const SEG=200;
  for(let i=0;i<=SEG;i+=1){
    const a=-Math.PI/2+i/SEG*TAU;
    const r=rLarge*(1.0-clipReveal)+rCheckAt(a,1)*clipReveal;
    const x=CX+Math.cos(a)*r, y=CY+Math.sin(a)*r;
    if(i===0) ap.moveTo(x,y); else ap.lineTo(x,y);
  }
  ap.closePath();

  /* fuori dall'arena: contorno tratteggiato luminoso (non clippato). */
  ctx.save();
  ctx.setLineDash([9,7]);
  ctx.lineWidth=2.0;
  ctx.strokeStyle='rgba(255,226,150,0.55)';
  ctx.stroke(p);
  ctx.restore();

  /* Tutti i livelli interni sono clippati alla maschera del catrame. */
  ctx.save();
  ctx.clip(ap);

  /* L1 radiant white-gold ivory face with strong inner glow */
  ctx.fillStyle=face;
  ctx.globalAlpha=0.82;
  ctx.fill(p);
  ctx.globalAlpha=1.0;

  /* L2 rotating specular sheen */
  ctx.save(); ctx.clip(p);
  const ang=now/2600, sx=CX+Math.cos(ang)*240, sy=CY+Math.sin(ang)*240;
  const sh=ctx.createLinearGradient(CX-(sx-CX),CY-(sy-CY),sx,sy);
  sh.addColorStop(.42,'rgba(255,255,255,0)'); sh.addColorStop(.5,'rgba(255,255,255,.35)'); sh.addColorStop(.58,'rgba(255,255,255,0)');
  ctx.fillStyle=sh; ctx.fillRect(0,0,W,W);
  ctx.restore();

  /* L3-L5 triple bronze rim — the ALMOST band */
  ctx.lineJoin='round';
  ctx.lineWidth=ALMOST_W; ctx.strokeStyle='rgba(96,44,8,.55)'; ctx.stroke(starPath(s*1.0));
  ctx.lineWidth=4.5; ctx.strokeStyle='#602c08'; ctx.stroke(p);
  ctx.lineWidth=2.4;
  const rim=ctx.createLinearGradient(CX-120,CY-120,CX+120,CY+120);
  rim.addColorStop(0,'#fce890'); rim.addColorStop(.5,'#a06a1e'); rim.addColorStop(1,'#fce890');
  ctx.strokeStyle=rim; ctx.stroke(p);
  /* L6 white specular hairline */
  ctx.lineWidth=.8; ctx.strokeStyle='rgba(255,248,215,.85)'; ctx.stroke(p);
  /* L7-L9 inset mechanical outlines */
  [0.8,0.62,0.45].forEach((k,i)=>{
    ctx.lineWidth=1;
    ctx.strokeStyle=`rgba(160,106,30,${.32-.07*i})`;
    ctx.stroke(starPath(s*k));
  });
  /* L10 core outer ring */
  ctx.lineWidth=3;
  ctx.strokeStyle='#8a5a18';
  ctx.beginPath(); ctx.arc(CX,CY,geo.rCore*s,0,TAU); ctx.stroke();
  /* L11 brushed bronze-on-gold core (the BIG WIN seat) */
  const core=ctx.createRadialGradient(CX-8,CY-10,2,CX,CY,geo.rCore*s);
  core.addColorStop(0,'#f7e1ad'); core.addColorStop(.55,'#cf9d4a'); core.addColorStop(1,'#7d4d12');
  ctx.fillStyle=core;
  ctx.beginPath(); ctx.arc(CX,CY,geo.rCore*s-2,0,TAU); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(CX,CY,geo.rCore*s-2,0,TAU); ctx.clip();
  ctx.globalAlpha=.3;
  for(let i=0;i<9;i+=1){                      // brushed arcs
    ctx.strokeStyle=i%2?'rgba(255,240,200,.5)':'rgba(96,44,8,.5)';
    ctx.lineWidth=.7;
    ctx.beginPath(); ctx.arc(CX,CY,(geo.rCore*s-3)*(i+1)/10,t*.3*(i%2?1:-1),t*.3*(i%2?1:-1)+TAU*.8); ctx.stroke();
  }
  ctx.globalAlpha=1; ctx.restore();
  /* L12 core inner sun-spark ring */
  ctx.lineWidth=1.2;
  ctx.strokeStyle=`rgba(255,238,188,${.55+.3*Math.sin(t*2.4)})`;
  ctx.beginPath(); ctx.arc(CX,CY,geo.rCore*s*.55,0,TAU); ctx.stroke();
  /* V6: glint prismatici rimossi — erano un quarto colore (ciano) sulle punte. */

  ctx.restore();
}

/* RISK STREAMS — flowing cosmic rivers / expanding ink veins.
   Vivid translucent jewel-gel: reads on the astral ink AND tints the white-gold
   star like stained glass. The centreline MEANDERS and the body SWELLS
   asymmetrically as it pools inward — never a rigid vertical banner.
   Coverage angle ∝ risk probability; edges shimmer via animated #fluidWobble. */
function drawStream(wedge,color,edge,now,pour,variant){
  if(pour<=0) return;
  const t=now/1000;
  const mid=(wedge.a0+wedge.a1)/2;
  const half=Math.max(0.06,(wedge.a1-wedge.a0)/2);
  const ge=rCheckAt(mid);                       // source = the goo edge at this wedge
  const reach=(ge-geo.rCore)*pour;              // pours INTO the goo — proportional to goo depth
  const STEPS=36;
  const fade=clamp(pour*1.5,0,1);
  const col=a=>color.replace('A',a.toFixed(3));
  /* distinct per-stream personality so the two rivers bend differently */
  const seed=variant==='wound' ? 1.6 : 4.3;
  const bendDir=variant==='wound' ? 1 : -1;

  /* u: 0 at the goo-edge source → 1 toward the centre */
  const centreline=u=> mid
      + Math.sin(u*2.15 + t*0.5 + seed)*half*0.85*u*bendDir   // growing S-meander
      + Math.sin(u*4.6 + t*1.0 + seed)*0.018*u;               // fine ripple
  const swell=u=> half*(0.42 + 1.05*Math.sin(Math.min(1,u*1.04)*Math.PI*0.9)); // vein bulge
  const radAt=(u,a)=> rCheckAt(a) - reach*u;    // creep inward from the goo edge per angle

  /* ragged, creeping edge: low swell + higher-frequency irregular notches so the
     border looks like bleeding ink, never a clean petal */
  const ragged=(u,ph)=> 1
      + 0.16*Math.sin(u*6.1 + t*1.3 + ph)
      + 0.13*Math.sin(u*17.0 + ph*1.7 + t*0.5)
      + 0.09*Math.sin(u*34.0 + ph*0.6)
      + 0.05*Math.sin(u*61.0 + ph*2.2);
  const buildPath=(wScale)=>{
    ctx.beginPath();
    for(let i=0;i<=STEPS;i+=1){              // left bank: edge → centre
      const u=i/STEPS, c=centreline(u);
      const w=swell(u)*wScale*ragged(u,seed);
      const a=c-w, d=radAt(u,a);
      ctx.lineTo(CX+Math.cos(a)*d,CY+Math.sin(a)*d);
    }
    for(let i=STEPS;i>=0;i-=1){              // right bank: centre → edge (asymmetric)
      const u=i/STEPS, c=centreline(u);
      const w=swell(u)*wScale*ragged(u,seed+2.9);
      const a=c+w, d=radAt(u,a);
      ctx.lineTo(CX+Math.cos(a)*d,CY+Math.sin(a)*d);
    }
    ctx.closePath();
  };

  ctx.save();
  ctx.clip(gooBlobPath(1,0));                // rivers stay inside the goo
  /* no organic wobble — crystal streams have clean, faceted edges */

  /* 1) CRYSTAL ENERGY BODY — additive so it glows like neon, not painted ink */
  ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(CX,CY,Math.max(0,ge-reach),CX,CY,ge);
  g.addColorStop(0, col(0.10*fade));
  g.addColorStop(.5, col(0.52*fade));
  g.addColorStop(.85,col(0.78*fade));
  g.addColorStop(1, col(0.92*fade));
  ctx.fillStyle=g; buildPath(1); ctx.fill();

  /* 2) LUMINOUS CORE — bright additive heart */
  const c=ctx.createRadialGradient(CX,CY,Math.max(0,ge-reach*0.9),CX,CY,ge);
  c.addColorStop(0, col(0.0));
  c.addColorStop(.7, col(0.30*fade));
  c.addColorStop(1, col(0.58*fade));
  ctx.fillStyle=c; buildPath(0.5); ctx.fill();

  /* 3) crystalline edge filaments — two bold arcs, vivid */
  ctx.strokeStyle=edge; ctx.lineCap='round';
  for(let k=0;k<3;k+=1){
    ctx.lineWidth=(k===0?2.4:1.1);
    ctx.globalAlpha=fade*(k===0?0.95:0.55);
    ctx.beginPath();
    for(let i=0;i<=STEPS;i+=1){
      const u=i/STEPS;
      const a=centreline(u)+(k-1.5)*swell(u)*0.5+Math.sin(t*1.2+i*.4+k*1.9)*half*0.18*u;
      const d=radAt(u,a)+Math.sin(t*1.5+i*.5+k)*3;
      const x=CX+Math.cos(a)*d, y=CY+Math.sin(a)*d;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  /* drifting jewel droplets seeping ahead of the pool */
  for(let k=0;k<6;k+=1){
    const u=1+0.04*k;
    const a=centreline(0.95)+Math.sin(t*.6+k*1.3)*half*0.7;
    const dd=radAt(0.96,a)-4-Math.abs(Math.sin(t*.7+k*1.9))*Math.min(reach*.35,38);
    if(dd<8) continue;
    const dx=CX+Math.cos(a)*dd, dy=CY+Math.sin(a)*dd, rr=1.6+(k%3);
    const dg=ctx.createRadialGradient(dx,dy,0,dx,dy,rr);
    dg.addColorStop(0,edge); dg.addColorStop(1,col(0));
    ctx.globalAlpha=fade*0.85; ctx.fillStyle=dg;
    ctx.beginPath(); ctx.arc(dx,dy,rr,0,TAU); ctx.fill();
  }

  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';
  ctx.restore();
}

/* ZONE DI RISCHIO — drawn ON TOP of the star, visible regardless of gap size.
   FERITA (wound): amber-crimson arc band around the full star perimeter.
   MORTE (death): deep-violet void spots at the 5 valley floors.
   Both use additive glow that bleeds over the star's bronze rim.
   Pour animation: appears as scene.pourP goes 0→1. */
function drawValleyRisks(now,pour){
  if(pour<=0) return;
  const t=now/1000;
  const fade=clamp(pour*1.5,0,1);

  /* ── FERITA (WOUND): crimson arc-band around the star's outer rim ── */
  /* Drawn as an additive glow ring following rStarAt, extending outward.
     Visible as a danger halo even when failure gap is tiny. */
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const WOUND_SEGS=120;
  const woundGlowR=Math.max(18, geo.woundW*0.9+12); // minimum 18px so always visible
  for(let k=0;k<WOUND_SEGS;k+=1){
    const a=(k/WOUND_SEGS)*TAU;
    const starR=rStarAt(a);
    /* outer band mid-point */
    const bandMid=starR+woundGlowR*0.4;
    const wx=CX+Math.cos(a)*bandMid, wy=CY+Math.sin(a)*bandMid;
    const pulse=0.5+0.5*Math.sin(t*2.1+k*0.23+0.8);
    const alpha=fade*(0.28+0.22*pulse);
    const gw=ctx.createRadialGradient(wx,wy,0,wx,wy,woundGlowR);
    gw.addColorStop(0,`rgba(220,60,30,${alpha})`);
    gw.addColorStop(0.5,`rgba(180,30,10,${alpha*0.5})`);
    gw.addColorStop(1,'transparent');
    ctx.fillStyle=gw;
    ctx.beginPath(); ctx.arc(wx,wy,woundGlowR,0,TAU); ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';
  ctx.restore();

  /* Wound arc stroke directly on the star bronze rim */
  ctx.save();
  const WOUND_ARC=200;
  ctx.lineWidth=2.5;
  for(let k=0;k<WOUND_ARC;k+=1){
    const a0=(k/WOUND_ARC)*TAU;
    const a1=((k+1)/WOUND_ARC)*TAU;
    const r0=rStarAt(a0), r1=rStarAt(a1);
    const pulse=0.5+0.5*Math.sin(t*2.4+(k/WOUND_ARC)*TAU*3.7);
    const alpha=fade*(0.55+0.35*pulse);
    ctx.strokeStyle=`rgba(230,70,30,${alpha})`;
    ctx.shadowColor='rgba(255,60,20,0.8)'; ctx.shadowBlur=6+4*pulse;
    ctx.beginPath();
    ctx.moveTo(CX+Math.cos(a0)*r0, CY+Math.sin(a0)*r0);
    ctx.lineTo(CX+Math.cos(a1)*r1, CY+Math.sin(a1)*r1);
    ctx.stroke();
  }
  ctx.shadowBlur=0;
  ctx.restore();

  /* ── MORTE (DEATH): void spots at the 5 valley floors ── */
  /* Qualitatively different from wound: black cores + violet glow,
     positioned at star valley tips (not in the failure gap). */
  ctx.save();
  for(let i=0;i<AXES;i+=1){
    const valleyAng=TIP(i)+Math.PI/AXES;  // midpoint between tips = valley
    const starAtV=rStarAt(valleyAng);
    /* death void centered just OUTSIDE the star valley edge */
    const deathR=Math.max(22, geo.deathDepth*1.2);
    const voidCtrR=starAtV+deathR*0.35;
    const vx=CX+Math.cos(valleyAng)*voidCtrR;
    const vy2=CY+Math.sin(valleyAng)*voidCtrR;
    const pulse=0.5+0.5*Math.sin(t*2.7+i*1.26);
    const voidSize=deathR*(0.9+0.2*pulse)*pour;

    /* outer violet glow (additive — bleeds over anything) */
    ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(vx,vy2,0,vx,vy2,voidSize*2.2);
    g.addColorStop(0,`rgba(120,0,220,${fade*0.7*(0.5+0.5*pulse)})`);
    g.addColorStop(0.4,`rgba(70,0,150,${fade*0.4})`);
    g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(vx,vy2,voidSize*2.2,0,TAU); ctx.fill();
    ctx.globalCompositeOperation='source-over';

    /* black void core — clearly "dead space" */
    const bc=ctx.createRadialGradient(vx,vy2,0,vx,vy2,voidSize*0.8);
    bc.addColorStop(0,`rgba(0,0,0,${fade*0.95})`);
    bc.addColorStop(0.65,`rgba(8,0,20,${fade*0.75})`);
    bc.addColorStop(1,'transparent');
    ctx.fillStyle=bc;
    ctx.beginPath(); ctx.arc(vx,vy2,voidSize*0.8,0,TAU); ctx.fill();

    /* rotating violet ring arcs — qualitatively distinct from wound style */
    ctx.globalAlpha=fade*(0.55+0.25*pulse);
    ctx.strokeStyle=`rgba(190,80,255,${0.5+0.3*pulse})`;
    ctx.lineWidth=1.2; ctx.shadowColor='rgba(160,60,255,0.8)'; ctx.shadowBlur=6;
    for(let ring=1;ring<=3;ring+=1){
      const dir=ring%2?1:-1;
      ctx.beginPath();
      ctx.arc(vx,vy2,voidSize*(0.18+ring*0.14),t*dir*0.95,t*dir*0.95+TAU*0.7);
      ctx.stroke();
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
  ctx.restore();
}

/* obelisk pillars */
function drawPillar(pl,isWhite){
  if(pl.drop<=0) return;
  const px=CX+Math.cos(pl.ang)*pl.r, py=CY+Math.sin(pl.ang)*pl.r;
  const dropY=(1-pl.drop)*-520;
  const vy=py+dropY;
  /* tapered runic monolith with a faceted pyramidion cap — slender & elegant */
  const bw=13.5, tw=5.5;           // base / shoulder half-widths
  const h=112, capH=40;            // taller shaft + a longer, sharper pyramidion
  const footF=11, frontF=3;
  const lean=isWhite?0:3;           // basalt leans (asymmetry / Rude Beauty)
  const shoulderY=vy-h;
  const tipX=px+lean, tipY=shoulderY-capH;
  const Bc=[px,vy+footF];
  const bL=[px-bw,vy+frontF], bR=[px+bw,vy+frontF];
  const sL=[px-tw,shoulderY], sR=[px+tw,shoulderY];
  const Sc=[px,shoulderY+footF*0.42];
  const mk=(...pts)=>{const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p;};
  const shaftL=mk(Bc,bL,sL,Sc);
  const shaftR=mk(Bc,bR,sR,Sc);
  const capL=mk(Sc,sL,[tipX,tipY]);
  const capR=mk(Sc,sR,[tipX,tipY]);
  const glow=isWhite?'#ffe9c0':'#c8862e';
  const fl=pl.flash;
  ctx.save();

  /* ground shadow + emissive socket where the obelisk roots into the goo */
  if(pl.drop>=1){
    ctx.fillStyle='rgba(3,22,20,.62)';
    ctx.beginPath(); ctx.ellipse(px,py,bw*1.25,bw*.42,0,0,TAU); ctx.fill();
    const sock=ctx.createRadialGradient(px,py,1,px,py,bw*1.7);
    sock.addColorStop(0, isWhite?'rgba(255,221,150,.40)':'rgba(56,224,196,.36)');
    sock.addColorStop(1,'transparent');
    ctx.fillStyle=sock;
    ctx.beginPath(); ctx.ellipse(px,py,bw*1.7,bw*.62,0,0,TAU); ctx.fill();
    /* faint vertical emissive aura hugging the shaft */
    const aura=ctx.createLinearGradient(px,py,px,py-h-capH);
    aura.addColorStop(0, isWhite?'rgba(255,224,150,.18)':'rgba(60,224,196,.16)');
    aura.addColorStop(1,'transparent');
    ctx.fillStyle=aura;
    ctx.beginPath(); ctx.ellipse(px,py-(h+capH)*0.5,bw*1.25,(h+capH)*0.5,0,0,TAU); ctx.fill();
  }
  /* descent motion-streak while falling */
  if(pl.drop<1){
    const tg=ctx.createLinearGradient(px,tipY-70,px,vy);
    tg.addColorStop(0,glow+'00'); tg.addColorStop(.6,glow+'33'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.globalAlpha=.6;
    ctx.beginPath(); ctx.moveTo(px-tw,tipY-10); ctx.lineTo(px,tipY-72); ctx.lineTo(px+tw,tipY-10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
  }

  /* shadow (left) shaft + cap — near-black obsidian face */
  ctx.fillStyle=isWhite?'#a48d60':'#07050f'; ctx.fill(shaftL);
  ctx.fillStyle=isWhite?'#8f7a52':'#050310'; ctx.fill(capL);

  /* lit (right) shaft — dark crystal face with cold azure catch-light */
  const fg=ctx.createLinearGradient(px-2,shoulderY,px+bw,vy);
  if(isWhite){ fg.addColorStop(0,'#fefaf0'); fg.addColorStop(.4,'#ece0c1'); fg.addColorStop(1,'#c2a574'); }
  else { fg.addColorStop(0,'#1c2a3a'); fg.addColorStop(.45,'#0e1a26'); fg.addColorStop(1,'#060d14'); }
  ctx.fillStyle=fg; ctx.fill(shaftR);

  /* matte material grain clipped to the lit shaft */
  ctx.save();
  ctx.clip(shaftR);
  ctx.globalCompositeOperation='overlay';
  ctx.globalAlpha=isWhite?.55:.65;
  ctx.drawImage(isWhite?marbleTex:stoneTex, px-bw, tipY, bw*2.2, h+capH+footF);
  if(isWhite){
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    const ss=ctx.createRadialGradient(px+2,shoulderY+h*.35,0,px+2,shoulderY+h*.35,h*.7);
    ss.addColorStop(0,'rgba(255,206,128,.20)'); ss.addColorStop(.6,'rgba(255,200,110,.05)'); ss.addColorStop(1,'transparent');
    ctx.fillStyle=ss; ctx.fillRect(px-bw,tipY,bw*2.2,h+capH+footF);
  } else {
    /* subtle azure crystal vein in the lit face */
    ctx.globalCompositeOperation='screen'; ctx.globalAlpha=.18;
    const vein=ctx.createLinearGradient(px,shoulderY,px+bw,vy);
    vein.addColorStop(0,'rgba(0,229,255,1)'); vein.addColorStop(1,'rgba(0,80,120,1)');
    ctx.fillStyle=vein; ctx.fillRect(px-bw,tipY,bw*2.2,h+capH+footF);
  }
  ctx.restore();

  /* lit (right) pyramidion facet */
  const cg=ctx.createLinearGradient(tipX,tipY,sR[0],shoulderY);
  if(isWhite){ cg.addColorStop(0,'#fffdf6'); cg.addColorStop(1,'#d8c188'); }
  else { cg.addColorStop(0,'#243444'); cg.addColorStop(1,'#040210'); }
  ctx.fillStyle=cg; ctx.fill(capR);

  /* glowing rune fissure down the lit face */
  ctx.save();
  ctx.clip(shaftR);
  const rGlow=0.32+0.68*fl;
  ctx.strokeStyle=isWhite?`rgba(255,233,176,${0.5*rGlow})`:`rgba(210,140,60,${0.55*rGlow})`;
  ctx.shadowColor=glow; ctx.shadowBlur=(isWhite?6:5)*(0.4+rGlow);
  ctx.lineWidth=1.1;
  ctx.beginPath();
  let rx=px+3, ry=shoulderY+10;
  ctx.moveTo(rx,ry);
  for(let k=1;k<=5;k+=1){ rx=px+3+(k%2?3:-2); ry=shoulderY+10+k*(h*0.62/5); ctx.lineTo(rx,ry); }
  ctx.stroke();
  /* a couple of rune notches */
  ctx.lineWidth=0.9;
  for(let k=1;k<=2;k+=1){ const ny=shoulderY+18+k*22; ctx.beginPath(); ctx.moveTo(px+1,ny); ctx.lineTo(px+8,ny-4); ctx.stroke(); }
  ctx.restore();

  /* ball-passage edge ignition */
  if(fl>0.02){
    ctx.shadowColor=glow; ctx.shadowBlur=26*fl;
    ctx.strokeStyle=glow; ctx.lineWidth=.6+1.9*fl; ctx.globalAlpha=fl;
    ctx.stroke(shaftR); ctx.stroke(capR);
    ctx.globalAlpha=1; ctx.shadowBlur=0;
  }

  /* crystal: strong azure back-rim + secondary cap edge — forces dark monolith
     to read as crystal against the teal background */
  if(!isWhite){
    /* primary left-edge azure line */
    ctx.strokeStyle='rgba(0,229,255,.95)'; ctx.lineWidth=1.8;
    ctx.shadowColor='rgba(0,200,255,.90)'; ctx.shadowBlur=14;
    ctx.beginPath();
    ctx.moveTo(Bc[0],Bc[1]); ctx.lineTo(bL[0],bL[1]); ctx.lineTo(sL[0],sL[1]); ctx.lineTo(tipX,tipY);
    ctx.stroke();
    /* secondary softer outer glow pass */
    ctx.strokeStyle='rgba(0,180,255,.35)'; ctx.lineWidth=5;
    ctx.shadowBlur=22;
    ctx.beginPath();
    ctx.moveTo(bL[0],bL[1]); ctx.lineTo(sL[0],sL[1]); ctx.lineTo(tipX,tipY);
    ctx.stroke();
    ctx.shadowBlur=0;
  }

  /* chiseled specular ridges — sharp catchlights on the lit face */
  const spec=isWhite?'rgba(255,253,240,.95)':'rgba(160,230,255,.95)';
  ctx.strokeStyle=spec; ctx.lineWidth=isWhite?1.3:1.5;
  ctx.shadowColor=spec; ctx.shadowBlur=isWhite?7:10;
  ctx.beginPath(); ctx.moveTo(tipX,tipY); ctx.lineTo(sR[0],shoulderY); ctx.stroke();   // lit cap ridge
  ctx.beginPath(); ctx.moveTo(tipX,tipY); ctx.lineTo(Sc[0],Sc[1]); ctx.stroke();       // central spine
  const evg=ctx.createLinearGradient(sR[0],shoulderY,bR[0],vy);
  evg.addColorStop(0,spec); evg.addColorStop(.55,isWhite?'rgba(120,80,30,.22)':'rgba(0,120,180,.18)'); evg.addColorStop(1,'transparent');
  ctx.strokeStyle=evg; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(sR[0],shoulderY); ctx.lineTo(bR[0],vy+frontF); ctx.stroke();
  ctx.shadowBlur=0;

  /* basalt: a chipped fracture at the shoulder (broken, ancient) */
  if(!isWhite){
    ctx.strokeStyle='rgba(150,95,30,.5)'; ctx.lineWidth=.8;
    ctx.beginPath(); ctx.moveTo(px-tw,shoulderY+6); ctx.lineTo(px-tw+5,shoulderY-3); ctx.lineTo(px-tw+1,shoulderY-9); ctx.stroke();
  } else {
    /* alabaster: a bright crystalline tip glint */
    ctx.fillStyle='rgba(255,255,255,.9)'; ctx.shadowColor='#fff'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(tipX,tipY,1.6,0,TAU); ctx.fill(); ctx.shadowBlur=0;
  }
  /* soft emissive halo crowning the pyramidion */
  const tipHalo=ctx.createRadialGradient(tipX,tipY,0,tipX,tipY,16+10*fl);
  tipHalo.addColorStop(0, isWhite?`rgba(255,238,180,${.5+.4*fl})`:`rgba(120,210,255,${.32+.4*fl})`);
  tipHalo.addColorStop(1,'transparent');
  ctx.fillStyle=tipHalo;
  ctx.beginPath(); ctx.arc(tipX,tipY,16+10*fl,0,TAU); ctx.fill();
  ctx.restore();
}

function drawShocks(dt){
  for(let i=scene.shocks.length-1;i>=0;i-=1){
    const s=scene.shocks[i]; s.t+=dt;
    const p=s.t/s.dur;
    if(p>=1){scene.shocks.splice(i,1);continue;}
    ctx.save();
    ctx.globalAlpha=(1-p)*.8;
    ctx.strokeStyle=s.c; ctx.lineWidth=2.4*(1-p)+.4;
    ctx.shadowColor=s.c; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.ellipse(s.x,s.y,8+44*easeOutCubic(p),(8+44*easeOutCubic(p))*.42,0,0,TAU); ctx.stroke();
    ctx.restore();
  }
}
function drawRimHits(){
  scene.rimHits.forEach(h=>{
    const a=h.life/600;
    ctx.save();
    ctx.globalAlpha=a*.85;
    ctx.strokeStyle='#fce890'; ctx.lineWidth=4;
    ctx.shadowColor='#fce890'; ctx.shadowBlur=16;
    ctx.beginPath(); ctx.arc(CX,CY,R-5,h.ang-.16,h.ang+.16); ctx.stroke();
    ctx.restore();
  });
}
function drawBall(now){
  const b=scene.ball;
  if(!b.on && scene.state!=='resolution') return;
  /* gold→teal comet trail */
  const n=b.trail.length;
  for(let i=1;i<n;i+=1){
    const t0=b.trail[i-1], t1=b.trail[i];
    const a=t1.life/480;
    if(a<=0) continue;
    const mix=i/n;                              // tail→head
    const cr=Math.round(52+(255-52)*mix), cg=Math.round(212+(233-212)*mix), cb=Math.round(184+(168-184)*mix);
    ctx.globalAlpha=a*.6;
    ctx.strokeStyle=`rgb(${cr},${cg},${cb})`;
    ctx.lineWidth=b.r*1.5*a*(.4+.6*mix);
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(t0.x,t0.y); ctx.lineTo(t1.x,t1.y); ctx.stroke();
  }
  ctx.globalAlpha=1;
  scene.sparks.forEach(s=>{
    const a=s.life/s.max;
    ctx.globalAlpha=a; ctx.fillStyle=s.c; ctx.shadowColor=s.c; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r*a,0,TAU); ctx.fill(); ctx.shadowBlur=0;
  });
  ctx.globalAlpha=1;
  /* the energy pinball */
  const pulse=scene.state==='resolution'?1+.08*Math.sin(now/120):1;
  const r=b.r*pulse;
  const halo=ctx.createRadialGradient(b.x,b.y,r*.5,b.x,b.y,r*4);
  halo.addColorStop(0,'rgba(255,236,170,.5)'); halo.addColorStop(.5,'rgba(252,232,144,.12)'); halo.addColorStop(1,'transparent');
  ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(b.x,b.y,r*4,0,TAU); ctx.fill();
  const g=ctx.createRadialGradient(b.x-3,b.y-3,1,b.x,b.y,r+2);
  g.addColorStop(0,'#ffffff'); g.addColorStop(.4,'#ffeebc'); g.addColorStop(1,'#a06a1e');
  ctx.shadowColor='rgba(252,232,144,.95)'; ctx.shadowBlur=26;
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,r,0,TAU); ctx.fill();
  ctx.lineWidth=1.4; ctx.strokeStyle='rgba(255,244,200,.95)'; ctx.stroke();
  ctx.shadowBlur=0;
}

/* blueprint preview in idle — zones update live as sliders move */
function drawBlueprint(now){
  if(scene.state!=='idle') return;
  /* the void before creation: only a single breathing ember-seed at the core */
  const t=now/1000;
  const pul=0.5+0.5*Math.sin(t*1.6);
  ctx.save();
  const sg=ctx.createRadialGradient(CX,CY,0,CX,CY,18+10*pul);
  sg.addColorStop(0,`rgba(255,236,170,${0.5+0.3*pul})`);
  sg.addColorStop(0.5,`rgba(201,162,39,${0.12+0.1*pul})`);
  sg.addColorStop(1,'transparent');
  ctx.fillStyle=sg;
  ctx.beginPath(); ctx.arc(CX,CY,18+10*pul,0,TAU); ctx.fill();
  ctx.fillStyle=`rgba(255,248,225,${0.7+0.3*pul})`;
  ctx.beginPath(); ctx.arc(CX,CY,1.6+0.6*pul,0,TAU); ctx.fill();
  ctx.restore();
}

/* =========================================================================
   MAIN LOOP
   ========================================================================= */
let lastT=performance.now();
function frame(now){
 try{
  const dt=Math.min(50,now-lastT); lastT=now;
  scene.nowMs=now;                       // drives the goo's breathing undulation
  scene.warp=Math.max(0,(scene.warp||0)-0.04);
  tickTimeline();
  /* V6: rimosso l'aggiornamento per-frame di #gooTurb/#fluidTurb — quei filtri
     SVG non erano applicati da nessuna regola CSS, quindi erano due setAttribute
     per frame a costo di style recalc e zero pixel. */

  ctx.clearRect(0,0,W,W);
  drawBackdrop(now);
  drawChallengeSurface(now);
  drawAxisRig(now);
  drawBlueprint(now);
  drawStar(now);
  /* V6: drawValleyRisks() disattivato — ferita e morte tornano con una
     grammatica propria, fuori dall'area del goo. */
  scene.whitePillars.forEach(p=>drawPillar(p,true));  // draw first (behind)
  scene.blackPillars.forEach(p=>drawPillar(p,false)); // draw last (in front)
  drawShocks(dt);
  drawRimHits();
  drawMotes(now,dt);
  drawBall(now);
 }catch(e){ if(!window.__frameErrLogged){ window.__frameErrLogged=true; console.error('FRAME ERROR:', e && e.stack || e); } }
 /* V6.2: guarded re-schedule — the V6 clone had two parallel self-rescheduling
    rAF loops that destroy() could never stop (leaked frames after unmount). */
 if(engineAlive) rafId=requestAnimationFrame(frame);
}

/* =========================================================================
   PANEL BINDINGS + LIVE MATH
   ========================================================================= */
/* panel sliders removed — config comes from props */


function updateMathPanel(){
  const tst=geo.tst;
  const failFrom=Math.min(100,tst+6);
  const failSpan=Math.max(0,100-(tst+5));
  const epicN=Math.max(1,Math.round(failSpan*cfg.crit/100));
  const epicFrom=101-epicN;
  $id('mTst').textContent=tst;
  $id('mWin').textContent=`1 – ${tst}`;
  $id('mAlmost').textContent=`${Math.min(100,tst+1)} – ${Math.min(100,tst+5)}`;
  $id('mFail').textContent=failSpan>0?`${failFrom} – 100`:'—';
  $id('mEpic').textContent=failSpan>0?`${epicFrom} – 100 (${epicN})`:'—';
  $id('mWound').textContent=`${cfg.wound}%`;
  $id('mDead').textContent=`${cfg.dead}%`;
  const bar=$id('probBar');
  const sW=tst, aW=Math.min(5,100-tst), fW=Math.max(0,failSpan-epicN), eW=Math.min(epicN,failSpan);
  bar.innerHTML=`
    <div class="seg s" style="width:${sW}%"></div>
    <div class="seg a" style="width:${aW}%"></div>
    <div class="seg f" style="width:${fW}%"></div>
    <div class="seg e" style="width:${eW}%"></div>`;
}
function updateResultPanel(preOnly){
  const r=scene.res;
  if(!r) return;
  const names={bigwin:'Trionfo',win:'Vittoria',almost:'Per un Soffio',fail:'Sconfitta',epicfail:'Rovina'};
  const cls={bigwin:'triumph',win:'win',almost:'almost',fail:'fail',epicfail:'epic'};
  const v=$id('rVerdict');
  v.textContent=names[r.verdict]+(r.wounded?' · Ferito':'')+(r.dead?' · Caduto':'');
  v.className='verdict '+cls[r.verdict];
  $id('rRoll').textContent=r.roll;
  $id('rVs').textContent=`${r.roll} ${r.roll<=geo.tst?'≤':'>'} ${geo.tst}`;
  $id('rRisk').textContent=`${r.riskRoll} (≤${cfg.dead} morto · ≤${cfg.dead+cfg.wound} ferito)`;
  $id('rZone').textContent=preOnly
    ? `pre-calcolata (${Math.round(scene.target.x)}, ${Math.round(scene.target.y)})`
    : `raggiunta (${Math.round(scene.ball.x)}, ${Math.round(scene.ball.y)})`;
}

/* frame decorations */
(function buildFrame(){
  return;   // V6: ghiera bronzea rimossa dal markup — niente studs né degree ticks
  const g=$id('studs');
  for(let i=0;i<10;i+=1){
    const a=-Math.PI/2+i*(Math.PI/5);
    const x=500+Math.cos(a)*473, y=500+Math.sin(a)*473;
    const big=i%2===0;
    /* deep rivet shadow, saturated with emerald/teal */
    const sh=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    sh.setAttribute('cx',x+2); sh.setAttribute('cy',y+5);
    sh.setAttribute('rx',big?14:9); sh.setAttribute('ry',big?6:4);
    sh.setAttribute('fill','rgba(7,46,38,.65)');
    g.appendChild(sh);
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y);
    c.setAttribute('r',big?13:8);
    c.setAttribute('fill','url(#studG)'); c.setAttribute('stroke','#3a2208'); c.setAttribute('stroke-width','2');
    g.appendChild(c);
  }
  const ticks=$id('degreeTicks');
  for(let i=0;i<72;i+=1){
    const a=i*(Math.PI/36), r1=489, r2=i%6===0?481:485;
    const l=document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',500+Math.cos(a)*r1); l.setAttribute('y1',500+Math.sin(a)*r1);
    l.setAttribute('x2',500+Math.cos(a)*r2); l.setAttribute('y2',500+Math.sin(a)*r2);
    l.setAttribute('stroke-width',i%6===0?'2':'1');
    ticks.appendChild(l);
  }
})();

$id('launch').addEventListener('click',()=>{ armed?throwBall():launchRoll(); });
window.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!e.repeat){ e.preventDefault(); armed?throwBall():launchRoll(); }
});

recomputeGeometry();
updateMathPanel();

  /* ---- public handle ---- */
  let engineAlive = true;
  let rafId = requestAnimationFrame(frame);
  recomputeGeometry();
  function setConfig(newSkills, newConfig){
    if(newSkills){ skills = newSkills.slice(); recomputeSkillAxes(); }
    if(newConfig){ Object.assign(cfg, newConfig); }
    recomputeGeometry();
    /* reposition existing obelisks live to the new per-axis radii (keep drop state) */
    if(scene.whitePillars && scene.whitePillars.length){
      for(let i=0;i<scene.whitePillars.length;i+=1){
        if(geo.obeliskTip[i]!=null) scene.whitePillars[i].r=geo.obeliskTip[i];
        if(geo.obeliskCheck[i]!=null) scene.blackPillars[i].r=geo.obeliskCheck[i];  // sit on the difficulty
      }
    }
  }
  function destroy(){ engineAlive=false; cancelAnimationFrame(rafId); gooRenderer?.destroy(); }
  return { roll: launchRoll, throw: throwBall, setConfig, destroy };
}
