// M/S EQ(M-6)のテスト: node test/msq.js  登録・既定・旧データ互換・配線(行列の厳密さ)・つまみの振り分け。耳・実機は未確認。
// 配線の検査は「偽ノードをつなぎ、DC の (L,R) を流して出力を計算する」小さな評価器で行う。フィルターは『ゲインだけ』の代用(周波数特性は見ない)。
const fs=require('fs'),path=require('path'),vm=require('vm'),JS=path.join(__dirname,'..','www','js');
let err=0;const ok=(c,m)=>{if(!c){console.error('NG: '+m);err++}};
const ctx={console,setTimeout,clearTimeout,Float32Array,Float64Array};ctx.window=ctx;vm.createContext(ctx);vm.runInContext('var SD={};',ctx);
['params.js','wtparams.js','mat.js','umat.js','swtparams.js','grparams.js','fmparams.js','addparams.js','modlib.js','mixdefs.js','fxnew.js','fxparams.js','fxdsp.js','fxworklets.js','bus.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(JS,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD;
/* ① 登録 */
const r=SD.FXR.find(q=>q.k==='ms');
ok(!!r&&r.name==='M/S EQ'&&r.on==='msOn'&&!r.wn&&!r.wk&&!r.heavy,'ラック登録: M/S EQ(ワークレットなし・heavy でない)');
ok(r&&r.ids.join()==='msOn,msMLo,msMMid,msMMidF,msMHi,msSHpf,msSLo,msSMid,msSMidF,msSHi','つまみの並び');
ok(SD.FXCHAIN.indexOf('ms')===SD.FXCHAIN.indexOf('sw')+1,'チェーン: sw(WIDTH)の次');
ok(SD.FXR.findIndex(q=>q.k==='ms')===SD.FXR.findIndex(q=>q.k==='sw')+1&&SD.FXR.slice(-2).map(q=>q.k).join()==='dl,rv','ラック: sw の次・DELAY/REVERB は最後のまま');
ok(SD.FXR.length<=SD.FXMAX&&SD.FXMAX===24,'最大数以内('+SD.FXR.length+'/'+SD.FXMAX+')');
ok(SD.FXCHAIN.every(k=>SD.FXR.some(q=>q.k===k))&&new Set(SD.FXCHAIN).size===SD.FXCHAIN.length,'チェーンとラックの対応・重複なし');
/* ② 既定=音が変わらない値・範囲・FXIDS(保存・読み込み)・旧データ */
const D=SD.defs.analog.byId;
r.ids.forEach(id=>ok(!!D[id]&&SD.FXIDS.indexOf(id)>=0&&SD.FXDEF[id]===D[id].def,id+': 定義・FXIDS・既定が揃う'));
ok(D.msOn.def===0,'既定は OFF(旧データは M/S EQ なしで読まれる)');
['msMLo','msMMid','msMHi','msSLo','msSMid','msSHi'].forEach(id=>ok(D[id].min===-12&&D[id].max===12&&D[id].def===0,id+': ±12dB・既定 0'));
ok(D.msSHpf.def===D.msSHpf.min&&D.msSHpf.min===10,'SIDE LOW CUT の既定は下限(10Hz=実質なし)');
ok(D.msMMidF.min===100&&D.msMMidF.max===10000&&D.msSMidF.def===2500,'FREQ の範囲');
['analog','wt','fm','add','gr','mod'].forEach(s=>ok(SD.defs[s]&&SD.defs[s].byId.msOn&&SD.defs[s].DEF.msOn===0,s+': 全エンジンに定義がある'));
/* 旧保存の並び(ms が無い)・既定と同じなら保存しない・ms を動かせる */
{const N=SD.fxOrdNorm,Dd=SD.FXCHAIN.slice(),old=Dd.filter(k=>k!=='ms');
 ok(N(old).join()===Dd.join(),'旧保存の並び(ms なし)は既定の位置(sw の次)に補われる');
 ok(SD.fxOrdSave(old)===null,'旧保存を読み直して既定と同じなら保存しない(null)');
 const custom=Dd.filter(k=>k!=='ms');custom.splice(custom.indexOf('gt'),0,'sw');const cu=custom.filter((k,i,a)=>a.indexOf(k)===i);
 const n2=N(cu);ok(n2.indexOf('ms')===n2.indexOf('sw')+1,'並べ替えた旧保存でも ms は sw の直後に補われる');
 const mv=SD.fxOrdMove(Dd,Dd.indexOf('ms'),-1);ok(mv.indexOf('ms')===Dd.indexOf('ms')-1,'▲で ms を前へ動かせる');
 ok(SD.fxOrdSave(mv)!==null&&SD.fxOrdSave(SD.fxOrdMove(mv,mv.indexOf('ms'),1))===null,'動かすと保存・戻すと保存しない')}
/* ③ 配線: 偽ノード+評価器 */
let nid=0;const P=v=>({value:v,setTargetAtTime(x){this.value=x},setValueAtTime(x){this.value=x}});
function node(kind){const n={kind,type:kind,id:++nid,conn:[],channelCount:2,channelCountMode:'max',connect(t,o,i){n.conn.push({to:t,o:o|0,i:i|0});return t},disconnect(){n.conn=[]}};
 n.gain=P(1);n.frequency=P(350);n.Q=P(1);return n}
const fx={sampleRate:48000,currentTime:0,createGain:()=>node('gain'),createBiquadFilter:()=>{const f=node('biquad');f.gain.value=0;return f},createChannelSplitter:()=>node('split'),createChannelMerger:()=>node('merge')};
const B=Object.create(SD.Bus.prototype);B.ctx=fx;B.p={};B.st={};
const S=B.mk_ms();B.st.ms=S;
/* つながっている先から逆引きして、出力 (L,R) を計算。biquad は 10^(gain/20) 倍の代用(HPF は1倍) */
const all=new Set();(function walk(n){if(all.has(n))return;all.add(n);n.conn.forEach(c=>walk(c.to))})(S.in);
function evalOut(l,r){const memo=new Map();
 const incoming=(t,idx)=>[...all].flatMap(n=>n.conn.filter(c=>c.to===t&&(idx===undefined||c.i===idx)).map(c=>({from:n,o:c.o})));
 const val=(n,o)=>{const key=n.id+':'+o;if(memo.has(key))return memo.get(key);let v;
  if(n===S.in){v=[l,r]}
  else if(n.kind==='split'){const s=incoming(n).map(e=>val(e.from,e.o))[0];v=s[o]}
  else if(n.kind==='merge'){v=[0,1].map(i=>incoming(n,i).reduce((a,e)=>a+val(e.from,e.o),0))}
  else{const ins=incoming(n).map(e=>val(e.from,e.o));
   const f=n.kind==='biquad'?(n.type==='highpass'?1:Math.pow(10,n.gain.value/20)):n.gain.value;
   if(n.channelCount===2&&n.kind==='gain'){v=[0,1].map(i=>f*ins.reduce((a,x)=>a+(Array.isArray(x)?x[i]:x),0))}else v=f*ins.reduce((a,x)=>a+(Array.isArray(x)?x[0]:x),0)}
  memo.set(key,v);return v};return val(S.out,0)}
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-9,m+' '+a+' ≠ '+b);
/* フィルターが全部 0dB なら入力と同じ(行列が厳密) */
[[1,1],[1,-1],[.3,-.8],[0,.5],[.7,0]].forEach(([l,rr])=>{const o=evalOut(l,rr);near(o[0],l,'再構成 L('+l+','+rr+')');near(o[1],rr,'再構成 R('+l+','+rr+')')});
/* Mid だけ +6dB(MID LOW): 同相(L=R)は +6dB・逆相(L=−R=Side)は変わらない */
const g6=Math.pow(10,6/20);
S.mLo.gain.value=6;{const m=evalOut(1,1),s=evalOut(1,-1);near(m[0],g6,'Mid +6: 同相 L');near(m[1],g6,'Mid +6: 同相 R');near(s[0],1,'Mid +6: Side は不変 L');near(s[1],-1,'Mid +6: Side は不変 R')}
S.mLo.gain.value=0;
/* Side だけ +6dB(SIDE HIGH): 逆相は +6dB・同相は変わらない。左右の向きも保たれる */
S.sHi.gain.value=6;{const m=evalOut(1,1),s=evalOut(1,-1),t=evalOut(1,0);near(m[0],1,'Side +6: Mid は不変 L');near(m[1],1,'Side +6: Mid は不変 R');near(s[0],g6,'Side +6: L');near(s[1],-g6,'Side +6: R');
 /* L だけ: M=.5・S=.5 → L=.5+.5*g6・R=.5−.5*g6(Side が増えると R は減る=広がる) */
 near(t[0],.5+.5*g6,'Side +6: L だけの入力 L');near(t[1],.5-.5*g6,'Side +6: L だけの入力 R')}
S.sHi.gain.value=0;
/* Side を全部消すと(−∞ の代用で gain 0)モノになる: L=R=(L+R)/2 */
{const keep=S.sHi.gain.value;S.sHi.gain.value=-400;const o=evalOut(1,-.5);near(o[0],.25,'Side 消去: L=(L+R)/2');near(o[1],.25,'Side 消去: R=(L+R)/2');S.sHi.gain.value=keep}
/* 各フィルターは正しい経路(M か S)にある: 他方の信号が通る経路に入っていない */
{const chk=(node,path)=>ok(node&&node.kind==='biquad','経路: '+path+' が biquad');chk(S.mLo,'mLo');chk(S.mMid,'mMid');chk(S.mHi,'mHi');chk(S.sHp,'sHp');chk(S.sLo,'sLo');chk(S.sMid,'sMid');chk(S.sHi,'sHi');
 const names=['mLo','mMid','mHi','sLo','sMid','sHi'];names.forEach(k=>{S[k].gain.value=6;const m=evalOut(1,1),s=evalOut(1,-1);const isM=k[0]==='m';
  ok(Math.abs(m[0]-(isM?g6:1))<1e-9&&Math.abs(s[0]-(isM?1:g6))<1e-9,k+': '+(isM?'Mid':'Side')+' の経路にだけ効く');S[k].gain.value=0})}
ok(S.sHp.kind==='biquad'&&S.sHp.type==='highpass'&&S.mLo.type==='lowshelf'&&S.mMid.type==='peaking'&&S.mHi.type==='highshelf'&&S.in.channelCount===2&&S.out.channelCount===2,'入口・出口は2ch');
/* ④ つまみ → ノード(up) */
{const B2=Object.create(SD.Bus.prototype);B2.ctx=fx;B2.st={ms:B.mk_ms.call(B2)};B2.p={};const set=(id,v)=>{B2.p[id]=v;B2.up(id)},m=B2.st.ms;
 set('msMLo',3);set('msMMid',-4);set('msMMidF',2000);set('msMHi',5);set('msSHpf',120);set('msSLo',-2);set('msSMid',6);set('msSMidF',4000);set('msSHi',9);
 ok(m.mLo.gain.value===3&&m.mMid.gain.value===-4&&m.mMid.frequency.value===2000&&m.mHi.gain.value===5,'up: Mid 側のつまみ');
 ok(m.sHp.frequency.value===120&&m.sLo.gain.value===-2&&m.sMid.gain.value===6&&m.sMid.frequency.value===4000&&m.sHi.gain.value===9,'up: Side 側のつまみ');
 set('msOn',1);set('msOn',0);ok(true,'msOn は up で落ちない');
 const B3=Object.create(SD.Bus.prototype);B3.ctx=fx;B3.st={};B3.p={};ok((()=>{try{B3.up('msMLo');return true}catch(e){return false}})(),'ステージが無いとき up は何もしない')}
/* ⑤ act: ONのときだけ作る(ワークレット非対応でも使える) */
{const A=Object.create(SD.Bus.prototype);A.p={msOn:0};A.wkOK=false;ok(A.act('ms')===false,'act: OFF');A.p.msOn=1;ok(A.act('ms')===true,'act: ON(ワークレットなしでも)');
 ok(typeof SD.Bus.prototype.mk_ms==='function','mk_ms がある')}
/* ⑥ 既存を壊さない: sw の act はワークレット必須のまま・他の項目の act は変わらない */
{const A=Object.create(SD.Bus.prototype);A.p={swOn:1,mbOn:1};A.wkOK=false;ok(A.act('sw')===false&&A.act('mb')===false,'sw・mb はワークレットが無ければ OFF のまま');A.wkOK=true;ok(A.act('sw')&&A.act('mb'),'ワークレットがあれば ON')}
if(err){console.error(err+'件NG');process.exit(1)}console.log('msq OK');
