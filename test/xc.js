/* XCコース(xc01〜)の検査: ①聞き比べの音量差1dB以内(オフライン描画・2段目・キー対応の test/cmest.js)②mt目標(GR)が、目標どおりの状態で達成できる・目安表(SD.GUIDE)と一致
   ③初期状態で mx 目標が全部は達成済みでない ④本文の主張が音に出ている(ATTACK・RELEASE・2段のGR・MIX・SC HPF)⑤本文の長さ・禁止語・用語
   node-web-audio-api が無いとき、CI以外では測定の部分だけスキップ */
const E=require('./cmest.js'),SD=E.loadSD();let err=0;const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XC'),get=id=>LS.find(l=>l.id===id);
['xc01','xc02','xc03','xc04','xc05','xc06','xc07','xc08','xc09','xc10'].forEach(id=>ok(get(id),id+' が無い'));
/* 定義だけの検査 */
const CPK=SD.INSP.filter(p=>p.ins==='cp'&&p.id!=='iCpSc'&&p.id!=='iCpScLsn').map(p=>p.id);
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xc1'&&L.steps.length>=5&&L.steps.length<=8&&L.steps.some(s=>s.col)&&L.steps.some(s=>s.cmp),'形 '+L.id);
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.cp,L.id+' T'+(i+1)+' に mx.eq と mx.cp'));
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ',t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');
  (st.cmp||[]).forEach((c,i)=>{ok(c.tm||c.bm||c.mt,w+'cmp'+(i+1)+' は tm か bm を持つ');ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲');
   Object.keys(c.tm||{}).forEach(t=>{const v=c.tm[t];ok(v.iCpOn===0||CPK.every(k=>v[k]!==undefined),w+'cmp'+(i+1)+' tm のCOMPは全つまみを書く')})});
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1],b=g.k.replace(/_2$/,''),src=g.k===b?(x.o.mx&&x.o.mx.cp):x.o.mix,ini=src&&src[g.k],d=SD.insDef(g.k).def;return SD.MixGoal.inRange(ini==null?d:ini,g.rng)});ok(!met,w+'mx 目標が最初から全部達成済み')}
  if(st.quiz)ok(st.cmp&&st.quiz.ans>=1&&st.quiz.ans<=st.cmp.length,w+'quiz.ans')})});
{const a=LS.flatMap(L=>L.steps.filter(s=>s.quiz).map(s=>s.quiz.ans));ok(new Set(a).size>=3,'quiz の正解の位置が偏っている '+a)}
/* 目安表との一致・構成 */
{const g=get('xc01').steps[1].mt[0],G=SD.GUIDE.dyn.grBass;ok(g.m==='gr'&&g.rng[0]===G[0]&&g.rng[1]===G[1],'xc01 の GR 目標が目安表(ベースのGR)と違う')}
ok(SD.ordValid(get('xc03').tk[1].o.mix.ord)&&get('xc03').tk[1].o.mix.ord.indexOf('cp_2')>=0,'xc03 の ord に cp_2');
ok(get('xc05').tk[1].o.mx.cp.iCpSc===1&&get('xc05').tk[1].o.mx.cp.iCpScHpf===120,'xc05 のキーはT1・初期 SC HPF 120');
ok(get('xc07').tk[1].o.mix.ord.indexOf('cp_2')>=0&&SD.ordValid(get('xc07').tk[1].o.mix.ord),'xc07 の ord に cp_2');
ok(get('xc09').tk.length===2&&get('xc10').tk.every(x=>x.o.out)&&get('xc10').tk.length===5,'xc09 は2トラック・xc10 は全トラックが BUS に出る');
/* 用語 */
SD.TERMS.filter(t=>/^xc_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>SD.LESSONS.some(l=>l.id===s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
(async()=>{
 if(!E.hasRender){if(process.env.CI){bad('node-web-audio-api が無い')}else console.log('SKIP: 測定(node-web-audio-api 未インストール)');return done()}
 let nC=0,nM=0;const mean=a=>{const b=a.slice(a.length/3|0);return b.reduce((x,y)=>x+y,0)/b.length},mn=a=>Math.min(...a.slice(a.length/3|0));
 for(const L of LS)for(let si=0;si<L.steps.length;si++){const st=L.steps[si];
  if((st.cmp||[]).length>1&&st.cmp.every(c=>c.tm)){const lv=await E.cmpLevels(SD,L,st),sp=SD.MixGoal.cmpSpread(lv,st.cmp.map(c=>c.g||0));nC++;ok(sp<=1.0,L.id+' step'+(si+1)+' 聞き比べの音量差が1dBを超える '+sp.toFixed(2)+'dB')}
  if((st.mt||[]).length){const state=E.stateAt(SD,L,si),r=await E.measure(SD,L,state);
   st.mt.forEach(g=>{if(g.m!=='gr')return;nM++;ok(E.mtReachable(SD,r.gr[g.trk]||[],g.rng,g.hold),L.id+' step'+(si+1)+' mt GR '+g.rng+' が目標どおりの状態で達成できない')})}}
 /* 本文の主張 */
 const one=async(id,i,o)=>E.measure(SD,{tk:[get(id).tk[i]]},{1:o}),CP=o=>Object.assign({iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20},o);
 {const a=await one('xc01',1,CP({iCpThr:-30,iCpRatio:4,iCpAtk:1})),b=await one('xc01',1,CP({iCpThr:-30,iCpRatio:4,iCpAtk:30}));ok(20*Math.log10(b.peak/a.peak)>1,'xc01: ATTACKが遅いほど頭(ピーク)が残る');}
 {const lo=await one('xc01',1,CP({iCpThr:-25,iCpRatio:3})),hi=await one('xc01',1,CP({iCpThr:-41,iCpRatio:8})),v=r=>mean(r.gr[1]);ok(v(lo)>=3&&v(lo)<=6&&v(hi)>=10,'xc01: 浅い GR '+v(lo).toFixed(1)+' 深い GR '+v(hi).toFixed(1))}
 {const s=await one('xc02',1,CP({iCpThr:-30,iCpRatio:4,iCpRel:150})),l=await one('xc02',1,CP({iCpThr:-30,iCpRatio:4,iCpRel:1500}));ok(mn(s.gr[1])<4.5&&mn(l.gr[1])>8,'xc02: RELEASE 150ms は音の間で戻り、1500ms は戻りきらない '+mn(s.gr[1]).toFixed(1)+' '+mn(l.gr[1]).toFixed(1))}
 {const ORD=get('xc03').tk[1].o.mix.ord,sf=o=>{const r={};Object.keys(o).forEach(k=>r[k+'_2']=o[k]);return r};
  const two=(a,b)=>Object.assign({ord:ORD},CP(a),sf(CP(b)));
  const one1=await one('xc03',1,CP({iCpThr:-28,iCpRatio:3})),soft=await one('xc03',1,two({iCpThr:-22,iCpRatio:2,iCpAtk:5,iCpRel:100},{iCpThr:-22,iCpRatio:2,iCpAtk:30,iCpRel:300})),hard=await one('xc03',1,two({iCpThr:-40,iCpRatio:8,iCpAtk:5,iCpRel:100},{iCpThr:-40,iCpRatio:8,iCpAtk:30,iCpRel:300}));
  const sum=r=>mean(r.gr[1])+mean(r.gr2[1]);ok(Math.abs(sum(soft)-mean(one1.gr[1]))<=2&&sum(soft)>0&&mean(soft.gr[1])<mean(soft.gr2[1])+1,'xc03: 軽く2回の合計GRが1段の量と同じくらい '+sum(soft).toFixed(1)+' vs '+mean(one1.gr[1]).toFixed(1));
  ok(sum(hard)>sum(one1)+3||sum(hard)>mean(one1.gr[1])+3,'xc03: 2段とも強いとGRが足し算で大きい '+sum(hard).toFixed(1))}
 {const r=[];for(const m of [.15,.4,.7,1])r.push((await one('xc04',1,CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:m}))).tr[1]);ok(r[0]<r[1]&&r[1]<r[2]&&r[2]<r[3],'xc04: MIX が増えるほど音量が増える '+r.map(x=>x.toFixed(1)));
  const t=[];for(const th of [-34,-44,-54])t.push(mean((await one('xc04',1,CP({iCpThr:th,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4}))).gr[1]));ok(t[0]<t[1]&&t[1]<t[2],'xc04: THRESH が低いほど GR が大きい '+t.map(x=>x.toFixed(1)))}
 {const L=get('xc05'),gr=async h=>mean((await E.measure(SD,L,{2:Object.assign({},SD.scMix({src:0,depth:.8,key:-14}),{iCpScHpf:h})})).gr[2]),a=await gr(20),b=await gr(120),c=await gr(300);ok(a>b&&b>c&&a-c>2,'xc05: SC HPF を上げるほどへこみが浅い '+[a,b,c].map(x=>x.toFixed(1)));
  const ig=async h=>mean((await one('xc05',1,CP({iCpThr:-30,iCpRatio:4,iCpScHpf:h}))).gr[1]),x=await ig(20),y=await ig(100),zz=await ig(300);ok(x>y&&y>zz&&x-zz>3,'xc05: INT でも SC HPF を上げると GR が減る '+[x,y,zz].map(q=>q.toFixed(1)))}

 /* MX-5: xc06〜xc10 の主張 */
 {const pk=async a=>(await one('xc06',0,CP({iCpThr:-30,iCpRatio:4,iCpAtk:a,iCpRel:100}))).peak,a=await pk(1),b=await pk(30);ok(20*Math.log10(b/a)>1,'xc06: ATTACKが遅いほど頭(ピーク)が残る '+(20*Math.log10(b/a)).toFixed(1));
  const tl=async o=>(await one('xc06',2,CP(o))).tr[1],t0=await tl({iCpThr:-30,iCpRatio:4,iCpAtk:30,iCpRel:100}),t1=await tl({iCpThr:-30,iCpRatio:4,iCpAtk:.5,iCpRel:60,iCpMake:4});ok(Number.isFinite(t0)&&Number.isFinite(t1),'xc06: 測定できる');}
 {const L=get('xc07'),ORD=L.tk[1].o.mix.ord,sf=o=>{const r={};Object.keys(o).forEach(k=>r[k+'_2']=o[k]);return r},two=(a,b)=>Object.assign({ord:ORD},a,sf(b)),
   LIM=o=>CP(Object.assign({iCpThr:-14,iCpRatio:20,iCpAtk:.1,iCpRel:60,iCpKnee:0},o||{})),SOFT=CP({iCpThr:-24,iCpRatio:2.5,iCpAtk:10,iCpRel:120}),run=o=>E.measure(SD,{tk:[L.tk[1]]},{1:o});
  const soft=await run(two(SOFT,CP({iCpThr:0,iCpRatio:1}))),both=await run(two(SOFT,LIM())),lo=await run(two(SOFT,LIM({iCpThr:-34})));
  {const g=both.gr2[1],mx=Math.max(...g),mn=mean(g);/* 最大GRは実行ごとに約2.9〜4.2dBとゆれる(CIで2.7)。形(平均に比べ最大がずっと大きい)を見るため、絶対値は緩め・比率で判定 */ok(mx>1.5&&mn<mx*.4,'xc07: 2段目は山のところだけ強く働く(GRの最大が平均よりずっと大きい) 最大'+mx.toFixed(1)+' 平均'+mn.toFixed(1))}
  ok(mean(lo.gr2[1])>mean(both.gr2[1])+1,'xc07: 2段目の THRESH を下げるほど GR が大きい '+mean(both.gr2[1]).toFixed(1)+' '+mean(lo.gr2[1]).toFixed(1))}
 {const L=get('xc08'),eo=(ord,g)=>Object.assign({ord:ord,iEqOn:1,iEqB1f:250,iEqB1g:g,iEqHpf:20},CP({iCpThr:-26,iCpRatio:4,iCpAtk:10,iCpRel:150})),run=o=>E.measure(SD,{tk:[L.tk[1]]},{1:o}),
   a=await run(eo(['gt','eq','cp','ds','sa','md'],9)),b=await run(eo(['gt','cp','eq','ds','sa','md'],9)),c=await run(eo(['gt','eq','cp','ds','sa','md'],0));
  ok(mean(a.gr[1])>mean(b.gr[1])+1&&mean(a.gr[1])>mean(c.gr[1])+1,'xc08: 足したEQをCOMPの前に置くとGRが増える '+[a,b,c].map(r=>mean(r.gr[1]).toFixed(1)))}
 {const L=get('xc09'),SPL=(eq,cp)=>Object.assign({},eq,CP(cp)),run=o=>E.measure(SD,L,o),
   sp=await run({1:SPL({iEqOn:1,iEqLpf:800,iEqHpf:20},{iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:150,iCpMake:4}),2:SPL({iEqOn:1,iEqLpf:20000,iEqHpf:800},{iCpThr:-30,iCpRatio:2.5,iCpAtk:10,iCpRel:250})});
  ok(mean(sp.gr[1])>mean(sp.gr[2])+2,'xc09: 低域側のGRが高域側より大きい '+mean(sp.gr[1]).toFixed(1)+' '+mean(sp.gr[2]).toFixed(1))}
 {const L=get('xc10'),BCP=o=>Object.assign({iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:2,iCpAtk:30,iCpRel:150,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20},o||{}),G={2:CP({iCpThr:-22,iCpRatio:3,iCpAtk:20,iCpRel:100}),4:CP({iCpThr:-28,iCpRatio:4,iCpAtk:10,iCpRel:200})},
   run=a=>E.measure(SD,L,Object.assign({},G,{bm:{A:a}})),l=await run(BCP({iCpThr:-12})),h=await run(BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5}));
  ok(l.grBus&&h.grBus&&mean(h.grBus.A)>mean(l.grBus.A)+3,'xc10: 深いバスほどGRが大きい '+mean(l.grBus.A).toFixed(1)+' '+mean(h.grBus.A).toFixed(1));
  const bad=await E.measure(SD,L,{}),fix=await E.measure(SD,L,G);ok(mean(bad.gr[2])>mean(fix.gr[2])+3,'xc10: 直す前のスネアは強すぎる(GR) '+mean(bad.gr[2]).toFixed(1)+' → '+mean(fix.gr[2]).toFixed(1))}
 console.log(err?('失敗 '+err+'件'):('OK: XCコース '+LS.length+'本・聞き比べ'+nC+'件の音量差・mt目標'+nM+'件・本文の主張を測定で検査'));process.exit(err?1:0)
})();
function done(){console.log(err?('失敗 '+err+'件'):('OK: XCコース '+LS.length+'本(測定はスキップ)'));process.exit(err?1:0)}
