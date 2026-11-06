/* XDコース(xd01〜)の検査(静的): ①形(diag・lv3・cat xd1・5〜8ステップ・cmp・col・save・quiz・直す目標・各トラックに mx.eq と mx.cp・pre実在)
   ②本文150字以内・年号なし・LUFS/機種名を書かない・用語 ③初期状態で直す目標が全部は達成済みでない ④『問題を1つだけ残した3つ』: 問題は初期状態に入っていて、直した状態(最後のcmpの最後)では消えている
   ⑤quiz の正解の位置。聞こえ方は耳で確かめる(未確認) */
const fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XD'),get=id=>LS.find(l=>l.id===id),ids=new Set(SD.LESSONS.map(l=>l.id));
['xd01','xd02','xd03','xd04','xd05','xd06','xd07','xd08'].forEach(id=>ok(get(id),id+' が無い'));
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xd1'&&L.kind==='diag'&&L.steps.length>=5&&L.steps.length<=8&&L.steps.some(s=>s.col)&&L.steps.some(s=>s.cmp)&&L.save&&L.steps.some(s=>s.quiz),'形 '+L.id);
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.cp,L.id+' T'+(i+1)+' に mx.eq と mx.cp'));
 ok(L.steps.filter(s=>(s.mx||[]).length||(s.f||[]).length).length===(L.id==='xd08'?1:3),L.id+' 直す目標の数(問題の数)');
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ',t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);
  ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');ok(!/(LUFS|ラウドネス|808|909)/.test(t+st.h),w+'LUFS・機種名は書かない');
  (st.cmp||[]).forEach((c,i)=>{ok(c.tm,w+'cmp'+(i+1)+' は tm');ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲')});
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1];let ini;
   if(g.ins==='mix')ini=(x.o.mix||{})[g.k];else{const src=g.ins==='eq'?x.o.mx.eq:g.ins==='cp'?x.o.mx.cp:null;ini=src&&src[g.k]}
   if(ini==null)ini=(g.ins==='mix'?SD.MIXP.filter(q=>q.id===g.k)[0]:SD.insDef(g.k)).def;return SD.MixGoal.inRange(ini,g.rng)});ok(!met,w+'直す目標が最初から達成済み')}
  if(st.quiz)ok(st.cmp&&st.quiz.ans>=1&&st.quiz.ans<=st.cmp.length,w+'quiz.ans')})});
{const a=LS.flatMap(L=>L.steps.filter(s=>s.quiz).map(s=>s.quiz.ans));ok(new Set(a).size>=3,'quiz の正解の位置が偏っている '+a)}
SD.TERMS.filter(t=>/^xd_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>ids.has(s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(t,L.id+' の terms '+id+' が未登録');ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
/* 問題が初期状態に入っていて、直した状態で消えている(目標の範囲に入る) */
const eqv=(L,t,k)=>{const q=L.tk[t-1].o,v=q.mx.eq[k];return v==null?SD.insDef(k).def:v};
const fixed=L=>{const st=L.steps[L.steps.length-1];return st.cmp[st.cmp.length-1].tm};
const inFix=(L,t,k)=>{const f=fixed(L)[t];return f[k]!==undefined?f[k]:SD.insDef(k).def};
{const L=get('xd01');ok(L.tk[1].o.mix.tVol>=.9&&fixed(L)[2].tVol>=.55&&fixed(L)[2].tVol<=.7,'xd01 サブ: 初期は大きく・直すと55〜70%');
 ok(eqv(L,3,'iEqHpf')<=30&&fixed(L)[3].iEqHpf>=SD.GUIDE.roles.pad.hpf[0]&&L.steps[3].mx[0].rng+''===SD.GUIDE.roles.pad.hpf+'','xd01 ミッドベース: 初期はHPFなし・直すと pad.hpf');
 ok(eqv(L,1,'iEqLg')>=4&&Math.abs(inFix(L,1,'iEqLg'))<=2,'xd01 キック: 初期でLOWが+4dB以上・直すと±2dB')}
{const L=get('xd02');ok(eqv(L,2,'iEqHg')>=4&&inFix(L,2,'iEqHg')<=-1,'xd02 ハット');ok(eqv(L,3,'iEqB2g')>=4&&inFix(L,3,'iEqB2g')<=-1,'xd02 リード');ok(eqv(L,4,'iEqHg')>=4&&Math.abs(inFix(L,4,'iEqHg'))<=1,'xd02 コード')}
{const L=get('xd03');ok(L.tk[3].o.mix.tVol<=.4&&fixed(L)[4].tVol>=.65,'xd03 声の音量');ok(eqv(L,2,'iEqB2g')>=4&&inFix(L,2,'iEqB2g')<=-1,'xd03 コードの帯域');ok(L.tk[3].o.mix.tRvb>=.5&&fixed(L)[4].tRvb<=.2,'xd03 残響')}
/* 3つの比較は、問題がちょうど1つだけ残る */
ok(LS.filter(L=>!/xd08/.test(L.id)).every(L=>L.steps.filter(s=>s.cmp&&s.cmp.length===3).length===3),'診断は3択の聞き比べが3回');
/* MX-13 */
{const L=get('xd04');ok(L.init.swWidth===2&&L.steps[1].f[1][1]===1,'xd04 広がりすぎ: 初期WIDTH 200%・目標は100%');
 ok(SD.GUIDE.roles.hat.pan.lo===10&&SD.GUIDE.roles.hat.pan.hi===30&&L.steps[3].mx[0].rng+''==='0.1,0.3','xd04 ハットのパン目標が hat.pan と違う');
 ok(L.tk[1].o.mix.tPan===0&&L.tk[2].o.mix.tPan>=.8&&L.steps[5].mx[0].rng+''==='-0.1,0.1','xd04 初期: ハットは中央・リードは端')}
{const L=get('xd05'),cp=t=>L.tk[t-1].o.mx.cp;ok(cp(1).iCpRatio>=8&&cp(4).iCpAtk<=2&&cp(3).iCpRel>=800,'xd05 初期: かけすぎ・ATTACK速い・RELEASE長い');
 const f=fixed(L);ok(f[1].iCpRatio>=2&&f[1].iCpRatio<=4&&f[4].iCpAtk>=10&&f[4].iCpAtk<=30&&f[3].iCpRel>=100&&f[3].iCpRel<=300,'xd05 直した状態が目標の範囲')}
{const L=get('xd06'),f=fixed(L);ok(L.tk[3].o.mix.tVol>=.9&&L.tk[4].o.mix.tVol<=.1&&L.tk[2].o.mx.cp.iCpMake>=8,'xd06 初期の問題');
 ok(f[4].tVol>=.4&&f[4].tVol<=.6&&f[5].tVol>=.3&&f[5].tVol<=.5&&f[3].iCpMake>=0&&f[3].iCpMake<=2,'xd06 直した状態が目標の範囲')}
{const L=get('xd07');ok(eqv(L,1,'iEqLg')>=4&&eqv(L,2,'iEqHg')>=4&&L.tk[2].o.mix.tVol>=.9,'xd07 初期の問題');const f=fixed(L);ok(Math.abs(f[1].iEqLg)<=2&&f[2].iEqHg<=-1&&f[3].tVol>=.4&&f[3].tVol<=.6,'xd07 直した状態が目標の範囲')}
{const L=get('xd08'),f=fixed(L);ok(eqv(L,2,'iEqHg')>=4&&eqv(L,3,'iEqB2g')>=4&&L.tk[2].o.mix.tVol>=.9&&L.steps.slice(0,4).every(s=>s.quiz),'xd08 初期の問題・4問');
 ok(f[2].iEqHg<=-1&&f[3].iEqB2g<=-1&&f[3].tVol>=.4&&f[3].tVol<=.6,'xd08 直した状態が目標の範囲')}
console.log(err?('失敗 '+err+'件'):('OK: XDコース '+LS.length+'本(静的検査まで。聞こえ方は未確認)'));process.exit(err?1:0);
