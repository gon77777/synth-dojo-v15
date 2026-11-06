// mt 目標の拡張(M-5)のテスト: node test/lmgoal.js  合成信号のみ。他の測定器との照合は未確認。
// 検査: MT の表(名前・単位)・chipText・MixGoal.check の m ごとの範囲・既存4種の不変・合成信号の測定値で『初期は未達成・整えると達成』・app.js の配線(静的)
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);vm.runInContext('var SD={};',ctx);
const J=f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..','www','js',f),'utf8'),ctx,{filename:f});
['mixdefs.js','loud.js'].forEach(J);
const SD=ctx.SD,G=SD.MixGoal,L=SD.LOUD;let err=0;const bad=m=>{console.error('NG: '+m);err++};const ok=(c,m)=>{if(!c)bad(m)};
const A=db=>Math.pow(10,db/20);
/* ---- 表と文言 ---- */
const LM=['lufsM','lufsS','lufsI','tp','plr','corr','bal','mdiff'];
ok(JSON.stringify(LM)===JSON.stringify(L.KEYS),'SD.LOUD.KEYS と MixGoal.MT の lm が一致しない');
LM.forEach(m=>{const t=G.MT[m];ok(t&&t.lm===1&&t.n&&typeof t.u==='string'&&t.lo<t.hi,m+' の MT の定義が不足')});
ok(Object.keys(G.MT).filter(m=>G.MT[m].lm).length===LM.length,'lm の m が KEYS と違う');
/* 既存4種は従来どおり(名前と dB・ovl は単位なし) */
ok(G.chipText({trk:1,m:'peak',rng:[-6,0],hold:2})==='T1 PEAK -6〜0 dB を2秒','peak の文言が変わった: '+G.chipText({trk:1,m:'peak',rng:[-6,0],hold:2}));
ok(G.chipText({trk:'M',m:'rms',rng:[-20,-10],hold:1})==='MASTER RMS(目安) -20〜-10 dB を1秒','rms の文言');
ok(G.chipText({trk:3,m:'gr',rng:[2,6],hold:3})==='T3 GR 2〜6 dB を3秒','gr の文言');
ok(G.chipText({trk:2,m:'ovl',rng:[0,30],hold:2})==='T2 ぶつかり度 0〜30 を2秒','ovl は単位なし');
/* 新しい m: 単位が m ごとに出る */
const T=[['lufsS',[-15,-13],'MASTER LUFS-S -15〜-13 LUFS を3秒'],['lufsM',[-16,-12],'MASTER LUFS-M -16〜-12 LUFS を3秒'],['lufsI',[-15,-13],'MASTER LUFS-I -15〜-13 LUFS を3秒'],
 ['tp',[-60,-1],'MASTER TP(近似) -60〜-1 dBTP を3秒'],['plr',[8,14],'MASTER PLR 8〜14 LU を3秒'],['corr',[.5,1],'MASTER 位相相関 0.5〜1 を3秒'],
 ['bal',[0,1],'MASTER LRバランス(差) 0〜1 dB を3秒'],['mdiff',[0,1],'MASTER モノ差 0〜1 LU を3秒']];
T.forEach(([m,r,s])=>{const c=G.chipText({trk:'M',m,rng:r,hold:3});ok(c===s,m+' の文言 '+c)});
/* ---- MixGoal.check ---- */
const mk=mt=>({id:'zz',steps:[{h:'x',b:'y',mt:[].concat(mt)}]});
const chk=mt=>G.check(mk(mt));
LM.forEach(m=>{const t=G.MT[m],mid=[t.lo+(t.hi-t.lo)*.25,t.lo+(t.hi-t.lo)*.5];
 ok(chk({trk:'M',m,rng:mid,hold:2}).length===0,m+': 正しい定義が通らない '+chk({trk:'M',m,rng:mid,hold:2}).join());
 ok(chk({trk:1,m,rng:mid,hold:2}).length>0,m+': トラック指定が通ってしまう');
 ok(chk({trk:'M',m,rng:[t.lo-1,t.lo+1],hold:2}).length>0,m+': 下限の外が通ってしまう');
 ok(chk({trk:'M',m,rng:[t.hi-1,t.hi+1],hold:2}).length>0,m+': 上限の外が通ってしまう');
 ok(chk({trk:'M',m,rng:[mid[1],mid[0]],hold:2}).length>0,m+': 逆順の範囲が通ってしまう');
 ok(chk({trk:'M',m,rng:mid,hold:31}).length>0,m+': hold 31秒が通ってしまう');
 ok(chk({trk:'M',m,rng:[t.lo,t.hi],hold:0}).length===0,m+': 範囲いっぱいは通る')});
ok(chk({trk:'M',m:'lufs',rng:[-15,-13],hold:1}).length>0,'不明な m が通ってしまう');
/* 既存の型の検査は不変 */
ok(chk({trk:1,m:'peak',rng:[-12,-3],hold:2}).length===0&&chk({trk:'M',m:'rms',rng:[-30,0],hold:1}).length===0,'peak/rms が通らない');
ok(chk({trk:'M',m:'gr',rng:[1,6],hold:1}).length>0&&chk({trk:'M',m:'ovl',rng:[0,50],hold:1}).length>0,'gr/ovl の master 禁止が変わった');
ok(chk({trk:2,m:'ovl',rng:[0,101],hold:1}).length>0,'ovl の 0〜100 が変わった');
/* ---- 合成信号の測定値から: 判定ループと同じ手順(100msごとに pick → inRange → hold)で達成を確かめる ---- */
function met(gen,sec,g,fsr){fsr=fsr||48000;const st=L.acc(),h={ok:0,bad:0};let got=false,first=null,i=0;
 const N=Math.round(fsr*sec),l=new Float32Array(N),r=new Float32Array(N);for(let k=0;k<N;k++){const v=gen(k,fsr);l[k]=v[0];r[k]=v[1]}
 const f=L.Front(fsr,fr=>{L.push(st,fr,fsr);i++;const v=L.pick(st,g.m);if(G.hold(h,G.inRange(v,g.rng),.1,g.hold)&&!got){got=true;first=i*.1}});f.process(l,r);return got}
const sn=(hz,amp,ph)=>(i,fs)=>{const v=amp*Math.sin(2*Math.PI*hz*i/fs+(ph||0));return[v,v]};
const goal=(m,rng,hold)=>({trk:'M',m,rng,hold:hold==null?2:hold});
/* LUFS: 1kHz 両ch −23 dBFS = −23 LUFS(M-1 の検査と同じ)。範囲が合えば達成・外れなら未達成 */
const s23=sn(1000,A(-23));
['lufsM','lufsS','lufsI'].forEach(m=>{ok(met(s23,8,goal(m,[-24,-22]))===true,m+': −23 LUFS で [-24,-22] が達成されない');ok(met(s23,8,goal(m,[-16,-12]))===false,m+': −23 LUFS で [-16,-12] が達成されてしまう')});
ok(met(sn(1000,A(-14)),8,goal('lufsS',[-15,-13]))===true,'−14 dBFS で lufsS [-15,-13] が達成されない');
/* TP(近似): fs/4 の正弦波 45° → 真のピークは約0 dBTP・サンプルピークは約0.707(−3 dB) */
ok(met(sn(12000,1,Math.PI/4),5,goal('tp',[-1,1]))===true,'tp: 約0 dBTP が [-1,1] に入らない');
ok(met(sn(12000,1,Math.PI/4),5,goal('tp',[-60,-2]))===false,'tp: 0 dBTP が [-60,-2] に入ってしまう');
/* PLR = TP − LUFS-I。−23 dBFS の1kHz: TP≈−23 dBTP・I=−23 LUFS → 約0 LU */
ok(met(s23,8,goal('plr',[-0.5,1]))===true,'plr: 正弦波(TP≈I)が [-0.5,1] に入らない');
ok(met(s23,8,goal('plr',[6,12]))===false,'plr: 正弦波が [6,12] に入ってしまう');
/* 位相相関: 同じ=+1・逆相=−1 */
ok(met(s23,5,goal('corr',[.9,1]))===true,'corr: 同じ信号が [0.9,1] に入らない');
ok(met((i,fs)=>{const v=A(-23)*Math.sin(2*Math.PI*1000*i/fs);return[v,-v]},5,goal('corr',[.9,1]))===false,'corr: 逆相が [0.9,1] に入ってしまう');
ok(met((i,fs)=>{const v=A(-23)*Math.sin(2*Math.PI*1000*i/fs);return[v,-v]},5,goal('corr',[-1,-.9]))===true,'corr: 逆相が [-1,-0.9] に入らない');
/* バランス: 片ch −6 dB → |L−R| = 6.0 */
const bal6=(i,fs)=>{const v=.3*Math.sin(2*Math.PI*1000*i/fs);return[v,v*A(-6)]};
ok(met(bal6,5,goal('bal',[5.5,6.5]))===true,'bal: 6 dB が [5.5,6.5] に入らない');
ok(met(bal6,5,goal('bal',[0,1]))===false,'bal: 6 dB が [0,1] に入ってしまう');
const bal6r=(i,fs)=>{const v=.3*Math.sin(2*Math.PI*1000*i/fs);return[v*A(-6),v]};
ok(met(bal6r,5,goal('bal',[5.5,6.5]))===true,'bal: R が大きい側でも絶対値で 6 dB');
/* モノ差: 同相=0・逆相=大きく下がる(下限 −70 LUFS まで) */
ok(met(s23,5,goal('mdiff',[0,.5]))===true,'mdiff: 同相が [0,0.5] に入らない');
const anti=(i,fs)=>{const v=A(-23)*Math.sin(2*Math.PI*1000*i/fs);return[v,-v]};
ok(met(anti,5,goal('mdiff',[0,.5]))===false,'mdiff: 逆相が [0,0.5] に入ってしまう');
ok(met(anti,5,goal('mdiff',[20,48]))===true,'mdiff: 逆相が [20,48] に入らない');
/* 「初期状態では未達成・直すと達成」: 大きすぎる(−8)→ lufsS [-15,-13] は未達成、−14 に下げると達成 */
ok(met(sn(1000,A(-8)),8,goal('lufsS',[-15,-13]))===false&&met(sn(1000,A(-14)),8,goal('lufsS',[-15,-13]))===true,'lufsS: 初期は未達成・直すと達成にならない');
/* hold: 値が出る前(最初の400ms)や短すぎる再生では達成にならない・無音(null)も未達成 */
ok(met(s23,.3,goal('lufsM',[-24,-22],.1))===false,'lufsM: 400ms 未満で達成してしまう');
ok(met(()=>[0,0],6,goal('lufsS',[-70,0],1))===false,'無音(−∞=null)が達成してしまう');
ok(met(()=>[0,0],6,goal('corr',[-1,1],1))===false,'無音の相関(null)が達成してしまう');
/* ---- 既存レッスンの mt は従来の4種だけ(今回は既存のレッスンを変えない)・app.js の配線(静的) ---- */
const dir=path.join(__dirname,'..','www','js'),old=['peak','rms','gr','ovl'];
fs.readdirSync(dir).filter(f=>/\.js$/.test(f)&&f!=='mixdefs.js'&&f!=='loud.js'&&f!=='app.js'&&f!=='lm.js').forEach(f=>{const t=fs.readFileSync(path.join(dir,f),'utf8');const re=/\bm:'(\w+)'/g;let x;
 if(/mt:\[/.test(t))while((x=re.exec(t)))if(LM.indexOf(x[1])>=0)bad(f+': 既存のファイルが新しい m を使っている(使ってよいのは lm.js だけ) '+x[1])});
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
ok(/MixGoal\.chipText\(g\)/.test(app),'app.js のチップが chipText を使っていない');
ok(!/g\.m==='ovl'\?'':' dB'/.test(app),'app.js に dB 固定の単位が残っている');
ok(/SD\.LOUD\.pick\(B\.lmState\(\),g\.m\)/.test(app)&&/B\.lmOk&&B\.lmOk\(\)/.test(app),'app.js の判定が pick(lmState) と lmOk を使っていない');
ok(/SD\.bus\.lmReset\(\)/.test(app),'app.js のステップ開始時の lmReset が無い');
ok(/SD\.MixGoal\.hold\(S\.mtSt\[i\]/.test(app),'既存の hold 判定が消えた');
if(err){console.error(err+'件NG');process.exit(1)}console.log('lmgoal OK');
