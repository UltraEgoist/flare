// ============================================================
// Flare Compiler Core Library
// Phases: Split → Parse → Type Check → Code Generate
// ============================================================

// ─── Phase 1: Block Splitter ───
function splitBlocks(source) {
  const blocks = [];
  const re = /<(meta|script|template|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    blocks.push({
      type: m[1],
      content: m[3],
      startLine: source.substring(0, m.index).split('\n').length,
    });
  }
  return blocks;
}

// ─── Type Parser ───
function parseType(raw) {
  const s = raw.trim();
  if (s.endsWith('[]')) return { kind: 'array', element: parseType(s.slice(0, -2)) };
  if (s.includes('|')) {
    return { kind: 'union', types: s.split('|').map(p => {
      const t = p.trim();
      if (t.startsWith('"') || t.startsWith("'")) return { kind: 'literal', value: t.replace(/["']/g, '') };
      return parseType(t);
    })};
  }
  if (['string','number','boolean','void','null','undefined'].includes(s))
    return { kind: 'primitive', name: s };
  if (s.startsWith('"') || s.startsWith("'"))
    return { kind: 'literal', value: s.replace(/["']/g, '') };
  if (s.startsWith('{') && s.endsWith('}')) {
    const fields = [];
    for (const fp of s.slice(1,-1).trim().split(',').map(f=>f.trim()).filter(Boolean)) {
      const fm = fp.match(/^(\w+)(\?)?\s*:\s*(.+)$/);
      if (fm) fields.push({ name: fm[1], type: parseType(fm[3]), optional: fm[2]==='?' });
    }
    return { kind: 'object', fields };
  }
  return { kind: 'primitive', name: s };
}

// ─── Phase 2: Meta Parser ───
function parseMeta(content) {
  const meta = {};
  for (const line of content.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//'))) {
    const m = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (!m) continue;
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    switch(m[1]) {
      case 'name': meta.name = val; break;
      case 'shadow': meta.shadow = val; break;
      case 'form': meta.form = val==='true'; break;
      case 'extends': meta.extends = val; break;
    }
  }
  return meta;
}

// ─── Phase 2: Script Parser ───
function parseScript(content, startLine) {
  const decls = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const ln = startLine + i;
    if (!line || line.startsWith('//')) { i++; continue; }

    let m;
    if ((m = line.match(/^import\s+(?:(\w+)\s+from\s+|{([^}]+)}\s+from\s+)["']([^"']+)["']/))) {
      decls.push({ kind:'import', defaultImport:m[1], namedImports:m[2]?.split(',').map(s=>s.trim()), from:m[3], span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^type\s+(\w+)\s*=\s*(.+)$/))) {
      decls.push({ kind:'type', name:m[1], type:parseType(m[2]), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^state\s+(\w+)\s*:\s*([^=]+)\s*=\s*(.+)$/))) {
      decls.push({ kind:'state', name:m[1], type:parseType(m[2].trim()), init:m[3].trim(), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^prop\s+(\w+)\s*:\s*([^=]+?)(?:\s*=\s*(.+))?$/))) {
      decls.push({ kind:'prop', name:m[1], type:parseType(m[2].trim()), default:m[3]?.trim(), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^computed\s+(\w+)\s*:\s*([^=]+)\s*=\s*(.+)$/))) {
      decls.push({ kind:'computed', name:m[1], type:parseType(m[2].trim()), expr:m[3].trim(), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^emit(?:\(([^)]*)\))?\s+(\w+)\s*:\s*(.+)$/))) {
      const rawOpts = m[1] || '';
      const opts = rawOpts ? rawOpts.split(',').map(s => s.trim().toLowerCase()) : [];
      const emitOpts = {};
      if (opts.includes('local')) {
        emitOpts.bubbles = false;
        emitOpts.composed = false;
      } else {
        emitOpts.bubbles = opts.length === 0 || opts.includes('bubbles');
        emitOpts.composed = opts.length === 0 || opts.includes('composed');
      }
      decls.push({ kind:'emit', name:m[2], type:parseType(m[3].trim()), options: emitOpts, span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^ref\s+(\w+)\s*:\s*(.+)$/))) {
      decls.push({ kind:'ref', name:m[1], type:parseType(m[2].trim()), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^fn\s+(async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?\s*\{/))) {
      const params = [];
      if (m[3].trim()) for (const p of m[3].split(',')) {
        const pm = p.trim().match(/^(\w+)\s*:\s*(.+)$/);
        if (pm) params.push({ name:pm[1], type:parseType(pm[2]) });
      }
      let body='', bc=1; i++;
      while (i<lines.length && bc>0) {
        const l=lines[i]; bc+=(l.match(/\{/g)||[]).length; bc-=(l.match(/\}/g)||[]).length;
        if (bc>0) body+=(body?'\n':'')+l; i++;
      }
      decls.push({ kind:'fn', name:m[2], async:!!m[1], params, returnType:m[4]?parseType(m[4]):undefined, body:body.trim(), span:{line:ln} });
      continue;
    }
    if ((m = line.match(/^on\s+(mount|unmount|adopt)\s*\{/))) {
      let body='', bc=1; i++;
      while (i<lines.length && bc>0) {
        const l=lines[i]; bc+=(l.match(/\{/g)||[]).length; bc-=(l.match(/\}/g)||[]).length;
        if (bc>0) body+=(body?'\n':'')+l; i++;
      }
      decls.push({ kind:'lifecycle', event:m[1], body:body.trim(), span:{line:ln} });
      continue;
    }
    if ((m = line.match(/^watch\s*\(([^)]+)\)\s*\{/))) {
      const deps=m[1].split(',').map(d=>d.trim());
      let body='', bc=1; i++;
      while (i<lines.length && bc>0) {
        const l=lines[i]; bc+=(l.match(/\{/g)||[]).length; bc-=(l.match(/\}/g)||[]).length;
        if (bc>0) body+=(body?'\n':'')+l; i++;
      }
      decls.push({ kind:'watch', deps, body:body.trim(), span:{line:ln} });
      continue;
    }
    if ((m = line.match(/^provide\s+(\w+)\s*:\s*([^=]+)\s*=\s*(.+)$/))) {
      decls.push({ kind:'provide', name:m[1], type:parseType(m[2].trim()), init:m[3].trim(), span:{line:ln} });
      i++; continue;
    }
    if ((m = line.match(/^consume\s+(\w+)\s*:\s*(.+)$/))) {
      decls.push({ kind:'consume', name:m[1], type:parseType(m[2].trim()), span:{line:ln} });
      i++; continue;
    }
    i++;
  }
  return decls;
}

// ─── Phase 2: Template Parser ───
function parseTemplateNodes(html) {
  const nodes = []; let pos = 0;
  while (pos < html.length) {
    if (html.startsWith('{{', pos)) {
      const end = html.indexOf('}}', pos+2);
      if (end!==-1) { nodes.push({ kind:'interpolation', expr:html.substring(pos+2,end).trim() }); pos=end+2; continue; }
    }
    if (html.startsWith('<#if', pos)) { const r=parseIfBlock(html,pos); nodes.push(r.node); pos=r.end; continue; }
    if (html.startsWith('<#for', pos)) { const r=parseForBlock(html,pos); nodes.push(r.node); pos=r.end; continue; }
    if (html[pos]==='<' && html[pos+1]!=='/' && !html.startsWith('<:',pos) && !html.startsWith('<#',pos)) {
      const r=parseElement(html,pos); if(r){nodes.push(r.node);pos=r.end;continue;}
    }
    const next=findNext(html,pos); const text=html.substring(pos,next);
    if (text.trim()) nodes.push({ kind:'text', value:text });
    pos=next;
  }
  return nodes;
}
function findNext(html,pos){let min=html.length;for(const m of['{{','<#if','<#for','<']){const i=html.indexOf(m,pos+1);if(i!==-1&&i<min)min=i;}return min;}
function parseElement(html,pos){
  const m=html.substring(pos).match(/^<([a-zA-Z][\w-]*)((?:\s+[^>]*?)?)(\s*\/?)>/);
  if(!m)return null;
  const tag=m[1],attrsStr=m[2],self=m[3].includes('/'),tagEnd=pos+m[0].length;
  const attrs=parseAttrs(attrsStr);
  if(self)return{node:{kind:'element',tag,attrs,children:[],selfClosing:true},end:tagEnd};
  const close=`</${tag}>`;let depth=1,sp=tagEnd;
  while(depth>0&&sp<html.length){
    const no=html.indexOf(`<${tag}`,sp),nc=html.indexOf(close,sp);
    if(nc===-1)break;
    if(no!==-1&&no<nc){const a=html.indexOf('>',no);if(a!==-1&&html[a-1]!=='/')depth++;sp=a+1;}
    else{depth--;if(depth===0)return{node:{kind:'element',tag,attrs,children:parseTemplateNodes(html.substring(tagEnd,nc)),selfClosing:false},end:nc+close.length};sp=nc+close.length;}
  }
  return{node:{kind:'element',tag,attrs,children:[],selfClosing:true},end:tagEnd};
}
function parseAttrs(str){
  const attrs=[],re=/([:\@]?[\w\-\.]+(?:\|[\w]+)*)(?:\s*=\s*"([^"]*)")?/g;let m;
  while((m=re.exec(str))!==null){
    let name=m[1],value=m[2]||'',dynamic=false,event=false,bind=false,ref=false,html=false,spread=false;
    const parts=name.split('|'),modifiers=parts.slice(1);name=parts[0];
    if(name===':bind'){bind=true;name='bind';}
    else if(name.startsWith(':...')){spread=true;name=name.slice(4);}
    else if(name.startsWith(':')){dynamic=true;name=name.slice(1);}
    else if(name==='@html'){html=true;name='html';}
    else if(name.startsWith('@')){event=true;name=name.slice(1);}
    else if(name==='ref'){ref=true;}
    attrs.push({name,value,dynamic,event,bind,ref,modifiers,html,spread});
  }
  return attrs;
}
function findMatchingClose(html,start,bt){let d=1,p=start;const o=`<${bt}`,c=`</${bt}>`;while(d>0&&p<html.length){const no=html.indexOf(o,p),nc=html.indexOf(c,p);if(nc===-1)return html.length;if(no!==-1&&no<nc){d++;p=no+o.length;}else{d--;if(d===0)return nc;p=nc+c.length;}}return html.length;}
function parseIfBlock(html,pos){
  const om=html.substring(pos).match(/<#if\s+condition="([^"]+)">/);
  if(!om)throw new Error('Invalid #if');
  const cond=om[1],sp=pos+om[0].length,cp=findMatchingClose(html,sp,'#if');
  let inner=html.substring(sp,cp),elseChildren,elseIfChain=[];

  // Parse :else-if and :else branches
  let remaining = inner;
  const mainEndRe = /<:else-if\s+condition="([^"]+)">|<:else>/;
  const mainMatch = remaining.match(mainEndRe);
  if (mainMatch && mainMatch.index !== undefined) {
    const mainContent = remaining.substring(0, mainMatch.index);
    remaining = remaining.substring(mainMatch.index);

    // Parse chain of :else-if and final :else
    while (remaining.length > 0) {
      const eifm = remaining.match(/^<:else-if\s+condition="([^"]+)">/);
      if (eifm) {
        remaining = remaining.substring(eifm[0].length);
        const nextBranch = remaining.match(/<:else-if\s+condition="([^"]+)">|<:else>/);
        let branchContent;
        if (nextBranch && nextBranch.index !== undefined) {
          branchContent = remaining.substring(0, nextBranch.index);
          remaining = remaining.substring(nextBranch.index);
        } else {
          branchContent = remaining;
          remaining = '';
        }
        elseIfChain.push({ condition: eifm[1], children: parseTemplateNodes(branchContent.trim()) });
        continue;
      }
      const elsem = remaining.match(/^<:else>/);
      if (elsem) {
        elseChildren = parseTemplateNodes(remaining.substring(elsem[0].length).trim());
        break;
      }
      break;
    }
    inner = mainContent;
  }

  const node = { kind:'if', condition:cond, children:parseTemplateNodes(inner.trim()), elseIfChain: elseIfChain.length > 0 ? elseIfChain : undefined, elseChildren };
  return{node, end:cp+'</#if>'.length};
}
function parseForBlock(html,pos){
  // Support attributes in any order: each, of, key
  const tagMatch=html.substring(pos).match(/<#for\s+((?:[^>])+)>/);
  if(!tagMatch)throw new Error('Invalid #for');
  const attrStr=tagMatch[1];
  const eachM=attrStr.match(/each="([^"]+)"/);
  const ofM=attrStr.match(/of="([^"]+)"/);
  const keyM=attrStr.match(/key="([^"]+)"/);
  if(!eachM||!ofM||!keyM)throw new Error('Invalid #for: missing required attributes (each, of, key)');
  const ep=eachM[1].split(',').map(s=>s.trim()),each=ep[0],index=ep[1],of_=ofM[1],key=keyM[1];
  const om=tagMatch; // compatibility
  const sp=pos+om[0].length,cp=findMatchingClose(html,sp,'#for');
  let inner=html.substring(sp,cp),emptyChildren;
  const emm=inner.match(/<:empty>([\s\S]*?)<\/:empty>/);
  if(emm&&emm.index!==undefined){emptyChildren=parseTemplateNodes(emm[1]);inner=inner.substring(0,emm.index)+inner.substring(emm.index+emm[0].length);}
  return{node:{kind:'for',each,index,of:of_,key,children:parseTemplateNodes(inner),emptyChildren},end:cp+'</#for>'.length};
}

// ─── Phase 3: Type Checker ───
class TypeChecker {
  constructor(component){this.c=component;this.symbols=new Map();this.diags=[];this.typeAliases=new Map();}
  check(){this.buildSymbols();this.checkScript();this.checkTemplate(this.c.template);this.checkUnused();return this.diags;}
  buildSymbols(){for(const d of this.c.script){switch(d.kind){case'state':this.symbols.set(d.name,{type:d.type,source:'state'});break;case'prop':this.symbols.set(d.name,{type:d.type,source:'prop'});break;case'computed':this.symbols.set(d.name,{type:d.type,source:'computed'});break;case'fn':this.symbols.set(d.name,{type:d.returnType||{kind:'primitive',name:'void'},source:'fn'});break;case'emit':this.symbols.set(d.name,{type:d.type,source:'emit'});break;case'ref':this.symbols.set(d.name,{type:d.type,source:'ref'});break;case'provide':this.symbols.set(d.name,{type:d.type,source:'provide'});break;case'consume':this.symbols.set(d.name,{type:d.type,source:'consume'});break;case'type':this.typeAliases.set(d.name,d.type);break;}}}
  checkScript(){for(const d of this.c.script)if(d.kind==='state'){const t=this.infer(d.init);if(t&&!this.assignable(t,d.type))this.diags.push({level:'error',code:'E0201',message:`state '${d.name}' の初期値の型が一致しません`,span:d.span});}}
  checkTemplate(nodes){for(const n of nodes){if(n.kind==='interpolation')this.checkInterp(n);else if(n.kind==='element'){n.attrs.forEach(a=>{
    if(a.dynamic||a.bind)this.checkVars(a.value);
    // Security: warn about @html usage
    if(a.html)this.diags.push({level:'warning',code:'W0201',message:`@html はエスケープされません。XSSリスクがあるため、信頼できるデータのみ使用してください`});
    // Security: warn about dynamic href/src (potential javascript: URL injection)
    if(a.dynamic&&(a.name==='href'||a.name==='src'))this.diags.push({level:'warning',code:'W0202',message:`動的な :${a.name} は javascript: URL インジェクションのリスクがあります。入力を検証してください`});
  });this.checkTemplate(n.children);}else if(n.kind==='if'){this.checkVars(n.condition);this.checkTemplate(n.children);if(n.elseIfChain)for(const branch of n.elseIfChain){this.checkVars(branch.condition);this.checkTemplate(branch.children);}if(n.elseChildren)this.checkTemplate(n.elseChildren);}else if(n.kind==='for'){this.checkVars(n.of);this.symbols.set(n.each,{type:{kind:'primitive',name:'string'},source:'loop'});if(n.index)this.symbols.set(n.index,{type:{kind:'primitive',name:'number'},source:'loop'});this.checkTemplate(n.children);if(n.emptyChildren)this.checkTemplate(n.emptyChildren);this.symbols.delete(n.each);if(n.index)this.symbols.delete(n.index);}}}
  checkInterp(n){const m=n.expr.match(/^(\w+)\.(\w+)\(/);if(m){const sym=this.symbols.get(m[1]);if(sym&&sym.type.kind==='primitive'){const strM=['toUpperCase','toLowerCase','trim','split','replace','includes','startsWith','endsWith','indexOf','slice'];if(sym.type.name==='number'&&strM.includes(m[2]))this.diags.push({level:'error',code:'E0302',message:`'${m[1]}' は 'number' 型ですが、'${m[2]}' メソッドはありません`,hint:`String(${m[1]}) に変換してください`});}}this.checkVars(n.expr);}
  checkVars(expr){const reserved=new Set(['true','false','null','undefined','void','typeof','instanceof','new','return','if','else','for','while','const','let','var','function','class','this','super','import','export','from','await','async','try','catch','finally','throw','length','map','filter','reduce','push','pop','trim','includes','indexOf','slice','splice','concat','join','split','toFixed','toString','toUpperCase','toLowerCase','replace','match','startsWith','endsWith','parseInt','parseFloat','String','Number','Boolean','Array','Object','Math','JSON','console','window','document','fetch','Promise','Date','Error','event','e','r','s','i','t','n','ok','data','error','index']);
    // Strip string literals before extracting identifiers
    const stripped=expr.replace(/"(?:[^"\\]|\\.)*"/g,' ').replace(/'(?:[^'\\]|\\.)*'/g,' ').replace(/`(?:[^`\\]|\\.)*`/g,' ');
    const ids=stripped.match(/\b[a-zA-Z_]\w*\b/g)||[];for(const id of ids){if(reserved.has(id)||this.typeAliases.has(id))continue;if(!this.symbols.has(id)){const sug=this.similar(id);this.diags.push({level:'error',code:'E0301',message:`未定義の識別子 '${id}'`,hint:sug?`'${sug}' のことですか？`:undefined});}}}
  checkUnused(){const used=new Set();this.collectRefs(this.c.template,used);for(const d of this.c.script){if(d.kind==='computed')(d.expr.match(/\b\w+\b/g)||[]).forEach(w=>used.add(w));if(d.kind==='fn')(d.body.match(/\b\w+\b/g)||[]).forEach(w=>used.add(w));if(d.kind==='watch'){d.deps.forEach(dep=>used.add(dep));(d.body.match(/\b\w+\b/g)||[]).forEach(w=>used.add(w));}}for(const[name,sym]of this.symbols)if(sym.source==='state'&&!used.has(name))this.diags.push({level:'warning',code:'W0101',message:`state '${name}' が宣言されましたが使用されていません`});}
  collectRefs(nodes,refs){for(const n of nodes){if(n.kind==='interpolation')(n.expr.match(/\b\w+\b/g)||[]).forEach(w=>refs.add(w));else if(n.kind==='element'){n.attrs.forEach(a=>{if(a.dynamic||a.event||a.bind)(a.value.match(/\b\w+\b/g)||[]).forEach(w=>refs.add(w));});this.collectRefs(n.children,refs);}else if(n.kind==='if'){(n.condition.match(/\b\w+\b/g)||[]).forEach(w=>refs.add(w));this.collectRefs(n.children,refs);if(n.elseIfChain)for(const branch of n.elseIfChain){(branch.condition.match(/\b\w+\b/g)||[]).forEach(w=>refs.add(w));this.collectRefs(branch.children,refs);}if(n.elseChildren)this.collectRefs(n.elseChildren,refs);}else if(n.kind==='for'){(n.of.match(/\b\w+\b/g)||[]).forEach(w=>refs.add(w));this.collectRefs(n.children,refs);if(n.emptyChildren)this.collectRefs(n.emptyChildren,refs);}}}
  infer(e){e=e.trim();if(/^-?\d+(\.\d+)?$/.test(e))return{kind:'primitive',name:'number'};if(/^["'`]/.test(e))return{kind:'primitive',name:'string'};if(e==='true'||e==='false')return{kind:'primitive',name:'boolean'};if(e==='null')return{kind:'primitive',name:'null'};if(e.startsWith('['))return{kind:'array',element:{kind:'primitive',name:'string'}};const sym=this.symbols.get(e);return sym?sym.type:null;}
  assignable(from,to){if(from.kind===to.kind&&from.kind==='primitive')return from.name===to.name;if(from.kind==='array'&&to.kind==='array')return true;return true;}
  similar(name){let best=null,bd=Infinity;for(const[k]of this.symbols){const d=lev(name,k);if(d<bd&&d<=2){bd=d;best=k;}}return best;}
}
function lev(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return dp[m][n];}

// ─── Type to TypeScript string ───
function typeToTs(t) {
  if (!t) return 'any';
  switch (t.kind) {
    case 'primitive': return t.name;
    case 'array': return `${typeToTs(t.element)}[]`;
    case 'union': return t.types.map(typeToTs).join(' | ');
    case 'literal': return `"${t.value}"`;
    case 'object': {
      const fields = t.fields.map(f => `${f.name}${f.optional ? '?' : ''}: ${typeToTs(f.type)}`);
      return `{ ${fields.join('; ')} }`;
    }
    default: return 'any';
  }
}

// ─── Phase 5: Code Generator ───
function generate(c, options) {
  const ts = options?.target === 'ts';
  const sv=[],pv=[],cv=[],en=[],rn=[],fn=[],prov=[],cons=[];
  for(const d of c.script){switch(d.kind){case'state':sv.push(d.name);break;case'prop':pv.push(d.name);break;case'computed':cv.push(d.name);break;case'emit':en.push(d.name);break;case'ref':rn.push(d.name);break;case'fn':fn.push(d.name);break;case'provide':prov.push(d.name);sv.push(d.name);break;case'consume':cons.push(d.name);break;}}

  let _eid = 0;
  function nextEid() { return `fl-${_eid++}`; }

  // Replace identifiers but skip those inside string literals
  function txSafe(expr, replacements) {
    // Split expression into string-literal and non-string parts
    const parts = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        // Find matching close quote (handle escapes)
        const quote = ch;
        let j = i + 1;
        while (j < expr.length) {
          if (expr[j] === '\\') { j += 2; continue; }
          if (expr[j] === quote) { j++; break; }
          if (quote === '`' && expr[j] === '$' && expr[j+1] === '{') {
            // Template literal expression - find matching }
            let depth = 1; j += 2;
            while (j < expr.length && depth > 0) {
              if (expr[j] === '{') depth++;
              else if (expr[j] === '}') depth--;
              if (depth > 0) j++;
              else { j++; break; }
            }
            continue;
          }
          j++;
        }
        parts.push({ text: expr.substring(i, j), isString: true });
        i = j;
      } else {
        let j = i;
        while (j < expr.length && expr[j] !== '"' && expr[j] !== "'" && expr[j] !== '`') j++;
        parts.push({ text: expr.substring(i, j), isString: false });
        i = j;
      }
    }
    // Apply replacements only to non-string parts
    return parts.map(p => {
      if (p.isString) return p.text;
      let t = p.text;
      for (const [pattern, replacement] of replacements) {
        t = t.replace(pattern, replacement);
      }
      return t;
    }).join('');
  }

  function buildReplacements() {
    const reps = [];
    for(const s of sv) reps.push([new RegExp(`\\b${s}\\b`,'g'), `this.#${s}`]);
    for(const p of pv) reps.push([new RegExp(`\\b${p}\\b`,'g'), `this.#prop_${p}`]);
    for(const v of cv) reps.push([new RegExp(`\\b${v}\\b`,'g'), `this.#${v}`]);
    for(const e of en) reps.push([new RegExp(`\\b${e}\\(`,'g'), `this.#emit_${e}(`]);
    for(const f of fn) reps.push([new RegExp(`\\b${f}\\(`,'g'), `this.#${f}(`]);
    for(const ref of rn) reps.push([new RegExp(`\\b${ref}\\b`,'g'), `this.#${ref}`]);
    for(const co of cons) reps.push([new RegExp(`\\b${co}\\b`,'g'), `this.#${co}`]);
    return reps;
  }
  const _defaultReplacements = buildReplacements();

  function tx(expr){ return txSafe(expr, _defaultReplacements); }
  function tagToClass(t){return t.split('-').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('');}
  function camelToKebab(s){return s.replace(/([A-Z])/g,'-$1').toLowerCase();}
  function minCss(css){return css.replace(/\s+/g,' ').replace(/\s*{\s*/g,'{').replace(/\s*}\s*/g,'}').replace(/\s*:\s*/g,':').replace(/\s*;\s*/g,';').trim();}

  // Track event bindings: each gets a unique data-flare-id
  const eventBindings = []; // { eid, events: [{name, handler, modifiers}], binds: [{value}], inLoop: false, loopCtx: null }

  function tplStr(nodes,indent,loopCtx){const pad=' '.repeat(indent);let o='';for(const n of nodes){switch(n.kind){case'text':if(n.value.trim())o+=`${pad}${n.value.trim()}\n`;break;case'interpolation':o+=`${pad}\${this.#esc(${loopCtx?txLoop(n.expr,loopCtx):tx(n.expr)})}\n`;break;case'element':o+=elStr(n,indent,loopCtx);break;case'if':o+=ifStr(n,indent,loopCtx);break;case'for':o+=forStr(n,indent,loopCtx);break;}}return o;}

  // Transform expression inside a loop context - don't transform loop variables
  function txLoop(expr, loopCtx) {
    const reps = [];
    for(const s of sv) {
      if (s === loopCtx.each || s === loopCtx.index) continue;
      reps.push([new RegExp(`\\b${s}\\b`,'g'), `this.#${s}`]);
    }
    for(const p of pv) reps.push([new RegExp(`\\b${p}\\b`,'g'), `this.#prop_${p}`]);
    for(const v of cv) reps.push([new RegExp(`\\b${v}\\b`,'g'), `this.#${v}`]);
    for(const e of en) reps.push([new RegExp(`\\b${e}\\(`,'g'), `this.#emit_${e}(`]);
    for(const f of fn) reps.push([new RegExp(`\\b${f}\\(`,'g'), `this.#${f}(`]);
    for(const ref of rn) reps.push([new RegExp(`\\b${ref}\\b`,'g'), `this.#${ref}`]);
    return txSafe(expr, reps);
  }

  function elStr(n,indent,loopCtx){
    const pad=' '.repeat(indent);
    const evAttrs=n.attrs.filter(a=>a.event);
    const bindAttrs=n.attrs.filter(a=>a.bind);
    const hasEvents = evAttrs.length > 0 || bindAttrs.length > 0;
    let eid = null;

    if (hasEvents) {
      if (loopCtx) {
        // Inside a loop: use dynamic eid with loop index
        eid = nextEid();
        eventBindings.push({
          eid, events: evAttrs, binds: bindAttrs,
          inLoop: true, loopCtx: { ...loopCtx },
        });
      } else {
        eid = nextEid();
        eventBindings.push({
          eid, events: evAttrs, binds: bindAttrs,
          inLoop: false, loopCtx: null,
        });
      }
    }

    let as='';
    // Add data-flare-id for event targeting
    if (eid && !loopCtx) {
      as += ` data-flare-id="${eid}"`;
    } else if (eid && loopCtx) {
      // Dynamic id that includes loop index
      as += ` data-flare-id="${eid}-\${${loopCtx.index || '__idx'}}"`;
    }

    for(const a of n.attrs){
      if(a.event)continue;
      if(a.ref){as+=` data-ref="${a.value}"`;continue;}
      if(a.bind){
        const txExpr = loopCtx ? txLoop(a.value, loopCtx) : tx(a.value);
        as+=` value="\${this.#escAttr(${txExpr})}"`;
        continue;
      }
      if(a.html)continue;
      if(a.dynamic){
        const txExpr = loopCtx ? txLoop(a.value, loopCtx) : tx(a.value);
        if(a.name==='class')as+=` class="\${this.#escAttr(Object.entries(${txExpr}).filter(([,v])=>v).map(([k])=>k).join(' '))}"`;
        else if(['disabled','checked','hidden'].includes(a.name))as+=` \${${txExpr} ? '${a.name}' : ''}`;
        // Security: sanitize href/src to block javascript: and data: URLs
        else if(['href','src','action','formaction'].includes(a.name))as+=` ${a.name}="\${this.#escUrl(${txExpr})}"`;
        else as+=` ${a.name}="\${this.#escAttr(${txExpr})}"`;
      } else {
        as+=a.value?` ${a.name}="${a.value}"`:` ${a.name}`;
      }
    }
    const ha=n.attrs.find(a=>a.html);
    const isCustomElement = n.tag.includes('-');
    if(n.selfClosing){
      // Custom elements must NOT use self-closing syntax - browsers ignore it
      if(isCustomElement) return`${pad}<${n.tag}${as}></${n.tag}>\n`;
      return`${pad}<${n.tag}${as} />\n`;
    }
    if(ha){
      // @html is intentionally unescaped - developer opts in to raw HTML
      const txExpr = loopCtx ? txLoop(ha.value, loopCtx) : tx(ha.value);
      return`${pad}<${n.tag}${as}>\${${txExpr}}</${n.tag}>\n`;
    }
    // Custom elements with no children: no whitespace between tags
    if(isCustomElement && n.children.length === 0){
      return`${pad}<${n.tag}${as}></${n.tag}>\n`;
    }
    return`${pad}<${n.tag}${as}>\n${tplStr(n.children,indent+2,loopCtx)}${pad}</${n.tag}>\n`;
  }

  function ifStr(n,indent,loopCtx){
    const pad=' '.repeat(indent);
    const txExpr = loopCtx ? txLoop(n.condition, loopCtx) : tx(n.condition);
    let o=`${pad}\${${txExpr} ? \`\n${tplStr(n.children,indent+2,loopCtx)}`;
    // else-if chain
    if(n.elseIfChain) {
      for(const branch of n.elseIfChain) {
        const branchExpr = loopCtx ? txLoop(branch.condition, loopCtx) : tx(branch.condition);
        o+=`${pad}\` : ${branchExpr} ? \`\n${tplStr(branch.children,indent+2,loopCtx)}`;
      }
    }
    if(n.elseChildren)o+=`${pad}\` : \`\n${tplStr(n.elseChildren,indent+2,loopCtx)}`;
    o+=`${pad}\` : ''}\n`;
    return o;
  }

  function forStr(n,indent,loopCtx){
    const pad=' '.repeat(indent);
    const le=tx(n.of);
    const idxVar = n.index || '__idx';
    const forLoopCtx = { each: n.each, index: idxVar, of: n.of };

    if(n.emptyChildren) {
      return`${pad}\${${le}.length > 0 ? ${le}.map((${n.each}, ${idxVar}) => \`\n${tplStr(n.children,indent+2,forLoopCtx)}${pad}\`).join('') : \`\n${tplStr(n.emptyChildren,indent+2,loopCtx)}${pad}\`}\n`;
    }
    return`${pad}\${${le}.map((${n.each}, ${idxVar}) => \`\n${tplStr(n.children,indent+2,forLoopCtx)}${pad}\`).join('')}\n`;
  }

  // Build event binding code using data-flare-id
  function buildEvtCode(root) {
    let code = '';
    for (const binding of eventBindings) {
      if (binding.inLoop) {
        // Loop bindings: querySelectorAll with prefix match
        const lc = binding.loopCtx;
        const listExpr = tx(lc.of);
        code += `    // Loop event binding: ${binding.eid}\n`;
        code += `    ${root}.querySelectorAll('[data-flare-id^="${binding.eid}-"]').forEach(el => {\n`;
        code += `      const __idx = parseInt(el.getAttribute('data-flare-id').split('-').pop(), 10);\n`;

        for (const a of binding.events) {
          let pre = '';
          for (const mod of a.modifiers) {
            if(mod==='prevent')pre+='e.preventDefault(); ';
            if(mod==='stop')pre+='e.stopPropagation(); ';
            if(mod==='enter')pre+="if (e.key !== 'Enter') return; ";
            if(mod==='esc')pre+="if (e.key !== 'Escape') return; ";
          }
          // Build handler - need to resolve loop variable references
          let handlerBody = a.value;
          // Replace loop variable with array access: todo -> this.#todos[__idx]
          // But for function calls like removeTodo(index), transform differently
          let h;
          if(handlerBody.includes('=')&&!handlerBody.includes('=>')&&!handlerBody.includes('==')){
            h=`(e) => { ${pre}${txLoopHandler(handlerBody, lc)}; this.#update(); }`;
          } else if(handlerBody.includes('(')){
            h=`(e) => { ${pre}${txLoopHandler(handlerBody, lc)}; this.#update(); }`;
          } else {
            h=`(e) => { ${pre}this.#${handlerBody}(); this.#update(); }`;
          }
          code += `      const fn_${a.name} = ${h};\n`;
          code += `      el.addEventListener('${a.name}', fn_${a.name});\n`;
          code += `      this.#listeners.push([el, '${a.name}', fn_${a.name}]);\n`;
        }

        for (const a of binding.binds) {
          code += `      const fn_input = (e) => { this.#${a.value} = e.target.value; this.#update(); };\n`;
          code += `      el.addEventListener('input', fn_input);\n`;
          code += `      this.#listeners.push([el, 'input', fn_input]);\n`;
        }

        code += `    });\n`;
      } else {
        // Static bindings: querySelector with exact match
        code += `    {\n`;
        code += `      const el = ${root}.querySelector('[data-flare-id="${binding.eid}"]');\n`;
        code += `      if (el) {\n`;

        for (const a of binding.events) {
          let pre = '';
          for (const mod of a.modifiers) {
            if(mod==='prevent')pre+='e.preventDefault(); ';
            if(mod==='stop')pre+='e.stopPropagation(); ';
            if(mod==='enter')pre+="if (e.key !== 'Enter') return; ";
            if(mod==='esc')pre+="if (e.key !== 'Escape') return; ";
          }
          let h;
          if(a.value.includes('=')&&!a.value.includes('=>')&&!a.value.includes('==')){
            h=`(e) => { ${pre}${tx(a.value)}; this.#update(); }`;
          } else if(a.value.includes('(')){
            h=`(e) => { ${pre}${tx(a.value)}; this.#update(); }`;
          } else {
            h=`(e) => { ${pre}this.#${a.value}(); this.#update(); }`;
          }
          code += `        const fn_${a.name} = ${h};\n`;
          code += `        el.addEventListener('${a.name}', fn_${a.name});\n`;
          code += `        this.#listeners.push([el, '${a.name}', fn_${a.name}]);\n`;
        }

        for (const a of binding.binds) {
          // Preserve focus and cursor position on :bind inputs
          code += `        const fn_input = (e) => { this.#${a.value} = e.target.value; this.#updateKeepFocus(el); };\n`;
          code += `        el.addEventListener('input', fn_input);\n`;
          code += `        this.#listeners.push([el, 'input', fn_input]);\n`;
        }

        code += `      }\n`;
        code += `    }\n`;
      }
    }
    return code;
  }

  // Transform handler expression inside loop context
  function txLoopHandler(expr, loopCtx) {
    let r = expr;
    // Replace the index variable (e.g. "index") with __idx
    if (loopCtx.index && loopCtx.index !== '__idx') {
      r = r.replace(new RegExp(`\\b${loopCtx.index}\\b`, 'g'), '__idx');
    }
    // Now apply normal transforms (but skip loop variables)
    const reps = [];
    for(const s of sv) {
      if (s === loopCtx.each || s === loopCtx.index) continue;
      reps.push([new RegExp(`\\b${s}\\b`,'g'), `this.#${s}`]);
    }
    for(const p of pv) reps.push([new RegExp(`\\b${p}\\b`,'g'), `this.#prop_${p}`]);
    for(const v of cv) reps.push([new RegExp(`\\b${v}\\b`,'g'), `this.#${v}`]);
    for(const e of en) reps.push([new RegExp(`\\b${e}\\(`,'g'), `this.#emit_${e}(`]);
    for(const f of fn) reps.push([new RegExp(`\\b${f}\\(`,'g'), `this.#${f}(`]);
    return txSafe(r, reps);
  }

  const cn=tagToClass(c.meta.name||'x-component'),tn=c.meta.name||'x-component',sh=c.meta.shadow||'open',us=sh!=='none',root=us?'this.#shadow':'this';

  // Reset eid counter for this component
  _eid = 0;
  eventBindings.length = 0;

  // Build template string first (populates eventBindings)
  const templateStr = tplStr(c.template, 6, null);

  // Now generate the class wrapped in IIFE
  let o = `(() => {\n"use strict";\n\n`;
  o += `class ${cn} extends HTMLElement {\n`;
  for(const d of c.script)if(d.kind==='state')o+=`  #${d.name}${ts?': '+typeToTs(d.type):''} = ${d.init};\n`;
  for(const d of c.script)if(d.kind==='provide')o+=`  #${d.name}${ts?': '+typeToTs(d.type):''} = ${d.init};\n`;
  for(const d of c.script)if(d.kind==='consume')o+=`  #${d.name}${ts?': '+typeToTs(d.type)+' | undefined':''} = undefined;\n`;
  for(const d of c.script)if(d.kind==='ref')o+=`  #${d.name}${ts?': '+typeToTs(d.type)+' | null':''} = null;\n`;
  if(us)o+=`  #shadow${ts?': ShadowRoot':''};\n`;o+=`  #listeners${ts?': [Element, string, EventListener][]':''} = [];\n\n`;
  if(pv.length){o+=`  static get observedAttributes() {\n    return [${pv.map(p=>`'${camelToKebab(p)}'`).join(', ')}];\n  }\n\n`;}
  o+=`  constructor() {\n    super();\n`;if(us)o+=`    this.#shadow = this.attachShadow({ mode: '${sh}' });\n`;o+=`  }\n\n`;
  o+=`  connectedCallback() {\n`;
  // Read initial prop values from HTML attributes
  for(const d of c.script) {
    if(d.kind==='prop') {
      const kebab=camelToKebab(d.name);
      const coerce = d.type.name==='number'?`parseFloat(v) || 0`:d.type.name==='boolean'?`v !== null && v !== 'false'`:`v || ${d.default||"''"}`;
      o+=`    { const v = this.getAttribute('${kebab}'); if (v !== null) this.#prop_${d.name} = ${coerce}; }\n`;
    }
  }
  // provide: listen for context requests from descendants
  for(const d of c.script) {
    if(d.kind==='provide') {
      o+=`    this.addEventListener('__flare_ctx_${d.name}', (e) => { e.stopPropagation(); e.detail.value = this.#${d.name}; e.detail.provider = this; });\n`;
    }
  }
  // consume: dispatch event to find nearest ancestor provider
  for(const d of c.script) {
    if(d.kind==='consume') {
      o+=`    { const detail = { value: undefined, provider: null };\n`;
      o+=`      this.dispatchEvent(new CustomEvent('__flare_ctx_${d.name}', { detail, bubbles: true, composed: true }));\n`;
      o+=`      if (detail.provider) this.#${d.name} = detail.value; }\n`;
    }
  }
  o+=`    this.#render();\n    this.#bindEvents();\n    this.#bindRefs();\n`;
  for(const d of c.script)if(d.kind==='lifecycle'&&d.event==='mount')o+=`    ${tx(d.body).split('\n').join('\n    ')}\n`;
  o+=`  }\n\n`;
  o+=`  disconnectedCallback() {\n    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));\n    this.#listeners = [];\n`;for(const d of c.script)if(d.kind==='lifecycle'&&d.event==='unmount')o+=`    ${tx(d.body).split('\n').join('\n    ')}\n`;o+=`  }\n\n`;
  // adoptedCallback
  const adoptHooks = c.script.filter(d => d.kind==='lifecycle' && d.event==='adopt');
  if (adoptHooks.length > 0) {
    o+=`  adoptedCallback() {\n`;
    for(const d of adoptHooks) o+=`    ${tx(d.body).split('\n').join('\n    ')}\n`;
    o+=`  }\n\n`;
  }

  // attributeChangedCallback
  if(pv.length) {
    o+=`  attributeChangedCallback(name, oldVal, newVal) {\n    if (oldVal === newVal) return;\n`;
    for(const d of c.script)if(d.kind==='prop'){
      const kebab=camelToKebab(d.name);
      const coerce = d.type.name==='number'?'parseFloat(newVal) || 0':d.type.name==='boolean'?"newVal !== null && newVal !== 'false'":"newVal || ''";
      o+=`    if (name === '${kebab}') { this.#prop_${d.name} = ${coerce}; this.#update(); }\n`;
    }
    o+=`  }\n\n`;
  }

  for(const d of c.script)if(d.kind==='prop'){const def=d.default||(d.type.name==='number'?'0':d.type.name==='boolean'?'false':"''");const tsType=ts?': '+typeToTs(d.type):'';o+=`  #prop_${d.name}${tsType} = ${def};\n  get ${d.name}()${tsType} { return this.#prop_${d.name}; }\n\n`;}
  for(const d of c.script)if(d.kind==='computed'){const tsType=ts?': '+typeToTs(d.type):'';o+=`  get #${d.name}()${tsType} { return ${tx(d.expr)}; }\n\n`;}
  for(const d of c.script)if(d.kind==='emit'){const opts=d.options||{bubbles:true,composed:true};const detailType=ts?': '+typeToTs(d.type):'';o+=`  #emit_${d.name}(detail${detailType})${ts?': void':''} {\n    this.dispatchEvent(new CustomEvent('${d.name}', { detail, bubbles: ${opts.bubbles}, composed: ${opts.composed} }));\n  }\n\n`;}
  for(const d of c.script)if(d.kind==='fn'){const ak=d.async?'async ':'',ps=d.params.map(p=>ts?`${p.name}: ${typeToTs(p.type)}`:p.name).join(', ');const retType=ts&&d.returnType?': '+typeToTs(d.returnType):'';o+=`  ${ak}#${d.name}(${ps})${retType} {\n    ${tx(d.body).split('\n').join('\n    ')}\n  }\n\n`;}
  for(const d of c.script)if(d.kind==='watch')o+=`  #watch_${d.deps.join('_')}() {\n    ${tx(d.body).split('\n').join('\n    ')}\n  }\n\n`;
  // Generate previous-value fields for watch dependencies
  const watchDecls = c.script.filter(d => d.kind === 'watch');
  if (watchDecls.length > 0) {
    const allWatchedDeps = new Set();
    for (const w of watchDecls) w.deps.forEach(d => allWatchedDeps.add(d));
    for (const dep of allWatchedDeps) {
      const stateDecl = c.script.find(d => d.kind === 'state' && d.name === dep);
      if (stateDecl) {
        o += `  #__prev_${dep} = ${stateDecl.init};\n`;
      }
    }
    o += '\n';
  }

  // #render - uses template + innerHTML for proper custom element upgrade
  o+=`  #render() {\n`;
  o+=`    const tpl = document.createElement('template');\n`;
  o+=`    tpl.innerHTML = \`\n`;
  if(c.style)o+=`      <style>${minCss(c.style)}</style>\n`;
  o+=templateStr;
  o+=`    \`;\n`;
  o+=`    ${root}.replaceChildren(tpl.content.cloneNode(true));\n`;
  o+=`  }\n\n`;

  // #bindEvents - using data-flare-id
  o+=`  #bindEvents() {\n`;
  o+=buildEvtCode(root);
  o+=`  }\n\n`;

  // #bindRefs - bind ref declarations to DOM elements via data-ref
  o+=`  #bindRefs() {\n`;
  for(const d of c.script) {
    if(d.kind==='ref') {
      o+=`    this.#${d.name} = ${root}.querySelector('[data-ref="${d.name}"]');\n`;
    }
  }
  o+=`  }\n\n`;

  // #update - full re-render
  o+=`  #update() {\n`;
  o+=`    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));\n`;
  o+=`    this.#listeners = [];\n`;
  // Check watch deps before re-render
  for(const d of c.script) {
    if (d.kind==='watch') {
      const depChecks = d.deps.map(dep => `this.#${dep} !== this.#__prev_${dep}`).join(' || ');
      o+=`    const __watchFire_${d.deps.join('_')} = ${depChecks};\n`;
    }
  }
  o+=`    this.#render();\n`;
  o+=`    this.#bindEvents();\n`;
  o+=`    this.#bindRefs();\n`;
  for(const d of c.script) {
    if (d.kind==='watch') {
      const depsKey = d.deps.join('_');
      o+=`    if (__watchFire_${depsKey}) {\n`;
      o+=`      this.#watch_${depsKey}();\n`;
      for (const dep of d.deps) {
        o+=`      this.#__prev_${dep} = this.#${dep};\n`;
      }
      o+=`    }\n`;
    }
  }
  o+=`  }\n\n`;

  // #updateKeepFocus - re-render but preserve focus on :bind inputs
  o+=`  #updateKeepFocus(focusedEl) {\n`;
  o+=`    const fid = focusedEl?.getAttribute('data-flare-id');\n`;
  o+=`    const selStart = focusedEl?.selectionStart;\n`;
  o+=`    const selEnd = focusedEl?.selectionEnd;\n`;
  o+=`    this.#update();\n`;
  o+=`    if (fid) {\n`;
  o+=`      const el = ${root}.querySelector(\`[data-flare-id="\${fid}"]\`);\n`;
  o+=`      if (el) { el.focus(); if (selStart != null) { el.selectionStart = selStart; el.selectionEnd = selEnd; } }\n`;
  o+=`    }\n`;
  o+=`  }\n\n`;

  // #esc - HTML text content escaping (prevents XSS in {{ }} interpolation)
  o+=`  #esc(val) {\n`;
  o+=`    if (val == null) return '';\n`;
  o+=`    const s = String(val);\n`;
  o+=`    if (!/[&<>"']/.test(s)) return s;\n`;
  o+=`    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');\n`;
  o+=`  }\n\n`;

  // #escAttr - Attribute value escaping (prevents attribute injection)
  o+=`  #escAttr(val) {\n`;
  o+=`    if (val == null) return '';\n`;
  o+=`    const s = String(val);\n`;
  o+=`    if (!/[&<>"'`+'`]/.test(s)) return s;\n';
  o+=`    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\`/g,'&#96;');\n`;
  o+=`  }\n\n`;

  // #escUrl - URL sanitization (blocks javascript:, data:, vbscript: URLs)
  o+=`  #escUrl(val) {\n`;
  o+=`    if (val == null) return '';\n`;
  o+=`    const s = String(val).trim();\n`;
  o+=`    if (/^\\s*(javascript|data|vbscript)\\s*:/i.test(s)) return 'about:blank';\n`;
  o+=`    return this.#escAttr(s);\n`;
  o+=`  }\n`;

  o+=`}\n\n`;
  // Deferred registration: if __flareDefineQueue exists (bundle mode), push to queue.
  // Otherwise register immediately (standalone mode).
  o+=`if (typeof __flareDefineQueue !== 'undefined') {\n`;
  o+=`  __flareDefineQueue.push(['${tn}', ${cn}]);\n`;
  o+=`} else {\n`;
  o+=`  customElements.define('${tn}', ${cn});\n`;
  o+=`}\n`;

  // Close IIFE
  o += `\n})();\n`;

  return o;
}

// ─── Public API ───
function compile(source, fileName, options) {
  const blocks = splitBlocks(source);
  if (!blocks.some(b => b.type === 'template'))
    return { success:false, diagnostics:[{level:'error',code:'E0002',message:'<template> ブロックが見つかりません'}] };
  let meta={},script=[],template=[],style='';
  for(const b of blocks){switch(b.type){case'meta':meta=parseMeta(b.content);break;case'script':script=parseScript(b.content,b.startLine);break;case'template':template=parseTemplateNodes(b.content.trim());break;case'style':style=b.content.trim();break;}}
  if(!meta.name)meta.name='x-'+fileName.replace(/\.flare$/,'').replace(/([A-Z])/g,'-$1').toLowerCase();
  const ast={meta,script,template,style,fileName};
  const checker=new TypeChecker(ast);const diagnostics=checker.check();
  if(diagnostics.some(d=>d.level==='error'))return{success:false,diagnostics,ast};
  const output=generate(ast, options);
  return{success:true,output,diagnostics,ast};
}

module.exports = { compile, splitBlocks, parseTemplateNodes, TypeChecker, generate };
