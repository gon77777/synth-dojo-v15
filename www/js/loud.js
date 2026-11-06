/* 計測(M-1)。SD.LOUD=ラウドネス・トゥルーピーク(近似)・相関・バランス・モノ差・VU(近似)の純粋関数。
   DOM・保存・他のファイルに依存しない。M-1 ではどこからも呼ばない(配線は M-3)。
   他の測定器との突き合わせは未確認(合成信号での検査のみ)。
   流れ: Front(fs) が左右の音から 100ms ごとのフレームを作る → acc() の状態に push → read() で表示用の値。
   フレーム f={kl,kr,km,ll,rr,lr,sp,tp}(すべて線形・100ms 区間の平均二乗/最大)
     kl/kr=K特性後の L/R の平均二乗 ・ km=K特性後の (L+R)/2 の平均二乗 ・ ll/rr/lr=生の L²/R²/L·R の平均 ・ sp=サンプルピーク ・ tp=トゥルーピーク(近似) */
(function(){
 var L=SD.LOUD={};
 var FRAME_SEC=.1,M_N=4,S_N=30,OFFSET=-.691,ABS_GATE=-70,REL_GATE=-10,LRA_GATE=-20,LRA_MIN_FR=100,CORR_N=3;
 L.FRAME_SEC=FRAME_SEC;L.OFFSET=OFFSET;
 /* VU の基準レベル(RMS の dBFS)。先頭が既定。画面で選べる目安 */
 L.VUREF=[-18,-14,-20];
 /* 目標ラウドネスの目安。値は docs/LM_targets.md に出典と取得日。名前に団体名・サービス名は書かない。
    tp=ピークの上限の目安(dBTP)・tpLoud=平均がこの目標より大きいときの上限の目安 */
 L.TARGETS=[
  {id:'broadcast',name:'放送向け',lufs:-23,tp:-1},
  {id:'stream',name:'配信向け(標準)',lufs:-14,tp:-1,tpLoud:-2},
  {id:'streamLoud',name:'配信向け(再生側の大きめ設定)',lufs:-11,kind:'playback'},
  {id:'streamQuiet',name:'配信向け(再生側の小さめ設定)',lufs:-19,kind:'playback'}];
 L.TARGETS_ASOF='2026-11-05';
 L.target=function(id){for(var i=0;i<L.TARGETS.length;i++)if(L.TARGETS[i].id===id)return L.TARGETS[i];return null};
 var log10=function(x){return Math.log(x)/Math.LN10};
 L.db=function(p){return p>0?10*log10(p):-Infinity};      /* 電力→dB */
 L.dbA=function(a){return a>0?20*log10(a):-Infinity};     /* 振幅→dB */
 L.lufsOf=function(z){return z>0?OFFSET+10*log10(z):-Infinity};
 L.crest=function(peakDb,rmsDb){return isFinite(peakDb)&&isFinite(rmsDb)?peakDb-rmsDb:null};
 /* ---- K特性(2段のバイカッド)。係数は公表されている形の式から fs ごとに計算 ---- */
 L.kCoef=function(fs){
  var G=3.999843853973347,Q1=.7071752369554196,f1=1681.9744509555319,Q2=.5003270373253953,f2=38.13547087613982;
  var K=Math.tan(Math.PI*f1/fs),Vh=Math.pow(10,G/20),Vb=Math.pow(Vh,.499666774155),a0=1+K/Q1+K*K;
  var sh={b:[(Vh+Vb*K/Q1+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q1+K*K)/a0],a:[1,2*(K*K-1)/a0,(1-K/Q1+K*K)/a0]};
  var k2=Math.tan(Math.PI*f2/fs),c0=1+k2/Q2+k2*k2;
  var hp={b:[1,-2,1],a:[1,2*(k2*k2-1)/c0,(1-k2/Q2+k2*k2)/c0]};
  return{sh:sh,hp:hp}};
 var bq=function(c){return{b0:c.b[0],b1:c.b[1],b2:c.b[2],a1:c.a[1],a2:c.a[2],x1:0,x2:0,y1:0,y2:0}};
 var bqRun=function(s,x){var y=s.b0*x+s.b1*s.x1+s.b2*s.x2-s.a1*s.y1-s.a2*s.y2;s.x2=s.x1;s.x1=x;s.y2=s.y1;s.y1=y;return y};
 var kNew=function(k){return{s:bq(k.sh),h:bq(k.hp)}};
 var kRun=function(f,x){return bqRun(f.h,bqRun(f.s,x))};
 L.kGain=function(fs,hz){ /* K特性の振幅ゲイン(dB)。検査用 */
  var k=L.kCoef(fs),w=2*Math.PI*hz/fs,re=Math.cos(w),im=-Math.sin(w),re2=Math.cos(2*w),im2=-Math.sin(2*w);
  var ev=function(c){var nr=c.b[0]+c.b[1]*re+c.b[2]*re2,ni=c.b[1]*im+c.b[2]*im2,dr=1+c.a[1]*re+c.a[2]*re2,di=c.a[1]*im+c.a[2]*im2;
   return Math.sqrt((nr*nr+ni*ni)/(dr*dr+di*di))};
  return L.dbA(ev(k.sh)*ev(k.hp))};
 /* ---- トゥルーピーク(近似): 4倍オーバーサンプル。49タップの窓つきsinc(中心24・遅れ6サンプル) ---- */
 var TPH=(function(){var h=[],N=49,i,x,w;for(i=0;i<N;i++){x=(i-24)/4;w=.5+.5*Math.cos(Math.PI*(i-24)/25);h[i]=(x===0?1:Math.sin(Math.PI*x)/(Math.PI*x))*w}return h})();
 var TPN=13;
 var tpNew=function(){return{h:new Float64Array(TPN),i:0}};
 var tpPush=function(s,x){ /* x を入れて、4つの位相の絶対値の最大を返す(位相0=元のサンプル) */
  s.i=(s.i+TPN-1)%TPN;s.h[s.i]=x;var m=0,p,k,a,v;
  for(p=0;p<4;p++){a=0;for(k=0;k<TPN;k++){v=4*k+p;if(v<49)a+=TPH[v]*s.h[(s.i+k)%TPN]}a=a<0?-a:a;if(a>m)m=a}
  return m};
 /* ---- フロント: 音(L・R の Float32Array)→ 100ms ごとのフレーム。ワークレットと同じ計算の基準(M-2 で照合する) ---- */
 L.Front=function(fs,onFrame){
  var k=L.kCoef(fs),fl=kNew(k),fr=kNew(k),fm=kNew(k),tl=tpNew(),tr=tpNew(),N=Math.round(fs*FRAME_SEC),n=0;
  var a={kl:0,kr:0,km:0,ll:0,rr:0,lr:0,sp:0,tp:0};
  var self={fs:fs,block:N,
   process:function(l,r){
    var i,x,y,u,v,t;
    for(i=0;i<l.length;i++){
     x=l[i];y=r?r[i]:x;if(!(x===x))x=0;if(!(y===y))y=0;
     u=kRun(fl,x);v=kRun(fr,y);t=kRun(fm,(x+y)*.5);
     a.kl+=u*u;a.kr+=v*v;a.km+=t*t;a.ll+=x*x;a.rr+=y*y;a.lr+=x*y;
     t=Math.max(Math.abs(x),Math.abs(y));if(t>a.sp)a.sp=t;
     t=Math.max(tpPush(tl,x),tpPush(tr,y));if(t>a.tp)a.tp=t;
     if(++n===N){a.kl/=N;a.kr/=N;a.km/=N;a.ll/=N;a.rr/=N;a.lr/=N;onFrame(a);a={kl:0,kr:0,km:0,ll:0,rr:0,lr:0,sp:0,tp:0};n=0}}}};
  return self};
 /* ---- 蓄積と読み出し ---- */
 L.acc=function(){return{__acc:1,fr:[],n:0,zM:[],zS:[],sp:0,tp:0,vu1:0,vu2:0,vuOk:0}};
 L.reset=function(s){s.fr.length=0;s.n=0;s.zM.length=0;s.zS.length=0;s.sp=0;s.tp=0;s.vu1=0;s.vu2=0;s.vuOk=0;return s};
 var VU_W=22.1295; /* 2次(臨界減衰)の ω。ステップ応答が 0.3秒で 99% (1-(1+u)e^-u=.99 → u=6.6384) */
 var sumOf=function(a,key,n){var s=0,i;for(i=a.length-n;i<a.length;i++)s+=a[i][key];return s};
 L.push=function(s,f,fs){
  s.fr.push(f);if(s.fr.length>S_N)s.fr.shift();s.n++;
  if(f.sp>s.sp)s.sp=f.sp;if(f.tp>s.tp)s.tp=f.tp;
  if(s.fr.length>=M_N)s.zM.push((sumOf(s.fr,'kl',M_N)+sumOf(s.fr,'kr',M_N))/M_N);
  if(s.fr.length>=S_N)s.zS.push((sumOf(s.fr,'kl',S_N)+sumOf(s.fr,'kr',S_N))/S_N);
  /* VU(近似): 100ms ごとの RMS を 2次の遅れで平滑化(区間ごとに厳密な離散化) */
  var u=Math.sqrt((f.ll+f.rr)/2),T=FRAME_SEC,a=Math.exp(-VU_W*T),y1=s.vu1,y2=s.vu2;
  s.vu2=a*y2+(1-a)*u+(y1-u)*VU_W*T*a;s.vu1=a*y1+(1-a)*u;s.vuOk=1;return s};
 /* ゲート付きの全体ラウドネス(I)。zM=400ms ブロックの電力の並び */
 L.integrated=function(zM){
  var i,n=0,sum=0,thr=Math.pow(10,(ABS_GATE-OFFSET)/10),z;
  for(i=0;i<zM.length;i++)if(zM[i]>thr){sum+=zM[i];n++}
  if(!n)return null;
  var rel=L.lufsOf(sum/n)+REL_GATE,rthr=Math.pow(10,(rel-OFFSET)/10),s2=0,n2=0;
  for(i=0;i<zM.length;i++){z=zM[i];if(z>thr&&z>rthr){s2+=z;n2++}}
  return n2?L.lufsOf(s2/n2):null};
 var pct=function(a,p){var i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return a[lo]+(a[hi]-a[lo])*(i-lo)};
 /* ラウドネスレンジ。zS=3秒ブロックの電力の並び。10秒未満は null */
 L.lra=function(zS,frames){
  if(frames<LRA_MIN_FR||!zS.length)return null;
  var i,n=0,sum=0,thr=Math.pow(10,(ABS_GATE-OFFSET)/10);
  for(i=0;i<zS.length;i++)if(zS[i]>thr){sum+=zS[i];n++}
  if(!n)return null;
  var rthr=Math.pow(10,(L.lufsOf(sum/n)+LRA_GATE-OFFSET)/10),v=[];
  for(i=0;i<zS.length;i++)if(zS[i]>thr&&zS[i]>rthr)v.push(L.lufsOf(zS[i]));
  if(v.length<2)return null;
  v.sort(function(a,b){return a-b});
  return pct(v,.95)-pct(v,.10)};
 /* 読み出し。opt.vuRef=VU の基準(RMS の dBFS・既定 L.VUREF[0])。数値にできないものは null */
 L.read=function(s,opt){
  var ref=opt&&typeof opt.vuRef==='number'?opt.vuRef:L.VUREF[0],r={},fin=function(x){return isFinite(x)?x:null},fr=s.fr,n=fr.length;
  r.lufsM=n>=M_N?fin(L.lufsOf((sumOf(fr,'kl',M_N)+sumOf(fr,'kr',M_N))/M_N)):null;
  r.lufsS=n>=S_N?fin(L.lufsOf((sumOf(fr,'kl',S_N)+sumOf(fr,'kr',S_N))/S_N)):null;
  r.lufsI=L.integrated(s.zM);
  r.lra=L.lra(s.zS,s.n);
  r.sp=fin(L.dbA(s.sp));r.tp=fin(L.dbA(Math.max(s.tp,s.sp)));
  r.plr=r.tp!=null&&r.lufsI!=null?r.tp-r.lufsI:null;
  r.vu=s.vuOk&&s.vu2>1e-9?L.dbA(s.vu2)-ref:null;
  var c=Math.min(n,CORR_N),ll=n?sumOf(fr,'ll',c):0,rr=n?sumOf(fr,'rr',c):0,lr=n?sumOf(fr,'lr',c):0;
  r.corr=n&&ll>1e-12&&rr>1e-12?Math.max(-1,Math.min(1,lr/Math.sqrt(ll*rr))):null;
  r.bal=n&&ll>1e-12&&rr>1e-12?L.db(ll/rr):null;     /* L−R(dB)。+ なら L が大きい */
  if(n>=S_N){var zs=(sumOf(fr,'kl',S_N)+sumOf(fr,'kr',S_N))/S_N,zm=2*sumOf(fr,'km',S_N)/S_N,fl=Math.pow(10,(ABS_GATE-OFFSET)/10);
   r.mdiff=zs>fl?L.lufsOf(zs)-Math.max(L.lufsOf(zm),ABS_GATE):null}   /* ステレオ − モノにたたんだとき(両ch同じ)。下限は −70 LUFS */
  else r.mdiff=null;
  return r};
 /* ゴール判定用の取り出し(M-5 で mt の m に使う)。s は acc でも read の結果でもよい。bal は絶対値 */
 L.KEYS=['lufsM','lufsS','lufsI','tp','plr','corr','bal','mdiff'];
 L.pick=function(s,m,opt){
  if(L.KEYS.indexOf(m)<0)return null;
  var r=s&&s.__acc?L.read(s,opt):s,v=r?r[m]:null;
  if(typeof v!=='number'||!isFinite(v))return null;
  return m==='bal'?Math.abs(v):v};
})();
