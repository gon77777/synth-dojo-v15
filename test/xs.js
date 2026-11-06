/* XSコース(xs01〜)の検査: ①形(lv3・cat・5〜8ステップ・cmp・col・各トラックに mx.eq/mx.cp)②本文150字以内・年号なし・用語③初期状態で目標が全部は達成済みでない
   ④quiz の正解の位置⑤本文の数字がアプリの値・計算と一致(プリディレイの上限・32分音符・目安表)⑥聞き比べの音量差1dB以内(cmp.g が入っている案のみ。入っていなければ「未校正」と数える。
   node-web-audio-api が無いとき、CI以外では測定の部分だけスキップ) */
const E=require('./efest.js'),fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
/* 静的な検査は、validate.js と同じ全ファイルを読んだ SD で行う(cmest の読み込み一覧は音量測定用で、用語・他コースを全部は含まない) */
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const SDM=E.loadSD();const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XS'),get=id=>LS.find(l=>l.id===id);
['xs01','xs02','xs03','xs04','xs05','xs06','xs07','xs08','xs09','xs10'].forEach(id=>ok(get(id),id+' が無い'));
const ids=new Set(SD.LESSONS.map(l=>l.id));
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xs1'&&L.kind==='recipe'&&L.steps.length>=5&&L.steps.length<=8&&L.steps.some(s=>s.col)&&L.steps.some(s=>s.cmp),'形 '+L.id);
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.cp,L.id+' T'+(i+1)+' に mx.eq と mx.cp'));
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ',t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');
  ok(!/(LUFS|ラウフネス|ラウドネス)/.test(t),w+'LUFS の話は書かない(測れない)');
  (st.cmp||[]).forEach((c,i)=>{ok(c.tm||c.s||c.mt||c.ln||c.au===false,w+'cmp'+(i+1)+' は tm か s か mt か ln か au:false を持つ');ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲')});
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1];let ini;
    if(g.ins==='mix'){ini=(x.o.mix||{})[g.k];if(ini==null)ini=SD.MIXP.filter(q=>q.id===g.k)[0].def}
    else{const src=g.ins==='eq'?x.o.mx.eq:g.ins==='cp'?x.o.mx.cp:null;ini=src&&src[g.k];if(ini==null)ini=SD.insDef(g.k).def}
    return SD.MixGoal.inRange(ini,g.rng)});ok(!met,w+'mx 目標が最初から全部達成済み')}
  if(st.f&&st.f.length){const init=Object.assign({},SD.defs.analog.DEF,SD.FXDEF,L.init),met=st.f.every(([id,g])=>{const p=SD.FXP.filter(q=>q.id===id)[0]||SD.defs.analog.byId[id];if(!p){bad(w+'f の ID が不明 '+id);return true}return p.type==='seg'?init[id]===g:Math.abs(SD.toN(p,init[id])-SD.toN(p,g))<=(st.tol||.07)+1e-6});ok(!met,w+'f 目標が最初から全部達成済み')}
  if(st.quiz)ok(st.cmp&&st.quiz.ans>=1&&st.quiz.ans<=st.cmp.length,w+'quiz.ans')})});
{const a=LS.flatMap(L=>L.steps.filter(s=>s.quiz).map(s=>s.quiz.ans));ok(new Set(a).size>=3,'quiz の正解の位置が偏っている '+a)}
SD.TERMS.filter(t=>/^xs_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>ids.has(s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(t,L.id+' の terms '+id+' が未登録');ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
/* 本文の数字がアプリの値・計算と合っている */
{const pre=SD.FXP.filter(p=>p.id==='rvbPre')[0],bpm=120;
 ok(pre.max===100,'PRE DLY の上限が100msでない '+pre.max);
 ok(15000/bpm===125&&7500/bpm===62.5&&Math.round(7500/90)===83,'xs02 の拍の計算(16分125ms・32分62.5ms・90BPMの32分約83ms)');
 const t=get('xs02');ok(t.steps.some(s=>(s.f||[]).some(([id,g])=>id==='rvbPre'&&g===62.5)),'xs02 の PRE DLY 目標は62.5ms(120BPMの32分音符)');
 ok(t.steps.some(s=>/125ms/.test(s.b)&&/62\.5ms/.test(s.b)&&/上限は100ms/.test(s.b)),'xs02 の本文に 125ms・62.5ms・上限100ms');
 ok(t.steps.some(s=>/90BPM/.test(s.b+(s.col?s.col.b:''))),'xs02 に90BPMの例');
 /* テンポは120BPMのまま(レッスンで変えない) */
 ok(!t.steps.some(s=>(s.cmp||[]).some(c=>c.s&&c.s.sBpm!==undefined))&&t.init.sBpm===undefined,'xs02 はテンポを変えない')}
{const g=SD.GUIDE.roles;ok(g.pad.hpf[0]===100&&g.pad.hpf[1]===200,'目安表 pad.hpf が100〜200Hz');
 ok(get('xs04').steps[1].mx[0].rng[0]===g.pad.hpf[0]&&get('xs04').steps[1].mx[0].rng[1]===g.pad.hpf[1],'xs04 の LOW CUT 目標が目安表(pad.hpf)と違う');
 ok(g.hat.pan.lo===10&&g.hat.pan.hi===30,'目安表 hat.pan が±10〜30%');
 const m=get('xs05').steps[2].mx[0];ok(m.k==='tPan'&&m.rng[0]===g.hat.pan.lo/100&&m.rng[1]===g.hat.pan.hi/100,'xs05 のハットのパン目標が目安表(hat.pan)と違う')}
/* 構成(トラック・初期値・ダッキングのソース=リードの番号) */
{const x1=get('xs01'),x3=get('xs03'),x4=get('xs04'),x5=get('xs05');
 ok(x1.tk.length===4&&x1.tk.every(t=>t.o.mix.tRvb===.6&&t.o.mix.tDly===0),'xs01 は4トラック・全員 tRvb .6 から始める');
 ok(x3.tk[2].o.name==='リード'&&x3.steps.some(s=>(s.f||[]).some(([id,g])=>id==='dlDuckSrc'&&g===2)),'xs03 の DLY SRC=2 は T3(リード)');
 ok(x4.tk[2].o.name==='リード'&&x4.steps.some(s=>(s.f||[]).some(([id,g])=>id==='rvDuckSrc'&&g===2)),'xs04 の RVB SRC=2 は T3(リード)');
 ok(x3.tk[2].o.mix.tDly===1&&x3.tk[2].o.mx.eq.iEqOn===1&&x3.tk[0].o.mix.tDly===0&&x3.tk[1].o.mix.tDly===0,'xs03: リードだけがディレイに送られる・EQが入っている');
 ok(x5.tk[1].o.mix.tPan===.4&&x5.tk[2].o.mix.iMdOn===1,'xs05: ベースは右寄りから始まる・パッドにコーラス');
 ok(SD.FXP.filter(p=>p.id==='rtDuckRel')[0].max>=800&&SD.FXP.filter(p=>p.id==='dlyTone')[0].min<=1500,'xs03・xs04 の聞き比べの値がつまみの範囲内')}
(async()=>{
 if(!E.hasRender){if(process.env.CI){bad('node-web-audio-api が無い')}else console.log('SKIP: 測定(node-web-audio-api 未インストール)');return done()}
 let nC=0,nU=0;
 for(const L of SDM.LESSONS.filter(l=>l.course==='XS'))for(let si=0;si<L.steps.length;si++){const st=L.steps[si];if((st.cmp||[]).length<2)continue;
  if(!st.cmp.some(c=>c.g!==undefined)){nU++;continue}
  const lv=await E.levelsFx(SDM,L,st);if(lv.some(x=>x==null))continue;nC++;const sp=SDM.MixGoal.cmpSpread(lv,st.cmp.map(c=>c.g||0));ok(sp<=1.0,L.id+' step'+(si+1)+' 聞き比べの音量差が1dBを超える '+sp.toFixed(2)+'dB')}
 console.log(err?('失敗 '+err+'件'):('OK: XSコース '+LS.length+'本・音量差を測った聞き比べ'+nC+'件'+(nU?('・未校正'+nU+'件(tools/xs-cal.js で GT を出す)'):'')));process.exit(err?1:0)
})();
function done(){/* v11.25: xs05 の step5 は xs06 と矛盾しない(WIDTHだけならモノで薄くならない)。 */
{const st=get('xs05').steps[4];ok(st.quiz.ans===3&&!/(打ち消|薄く)/.test(st.b)||/薄くはならない/.test(st.quiz.ex),'xs05 step5: WIDTHがモノで薄くなる、と書いてはいけない(xs06と矛盾)');
 ok(!/打ち消され、薄くなる/.test(st.quiz.ex)&&/戻る/.test(st.b),'xs05 step5: モノでは広げる前に戻る、と書く')}
console.log(err?('失敗 '+err+'件'):('OK: XSコース '+LS.length+'本(測定はスキップ)'));process.exit(err?1:0)}
