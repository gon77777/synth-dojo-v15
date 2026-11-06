/* XGコース(xg01〜)の検査(静的+音量): ①形(lv3・cat・5〜8ステップ・cmp・col・各トラックに mx.eq/mx.cp・pre実在)②本文150字以内・年号なし・LUFS/機種名を書かない・用語
   ③初期状態で mx 目標が全部は達成済みでない ④quiz の正解の位置 ⑤構成(目安表との一致・SCのキー)。cmp.g は範囲だけ見る。聞こえ方は耳で確かめる */
const fs=require('fs'),path=require('path'),vm=require('vm');let err=0;
const SD=(()=>{const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
 const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
 eval('['+m[1]+']').forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));return ctx.SD})();
const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XG'),get=id=>LS.find(l=>l.id===id),ids=new Set(SD.LESSONS.map(l=>l.id));
['xg01','xg02','xg03','xg04','xg05','xg06','xg07','xg08','xg09','xg10','xg11','xg12'].forEach(id=>ok(get(id),id+' が無い'));
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xg1'&&L.kind==='recipe'&&L.steps.length>=5&&L.steps.length<=8&&L.steps.some(s=>s.col)&&L.steps.some(s=>s.cmp),'形 '+L.id);
 ok((L.pre||[]).length&&L.pre.every(p=>ids.has(p)),L.id+' pre');
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.cp,L.id+' T'+(i+1)+' に mx.eq と mx.cp'));
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ',t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);
  ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');ok(!/(LUFS|ラウドネス|ラウフネス|808|909)/.test(t+st.h),w+'LUFS・機種名は書かない');
  (st.cmp||[]).forEach((c,i)=>{ok(c.tm||c.bm||c.s||c.mt,w+'cmp'+(i+1)+' は tm か bm か s か mt を持つ');ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲')});
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1];let ini;
   if(g.ins==='mix')ini=(x.o.mix||{})[g.k];else{const src=g.ins==='eq'?x.o.mx.eq:g.ins==='cp'?x.o.mx.cp:null;ini=src&&src[g.k]}
   if(ini==null)ini=(g.ins==='mix'?SD.MIXP.filter(q=>q.id===g.k)[0]:SD.insDef(g.k)).def;return SD.MixGoal.inRange(ini,g.rng)});ok(!met,w+'mx 目標が最初から全部達成済み')}
  if(st.quiz)ok(st.cmp&&st.quiz.ans>=1&&st.quiz.ans<=st.cmp.length,w+'quiz.ans')})});
{const a=LS.flatMap(L=>L.steps.filter(s=>s.quiz).map(s=>s.quiz.ans));ok(new Set(a).size>=3,'quiz の正解の位置が偏っている '+a)}
SD.TERMS.filter(t=>/^xg_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>ids.has(s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(t,L.id+' の terms '+id+' が未登録');ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
for(const L of LS)for(const st of L.steps)for(const [id] of (st.f||[]))ok(SD.FXP.some(p=>p.id===id),L.id+' f の ID '+id);
/* MX-10: 構成・目安表との一致 */
const R=SD.GUIDE.roles,g=(L,n)=>get(L).steps[n].mx;
{const L=get('xg01');ok(L.tk[1].o.mx.cp.iCpSc===1&&L.tk[2].o.mx.cp.iCpSc===1,'xg01: ベースとパッドは T1 キーのサイドチェイン');
 ok(g('xg01',2)[0].rng+''==='-52,-40'&&g('xg01',2)[2].rng+''==='6,12','xg01 の SC 目標は cm12 と同じ(-52〜-40・6〜12)');
 ok(L.tk[0].o.mix.tVol<.85&&L.tk[1].o.mix.tVol>.75,'xg01: キックが小さく始まる')}
{const L=get('xg02');ok(R.pad.hpf[0]===100&&R.pad.hpf[1]===200&&g('xg02',1)[2].rng+''==='100,200','xg02 コードのHPF目標が pad.hpf と違う');
 ok(R.lead.hpf[0]===150&&R.lead.hpf[1]===250&&g('xg02',1)[3].rng+''==='150,250','xg02 リードのHPF目標が lead.hpf と違う');
 ok(R.kick.hpf[0]===30&&R.bass.hpf[0]===30&&g('xg02',1)[0].rng[0]<=30&&g('xg02',1)[0].rng[1]>=30,'xg02 キック・ベースの目標が30Hzを含む');
 ok(R.hat.pan.lo===10&&R.hat.pan.hi===30&&g('xg02',2)[0].rng+''==='0.1,0.3','xg02 ハットのパン目標が hat.pan と違う');
 ok(L.steps[3].cmp.every(c=>c.mt)&&L.steps[0].cmp.some(c=>c.mt),'xg02: 抜く比較は mt(音量は揃えない)')}
{ok(R.hat.hpf[0]===300&&R.hat.hpf[1]===500&&g('xg03',2)[0].rng+''==='300,500','xg03 ハットのHPF目標が hat.hpf と違う');
 ok(R.vocal.hpf[0]===80&&R.vocal.hpf[1]===120&&g('xg03',3)[1].rng+''==='80,120','xg03 声のHPF目標が vocal.hpf と違う');
 const L=get('xg03');ok(L.tk[1].o.name==='サブ'&&L.tk[1].o.p.o1Wave==='sine'&&L.tk[4].o.name==='声(代役)','xg03: T2=サブ(サイン波)・T5=声')}
{const L=get('xg04');ok(L.tk[3].o.mix.tPan===0&&L.tk[4].o.mix.tPan===0,'xg04: 壁の2枚は中央から始まる');
 ok(R.pad.hpf[0]===100&&g('xg04',2)[0].rng+''==='100,200','xg04 壁のHPF目標が pad.hpf と違う');
 ok(SD.GUIDE.dyn.eqStart[0]===1&&SD.GUIDE.dyn.eqStart[1]===3&&g('xg04',3)[2].rng+''==='1,3','xg04 リードのBAND2目標が eqStart(1〜3)と違う')}
{ok(R.vocal.hpf[0]===80&&g('xg05',2)[0].rng+''==='80,120','xg05 声のHPF目標が vocal.hpf と違う');
 ok(g('xg05',2)[1].rng+''==='1,3'&&SD.GUIDE.dyn.eqStart+''==='1,3','xg05 声のBAND2目標が eqStart(1〜3)と違う');
 ok(get('xg05').tk[0].o.name==='声(代役)'&&get('xg05').tk[0].o.mix.tPan===.15,'xg05: 声は右寄りから始まる')}
/* MX-11 */
{const g8=get('xg08');ok(g8.tk[3].o.mx.cp.iCpSc===1&&g('xg08',1)[0].rng+''==='-52,-40'&&g('xg08',1)[1].rng+''==='6,12'&&g('xg08',1)[2].rng+''==='80,200','xg08 の SC 目標は cm12 と同じ');
 ok(R.hat.hpf[0]===300&&g('xg08',3)[0].rng+''==='300,500'&&R.kick.hpf[0]===30&&g('xg08',2)[0].rng[0]<=30&&g('xg08',2)[0].rng[1]>=30,'xg08 のHPF目標が目安表と違う');
 ok(g8.tk[0].idx[10]===0&&g8.tk[0].idx[8]===undefined,'xg08: キックは0と10拍目(ブレイク風)')}
{const L=get('xg06');ok(L.tk[3].o.mix.iMdOn===1&&L.steps[2].f[1][1]===.6,'xg06: コードにMOD・WIDTH目標は60%');
 ok(L.steps[1].mx.every(m=>m.k==='iEqLpf'),'xg06 の暗さはLPF')}
{const L=get('xg07');ok(L.tk[2].o.name==='サブ'&&g('xg07',2)[2].rng+''==='0,0.05'&&L.tk[2].o.mix.tRvb>.05,'xg07: サブは最初は送りがある・目標は0〜5%');
 ok(L.tk[0].o.mx.cp.iCpRatio>1.5,'xg07: パッドAは最初は強く圧縮している')}
{const L=get('xg09');ok(L.tk[1].o.name==='サブ'&&L.tk[2].o.name==='ベース'&&R.pad.hpf[0]===100&&g('xg09',2)[0].rng+''==='100,200','xg09: T2=サブ・ミッドのHPFは100〜200')}
{ok(SD.GUIDE.dyn.eqStart+''==='1,3'&&g('xg10',2)[0].rng+''==='1,3','xg10 の高域は eqStart と一致')}
/* MX-12 */
{const L=get('xg11');ok(R.pad.hpf[0]===100&&g('xg11',1)[0].rng+''==='100,200','xg11 アルペジオのHPF目標が pad.hpf と違う');
 ok(R.lead.hpf[0]===150&&g('xg11',2)[0].rng+''==='150,250','xg11 リードのHPF目標が lead.hpf と違う');
 ok(R.hat.hpf[0]===300&&g('xg11',3)[0].rng+''==='300,500','xg11 ハットのHPF目標が hat.hpf と違う');
 ok(L.tk[2].o.p.o1Wave==='square'&&L.tk[3].o.p.o1Wave==='square'&&L.tk[1].o.p.o1Wave==='triangle','xg11: リード・アルペジオは矩形波、ベースは三角波')}
{const L=get('xg12');ok(L.tk.length===6&&L.steps.slice(1,4).every(s=>s.quiz),'xg12: 6トラック・聞き分けの3問');
 ok(L.steps.slice(1,4).map(s=>s.quiz.ans).join('')==='321','xg12: 正解の位置')}
console.log(err?('失敗 '+err+'件'):('OK: XGコース '+LS.length+'本(音量補正の範囲まで。聞こえ方は未確認)'));process.exit(err?1:0);
