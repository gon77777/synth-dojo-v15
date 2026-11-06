// sd-meter(fx-src/meter.js)のテスト(M-2): node test/fxw-meter.js
// 偽の AudioWorkletProcessor で動かし、SD.LOUD(loud.js)の参照計算と比べる。フレームは一致・読み出し値は 0.01 LU 以内。
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');let err=0;const bad=m=>{console.error('NG: '+m);err++};
const near=(a,b,t,m)=>{if(!(Math.abs(a-b)<=t))bad(m+' '+a+' ≠ '+b+' (±'+t+')')};
const ctx={console};ctx.window=ctx;ctx.SD={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'www','js','loud.js'),'utf8'),ctx);
const L=ctx.SD.LOUD;
const src=fs.readFileSync(path.join(root,'fx-src','meter.js'),'utf8');
function mk(sr){const procs={};
 new Function('sampleRate','AudioWorkletProcessor','registerProcessor',src)(sr,class{constructor(){this.port={postMessage:m=>this.sent.push(m),onmessage:null};this.sent=[]}},(n,c)=>{procs[n]=c});
 if(!procs['sd-meter'])throw new Error('sd-meter が登録されない');return new procs['sd-meter']()}
function feed(p,l,r,mono){let outOk=true;const o=[new Float32Array(128),new Float32Array(128)];
 for(let s=0;s+128<=l.length;s+=128){o[0].fill(1);o[1].fill(1);
  const inp=mono?[[l.subarray(s,s+128)]]:[[l.subarray(s,s+128),r.subarray(s,s+128)]];
  if(p.process(inp,[o],{})!==true)bad('process が true を返さない');
  if(o[0].some(v=>v!==0)||o[1].some(v=>v!==0))outOk=false}
 return outOk}
/* 音楽的な合成信号: 低音+中域+ノイズ、左右ちがい、途中で音量が変わる(ゲートも通る) */
function music(fs,sec){const N=Math.round(fs*sec/128)*128,l=new Float32Array(N),r=new Float32Array(N);let sd=7;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296*2-1};
 for(let i=0;i<N;i++){const t=i/fs,env=t<sec*.4?.5:t<sec*.7?.05:.3,bass=Math.sin(2*Math.PI*55*t),mid=Math.sin(2*Math.PI*880*t+Math.sin(2*Math.PI*3*t)),n=rnd()*.2;
  l[i]=env*(.6*bass+.3*mid+n)*(Math.sin(2*Math.PI*.5*t)>.9?1.6:1);r[i]=env*(.5*bass+.35*Math.sin(2*Math.PI*660*t)+rnd()*.2)}
 return[l,r]}
[48000,44100].forEach(fs=>{
 const[l,r]=music(fs,25),p=mk(fs),silent=feed(p,l,r);
 if(!silent)bad('出力が無音でない '+fs);
 /* 参照 */
 const ref=[];L.Front(fs,f=>ref.push(Object.assign({},f))).process(l,r);
 if(p.sent.length!==ref.length)bad('フレーム数 '+p.sent.length+' ≠ '+ref.length+' ('+fs+')');
 const keys=['kl','kr','km','ll','rr','lr','sp','tp'];let worst=0;
 for(let i=0;i<Math.min(ref.length,p.sent.length);i++)keys.forEach(k=>{const a=p.sent[i][k],b=ref[i][k],d=Math.abs(a-b)/(Math.abs(b)+1e-12);if(d>worst)worst=d});
 if(worst>1e-9)bad('フレームが参照と違う(相対差 '+worst+') '+fs);
 /* 読み出し(LUFS/TP/相関/モノ差)は 0.01 以内 */
 const a=L.acc(),b=L.acc();p.sent.forEach(f=>L.push(a,f,fs));ref.forEach(f=>L.push(b,f,fs));
 const ra=L.read(a),rb=L.read(b);['lufsM','lufsS','lufsI','lra','tp','plr','corr','bal','mdiff','vu'].forEach(k=>{if(rb[k]==null)bad('参照の '+k+' が null');else near(ra[k],rb[k],.01,k+' '+fs)});
 if(!(ra.lufsI<-5&&ra.lufsI>-60))bad('I が妙な値 '+ra.lufsI)});
/* フレームの長さ=100ms(128 の倍数でない 4800 でも境界が合う)・最初のフレームの位置 */
{const p=mk(48000),z=new Float32Array(128*38);feed(p,z,z);if(p.sent.length!==1)bad('4864サンプルで1フレームのはず: '+p.sent.length)}
/* モノ入力(1ch)は L=R 扱い・入力なしは無音として時間が進む */
{const fs=48000,N=48000,l=new Float32Array(N-N%128+128);for(let i=0;i<l.length;i++)l[i]=.2*Math.sin(2*Math.PI*1000*i/fs);
 const p=mk(fs),q=mk(fs);feed(p,l,null,true);feed(q,l,l);
 if(p.sent.length!==q.sent.length||Math.abs(p.sent[3].kl-q.sent[3].kl)>1e-12||Math.abs(p.sent[3].lr-q.sent[3].lr)>1e-12)bad('モノ入力が L=R と違う');
 const n=mk(fs);for(let i=0;i<40;i++)n.process([[]],[[new Float32Array(128),new Float32Array(128)]],{});if(n.sent.length!==1||n.sent[0].kl!==0)bad('入力なしは無音のフレームになるはず');
 const m=mk(fs);if(m.process([],[],{})!==true)bad('入出力なしで落ちる')}
/* NaN を入れても数が壊れない */
{const p=mk(48000),l=new Float32Array(128*40).fill(.1);l[500]=NaN;l[501]=Infinity*0;feed(p,l,l);if(p.sent.some(f=>Object.values(f).some(v=>!isFinite(v))))bad('NaN が伝わった')}
/* reset メッセージ: 数え直し・フィルター状態も初期化(同じ信号でフレームが同じになる) */
{const fs=48000,l=new Float32Array(128*40);for(let i=0;i<l.length;i++)l[i]=.3*Math.sin(2*Math.PI*200*i/fs);
 const p=mk(fs);feed(p,l,l);const first=p.sent[0];p.sent.length=0;feed(p,l.subarray(0,128*20),l.subarray(0,128*20));
 p.port.onmessage({data:{reset:true}});p.sent.length=0;feed(p,l,l);
 if(!p.sent.length)bad('reset 後にフレームが出ない');else['kl','tp','lr'].forEach(k=>near(p.sent[0][k],first[k],1e-12,'reset 後の最初のフレーム '+k));
 p.port.onmessage({data:{foo:1}});p.port.onmessage(null)}
/* 配線は bus.js だけ(M-3)。画面(app.js)は sd-meter を直接使わない */
['app.js'].forEach(f=>{if(/sd-meter/.test(fs.readFileSync(path.join(root,'www','js',f),'utf8')))bad(f+' が sd-meter を直接使っている')});
/* 生成物に入っている */
{const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'www','js','fxworklets.js'),'utf8'),c);if(!c.SD.FXWSRC.meter||!/registerProcessor\('sd-meter'/.test(c.SD.FXWSRC.meter))bad('fxworklets.js に meter が無い')}
if(err){console.error(err+'件NG');process.exit(1)}console.log('fxw-meter OK');
