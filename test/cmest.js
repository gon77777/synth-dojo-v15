/* CMコース(v7.6〜)の聞き比べ音量・GRの「測定」(オフライン描画)。tools/cm-cal.js が cmp.g を出し、test/cm.js が差1dB以内・目標(mt)が達成できること・claim を検査する。
   各トラックの音(シンセを単音で描画→ステップ位置に置く)に、トラック別COMP(ワークレット sd-comp)を通して足し合わせる。EQ・SAT・MODなど他のインサートは通さない(CMレッスンはCOMPだけ使う)。
   node-web-audio-api が要る(無ければ null を返す)。メーターの代わりに、ワークレットが報告する GR(20Hz)の列を返す。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const W=path.join(__dirname,'..','www','js'),FX=path.join(__dirname,'..','fx-src');
let OAC=null;try{OAC=require('node-web-audio-api').OfflineAudioContext}catch(e){}
const SR=48000;
function loadSD(){const ctx={console,setTimeout,clearTimeout,Float32Array,Float64Array};ctx.window=ctx;vm.createContext(ctx);vm.runInContext('var SD={};',ctx);
 ['params.js','wtparams.js','mat.js','umat.js','swtparams.js','grparams.js','fmparams.js','addparams.js','modlib.js','mixdefs.js','fxnew.js','fxparams.js','seq.js','drums.js','auto.js','lessons.js','lessons2.js','wtlessons.js','seqlessons.js','modlessons.js','grlessons.js','fmlessons.js','addlessons.js','aulessons.js','course.js','add.js','voice.js','cm.js','ef.js','pn.js','vo.js','mx.js','se.js','ms.js','xmix.js','xc.js','xs.js','xg.js','xd.js','synth.js'].forEach(f=>{const p=path.join(W,f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:f})});return ctx.SD}
/* COMP ワークレット(mix.js と同じ呼び方) */
const procs={};let last=null;
global.sampleRate=SR;global.currentTime=0;global.currentFrame=0;
global.AudioWorkletProcessor=class{constructor(){this.port={postMessage:m=>{last=m},onmessage:null}}};global.registerProcessor=(n,c)=>{procs[n]=c};
new Function(fs.readFileSync(path.join(FX,'comp.js'),'utf8'))();
['gate','saturator','modfx','bitcrush','ringmod','width','autofilter','deess'].forEach(f=>new Function(fs.readFileSync(path.join(FX,f+'.js'),'utf8'))());/* v7.7a: GATE・SAT・MOD(と、マスターFXのBITCRUSH・RING MOD)も測れるように */
const C=procs['sd-comp'],fxdsp=require(path.join(W,'fxdsp.js'));
const CPMAP={iCpModel:'model',iCpThr:'thresh',iCpRatio:'ratio',iCpAtk:'attack',iCpRel:'release',iCpKnee:'knee',iCpMix:'mix',iCpScHpf:'schpf'};
/* x(Float32Array)に COMP をかける。cp=インサートのつまみ値(iCp*)。戻り: {y, gr:[20Hzごとの報告(dB・正)]} */
function runComp(x,cp,key){const p=new C(),params={};C.parameterDescriptors.forEach(d=>{params[d.name]=[d.defaultValue]});
 Object.keys(CPMAP).forEach(k=>{if(cp[k]!==undefined)params[CPMAP[k]]=[cp[k]]});params.active=[1];if(key)params.scOn=[1];/* v11.19: キー(サイドチェイン)入力。key=Float32Array */
 const y=new Float32Array(x.length),oL=new Float32Array(128),oR=new Float32Array(128),gr=[];last=null;
 for(let s=0;s+128<=x.length;s+=128){const a=x.subarray(s,s+128),ins=key?[[a,a],[key.subarray(s,s+128),key.subarray(s,s+128)]]:[[a,a]];p.process(ins,[[oL,oR]],params);y.set(oL,s);if(last){gr.push(-last.gr);last=null}}
 const mk=Math.pow(10,(cp.iCpMake||0)/20);for(let i=0;i<y.length;i++)y[i]*=mk;
 return{y,gr}}
/* 汎用: ワークレット name に x(モノ)を通す。pm=つまみ(ワークレットの名前)。戻り: [左,右] */
function runProc(name,x,pm,opt){const K=procs[name],p=new K(opt||{}),params={};K.parameterDescriptors.forEach(d=>{params[d.name]=[d.defaultValue]});Object.keys(pm).forEach(k=>{params[k]=[pm[k]]});if('enabled' in params)params.enabled=[1];
 const L=new Float32Array(x.length),R=new Float32Array(x.length),a=new Float32Array(128),b=new Float32Array(128);
 for(let s=0;s+128<=x.length;s+=128){p.process([[x.subarray(s,s+128)]],[[a,b]],params);L.set(a,s);R.set(b,s)}return[L,R]}
function runEq(x,m){const st=fxdsp.eq4Stages(m,SR),y=Float64Array.from(x);st.forEach(q=>{const c=q.co;let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<y.length;i++){const v=y[i],o=c[0]*v+c[1]*x1+c[2]*x2-c[3]*y1-c[4]*y2;x2=x1;x1=v;y2=y1;y1=o;y[i]=o}});return Float32Array.from(y)}
/* DE-ESS(v7.10a 後半): x に sd-deess を通す。m=iDsFreq/iDsThr/iDsAmt/iDsListen。戻り: {y, gr:[報告(dB・正)]} */
function runDs(x,m){const K=procs['sd-deess'],p=new K(),params={};K.parameterDescriptors.forEach(d=>{params[d.name]=[d.defaultValue]});
 params.freq=[m.iDsFreq];params.thresh=[m.iDsThr];params.amt=[m.iDsAmt];params.listen=[m.iDsListen||0];params.enabled=[1];
 const y=new Float32Array(x.length),a=new Float32Array(128),b=new Float32Array(128),gr=[];last=null;
 for(let s=0;s+128<=x.length;s+=128){p.process([[x.subarray(s,s+128)]],[[a,b]],params);y.set(a,s);if(last){gr.push(last.gr);last=null}}
 return{y,gr}}
/* トラック別インサート(GATE→EQ→COMP→SAT→MOD。EQ/COMPの前後は iOrd)を通す。m=インサートのつまみ(iGt* iEq* iCp* iSa* iMd*)。戻り: {L,R,gr} */
function runChain(SD,x,m0,keys){const m=Object.assign({},SD.MIXDEF(),m0||{});let y=x,R=null,gr=null,gr2=null,dsgr=null;
 SD.INSORD(m).forEach(g=>{
  if(g==='gt'&&m.iGtOn==1)y=runProc('sd-gate',y,{threshold:m.iGtThr,hold:m.iGtHold,release:m.iGtRel,range:m.iGtRange})[0];
  else if(g==='eq'&&m.iEqOn==1)y=runEq(y,m);
  else if((g==='cp'||g==='cp_2')&&m['iCpOn'+(g==='cp_2'?'_2':'')]==1){/* v11.19: 2段目(cp_2)・キー(iCpSc)にも対応 */const sx=g==='cp_2'?'_2':'',cq={};Object.keys(CPMAP).concat(['iCpMake']).forEach(k=>{cq[k]=m[k+sx]});const sc=m['iCpSc'+sx]|0,r=runComp(y,cq,sc>=1&&keys&&keys[sc-1]?keys[sc-1]:null);y=r.y;if(sx)gr2=r.gr;else gr=r.gr}
  else if(g==='ds'&&m.iDsOn==1){const r=runDs(y,m);y=r.y;dsgr=r.gr}
  else if(g==='sa'&&m.iSaOn==1){const t=m.iSaType|0;if(t===0){const k=1+m.iSaDrive*12,mm=Math.tanh(k);y=y.map(v=>Math.tanh(v*k)/mm)}else y=runProc('sd-saturator',y,{drive:m.iSaDrive*36,tone:m.iSaTone,mix:m.iSaMix*100,out:m.iSaOut,type:t-1})[0]}
  else if(g==='md'&&m.iMdOn==1){const r=runProc('sd-modfx',y,{type:m.iMdType,rate:m.iMdRate,depth:m.iMdDepth*100,fb:m.iMdFb*100,mix:m.iMdMix*100},{processorOptions:{seed:1}});y=r[0];R=r[1]}});
 return{L:y,R:R||y,gr,gr2,dsgr}}
let SDg=null;
const cache={};
async function renderNote(SD,patch,note,vel,hold,total,syn0,_try){_try=_try||0;const key=JSON.stringify([patch,note,vel,hold,total,syn0||'']);if(cache[key])return cache[key];
 const c=new OAC(2,Math.round(total*SR),SR),bus={init:()=>c,input:c.destination,set(){}},syn=syn0==='add'?new SD.ADD(bus):new SD.Synth(bus);
 if(syn0==='add'){syn.init();syn.setPatch(Object.assign({},SD.defs.add.DEF,patch))}else{syn.p=Object.assign({},SD.defs.analog.DEF,patch);syn.init()}syn.noteOn(note,vel);let susp=false;c.suspend(hold).then(()=>{syn.noteOff(note);c.resume()}).catch(()=>{susp=true});
 const b=await c.startRendering();if(susp&&_try<8)return renderNote(SD,patch,note,vel,hold,total,syn0,_try+1);/* node-web-audio-api の suspend は描画開始と競合してまれに失敗する→やり直す */const o=Float32Array.from(b.getChannelData(0));if(o.some(v=>v!==v))throw new Error('NaN');return cache[key]=o}
const refPatch=L=>{const s=Object.assign({},SDg.defs.analog.DEF,L.init);L.steps.forEach(st=>{Object.assign(s,st.s||{});(st.f||[]).forEach(([id,g])=>{if(g!==undefined)s[id]=g})});return s};
/* トラック1本の素の音(ループ2回分=2×16ステップ・BPM120)を作る */
/* 声の代役(アディティブ)は node の描画環境で鳴らせないため、測定ではノコギリ波+ローパスの近似で代用する(レベル・長さの目安のみ) */
const VPX={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:2500,res:.2,envAmt:0,drive:0,aA:.06,aD:.2,aS:.85,aR:.25};
async function trackDry(L,t,loops){const SD=SDg,dr=SD.DRUMBY[t.id]||SD.VOICEBY[t.id],sy0=dr&&dr.synth||'analog',sy=sy0==='add'?'analog':sy0,src=dr?{demo:{n:[dr.n]}}:SD.LESSONS.find(x=>x.id===t.id),
 p=dr?Object.assign({},SD.defs[sy].DEF,sy0==='add'?VPX:dr.p,t.o.p||{}):Object.assign(refPatch(src),t.o.p||{}),
 nt=(src.demo.n[0].length?src.demo.n[0][0]:src.demo.n[0])+(t.o.tr|0),step=.125,stepN=Math.round(step*SR),len=16*stepN,out=new Float32Array(len*loops),acc=t.o.acc||[],tie=t.o.tie||[];
 for(let lp=0;lp<loops;lp++){for(let i=0;i<16;i++){if(t.idx[i]===undefined||tie.indexOf(i)>=0)continue;let ext=0;while(i+ext+1<16&&t.idx[i+ext+1]!==undefined&&tie.indexOf(i+ext+1)>=0)ext++;
   const a=acc.indexOf(i)>=0,dur=ext?step*(ext+1)-.006:step*(a?.8:.6),b=await renderNote(SD,p,nt+(t.idx[i]|0),a?1:.7,dur,Math.min(2.5,dur+.6),sy);
   const o=lp*len+i*stepN;for(let k=0;k<b.length&&o+k<out.length;k++)out[o+k]+=b[k]}}
 return out}
/* レッスン L の、各トラックに COMP 設定 over({トラック番号:{iCp*…}}・無指定は x.o.mx.cp)を掛けたときの {rms(dB・ミックス全体の後半ループ), gr:{trk:[…]}, peak, tr:{trk:rms(dB)}} */
async function measure(SD,L,over){if(!OAC)return null;SDg=SD;const loops=3,res={gr:{},gr2:{},tr:{}},bufs=[],dry=[];
 for(let k=0;k<L.tk.length;k++)dry.push(await trackDry(L,L.tk[k],loops));
 for(let k=0;k<L.tk.length;k++){const t=L.tk[k],init=SD.mxToMix(t.o.mx),tm={};Object.keys(t.o.mix||{}).forEach(q=>{if(q==='ord'||/^i[A-Z]/.test(q))tm[q]=t.o.mix[q]});/* v11.19: o.mix のインサート値(2段目・SC・ord) */
  const m=Object.assign({},init,tm,(over&&over[k+1])||{}),keys=dry.map((d,i)=>i===k?null:d),r=runChain(SD,dry[k],m,keys);
  if(over&&over.mute&&over.mute.indexOf(k)>=0){r.L=new Float32Array(r.L.length);r.R=new Float32Array(r.L.length)}/* v11.20: cmp.mt(0始まり)のミュート */
   if(over&&over.vol&&over.vol[k+1]!=null){const gv=SD.volGain(over.vol[k+1]);/* v11.25: 任意。トラックの VOL(over.vol={トラック番号:tVol})。指定しなければ従来どおり(既存の測定は変わらない) */
    if(r.R===r.L){for(let i=0;i<r.L.length;i++)r.L[i]*=gv}else{for(let i=0;i<r.L.length;i++){r.L[i]*=gv;r.R[i]*=gv}}}
  if(r.gr)res.gr[k+1]=r.gr;if(r.gr2)res.gr2[k+1]=r.gr2;if(r.dsgr)(res.ds=res.ds||{})[k+1]=r.dsgr;bufs.push([r.L,r.R]);
  const n=r.L.length,a=Math.round(n*2/3);let s=0;for(let i=a;i<n;i++)s+=(r.L[i]*r.L[i]+r.R[i]*r.R[i])/2;res.tr[k+1]=10*Math.log10(s/(n-a)+1e-20)}
 /* v11.20: バス(over.bm={A:{iCp*},B:…})。o.out が A/B/C のトラックを足してバスのCOMPを通す(EQ・並びは通さない。R=L の近似) */
 if(over&&over.bm){const grp={};L.tk.forEach((t,k)=>{const o=t.o.out,n=typeof o==='string'?'ABC'.indexOf(o)+1:(o|0);if(n>=1&&n<=3)(grp[n]=grp[n]||[]).push(k)});
  Object.keys(grp).forEach(n=>{const nm='ABC'[n-1],bp=over.bm[nm],idx=grp[n],len=bufs[idx[0]][0].length,sum=new Float32Array(len);idx.forEach(k=>{const b=bufs[k][0];for(let i=0;i<len;i++)sum[i]+=b[i]});
   let y=sum;if(bp&&bp.iCpOn==1){const m=Object.assign({},SD.MIXDEF(),bp),cq={};Object.keys(CPMAP).concat(['iCpMake']).forEach(q=>{cq[q]=m[q]});const r=runComp(sum,cq,null);y=r.y;(res.grBus=res.grBus||{})[nm]=r.gr}
   idx.forEach((k,j)=>{bufs[k]=j===0?[y,y]:[new Float32Array(len),new Float32Array(len)]})})}
 const n=bufs[0][0].length,a=Math.round(n*2/3);let s=0,pk=0;for(let i=a;i<n;i++){let l=0,r=0;bufs.forEach(b=>{l+=b[0][i];r+=b[1][i]});s+=(l*l+r*r)/2;pk=Math.max(pk,Math.abs(l),Math.abs(r))}
 res.rms=10*Math.log10(s/(n-a)+1e-20);res.peak=pk;return res}
/* GR の報告列(20Hz)に、アプリの目標判定(100msごとに最新の値を見て MixGoal.hold)を当てはめ、いつか達成できるか(ループ3回分のうち最後の2回で) */
function mtReachable(SD,gr,rng,hold){const st={ok:0,bad:0},per=Math.round(gr.length/3);let met=false;
 for(let i=per;i<gr.length;i+=2){const v=gr[i];met=SD.MixGoal.hold(st,SD.MixGoal.inRange(v,rng),.1,hold)||met}return met}

/* つまみの範囲の「まん中」(対数カーブは幾何平均) */
function midOf(SD,k,rng){const p=SD.INSP.find(q=>q.id===k);const m=p&&p.curve==='log'?Math.sqrt(rng[0]*rng[1]):(rng[0]+rng[1])/2;return +m.toPrecision(3)}
/* ステップ si(0始まり)の「目標どおりに動かした状態」: 最初の状態に、0..si の mx 目標のまん中を順に当てはめる({トラック番号:{iCp*}}) */
function stateAt(SD,L,si){const st={};L.tk.forEach((x,k)=>{st[k+1]=Object.assign({},SD.mxToMix(x.o.mx))});
 for(let i=0;i<=si;i++)(L.steps[i].mx||[]).forEach(g=>{if(g.trk&&g.k){st[g.trk]=st[g.trk]||{};st[g.trk][g.k]=midOf(SD,g.k,g.rng)}});return st}
/* 聞き比べの各案の測定: {level(dB), ...}。tm があれば最初の状態に重ねる */
async function cmpLevels(SD,L,st,useVol){const out=[];for(const v of st.cmp||[]){if(!v.tm&&!v.bm&&!v.mt){out.push(null);continue}const o=Object.assign({},v.tm||{},v.bm?{bm:v.bm}:{},v.mt?{mute:v.mt}:{});
  if(useVol){const vol={};L.tk.forEach((x,k)=>{const tv=(v.tm&&v.tm[k+1]&&v.tm[k+1].tVol!==undefined)?v.tm[k+1].tVol:(x.o.mix&&x.o.mix.tVol!==undefined?x.o.mix.tVol:1);vol[k+1]=tv});o.vol=vol}/* v11.25: VOL も反映(任意) */
  const r=await measure(SD,L,o);out.push(r.rms)}return out}
const trackDryX=(SD,L,t,loops)=>{SDg=SD;return trackDry(L,t,loops)};
module.exports={runDs,runProc,runChain,renderNote,procs,loadSD,measure,runComp,mtReachable,midOf,stateAt,cmpLevels,trackDry:trackDryX,OAC,hasRender:!!OAC,SR};
