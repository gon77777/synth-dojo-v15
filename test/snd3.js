/* 上級の音作り SA〜SR(仕様 §6)の共通検査: node test/snd3.js
   枠(cat・course・PLAN)・衝突なし・各レッスンの規則(lv3・5〜8ステップ・cmp・目標・pre 実在・init/f の実在と範囲・
   初期状態で目標が未達成・直した状態で達成・機種名なし・年号なし・quiz の ans 偏りなし)。レッスン0本でも通る。 */
const fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const COURSES=['SA','ST','SF','SG','SI','SM','SX','SC','SR'],PLAN={SA:10,ST:10,SF:10,SG:8,SI:8,SM:10,SX:8,SC:12,SR:8};
ok(SD.S3&&SD.S3.COURSES.length===9,'SD.S3 枠');
COURSES.forEach(c=>{const k=c.toLowerCase()+'1';ok(SD.CATS.some(x=>x.id===k&&x.course===c&&x.chapter==='course'),'cat '+k);
 ok(SD.S3&&SD.S3.PLAN[c]===PLAN[c],'PLAN '+c)});
ok(new Set(SD.CATS.map(c=>c.id)).size===SD.CATS.length,'cat id 重複');
ok(new Set(SD.LESSONS.map(l=>l.id)).size===SD.LESSONS.length,'レッスンID重複');
const other=new Set(SD.CATS.filter(c=>c.course&&COURSES.indexOf(c.course)<0).map(c=>c.course));
COURSES.forEach(c=>ok(!other.has(c),'course 略称が既存と衝突 '+c));
const ids=new Set(SD.LESSONS.map(l=>l.id)),tid=new Set(SD.TERMS.map(t=>t.id));
const LS=SD.LESSONS.filter(l=>COURSES.indexOf(l.course)>=0);
const BAN=/(EBU|ITU|Spotify|YouTube|Apple|Netflix|Amazon|Yamaha|Roland|Moog|Korg|DX7|TB-?303|TR-?808|Serum|Massive|Ableton|Fender|Gibson)/i;
const met=(L,id,g,cur,tol)=>{const p=SD.defs[L.synth].byId[id];if(!p)return false;if(p.type==='seg')return cur===g;return Math.abs(SD.toN(p,cur)-SD.toN(p,g))<=(tol||.07)+1e-6};
const ans=[];
LS.forEach(L=>{
 const n=+L.id.slice(2),c=L.course,cat=c.toLowerCase()+'1';
 ok(new RegExp('^'+c.toLowerCase()+'\\d\\d$').test(L.id)&&n>=1&&n<=PLAN[c],L.id+' ID');
 ok(L.cat===cat,L.id+' cat '+L.cat);ok(L.lv===3,L.id+' lv3');ok(L.kind==='recipe',L.id+' recipe');
 ok(L.steps.length>=5&&L.steps.length<=8,L.id+' ステップ数 '+L.steps.length);
 ok(L.steps.some(s=>s.cmp),L.id+' cmp なし');
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 ok((L.terms||[]).every(t=>tid.has(t)),L.id+' terms');
 ok(L.save&&L.save.name,L.id+' save');ok(L.demo&&L.demo.n,L.id+' demo');
 const D=SD.defs[L.synth];ok(!!D,L.id+' synth '+L.synth);if(!D)return;
 L.steps.forEach((s,i)=>{const w=L.id+' step'+(i+1)+' ',t=SD.guideTxt(s.b),all=s.h+t+[].concat(s.col||[]).map(x=>x.h+x.b).join('');
  ok(t.length<=150,w+'150字超 '+t.length);ok(!/(19|20)\d\d/.test(all),w+'年号');ok(!BAN.test(all),w+'機種・団体名');if(s.quiz)ans.push(s.quiz.ans)});
 if(L.synth==='mod'){ok((L.init||{}).mods&&L.init.cab,L.id+' mod の init(mods/cab)');return}
 Object.keys(L.init||{}).forEach(id=>{const p=D.byId[id];ok(p,L.id+' init に無いパラメータ '+id);if(p&&p.type==='knob'&&typeof L.init[id]==='number')ok(L.init[id]>=p.min&&L.init[id]<=p.max,L.id+' init 範囲外 '+id)});
 let goals=0;const cur=Object.assign({},D.DEF,L.init);
 L.steps.forEach((s,i)=>{const w=L.id+' step'+(i+1)+' ';if(s.s)Object.assign(cur,s.s);
  if(!(s.f&&s.f.length))return;goals++;
  s.f.forEach(([id,g])=>{const p=D.byId[id];ok(p,w+'f 実在 '+id);if(!p)return;
   if(p.type==='seg')ok(p.opts.some(o=>o[0]===g),w+'f seg 値 '+id+'='+g);else ok(typeof g==='number'&&g>=p.min&&g<=p.max,w+'f 範囲外 '+id+'='+g)});
  ok(!s.f.every(([id,g])=>met(L,id,g,cur[id],s.tol)),w+'直す前から目標が達成済み');
  s.f.forEach(([id,g])=>{cur[id]=g});
  ok(s.f.every(([id,g])=>met(L,id,g,cur[id],s.tol)),w+'直しても未達成')});
 ok(goals>=1,L.id+' 目標なし')});
if(ans.length>=5){const mx=Math.max.apply(null,[1,2,3,4].map(k=>ans.filter(a=>a===k).length));ok(mx<=ans.length*.6,'quiz ans 偏り '+ans.join(','))}
const by={};COURSES.forEach(c=>by[c]=LS.filter(l=>l.course===c).length);
ok(COURSES.every(c=>by[c]<=PLAN[c]),'PLAN 超過');
console.log(err?'NG '+err:'OK','SND3 枠9コース/計画'+COURSES.reduce((a,c)=>a+PLAN[c],0)+'本 現在 '+JSON.stringify(by));
process.exit(err?1:0);
