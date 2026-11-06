// 計測の配線(M-3)のテスト: node test/lmbus.js  偽のAudioContextでつなぎ方・付け外し・値の読み出しを検査
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={console,setTimeout,clearTimeout};ctx.window=ctx;vm.createContext(ctx);vm.runInContext('var SD={};',ctx);
const L=f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..','www','js',f),'utf8'),ctx,{filename:f});
let nid=0;
function node(type){const n={type,kind:type,id:++nid,out:[],channelCount:2,channelCountMode:'max',connect(t){n.out.push(t);return t},disconnect(t){n.out=t?n.out.filter(q=>q!==t):[]},start(){}};
 const P=v=>({value:v,setTargetAtTime(x){this.value=x},setValueAtTime(x){this.value=x}});
 n.gain=P(1);n.pan=P(0);n.Q=P(1);n.delayTime=P(0);n.frequency=P(350);n.threshold=P(0);n.knee=P(0);n.ratio=P(0);n.attack=P(0);n.release=P(0);return n}
class AC{constructor(){this.audioWorklet=AC.noWk?undefined:{addModule:()=>Promise.resolve()};this.currentTime=0;this.sampleRate=48000;this.state='running';this.destination=node('dest')}
 resume(){}createGain(){return node('gain')}createWaveShaper(){return node('shaper')}createDelay(){return node('delay')}createBiquadFilter(){return node('biquad')}createConvolver(){return node('conv')}createDynamicsCompressor(){return node('dyn')}
 createAnalyser(){const a=node('an');a.fftSize=1024;a.frequencyBinCount=512;a.getFloatTimeDomainData=b=>b.fill(0);a.getFloatFrequencyData=b=>b.fill(-90);return a}createStereoPanner(){return node('pan')}createChannelMerger(){return node('merger')}createBuffer(c,l){const d=[new Float32Array(l),new Float32Array(l)];return{len:l,getChannelData:i=>d[i]}}}
class AWN{constructor(x,name,opt){this.kind=name;this.out=[];this.connect=q=>{this.out.push(q);return q};this.disconnect=t=>{this.out=t?this.out.filter(q=>q!==t):[]};this.name=name;this.opt=opt;this.par={};this.parameters={get:k=>this.par[k]||(this.par[k]={value:0,setTargetAtTime(v){this.value=v}})};this.port={onmessage:null,sent:[],postMessage(m){this.sent.push(m)}}}}
ctx.AudioWorkletNode=AWN;ctx.Blob=class{constructor(a){this.a=a}};ctx.URL={createObjectURL:()=>'blob:x'};ctx.AudioContext=AC;
['mixdefs.js','fxdsp.js','fxworklets.js','loud.js','bus.js','seq.js'].forEach(L);
const SD=ctx.SD;let err=0;const ok=(c,m)=>{if(!c){console.error('NG: '+m);err++}};
const frame=(l)=>({kl:l,kr:l,km:l,ll:l,rr:l,lr:l,sp:.5,tp:.5});
(async()=>{
 /* 付ける: lim の出力から sd-meter、無音(ゲイン0)経由で destination。既存の分岐は変わらない */
 const B=new SD.Bus();B.init();await B.wkP;
 const before=B.n.lim.out.slice();
 ok(B.n.lim.name==='sd-limiter','前提: リミッターはワークレット');
 ok(B.lmW==null&&!B.lmOk(),'meterOn 前は付いていない');
 B.meterOn(true);
 ok(B.lmW&&B.lmW.name==='sd-meter'&&B.lmOk(),'meterOn(true) で sd-meter が付く');
 ok(B.n.lim.out.includes(B.lmW),'測定点は n.lim の出力');
 ok(before.every(q=>B.n.lim.out.includes(q))&&B.n.lim.out.length===before.length+1,'既存の接続(cmpG・an)は変わらず1本増えるだけ');
 ok(B.lmW.out.length===1&&B.lmW.out[0]===B.lmG&&B.lmG.gain.value===0&&B.lmG.out[0]===B.ctx.destination,'sd-meter→ゲイン0→destination');
 ok(!B.n.out.out.includes(B.lmW)&&!B.n.comp.out.includes(B.lmW),'comp・out には付けない(モニター・cmpG の後でもない)');
 ok(B.lmW.opt&&B.lmW.opt.numberOfOutputs===1&&B.lmW.opt.outputChannelCount[0]===2,'出力を持つ2ch');
 /* 値: フレームを流すと読める */
 const z=Math.pow(10,(-23+.691)/10)/2;
 ok(B.lmRead()&&B.lmRead().lufsM==null,'フレームが来る前は値なし');
 for(let i=0;i<40;i++)B.lmW.port.onmessage({data:frame(z)});
 let r=B.lmRead();ok(r&&Math.abs(r.lufsM+23)<.01&&Math.abs(r.lufsS+23)<.01&&Math.abs(r.lufsI+23)<.01,'−23 LUFS 相当のフレームで M/S/I が −23: '+JSON.stringify(r&&[r.lufsM,r.lufsS,r.lufsI]));
 ok(SD.LOUD.pick(B.lmState(),'lufsS')===r.lufsS,'pick(lmState) が読める');
 /* 外す: 接続は元どおり・値は保持 */
 const w1=B.lmW;B.meterOn(false);
 ok(B.lmW==null&&!B.n.lim.out.includes(w1)&&B.n.lim.out.length===before.length&&w1.out.length===0&&w1.port.onmessage===null,'meterOn(false) で外れる');
 r=B.lmRead();ok(r&&Math.abs(r.lufsI+23)<.01,'外しても値は保持');
 B.meterOn(true);ok(B.lmW&&B.lmW!==w1&&B.n.lim.out.length===before.length+1,'付け直し(二重につながらない)');
 B.meterOn(true);ok(B.n.lim.out.length===before.length+1,'meterOn(true) の繰り返しで増えない');
 B.lmReset();ok(B.lmRead().lufsI==null&&B.lmW.port.sent.some(m=>m.reset),'lmReset で消え、ワークレットにも reset を送る');
 /* 古いノードのメッセージは無視される(外したあとに届いても落ちない) */
 const old=B.lmW;B.meterOn(false);try{old.port.onmessage&&old.port.onmessage({data:frame(z)})}catch(e){ok(false,'外した後のメッセージで例外')}
 /* ワークレットが読み込まれる前に meterOn → 読み込み後(リミッター差し替え後)に付く */
 const C=new SD.Bus();C.init();C.meterOn(true);
 ok(C.lmW==null,'読み込み前は付かない(待つ)');await C.wkP;
 ok(C.lmW&&C.lmSrc===C.n.lim&&C.n.lim.name==='sd-limiter'&&C.n.lim.out.includes(C.lmW),'読み込み後は差し替え後の n.lim に付く');
 /* リミッターの差し替え(useLimiter を再度)でも付け直す */
 const lim0=C.n.lim,w0=C.lmW;C.n.comp.connect(C.n.lim);C.useLimiter();
 ok(C.n.lim!==lim0&&C.lmSrc===C.n.lim&&C.lmW&&C.lmW!==w0&&C.n.lim.out.includes(C.lmW)&&!lim0.out.includes(C.lmW),'useLimiter の後に付け直す');
 /* グラフの作り直し(init を再度)でも付く */
 const D=new SD.Bus();D.init();await D.wkP;D.meterOn(true);const dw=D.lmW;D.ctx=null;D.init();await D.wkP;
 ok(D.lmW&&D.lmW!==dw&&D.lmSrc===D.n.lim&&D.n.lim.out.includes(D.lmW),'グラフを作り直すと新しい n.lim に付く');
 /* ワークレット非対応: 何もしない・落ちない・従来のメーターは動く */
 AC.noWk=true;const U=new SD.Bus();U.init();await U.wkP;AC.noWk=false;
 let thrown=false;try{U.meterOn(true);U.lmReset();U.meterOn(false)}catch(e){thrown=true}
 ok(!thrown&&U.lmW==null&&U.lmRead()==null&&U.lmOk()===false,'非対応でも落ちない・値は null');
 U.meterOn(true);ok(U.masterMeter()!==null,'非対応でも masterMeter は従来どおり');
 /* ctx 前(init 前)の呼び出し */
 const E=new SD.Bus();thrown=false;try{E.meterOn(true);E.lmOn(true);E.lmReset();E.lmRead()}catch(e){thrown=true}ok(!thrown,'init 前でも落ちない');
 /* 画面からの利用は M-4(test/lmui.js が検査) */
 if(err){console.error(err+'件NG');process.exit(1)}console.log('lmbus OK');
})();
