import fs from 'fs';
let css = fs.readFileSync('/tmp/astrolabe.raw.css','utf8');
css = css.replace(/\/\*[\s\S]*?\*\//g, '');          // strip comments
const SCOPE = '.destiny-astrolabe';
function splitRules(s){
  const rules=[]; let depth=0, buf='';
  for(let i=0;i<s.length;i++){ const c=s[i]; buf+=c;
    if(c==='{') depth++; else if(c==='}'){ depth--; if(depth===0){ rules.push(buf); buf=''; } } }
  if(buf.trim()) rules.push(buf); return rules;
}
function scopeSelector(sel){
  sel=sel.trim(); if(!sel) return '';
  if(sel==='*') return `${SCOPE} *`;
  if(sel===':root'||/^(html|body)/.test(sel)) return SCOPE;
  if(sel.startsWith(SCOPE)) return sel;
  return `${SCOPE} ${sel}`;
}
function scopeHeader(h){ return [...new Set(h.split(',').map(scopeSelector).filter(Boolean))].join(', '); }
function process(s){
  return splitRules(s).map(rule=>{
    const b=rule.indexOf('{'); if(b<0) return '';
    const header=rule.slice(0,b).trim(); const body=rule.slice(b);
    if(/^@(-webkit-)?keyframes/.test(header)) return rule;
    if(header.startsWith('@media')){ const inner=body.slice(1,body.lastIndexOf('}')); return `${header}{\n${process(inner)}\n}`; }
    if(header.startsWith('@')) return rule;
    return `${scopeHeader(header)}${body}`;
  }).filter(Boolean).join('\n');
}
const overrides =
`/* layout overrides: fill the host container instead of the viewport, hide the (removed) panel */
.destiny-astrolabe{position:relative;width:100%;height:100%;overflow:hidden;}
.destiny-astrolabe .suite{width:100%;height:100%;}
.destiny-astrolabe .scene-col{flex:1 1 100%;width:100%;height:100%;}
.destiny-astrolabe .panel-col{display:none;}
`;
const out = `/* AUTO-GENERATED from public/destiny-astrolabe.html <style>. Scoped under ${SCOPE}. */\n${process(css)}\n${overrides}`;
fs.writeFileSync('src/ui/idleVillage/components/destinyAstrolabe/astrolabe.css', out);
console.log('lines:', out.split('\n').length);
