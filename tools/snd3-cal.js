/* S3 の聞き比べ音量(cmp.g)の測定: node tools/snd3-cal.js [コース略称=SA] → www/js/snd3.js の G3 表に貼る行を出す。
   各候補を demo.n[0] で描画し、いちばん小さい候補に RMS をそろえる dB(0以下・.1dB刻み)を出す。体験させたい回(音量を揃えない)は SKIP に書く。
   要: npm i --no-save node-web-audio-api@2.2.0。analog の recipe のみ(add は quality.js と同じ別経路が要るので未対応) */
const fs=require('fs'),path=require('path'),vm=require('vm');
let OAC;try{OAC=require('node-web-audio-api').OfflineAudioContext}catch(e){if(process.env.CI){console.error('NG: node-web-audio-api が無い');process.exit(1)}console.log('SKIP: node-web-audio-api 未インストール(npm i --no-save node-web-audio-api)');process.exit(0)}
const w=path.join(__dirname,'..','www','js'),ctx0={console};ctx0.window=ctx0;vm.createContext(ctx0);
['params.js','wtparams.js','mat.js','umat.js','swtparams.js','grparams.js','fmparams.js','addparams.js','modlib.js','mixdefs.js','fxnew.js','fxparams.js','seq.js','drums.js','auto.js','lessons.js','course.js','th.js','ly.js','ldpd.js','bs.js','plsq.js','fxl.js','ad.js','gn1.js','gn2.js','gn3.js','hs.js','muh.js','allicks.js','mu.js','mu2.js','al.js','al2.js','eq.js','cm.js','ef.js','pn.js','fq.js','vo.js','mx.js','se.js','ms.js','snd3.js','synth.js','add.js','voice.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx0,{filename:f}));
/* 決定的にする(v8.0): お手本のノイズ(Math.random)を固定の乱数列にして、実行ごと・描画の順序・再試行で値が揺れないようにする(render の頭で毎回リセット) */
vm.runInContext('(function(){var s=20260101;Math.random=function(){s=(s*1664525+1013904223)>>>0;return s/4294967296};Math.reseed=function(){s=20260101}})()',ctx0);
const SD=ctx0.SD;let err=0;const bad=m=>{console.error('NG: '+m);err++};
const SR=44100;
/* ---- 測定関数 ---- */
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const u=i+k,v=i+k+len/2,tr=re[v]*cr-im[v]*ci,ti=re[v]*ci+im[v]*cr;re[v]=re[u]-tr;im[v]=im[u]-ti;re[u]+=tr;im[u]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
function bands(x,t0){const N=16384,re=new Float64Array(N),im=new Float64Array(N),o=Math.round(t0*SR);for(let i=0;i<N;i++)re[i]=(x[o+i]||0)*(0.5-0.5*Math.cos(2*Math.PI*i/(N-1)));fft(re,im);
 const e={},tot={v:0};SD.BANDS.forEach(b=>e[b.id]=0);for(let k=1;k<N/2;k++){const f=k*SR/N,p=re[k]*re[k]+im[k]*im[k];if(f<20||f>20000)continue;tot.v+=p;const b=SD.BANDS.find(b=>f>=b.lo&&f<b.hi);if(b)e[b.id]+=p}
 SD.BANDS.forEach(b=>e[b.id]=tot.v?e[b.id]/tot.v:0);return e}
const peak=x=>{let m=0;for(const v of x)m=Math.max(m,Math.abs(v));return m};
const rms=(x,a,b)=>{let s=0;a=Math.round(a*SR);b=Math.round(b*SR);for(let i=a;i<b;i++)s+=x[i]*x[i];return Math.sqrt(s/(b-a))};
function corr(L,R){let a=0,b=0,c=0;for(let i=0;i<L.length;i++){a+=L[i]*L[i];b+=R[i]*R[i];c+=L[i]*R[i]}return a&&b?c/Math.sqrt(a*b):1}
/* 基音の検出(v8.0で改良): 窓を複数(t0から0.08秒おき・最大5つ)とり、各窓で FFT 自己相関の「最初に強い山」(最大の0.85倍以上のうち最短のラグ)を採って放物線補間。窓どうしは±3%でまとめ、数が多い群(同数なら高い方)を答えにする。
   オクターブ下に取り違える旧方式(最大の山を選ぶ)の対策。決定的(乱数なし)。自己検証は下の selfTest。 */
function pitch(x,t0){const N=8192,M=16384,lo=Math.round(SR/1000),hi=Math.round(SR/30),cand=[];let r0=0;
 for(let w=0;w<5;w++){const o=Math.round((t0+.08*w)*SR);if(o+N>x.length)break;const re=new Float64Array(M),im=new Float64Array(M);let e=0;for(let i=0;i<N;i++){re[i]=x[o+i];e+=x[o+i]*x[o+i]}
  const rm=Math.sqrt(e/N);if(w===0)r0=rm;if(rm<1e-4||rm<.2*r0)continue;
  fft(re,im);for(let k=0;k<M;k++){re[k]=re[k]*re[k]+im[k]*im[k];im[k]=0}fft(re,im);const r=re;
  let k=lo;while(k<hi&&r[k]>0)k++;let gm=0;for(let l=k;l<=hi;l++)if(r[l]>gm)gm=r[l];if(!(gm>0))continue;
  let bl=-1;for(let l=Math.max(k,lo+1);l<hi;l++)if(r[l]>=r[l-1]&&r[l]>=r[l+1]&&r[l]>=.85*gm){bl=l;break}if(bl<0)continue;
  const a=r[bl-1],b=r[bl],c=r[bl+1],d=a-2*b+c,sh=d?0.5*(a-c)/d:0;cand.push(SR/(bl+sh))}
 if(!cand.length)return 0;let best=null;for(const f of cand){const grp=cand.filter(g=>Math.abs(g/f-1)<.03);if(!best||grp.length>best.n||(grp.length===best.n&&f>best.f))best={n:grp.length,f:grp.reduce((a,b)=>a+b,0)/grp.length}}return best.f}
function attack(x){const pk=peak(x.subarray(0,Math.round(.5*SR)));for(let i=0;i<x.length;i++)if(Math.abs(x[i])>=pk*.9)return i/SR;return -1}
/* ---- オフライン描画(アナログ単音。hold秒だけ押して離す) ---- */
async function render(patch,notes,hold,total,synth,_try){_try=_try||0;vm.runInContext('Math.reseed()',ctx0);const c=new OAC(2,Math.round(total*SR),SR),bus={init:()=>c,input:c.destination,set(){}},syn=synth==='add'?new SD.ADD(bus):new SD.Synth(bus);
 if(synth==='add'){syn.init();syn.setPatch(Object.assign({},SD.defs.add.DEF,patch))}else{syn.p=Object.assign({},SD.defs.analog.DEF,patch);syn.init()}[].concat(notes).forEach(n=>syn.noteOn(n,1));
 let susp=false;c.suspend(hold).then(()=>{[].concat(notes).forEach(n=>syn.noteOff(n));c.resume()}).catch(()=>{susp=true});const b=await c.startRendering();if(susp&&_try<8)return render(patch,notes,hold,total,synth,_try+1);const o=[Float32Array.from(b.getChannelData(0)),Float32Array.from(b.getChannelData(1))];if(o.some(a=>a.some(v=>v!==v))||peak(o[0])<1e-4||peak(o[0])>10)throw new Error('FLAKY');return o}
const refPatch=L=>{const s=Object.assign({},SD.defs.analog.DEF,L.init);L.steps.forEach(st=>{Object.assign(s,st.s||{});(st.f||[]).forEach(([id,g])=>{if(g!==undefined)s[id]=g})});return s};

const SKIP=new Set([]);
(async()=>{
 const C=process.argv[2]||'SA',res=[];
 for(const L of SD.LESSONS.filter(l=>l.course===C&&l.synth==='analog')){
  const base=Object.assign({},SD.defs.analog.DEF,L.init);L.steps.forEach(st=>{Object.assign(base,st.s||{});(st.f||[]).forEach(([id,g])=>{if(g!==undefined)base[id]=g})});
  const cur=Object.assign({},SD.defs.analog.DEF,L.init);
  for(let i=0;i<L.steps.length;i++){const st=L.steps[i];Object.assign(cur,st.s||{});(st.f||[]).forEach(([id,g])=>{if(g!==undefined)cur[id]=g});
   if(!st.cmp||SKIP.has(L.id))continue;
   const n=(L.demo.n||[60])[0],r=[];
   for(const v of st.cmp){const p=Object.assign({},cur,v.s||{});const [l]=await render(p,n,.8,1.4);const aS=(p.aS||0)<.05;r.push(rms(l,aS?.0:.05,aS?.4:.8))}
   const g0=r.map(x=>20*Math.log10(r[0]/x)),mx=Math.max.apply(null,g0),g=g0.map(x=>Math.round((x-mx)*10)/10);/* g は 0 以下(検査の範囲)。いちばん小さい候補を基準に、大きい候補を下げる */
   res.push(["'"+L.id+"s"+(i+1)+"'",JSON.stringify(g)]);
   console.log(L.id,'step'+(i+1),'rms',r.map(x=>x.toFixed(3)).join(' '),'g',g.join(' '))}}
 console.log('G3 行:');console.log(res.map(x=>x[0]+':'+x[1]).join(','));process.exit(0)})();
