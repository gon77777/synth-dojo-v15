// 計測 SD.LOUD のテスト(M-1): node test/loud.js  合成信号のみ。1kHz の『−23 dBFS』は規格どおりピーク振幅(両chで −23 LUFS)。他の測定器との照合は未確認。
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={console};ctx.window=ctx;ctx.SD={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','www','js','loud.js'),'utf8'),ctx,{filename:'loud.js'});
const L=ctx.SD.LOUD;let err=0;const bad=m=>{console.error('NG: '+m);err++};
const near=(a,b,t,m)=>{if(!(Math.abs(a-b)<=t))bad(m+' '+a+' ≠ '+b+' (±'+t+')')};
const A=db=>Math.pow(10,db/20);
/* 信号を流して acc を返す。gen(i,fs)→[l,r] */
function run(fs,sec,gen,st){st=st||L.acc();const N=Math.round(fs*sec),l=new Float32Array(N),r=new Float32Array(N);
 for(let i=0;i<N;i++){const v=gen(i,fs);l[i]=v[0];r[i]=v[1]}
 const f=L.Front(fs,fr=>L.push(st,fr,fs));f.process(l,r);return st}
const sine=(hz,amp,ph)=>(i,fs)=>{const v=amp*Math.sin(2*Math.PI*hz*i/fs+(ph||0));return[v,v]};

/* K特性の係数: 48k は公表されている係数と一致(桁数6) */
{const k=L.kCoef(48000),p=[[k.sh.b,[1.53512485958697,-2.69169618940638,1.19839281085285]],[k.sh.a,[1,-1.69065929318241,.73248077421585]],[k.hp.a,[1,-1.99004745483398,.99007225036621]]];
 p.forEach(([a,b],i)=>a.forEach((x,j)=>near(x,b[j],1e-6,'K係数['+i+']['+j+']')))}
/* 1kHz 付近のゲイン ≈ +0.7 dB */
[44100,48000].forEach(fs=>near(L.kGain(fs,1000),.69,.1,'K特性の1kHzゲイン '+fs));
/* ステレオ同相 1kHz −23 dBFS = −23.0 LUFS(M・S・I すべて)。モノ(片ch)は −3.01 */
[48000,44100].forEach(fs=>{
 const s=run(fs,6,sine(1000,A(-23))),r=L.read(s);
 near(r.lufsM,-23,.1,'M '+fs);near(r.lufsS,-23,.1,'S '+fs);near(r.lufsI,-23,.1,'I '+fs);
 const m=run(fs,6,(i,f)=>[A(-23)*Math.sin(2*Math.PI*1000*i/f),0]),rm=L.read(m);
 near(rm.lufsM,-23-3.01,.1,'片ch M '+fs)});
/* 無音は null(—)。ゲートで除かれる */
{const r=L.read(run(48000,5,()=>[0,0]));['lufsM','lufsS','lufsI','corr','bal','vu','tp'].forEach(k=>{if(r[k]!=null)bad('無音の '+k+' が null でない: '+r[k])})}
/* 短い再生では S・LRA は出ない。M・I は出る */
{const r=L.read(run(48000,1,sine(1000,.1)));if(r.lufsS!=null)bad('1秒で S が出ている');if(r.lra!=null)bad('1秒で LRA が出ている');if(r.lufsM==null||r.lufsI==null)bad('1秒で M・I が出ない')}
/* ゲート: 大きい20秒(−23)+小さい20秒(−63 LUFS=−40 LU) → 小さい部分が I を下げない */
{const fs=48000,g=(i,f)=>sine(1000,i<20*f?A(-23):A(-63))(i,f),s=run(fs,40,g),r=L.read(s);
 near(r.lufsI,-23,.1,'ゲートが効いた I');
 const all=s.zM.reduce((a,b)=>a+b,0)/s.zM.length;if(!(Math.abs(L.lufsOf(all)-r.lufsI)>2))bad('ゲートなしの平均と I が近すぎる(ゲートが効いていない)');
 near(r.lufsS,-63,.2,'終わりの S')}
/* 絶対ゲート: −75 LUFS 相当だけの信号は I が null */
{const r=L.read(run(48000,8,sine(1000,A(-75))));if(r.lufsI!=null)bad('−75 LUFS が I に入った: '+r.lufsI)}
/* LRA: 15秒(−23)+15秒(−33)=約 10 LU。10秒未満は null */
{const fs=48000,s=run(fs,30,(i,f)=>sine(1000,i<15*f?A(-23):A(-33))(i,f)),r=L.read(s);
 if(r.lra==null)bad('LRA が出ない');else near(r.lra,10,.5,'LRA');
 const c=L.read(run(48000,15,sine(1000,A(-23))));if(c.lra==null||c.lra>.2)bad('一定音の LRA ≈ 0 のはず: '+c.lra);
 if(L.read(run(48000,9,sine(1000,.1))).lra!=null)bad('9秒で LRA が出ている')}
/* リセットで消える */
{const s=run(48000,5,sine(1000,.1));L.reset(s);const r=L.read(s);if(r.lufsM!=null||r.lufsI!=null||r.tp!=null)bad('reset 後に値が残る')}
/* TP(近似): fs/4 の正弦波・位相45°。サンプルピーク ≈ 0.707(−3.01dB)・TP ≈ 0 dBTP(±0.5) */
[48000,44100].forEach(fs=>{const r=L.read(run(fs,3,(i,f)=>{const v=Math.sin(2*Math.PI*(f/4)*i/f+Math.PI/4);return[v,v]}));
 near(r.sp,-3.01,.1,'サンプルピーク '+fs);near(r.tp,0,.5,'TP '+fs);if(!(r.tp-r.sp>2.5))bad('TP とサンプルピークの差が小さい '+fs)});
/* TP: 1kHz の正弦波はサンプルピークとほぼ同じ */
{const r=L.read(run(48000,2,sine(1000,.5)));near(r.tp,-6.02,.2,'1kHz の TP');near(r.sp,-6.02,.1,'1kHz のピーク')}
/* PLR = TP − I */
{const r=L.read(run(48000,5,sine(1000,A(-10))));near(r.plr,r.tp-r.lufsI,1e-9,'PLR')}
/* 相関 */
{const rd=g=>L.read(run(48000,2,g));
 near(rd(sine(440,.3)).corr,1,.001,'同じ=+1');
 near(rd((i,f)=>{const v=.3*Math.sin(2*Math.PI*440*i/f);return[v,-v]}).corr,-1,.001,'逆相=-1');
 near(rd((i,f)=>[.3*Math.sin(2*Math.PI*1000*i/f),.3*Math.cos(2*Math.PI*1000*i/f)]).corr,0,.05,'90°ずれ≈0');
 let sd=12345;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296*2-1};
 near(rd(()=>[.3*rnd(),.3*rnd()]).corr,0,.05,'独立ノイズ≈0')}
/* バランス: 右が −6 dB → L−R = +6.0。モノ差: 同相=0・逆相=大きく下がる */
{const r=L.read(run(48000,5,(i,f)=>{const v=.3*Math.sin(2*Math.PI*1000*i/f);return[v,v*A(-6)]}));near(r.bal,6.0,.1,'バランス');near(L.pick(r,'bal'),6.0,.1,'pick bal')
 near(L.read(run(48000,5,sine(1000,.3))).mdiff,0,.1,'同相のモノ差');
 const m=L.read(run(48000,5,(i,f)=>{const v=.3*Math.sin(2*Math.PI*1000*i/f);return[v,-v]})).mdiff;if(!(m>20))bad('逆相のモノ差が小さい: '+m);
 const h=L.read(run(48000,5,(i,f)=>[.3*Math.sin(2*Math.PI*1000*i/f),.3*Math.cos(2*Math.PI*1000*i/f)])).mdiff;near(h,3.01,.3,'90°ずれのモノ差(無関係な信号はモノで約3LU下がる)')}
/* VU(近似): 基準レベル(−18 RMS)の1kHz → 300ms で定常の 99%・停止後はゆっくり戻る */
{const fs=48000,amp=A(-18)*Math.SQRT2,st=L.acc(),N=fs*.1,f=L.Front(fs,fr=>L.push(st,fr,fs)),buf=(on)=>{const l=new Float32Array(N);for(let i=0;i<N;i++)l[i]=on?amp*Math.sin(2*Math.PI*1000*i/fs):0;return l};
 const steady=A(-18),lin=()=>st.vu2/steady;
 f.process(buf(1),buf(1));const v1=lin();f.process(buf(1),buf(1));f.process(buf(1),buf(1));const v3=lin();
 near(v3,.99,.005,'VU 300ms で99%');if(!(v1<.7))bad('VU 100ms でもう上がりきっている '+v1);
 for(let i=0;i<30;i++)f.process(buf(1),buf(1));near(L.read(st).vu,0,.05,'VU 定常=0 VU');
 near(L.read(st,{vuRef:-14}).vu,-4,.05,'VU 基準 −14');
 f.process(buf(0),buf(0));const d1=lin();if(!(d1>.3))bad('VU 停止100msで戻りが速すぎる '+d1);
 f.process(buf(0),buf(0));f.process(buf(0),buf(0));near(lin(),.01,.005,'VU 停止300msで約1%')}
/* pick と KEYS */
{const s=run(48000,5,sine(1000,.1)),r=L.read(s);L.KEYS.forEach(k=>{const a=L.pick(s,k),b=L.pick(r,k);if(a!==b)bad('pick(acc) と pick(read) が違う '+k)});
 if(L.pick(r,'nope')!==null)bad('未知のキーが null でない');if(L.pick(null,'tp')!==null)bad('null の状態')}
/* CREST・VUREF・TARGETS */
near(L.crest(-3,-20),17,1e-9,'crest');if(L.crest(-Infinity,-20)!==null)bad('crest の -∞');
if(JSON.stringify(L.VUREF)!=='[-18,-14,-20]')bad('VUREF');
{const T=L.TARGETS,ids=T.map(t=>t.id);if(new Set(ids).size!==ids.length)bad('TARGETS の id 重複');
 T.forEach(t=>{if(typeof t.lufs!=='number'||t.lufs>=0)bad('TARGETS lufs '+t.id);if(/Spotify|YouTube|Apple|Amazon|Tidal|EBU|ITU/i.test(JSON.stringify(t)))bad('TARGETS に団体名・サービス名 '+t.id)});
 if(L.target('stream').lufs!==-14||L.target('nope')!==null)bad('target()');
 const doc=fs.readFileSync(path.join(__dirname,'..','docs','LM_targets.md'),'utf8').replace(/−/g,'-');
 if(!doc.includes(L.TARGETS_ASOF))bad('docs/LM_targets.md に取得日 '+L.TARGETS_ASOF+' が無い');
 T.forEach(t=>{if(!doc.includes(String(t.lufs)))bad('docs/LM_targets.md に '+t.id+' の値 '+t.lufs+' が無い')})}
/* 純粋関数: 他のファイルに依存しない(SD 以外の参照が無い) */
if(/\bSD\.(?!LOUD)\w+/.test(fs.readFileSync(path.join(__dirname,'..','www','js','loud.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'')))bad('loud.js が SD.LOUD 以外を参照している');
if(err){console.error(err+'件NG');process.exit(1)}console.log('loud OK');
