/* LMコース(lm01〜)の検査(静的): node test/lm.js
   ①形(cat lm1=lv2・lm2=lv3 の割当・kind・5〜8ステップ・cmp・pre実在・MIXタブ) ②本文150字以内・年号なし・規格名/団体名/サービス名なし
   ③用語(lm_ 接頭辞・see 相互参照・既存語の see 追加) ④数値が SD.LOUD(VUREF)と一致 ⑤lm04 に『測定器ごとに少し違う』 ⑥quiz の正解が偏らない ⑦登録4か所
   聞こえ方・メーターの実際の値は耳・実機で確認(未確認) */
const fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='LM'),ids=new Set(SD.LESSONS.map(l=>l.id)),tid=new Set(SD.TERMS.map(t=>t.id));
const PLAN={1:['lm01','lm02','lm03','lm04','lm05'],2:['lm06','lm07','lm08','lm09','lm10','lm11','lm12']};
const KINDS={lm01:'read',lm02:'read',lm03:'read',lm04:'read',lm05:'read',lm06:'recipe',lm07:'recipe',lm08:'recipe',lm09:'recipe',lm10:'recipe',lm11:'read',lm12:'recipe'};
ok(SD.CATS.some(c=>c.id==='lm1'&&c.course==='LM'&&c.chapter==='course')&&SD.CATS.some(c=>c.id==='lm2'&&c.course==='LM'&&c.chapter==='course'),'cat lm1・lm2');
ok(LS.length>=12,'LM のレッスンが少ない '+LS.length);
['lm01','lm02','lm03','lm04','lm05','lm06','lm07','lm08','lm09','lm10','lm11','lm12'].forEach(id=>ok(LS.some(l=>l.id===id),id+' が無い'));
const BAN=/(EBU|ITU|BS\.?\s?1770|R\s?128|Spotify|YouTube|Apple|Netflix|Amazon|AES|ARIB|ATSC|ラジオ局|テレビ)/i;
const ans=[];
LS.forEach(L=>{
 const n=+L.id.slice(2),want=n<=5?1:2;
 ok(/^lm\d\d$/.test(L.id)&&n>=1&&n<=12,L.id+' ID');
 ok(L.cat==='lm'+want&&L.lv===(want===1?2:3),L.id+' は cat lm'+want+'・lv'+(want===1?2:3)+' ('+L.cat+'・lv'+L.lv+')');
 if(KINDS[L.id])ok(L.kind===KINDS[L.id],L.id+' kind');
 ok(L.steps.length>=5&&L.steps.length<=8,L.id+' ステップ数 '+L.steps.length);
 ok(L.steps.some(s=>s.cmp),L.id+' に聞き比べが無い');
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 ok((L.terms||[]).every(t=>tid.has(t)),L.id+' terms');
 ok(L.mode==='trk'&&L.tk&&L.tk.length===5,L.id+' トラック5本');
 L.steps.forEach((s,i)=>{const w=L.id+' step'+(i+1)+' ',t=SD.guideTxt(s.b),all=s.h+t+[].concat(s.col||[]).map(c=>c.h+c.b).join('');
  ok(t.length<=150,w+'本文が150字超 '+t.length);ok(!/(19|20)\d\d/.test(all),w+'年号らしき数字');ok(!BAN.test(all),w+'規格名・団体名・サービス名');
  ok(s.tab==='mix'||s.tab==='fx',w+'tab');if(s.quiz)ans.push(s.quiz.ans)});
 /* 読み物に目標は無い(validate も検査) */
 if(L.kind==='read')ok(!L.steps.some(s=>s.f||s.s||s.mt||s.mx),L.id+' 読み物に目標がある');
});
/* 用語: lm_ 接頭辞・100字以内・see が実在し、その用語を使うレッスンが see に載る */
SD.TERMS.filter(t=>/^lm_/.test(t.id)).forEach(t=>{ok(t.def.length<=100,t.id+' 定義100字超');ok((t.see||[]).length&&t.see.every(i=>ids.has(i)),t.id+' see');ok(!BAN.test(t.def+t.name),t.id+' 規格名等');
 (t.see||[]).forEach(i=>{const L=LS.find(l=>l.id===i);if(L)ok((L.terms||[]).indexOf(t.id)>=0,t.id+' は '+i+' の terms に無い')})});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);if(t&&/^lm_/.test(id)||['peak','rms','headroom','comp'].indexOf(id)>=0)ok(t.see.indexOf(L.id)>=0,id+' の see に '+L.id+' が無い')}));
/* lm03: 本文の VU 基準(dBFS)は SD.LOUD.VUREF と一致 */
{const L3=LS.find(l=>l.id==='lm03');if(L3){const tx=L3.steps.map(s=>SD.guideTxt(s.b)).join('');const m=(tx.match(/-\d+(?=[・)\s])/g)||[]).map(Number);
 ok(m.length>=3,'lm03 に基準の数値が書かれていない');m.forEach(v=>ok(SD.LOUD.VUREF.indexOf(v)>=0,'lm03 の数値 '+v+' が VUREF と一致しない'));
 SD.LOUD.VUREF.forEach(v=>ok(m.indexOf(v)>=0,'lm03 に VUREF の '+v+' が書かれていない'))}}
/* lm04: 測定器ごとの差を書く */
{const L4=LS.find(l=>l.id==='lm04');if(L4)ok(L4.steps.map(s=>s.b).join('').indexOf('測定器ごとに少し違う')>=0,'lm04 に「測定器ごとに少し違う」が無い')}
/* 本文の目標値は TARGETS の値だけ(lm06 以降で使う。N-1 では数値の LUFS を書かない) */
LS.forEach(L=>{if(+L.id.slice(2)>=6)return;const tx=L.steps.map(s=>s.b).join('');ok(!/-\d+\s?LUFS/.test(tx),L.id+' に目標値のような LUFS の数値')});

/* N-2: recipe(lm06〜)は save・目標(f か mt)が1つ以上。mt はマスター(trk 'M')・MixGoal.check 通過・チップの単位つき。
   初期状態(init)では f の目標が全部は達成済みでない。mt の初期値は実機で測る(未確認) */
LS.filter(l=>l.kind==='recipe').forEach(L=>{ok(L.save&&L.save.kind==='kit','recipe に save(kit) '+L.id);
 const gs=L.steps.filter(s=>(s.f||[]).length||(s.mt||[]).length);ok(gs.length>=1,L.id+' 目標が無い');
 SD.MixGoal.check(L).forEach(m=>bad(m));
 L.steps.forEach((s,i)=>(s.mt||[]).forEach(g=>{ok(g.trk==='M'&&SD.MixGoal.MT[g.m]&&SD.MixGoal.MT[g.m].lm===1,L.id+' step'+(i+1)+' mt はマスターの計測型');ok(g.hold>=2,L.id+' hold')}));
 const fs_=[].concat(...L.steps.map(s=>s.f||[]));if(fs_.length)ok(fs_.some(([k,v])=>(L.init||{})[k]!==v),L.id+' f の目標が初期状態で全部達成済み')});
/* 本文の数値は SD.LOUD.TARGETS と一致(lm06 以降): 「-NN LUFS」は lufs の値・「-N dBTP」は tp/tpLoud の値。目安・変わることがある */
{const TG=SD.LOUD.TARGETS,LU=new Set(TG.map(t=>t.lufs)),TPs=new Set();TG.forEach(t=>{if(t.tp!=null)TPs.add(t.tp);if(t.tpLoud!=null)TPs.add(t.tpLoud)});
 LS.filter(l=>+l.id.slice(2)>=6).forEach(L=>{const tx=L.steps.map(s=>SD.guideTxt(s.b)+[].concat(s.col||[]).map(c=>c.b).join('')).join('');
  (tx.match(/-\d+(?=\s?LUFS)/g)||[]).forEach(v=>ok(LU.has(+v),L.id+' の '+v+' LUFS が TARGETS に無い'));
  (tx.match(/-\d+(?=\s?dBTP)/g)||[]).forEach(v=>ok(TPs.has(+v),L.id+' の '+v+' dBTP が TARGETS に無い'));
  if(/LUFS|dBTP/.test(tx))ok(/目安/.test(tx)&&/変わる/.test(tx),L.id+' に「目安」「変わることがある」が無い')});
 const L6=LS.find(l=>l.id==='lm06');if(L6){const t=TG.find(x=>x.id==='stream'),g=[].concat(...L6.steps.map(s=>s.mt||[])).find(x=>x.m==='lufsS');
  ok(g&&g.rng[0]<=t.lufs&&t.lufs<=g.rng[1],'lm06 の目標範囲に配信向け '+t.lufs+' が入らない');
  const b=TG.find(x=>x.id==='broadcast');ok(t.lufs-b.lufs===9,'配信向けと放送向けの差が9 LUでない(本文は9 LU)')}
 const L7=LS.find(l=>l.id==='lm07');if(L7){const g=[].concat(...L7.steps.map(s=>s.mt||[])).find(x=>x.m==='tp'),t=TG.find(x=>x.id==='stream');ok(g&&g.rng[1]<=t.tp,'lm07 の TP 目標が上限の目安 '+t.tp+' を超えている')}}
/* lm05 の窓の長さは本文と同じ(M=約0.4秒・S=約3秒) */
{const L5=LS.find(l=>l.id==='lm05');if(L5){const tx=L5.steps[0].b;ok(/約0\.4秒/.test(tx)&&/約3秒/.test(tx),'lm05 の窓の長さ')}}
/* N-3: lm09 相関・lm10 モノ差とバランス・lm12 の4種。lm11 の揃える幅は本文(0.5 LU)と同じ。lm11 は聞き比べを揃えないと明記 */
{const mts=id=>[].concat(...(LS.find(l=>l.id===id)||{steps:[]}).steps.map(s=>s.mt||[]));
 ok(mts('lm09').some(g=>g.m==='corr'&&g.rng[0]>0&&g.rng[1]<=1),'lm09 corr');ok(['mdiff','bal'].every(m=>mts('lm10').some(g=>g.m===m)),'lm10 mdiff・bal');
 ok(['corr','lufsS','tp','plr'].every(m=>mts('lm12').some(g=>g.m===m)),'lm12 の4種');
 const g12=mts('lm12').find(g=>g.m==='lufsS'),st=SD.LOUD.target('stream');ok(g12&&g12.rng[0]<=st.lufs&&st.lufs<=g12.rng[1],'lm12 の lufsS に配信向けが入らない');
 const L11=LS.find(l=>l.id==='lm11');if(L11){const tx=L11.steps.map(s=>s.b).join('');ok(/0\.5 LU/.test(tx),'lm11 に 0.5 LU');ok(/揃えていない/.test(L11.steps[0].b),'lm11 step1 は揃えない旨')}
 const L12=LS.find(l=>l.id==='lm12');if(L12){const ids12=['lm07','lm08','lm09','lm10','lm11'];ok(ids12.every(i=>(L12.pre||[]).indexOf(i)>=0),'lm12 pre')}}
/* quiz の正解が偏らない(3つ以上あるとき) */
if(ans.length>=3)ok(new Set(ans).size>=2,'quiz の正解が1種類だけ '+ans.join());
/* 登録4か所 */
const R=(f,re)=>re.test(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));
ok(R('www/index.html',/js\/lm\.js/),'index.html');ok(R('www/sw.js',/js\/lm\.js/),'sw.js');ok(R('test/validate.js',/'lm\.js'/),'validate.js');ok(R('.github/workflows/build-apk.yml',/node test\/lm\.js/),'CI');
/* lm.js は xg.js より後に読む(SD.XM.H) */
{const h=fs.readFileSync(path.join(__dirname,'..','www/index.html'),'utf8');ok(h.indexOf('js/xg.js')<h.indexOf('js/lm.js'),'lm.js は xg.js の後')}
console.log('LM レッスン '+LS.length+' 本('+LS.map(l=>l.id).join(' ')+')・quiz正解 '+ans.join(','));
console.log(err?'NG '+err+' 件':'OK');process.exit(err?1:0);
