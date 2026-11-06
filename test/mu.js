// MU・AL の基盤検査(MU-1): node test/mu.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');['muh.js','mu.js','mu2.js','al.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
// 既存は不変(キー・並び・値)
const OLD=['major','minor','penta','blues','chrom'];
ok(Object.keys(SD.SCALES).slice(0,5).join()===OLD.join(),'既存5スケールの並び');
ok(SD.SCALES.major.join()==='0,2,4,5,7,9,11'&&SD.SCALES.minor.join()==='0,2,3,5,7,8,10'&&SD.SCALES.penta.join()==='0,2,4,7,9'&&SD.SCALES.blues.join()==='0,3,5,6,7,10','既存スケールの値');
ok(SD.SCALE_NAMES.slice(0,5).map(x=>x[0]).join()===OLD.join(),'既存SCALE_NAMESの並び');
ok(SD.SCALES.aeolian===undefined&&SD.SCALES.ionian===undefined,'aeolian/ionian は作らない');
ok(SD.CHORDS.slice(0,10).map(c=>c.id).join()==='maj,min,7,maj7,m7,sus2,sus4,pow,dim,add9','既存10和音の並び');
ok(SD.chordNotes(48,'maj',0).join()==='48,52,55'&&SD.chordNotes(48,'add9',0).join()==='48,52,55,62','既存和音の発音');
// スケール: 名前表と一致・度数表記→半音
ok(Object.keys(SD.SCALES).sort().join()===SD.SCALE_NAMES.map(x=>x[0]).sort().join(),'SCALES と SCALE_NAMES の一致');
{const B={1:0,2:2,3:4,4:5,5:7,6:9,7:11};Object.keys(SD.SCALES).forEach(k=>{if(k==='chrom')return;const d=SD.SCALE_DEG[k];if(!d){bad('度数表記なし '+k);return}
 const v=d.split(' ').map(t=>{let a=0,x=t;while(/^[♭♯]/.test(x)){a+=x[0]==='♭'?-1:1;x=x.slice(1)}return B[+x]+a});
 ok(v.join()===SD.SCALES[k].join(),'度数と半音が不一致 '+k+' '+v.join()+' / '+SD.SCALES[k].join());
 ok(SD.SCALES[k].every((x,i,a)=>x>=0&&x<12&&(!i||x>a[i-1])),'昇順・0〜11 '+k)})}
// 和音: 4音以内・根音0始まり・昇順・重複なし・id重複なし
{const ids=new Set();SD.CHORDS.forEach(c=>{ok(!ids.has(c.id),'和音ID重複 '+c.id);ids.add(c.id);ok(c.iv.length>=3&&c.iv.length<=4&&c.iv[0]===0&&c.iv.every((x,i,a)=>!i||x>a[i-1]),'和音の形 '+c.id);ok(c.sym!==undefined&&c.name,'和音の表示 '+c.id);
 for(let i=0;i<c.iv.length;i++){const n=SD.chordNotes(60,c.id,i);ok(n.length===c.iv.length&&n.every(x=>x>=SD.NMIN&&x<=SD.NMAX),'chordNotes範囲 '+c.id+i)}});
 const J=(r,t)=>SD.chordNotes(r,t,0).join();
 ok(J(60,'m7b5')==='60,63,66,70'&&J(60,'dim7')==='60,63,66,69'&&J(60,'aug')==='60,64,68'&&J(60,'6')==='60,64,67,69'&&J(60,'m6')==='60,63,67,69','追加和音の構成');
 ok(J(60,'9')==='60,64,70,74'&&J(60,'m9')==='60,63,70,74'&&J(60,'maj9')==='60,64,71,74','9th系(5度省略)');
 ok(SD.chordName(60,'m7b5',0)==='Cm7b5'&&SD.chordName(60,'maj9',0)==='CM9','和音名');
 ok(SD.cleanStep({on:true,n:60,ch:SD.chordNotes(60,'9',0),cd:{t:'9',i:0}}).cd.t==='9','追加和音の cleanStep 保持')}
// SD.snap/inScale が新スケールで動く
ok(SD.inScale(62,0,'dorian')&&!SD.inScale(64,0,'dorian')&&SD.snap(64,0,'mpent')===63,'新スケールの inScale/snap');
// muh
const H=SD.MUH;ok(H&&['mel','chd','steps4','scl','prog','lick'].every(k=>H[k]),'SD.MUH の公開');
const chk=(t,w)=>{ok(t&&t.id==='bass'&&t.o&&SD.SCALES[t.o.scale],w+' 形');Object.keys(t.idx).forEach(i=>{ok(+i>=0&&+i<16,w+' ステップ範囲 '+i);const n=60+(t.o.key|0)+t.idx[i];ok(n>=SD.NMIN&&n<=SD.NMAX,w+' 音域 '+n)});(t.o.tie||[]).forEach(i=>ok(t.idx[i]!==undefined&&+i>0,w+' tie'))};
{const a=H.mel('x','major',[0,2,4,5,7,9,11,12]);ok(a.o.tr===24&&a.o.key===0&&a.idx[0]===0&&a.idx[14]===12,'mel は th.js と同形(key省略=従来)');chk(a,'mel');
 const b=H.mel('x','major',[0,2],7);ok(b.o.tr===31&&b.o.key===7,'mel の key');
 ok(JSON.stringify(H.chd('c',[[0,'maj'],[7,'maj']],[0,8],4).idx)===JSON.stringify({0:0,1:0,2:0,3:0,8:7,9:7,10:7,11:7}),'chd のidx');
 const c=H.chd('c',[[0,'maj'],[5,'min']],[0,8],8);ok(c.o.cd[8].t==='min'&&c.o.tie.length===14&&c.o.tr===24,'chd の cd/tie');chk(c,'chd');
 SD.SCALE_NAMES.forEach(([k])=>{['up','updown'].forEach(d=>{const s=H.scl(k,5,d,'s');chk(s,'scl '+k+d);ok(s.o.key===5&&s.o.scale===k,'scl key/scale '+k)})});
 const s7=H.scl('major',0);ok(Object.keys(s7.idx).length===8&&s7.idx[14]===12,'scl 上昇=2ステップ刻み8音');
 const ud=H.scl('major',0,'updown');ok(Object.keys(ud.idx).length===15&&ud.idx[7]===12&&ud.idx[14]===0,'scl updown');
 ok(H.scl('nothing',0)===null,'scl 未知は null');
 const p=H.prog([[0,'maj'],[5,'maj'],[7,'7'],[0,'maj']],null,4,{sc:'major',key:2});chk(p,'prog');ok(p.o.cd[12].t==='maj'&&p.o.cd[8].t==='7'&&p.o.key===2,'prog 既定の at');
 const l=H.lick([[0,2,3],[4,1,0],[20,1,5],[-1,1,1]],9);chk(l,'lick');ok(l.idx[1]===3&&l.o.tie.join()==='1'&&l.idx[20]===undefined&&l.idx[4]===0&&l.o.key===9,'lick 変換・範囲外は捨てる')}
// th.js は変えない(mel/chd は th.js の内部のまま)
ok(!/SD\.MUH/.test(fs.readFileSync(path.join(w,'th.js'),'utf8')),'th.js が SD.MUH を使っていない');
ok(!/SD\.METER/.test(fs.readFileSync(path.join(w,'muh.js'),'utf8')),'muh.js は SD.METER に依存しない');
// kitTrack の o.key(app.js のソース検査)。o.key なし=従来(minor のときだけ音から)
{const a=fs.readFileSync(path.join(w,'app.js'),'utf8');ok(/key:o\.key!=null\?[^:]+:o\.scale==='minor'\?\(\(n%12\)\+12\)%12:0,/.test(a),'kitTrack: o.key 優先・なければ従来')}
// コース枠と MU/AL のレッスン検査(MU-2 以降のレッスンに適用。いまは0本でも通る)
ok(SD.CATS.some(c=>c.id==='mu1'&&c.course==='MU'&&c.chapter==='course')&&SD.CATS.some(c=>c.id==='al1'&&c.course==='AL'&&c.chapter==='course'),'コース枠 mu1/al1');
{const LI=new Set(SD.LESSONS.map(l=>l.id)),T=SD.TERMS,tn=new Set(T.map(t=>t.name));
 const ls=SD.LESSONS.filter(l=>l.course==='MU'||l.course==='AL');
 ls.forEach(L=>{const w=L.id+' ',n=+L.id.slice(2),m2=L.course==='MU'&&L.cat==='mu2',a2=L.course==='AL'&&L.cat==='al2';ok(m2?(L.lv===3&&/^mu\d\d$/.test(L.id)&&n>=17&&n<=35):a2?(L.lv===3&&n>=14&&n<=30):(L.cat===(L.course==='MU'?'mu1':'al1')&&L.lv===(L.course==='MU'?2:3)),w+'cat/lv');ok(new RegExp('^'+(L.course==='MU'?'(mu|mf)':'al')+'\\d\\d$').test(L.id),w+'ID形式');
  ok(L.steps.length>=5&&L.steps.length<=8,w+'ステップは5〜8('+L.steps.length+')');ok(L.steps.some(s=>s.cmp),w+'cmp');
  (L.pre||[]).forEach(i=>ok(LI.has(i),w+'pre '+i));
  L.steps.forEach((s,i)=>{const x=s.h+s.b+[].concat(s.col||[]).map(c=>c.h+c.b).join('');ok(s.b.length<=170,w+'step'+(i+1)+' bが長い '+s.b.length);ok(!/(19|20)\d\d/.test(x),w+'step'+(i+1)+' 年号');
   if(s.quiz)ok(s.cmp&&s.quiz.ans>=1&&s.quiz.ans<=s.cmp.length,w+'quiz')})});
 console.log('MU/AL レッスン '+ls.length+'本')}
/* MU-3: muh.chd の転回指定(省略=0) */
(function(){var a=SD.MUH.chd('t',[[0,'maj',1],[0,'maj']],[0,8],8);ok(a.o.cd[0].i===1&&a.o.cd[8].i===0,'muh.chd 転回')})();
/* MU-5: 用語集との整合(レッスンの terms ⇔ 用語の see。mu_/al_ の用語はすべてどこかのレッスンから参照される) */
{const ls=SD.LESSONS.filter(l=>l.course==='MU'||l.course==='AL');
 ls.forEach(L=>L.terms.forEach(t=>{const T=SD.TERMS.find(x=>x.id===t);ok(T&&T.see.indexOf(L.id)>=0,L.id+' の用語 '+t+' の see に無い')}));
 SD.TERMS.filter(t=>/^(mu_|al_)/.test(t.id)).forEach(t=>{ok(t.see.length>0,t.id+' see空');t.see.forEach(i=>{const L=SD.LESSONS.find(x=>x.id===i);ok(L&&L.terms.indexOf(t.id)>=0,t.id+' の see '+i+' が相互参照でない')})});
 ok(ls.filter(l=>l.cat==='mu1'&&l.id.slice(0,2)==='mu').length===16&&ls.filter(l=>l.id.slice(0,2)==='mf').length===3&&ls.filter(l=>l.course==='AL'&&l.cat==='al1').length===13,'MU16本・mf3本・AL13本(mu1/al1)');ok(ls.filter(l=>l.cat==='mu2').length<=19,'mu2 は19本まで');ok(ls.filter(l=>l.cat==='al2').length<=17,'al2 は17本まで');ok(SD.CATS.some(c=>c.id==='al2'&&c.course==='AL'&&c.chapter==='course')&&SD.AL2&&SD.AL2.L,'al2 のコース枠')}
/* TH2-0: 応用スケール・和音・mu2 の枠 */
{const NEW=['phrygian_dom','lydian_dom','altered','whole_tone','dim_wh','dim_hw','bebop_dom','bebop_maj','bebop_dor','m7b5_pent','dom_pent','hirajoshi','in_scale','insen','iwato','kumoi','ritsu','ryukyu'];
 ok(Object.keys(SD.SCALES).slice(0,13).join()==='major,minor,penta,blues,chrom,dorian,phrygian,lydian,mixolydian,locrian,harmonic,melodic,mpent','既存13スケールの並び');
 ok(Object.keys(SD.SCALES).slice(13).join()===NEW.join()&&SD.SCALE_NAMES.slice(13).map(x=>x[0]).join()===NEW.join(),'応用スケール18種の並び');
 ok(NEW.every(k=>SD.SCALE_LESSON[k])&&Object.keys(SD.SCALE_LESSON).length===18&&!SD.SCALE_LESSON.dorian,'SCALE_LESSON は応用18種だけ(画面に出さない)');
 const J=k=>SD.SCALES[k].join();ok(J('altered')==='0,1,3,4,6,8,10'&&J('whole_tone')==='0,2,4,6,8,10'&&J('phrygian_dom')==='0,1,4,5,7,8,10'&&J('lydian_dom')==='0,2,4,6,7,9,10','応用スケールの値');
 ok(J('dim_wh')==='0,2,3,5,6,8,9,11'&&J('dim_hw')==='0,1,3,4,6,7,9,10','ディミニッシュ2種(全半・半全)');
 /* 構造: ペンタ5音・ヘキサ6音・ヘプタ7音・ビバップとディミニッシュは8音 */
 ok(['m7b5_pent','dom_pent','hirajoshi','in_scale','insen','iwato','kumoi','ritsu','ryukyu'].every(k=>SD.SCALES[k].length===5)&&SD.SCALES.whole_tone.length===6&&['bebop_dom','bebop_maj','bebop_dor','dim_wh','dim_hw'].every(k=>SD.SCALES[k].length===8),'音数');
 /* 全音階どうしの関係: オルタードはメロディックマイナーの7番目のモード(半音上の長調の主音から)・リディアンドミナントは4番目 */
 const rot=(S,i)=>S.slice(i).concat(S.slice(0,i).map(x=>x+12)).map(x=>x-S[i]).join();
 ok(rot(SD.SCALES.melodic,6)===J('altered')&&rot(SD.SCALES.melodic,3)===J('lydian_dom')&&rot(SD.SCALES.harmonic,4)===J('phrygian_dom'),'オルタード=メロディックの7番目・リディアンDom=4番目・フリジアンDom=ハーモニックの5番目');
 ok(rot(SD.SCALES.dim_wh,1)===J('dim_hw'),'dim_hw は dim_wh の2番目から');
 ok(SD.snap(61,0,'whole_tone')!==61&&SD.inScale(66,0,'altered'),'応用スケールの snap/inScale');
 const D=SD.CHORDS.slice(18).map(c=>c.id).join();ok(D==='7sus4,7b5,7b9,7s9,7s11,7b13,maj7s11,mM7,69','追加和音9種の並び');
 const C=(t)=>SD.chordNotes(60,t,0).join();ok(C('7sus4')==='60,65,67,70'&&C('7b9')==='60,64,70,73'&&C('7s9')==='60,64,70,75'&&C('7s11')==='60,64,70,78'&&C('mM7')==='60,63,67,71'&&C('69')==='60,64,69,74'&&C('7b5')==='60,64,66,70','追加和音の発音');
 ok(SD.chordName(60,'7s9',0)==='C7#9'&&SD.chordName(60,'maj7s11',0)==='CM7#11','追加和音の名前');
 ok(SD.CHORDS.slice(0,18).map(c=>c.id).join()==='maj,min,7,maj7,m7,sus2,sus4,pow,dim,add9,m7b5,dim7,aug,6,m6,9,m9,maj9','既存18和音の並び');
 ok(SD.CATS.some(c=>c.id==='mu2'&&c.course==='MU'&&c.chapter==='course')&&SD.MU2&&SD.MU2.L,'mu2 のコース枠');
 /* 画面: スケール選択は SD.SCALE_LESSON を除く(app.js のソース検査) */
 ok(/SD\.SCALE_NAMES\.filter\(\(\[v\]\)=>!SD\.SCALE_LESSON\[v\]/.test(fs.readFileSync(path.join(w,'app.js'),'utf8')),'pickscale は応用スケールを出さない')}
console.log(err?'失敗 '+err+'件':'OK: MU/AL 基盤(スケール'+Object.keys(SD.SCALES).length+'・和音'+SD.CHORDS.length+'・MUH)');process.exit(err?1:0);
