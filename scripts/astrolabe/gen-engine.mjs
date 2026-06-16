import fs from 'fs';

const html = fs.readFileSync('public/destiny-astrolabe.html','utf8');
const OUT = 'src/ui/idleVillage/components/destinyAstrolabe';

/* ---------- 1. CSS ---------- */
const css = html.slice(html.indexOf('<style>')+7, html.indexOf('</style>'));
fs.writeFileSync('/tmp/astrolabe.raw.css', css);

/* ---------- 2. MARKUP (scene-col + filter SVG, drop panel-col) ---------- */
const body = html.slice(html.indexOf('<body>')+6, html.indexOf('<script>'));
const sceneStart = body.indexOf('<div class="scene-col">');
const sceneEnd = body.indexOf('<!-- ════════════ RIGHT');
const sceneCol = body.slice(sceneStart, sceneEnd).trim();
const filterSvg = body.slice(body.indexOf('<!-- Goo wobble')).trim();
const markup =
`<div class="suite" data-suite data-state="idle" data-tone="">
${sceneCol}
</div>
${filterSvg}`;
fs.writeFileSync(`${OUT}/markup.ts`,
`/* AUTO-GENERATED from public/destiny-astrolabe.html — scene chrome markup.
   Rendered via dangerouslySetInnerHTML inside the React component root. */
export const ASTROLABE_MARKUP = ${JSON.stringify(markup)};
`);

/* ---------- 3. ENGINE (factory) ---------- */
let js = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));

// 3a. strip 'use strict'
js = js.replace(/^\s*'use strict';\s*/,'');

// 3b. replace config + skills + url-params block (from `const cfg={` up to `const W=800`)
const cfgStart = js.indexOf('const cfg={');
const wStart = js.indexOf('const W=800');
const prelude =
`/* config + skills injected by the React host */
const cfg=Object.assign({stat:60,req:55,crit:5,wound:10,dead:5,tSlam:900,tBurst:1100,tPour:900,tSpin:2600,tSnap:650,mode:'random'}, opts.config||{});
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

`;
js = js.slice(0,cfgStart) + prelude + js.slice(wStart);

// 3c. DOM access: scope to root, missing ids -> harmless dummy
js = js.replace(/document\.getElementById\(/g, '$id(');

// 3d. remove panel binding block: from `function bindSlider` to the mode change listener line
const bindStart = js.indexOf('function bindSlider');
const modeLine = "$id('mode').addEventListener('change',e=>{cfg.mode=e.target.value;});";
const bindEnd = js.indexOf(modeLine) + modeLine.length;
js = js.slice(0,bindStart) + '/* panel sliders removed — config comes from props */\n' + js.slice(bindEnd);

// 3e. neutralize panel result/math writes that may target absent elements (safe via $id dummy, but drop the explicit calls)
js = js.replace(/updateResultPanel\((?:false|true)\);/g, '/* panel result removed */');

// 3f. postMessage -> opts.onResolve
js = js.replace(/if\(window\.parent !== window\)\{[\s\S]*?\},200\);\s*\}/,
`if(opts.onResolve){
    const skillName=skills.length>0?skills[skillIndex].name:'Skill';
    opts.onResolve({verdict:res.verdict,roll:res.roll,riskRoll:res.riskRoll,skillIndex:skillIndex,skillName:skillName,wounded:res.wounded,dead:res.dead});
  }`);

// 3g. tail: remove launch/keydown listeners + init; keep buildFrame (already above this point)
const launchListener = "$id('launch').addEventListener('click',launchRoll);";
const tailCut = js.indexOf(launchListener);
js = js.slice(0, tailCut);

// 3h. assemble factory
const engine =
`/* AUTO-GENERATED from public/destiny-astrolabe.html.
   Do not edit by hand — regenerate via /tmp/gen-astrolabe.mjs (kept in repo history).
   The standalone HTML remains the source of truth for the engine logic. */
/* eslint-disable */
// @ts-nocheck

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

export function createDestinyAstrolabeEngine(root: HTMLElement, opts: AstrolabeEngineOpts): AstrolabeEngineHandle {
  const DUMMY: any = new Proxy(function(){}, {
    get(_t, p){ if(p==='style'||p==='classList'||p==='dataset') return DUMMY;
      if(p==='value') return '0'; if(p==='textContent'||p==='innerHTML') return ''; return DUMMY; },
    set(){ return true; }, apply(){ return DUMMY; },
  });
  const $id = (id: string): any => root.querySelector('#'+id) || (root.querySelector('[data-'+id+']') || DUMMY);

${js}

  /* ---- public handle ---- */
  let rafId = requestAnimationFrame(frame);
  recomputeGeometry();
  function setConfig(newSkills, newConfig){
    if(newSkills){ skills = newSkills.slice(); recomputeSkillAxes(); }
    if(newConfig){ Object.assign(cfg, newConfig); }
    recomputeGeometry();
    /* reposition existing obelisks live to the new per-axis radii (keep drop state) */
    if(scene.whitePillars && scene.whitePillars.length){
      for(let i=0;i<scene.whitePillars.length;i+=1){
        if(geo.axisTip[i]!=null) scene.whitePillars[i].r=geo.axisTip[i];
        scene.blackPillars[i].r=rCheckAt(scene.blackPillars[i].ang);  // sit on the goo edge
      }
    }
  }
  function destroy(){ cancelAnimationFrame(rafId); }
  return { roll: launchRoll, throw: throwBall, setConfig, destroy };
}
`;
fs.writeFileSync(`${OUT}/engine.ts`, engine);
console.log('engine.ts lines:', engine.split('\n').length);
console.log('markup.ts written; raw css at /tmp/astrolabe.raw.css (',css.split('\n').length,'lines)');
// sanity: ensure no leftover panel/url refs
for(const bad of ['window.location.search','bindSlider(','window.parent.postMessage','addEventListener(\x27click\x27,launchRoll']){
  console.log('contains', JSON.stringify(bad), ':', engine.includes(bad));
}
