/* XBコース(xb01〜)の検査(静的): ①形(lv3・cat・5〜8ステップ・cmp・col・各トラックに mx.eq/mx.cp・pre実在)②本文150字以内・年号なし・LUFS を書かない・用語
   ③初期状態で mx 目標が全部は達成済みでない ④quiz の正解の位置 ⑤構成(バス割り当て・SCのキー・サブの波形)。
   cmp.g は未測定(入っていれば範囲だけ見る)。聞こえ方は耳で確かめる */
const fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XB'),get=id=>LS.find(l=>l.id===id),ids=new Set(SD.LESSONS.map(l=>l.id));
['xb01','xb02','xb03','xb04','xb05','xb06','xb07','xb08','xb09','xb10'].forEach(id=>ok(get(id),id+' が無い'));
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xb1'&&L.kind==='recipe'&&L.steps.length>=5&&L.steps.length<=8&&L.steps.some(s=>s.col)&&L.steps.some(s=>s.cmp),'形 '+L.id);
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.cp,L.id+' T'+(i+1)+' に mx.eq と mx.cp'));
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ',t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);
  ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');ok(!/(LUFS|ラウフネス|ラウドネス)/.test(t),w+'LUFS の話は書かない(測れない)');
  (st.cmp||[]).forEach((c,i)=>{ok(c.tm||c.bm||c.s||c.mt,w+'cmp'+(i+1)+' は tm か bm か s か mt を持つ');ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲')});
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1];let ini;
   if(g.ins==='mix')ini=(x.o.mix||{})[g.k];else{const src=g.ins==='eq'?x.o.mx.eq:g.ins==='cp'?x.o.mx.cp:null;ini=src&&src[g.k]}
   if(ini==null)ini=(g.ins==='mix'?SD.MIXP.filter(q=>q.id===g.k)[0]:SD.insDef(g.k)).def;return SD.MixGoal.inRange(ini,g.rng)});ok(!met,w+'mx 目標が最初から全部達成済み')}
  if(st.quiz)ok(st.cmp&&st.quiz.ans>=1&&st.quiz.ans<=st.cmp.length,w+'quiz.ans')})});
{const a=LS.flatMap(L=>L.steps.filter(s=>s.quiz).map(s=>s.quiz.ans));ok(new Set(a).size>=3,'quiz の正解の位置が偏っている '+a)}
SD.TERMS.filter(t=>/^xb_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>ids.has(s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(t,L.id+' の terms '+id+' が未登録');ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
/* 構成 */
ok(get('xb01').tk.map(t=>t.o.out).join()==='A,A,A,B,B,C','xb01 のバス: T1〜T3=A・T4〜T5=B・T6=C');
ok(get('xb01').steps[1].b.indexOf('{g:dyn.grDrumBus}')>=0&&SD.GUIDE.dyn.grDrumBus[0]===2,'xb01 のドラムバスGRは目安表');
{const L=get('xb03');ok(L.tk[1].o.mx.cp.iCpSc===1&&L.tk[0].o.mx.eq.iEqOn===1&&L.tk[1].o.mx.eq.iEqOn===1,'xb03: T2 はT1キーのサイドチェイン・両方EQあり');
 const g=L.steps[2].mx;ok(g[0].rng[0]===-52&&g[0].rng[1]===-40&&g[1].rng[0]===6&&g[1].rng[1]===12,'xb03 の SC 目標は cm12 と同じ(-52〜-40・6〜12)')}
{const L=get('xb04');ok(L.tk[1].o.name==='サブ'&&L.tk[1].o.p&&L.tk[2].o.name==='倍音'&&L.tk[2].o.tr===12,'xb04: T2=サブ・T3=1オクターブ上の倍音');
 ok(L.steps[1].mx[0].ins==='sa'&&SD.INSP.some(p=>p.id==='iSaDrive'),'xb04 の SAT 目標')}
for(const L of LS)for(const st of L.steps)for(const [id] of (st.f||[]))ok(SD.FXP.some(p=>p.id===id)||SD.defs.analog.byId[id],L.id+' f の ID '+id);
{const st=get('xb05').steps[2];ok(st.f.every(([id])=>SD.FXP.some(p=>p.id===id)),'xb05 の f はマスターCOMP')}
/* MX-9: 構成・目安表との一致 */
{const R=SD.GUIDE.roles,L=get('xb10');ok(L.tk.length===6&&L.tk.every(x=>x.o.mx.eq.iEqOn===1&&x.o.mx.eq.iEqHpf===20),'xb10: 6トラック・全員 HPF 20Hz から');
 const g=n=>L.steps[n].mx;ok(R.pad.hpf[0]===100&&R.pad.hpf[1]===200&&g(2)[0].rng+''==='100,200','xb10 コードのHPF目標が pad.hpf と違う');
 ok(R.lead.hpf[0]===150&&R.lead.hpf[1]===250&&g(2)[1].rng+''==='150,250','xb10 リードのHPF目標が lead.hpf と違う');
 ok(R.hat.hpf[0]===300&&R.hat.hpf[1]===500&&g(3)[1].rng+''==='300,500','xb10 ハットのHPF目標が hat.hpf と違う');
 ok(R.snare.hpf[0]===100&&g(3)[0].rng[0]<=100&&g(3)[0].rng[1]>=100,'xb10 スネアのHPF目標が snare.hpf を含む');
 ok(R.kick.hpf[0]===30&&R.bass.hpf[0]===30&&g(1).every(x=>x.rng[0]<=30&&x.rng[1]>=30),'xb10 キック・ベースの目標が30Hzを含む')}
{const L=get('xb08');ok(L.tk.length===4&&L.tk[2].o.out==='A'&&L.tk[3].o.out==='A'&&!L.tk[0].o.out,'xb08: T3・T4 だけが BUS A(並列)')}
{const L=get('xb07');ok(L.tk.map(t=>t.o.out).join()==='A,A,B,B,C','xb07 のバス: A,A,B,B,C')}
{const fx=SD.FXR.map(f=>f.k);ok(fx.indexOf('eq')<fx.indexOf('cp')&&fx.indexOf('cp')<fx.indexOf('mb')&&fx.indexOf('mb')<fx.indexOf('sw'),'マスターFXの並びが EQ→COMP→MB→WIDTH でない(xb09 の前提)')}
console.log(err?('失敗 '+err+'件'):('OK: XBコース '+LS.length+'本(静的検査。音量差は未測定)'));process.exit(err?1:0);
