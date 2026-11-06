/* v14.1 HM-0 HM ハモリの作り方コース用の表(SD.HMT 音程の型・SD.HMR 禁則表・SD.HMC 定旋律・SD.HMM お手本)と関数(SD.HMH)。
   純粋関数・決定的・乱数なし。仕様: docs/SPEC_HM_harmony_course.md
   音は [st,len,r]。st・len は16分単位、r は C4=60 からの半音(KEY=C 基準。KEY は o.tr=24+key で移調)。
   scaleNotes・track は SD.MEH(meh.js)を再利用する。すべてオリジナル。本文に年号・人名・曲名・機種名・流派名は書かない */
(function(){
 var mod=function(x){return ((x%12)+12)%12};
 var P=function(t){return t.trim().split(/\s+/).map(function(x){return x.split(':').map(Number)})};
 var sgn=function(x){return x>0?1:x<0?-1:0};

 /* 音程の型。deg=スケール内の音度ずらし(+上・-下)。semi=結果の半音数(絶対値)の取りうる値(メジャー内)。oct は12半音ちょうど */
 var T=function(id,n,tier,deg,semi,feel,o){o=o||{};return {id:id,n:n,tier:tier,deg:deg,semi:semi,feel:feel,oct:!!o.oct}};
 var HMT=[
  T('uni','ユニゾン',1,0,[0],'太い・同じ'),
  T('octu','オクターブ上',1,0,[12],'同じ音に聞こえる・厚い',{oct:1}),
  T('octd','オクターブ下',1,0,[12],'同じ音に聞こえる・厚い',{oct:1}),
  T('t3u','3度上',1,2,[3,4],'甘い・明るい'),
  T('t3d','3度下',1,-2,[3,4],'落ち着く・土台'),
  T('s6u','6度上',1,5,[8,9],'広がる・軽い'),
  T('s6d','6度下',1,-5,[8,9],'広く温かい'),
  T('p5u','5度上',1,4,[6,7],'空っぽ・強い'),
  T('p5d','5度下',1,-4,[6,7],'力強い・太い'),
  T('p4u','4度上',2,3,[5,6],'2声では注意'),
  T('p4d','4度下',2,-3,[5,6],'2声では注意')];
 HMT.forEach(function(t){if(t.id==='octu')t.o=12;if(t.id==='octd')t.o=-12});

 /* 禁則表(基準。教本で差があるため docs/HM0_audit.md に採用理由を書く)。kind は check が返す種類 */
 var R=function(id,n,tier,kind,note){return {id:id,n:n,tier:tier,kind:kind,note:note}};
 var HMR=[
  R('par5','並行5度',3,'par5','連続する2つの音程がどちらも完全5度で、同じ方向に動く'),
  R('par8','並行8度・ユニゾン',3,'par8','連続する2つの音程がどちらもオクターブ(ユニゾン)で、同じ方向に動く'),
  R('hid','隠伏(直行)5度・8度',3,'hid','同じ方向に動いて完全5度かオクターブに着く(基準=上の声が跳躍で着くとき)'),
  R('cross','声部の交差',2,'cross','上の声が下の声より低くなる'),
  R('overlap','声部の飛び越え',3,'overlap','上の声が下の声の直前の音より低い音へ行く(またはその逆)'),
  R('uni','途中のユニゾン',3,'uni','第1種で始め・終わり以外にユニゾンを使う'),
  R('start','始まり',3,'start','完全協和で始める(下に置くときはユニゾンかオクターブ)'),
  R('end','終わり',3,'end','ユニゾンかオクターブで終える'),
  R('leap','跳躍の制限',3,'leap','増音程・7度の跳躍と、オクターブを超える跳躍を避ける'),
  R('par36','3度・6度の連続数',3,'par36','3度か6度の並行は決めた回数まで(基準=4回)'),
  R('dis','強拍の不協和',3,'dis','強い拍には協和音程だけを置く'),
  R('susp','掛留',3,'susp','協和→タイ→強拍で不協和→下へ順次進行で解決(check の susp で判定。上の声の掛留のみ)'),
  R('p4','2声での4度',3,'dis','2声のみのとき完全4度は不協和として扱う(kind の two で切り替え)')];

 /* 定旋律: 1音=8ステップ。8音以下・先頭と末尾は主音(0)・最高音は1か所・終わりは順次進行・同じ音は連続しない */
 var C=function(id,n,sc,notes){return {id:id,n:n,sc:sc,len:8,notes:notes.map(function(r,i){return [i*8,8,r]})}};
 var HMC=[
  C('cf1','メジャーの定旋律','major',[0,2,4,5,7,5,2,0]),
  C('cf2','ドリアンの定旋律','dorian',[0,2,3,5,7,5,2,0]),
  C('cf3','メジャーの定旋律(別)','major',[0,4,5,7,5,4,2,0])];

 /* 音程 */
 var NM={0:['ユニゾン',1,'perfect'],1:['短2度',2,'minor'],2:['長2度',2,'major'],3:['短3度',3,'minor'],4:['長3度',3,'major'],5:['完全4度',4,'perfect'],
  6:['増4度(減5度)',4,'aug'],7:['完全5度',5,'perfect'],8:['短6度',6,'minor'],9:['長6度',6,'major'],10:['短7度',7,'minor'],11:['長7度',7,'major']};
 var interval=function(a,b){var s=Math.abs(a-b),m=s%12,e=NM[m],oc=Math.floor(s/12);
  if(s===12)return {semi:12,simple:0,name:'オクターブ',degree:8,quality:'perfect',compound:false};
  if(s>12&&m===0)return {semi:s,simple:0,name:oc+'オクターブ',degree:8,quality:'perfect',compound:true};
  return {semi:s,simple:m,name:e[0],degree:e[1],quality:e[2],compound:s>12}};
 /* 協和の分類。o.two!==false のとき完全4度は不協和(2声の扱い) */
 var kind=function(semi,o){var m=Math.abs(semi)%12;if(m===0||m===7)return 'perfect';if(m===3||m===4||m===8||m===9)return 'imperfect';
  if(m===5)return (o&&o.two===false)?'perfect':'dissonant';return 'dissonant'};
 var gen=function(semi){var m=Math.abs(semi)%12;return m===3||m===4?3:m===8||m===9?6:m===1||m===2?2:m===10||m===11?7:m===5?4:m===7?5:m===6?4:1};
 /* 動き方。u=上の声・l=下の声の前後の音 */
 var motion=function(u1,u2,l1,l2){var du=u2-u1,dl=l2-l1;if(!du&&!dl)return 'static';if(!du||!dl)return 'oblique';
  if(sgn(du)!==sgn(dl))return 'contrary';return gen(u1-l1)===gen(u2-l2)?'parallel':'similar'};

 var SN=function(sc,key,lo,hi){return SD.MEH.scaleNotes(sc,key,lo,hi)};
 /* 型に従い、スケール内で音度をずらす(模範解答用)。スケール外の音は直下のスケール音を基準にする */
 var harmonize=function(mel,sc,typ,key){var t=HMT.filter(function(x){return x.id===typ})[0];if(!t)return [];
  var L=SN(sc,key||0,-60,84);return (mel||[]).map(function(n){var r=n[2],i=-1,j;
   if(t.oct)return [n[0],n[1],r+t.o];
   for(j=0;j<L.length;j++){if(L[j]<=r)i=j;else break}
   if(i<0)return [n[0],n[1],r];var k=i+t.deg;k=Math.max(0,Math.min(L.length-1,k));return [n[0],n[1],L[k]]})};

 var snd=function(v,t){for(var i=0;i<v.length;i++)if(v[i][0]<=t&&t<v[i][0]+v[i][1])return v[i][2];return null};
 var pairs=function(a,b,unit){var ts={};a.concat(b).forEach(function(n){ts[n[0]]=1});
  return Object.keys(ts).map(Number).sort(function(x,y){return x-y}).filter(function(t){return !unit||t%unit===0}).map(function(t){return {t:t,m:snd(a,t),h:snd(b,t)}})
   .filter(function(p){return p.m!==null&&p.h!==null})};

 /* 検査(2声)。main・harm=[[st,len,r],…]。常に: out・cross・overlap・par5・par8・hid・leap。
    オプション: maxDist/minDist=range・uni・start・end・max36=par36・maxPar=parrun・dis=強拍の単位ステップ・chordAt=strong・unit=比べる時刻の間隔・hidStrict。
    戻り値は [{kind,t}]。susp=強拍の単位ステップ(掛留の検査。上の声が強拍をまたいで保持して不協和になるとき、準備=保持の頭が協和・解決=直後に下へ1〜2半音で協和、を満たさないと出る。強拍に新しく打つ不協和も出る) */
 var check=function(main,harm,sc,o){o=o||{};main=main||[];harm=harm||[];var out=[],S=sc?SD.SCALES[sc]:null,k=mod(o.key|0),ex=o.extra||[],add=function(kd,t){out.push({kind:kd,t:t})};
  [main,harm].forEach(function(v){v.forEach(function(n,i){if(S&&S.indexOf(mod(n[2]-k))<0&&ex.indexOf(mod(n[2]-k))<0)add('out',n[0]);
   if(i){var d=Math.abs(n[2]-v[i-1][2]),mx=o.maxLeap===undefined?12:o.maxLeap;if(d===6||d===10||d===11||d>mx)add('leap',n[0])}})});
  var ps=pairs(main,harm,o.unit),ref=0,prev=0;
  ps.forEach(function(p,i){var d=Math.abs(p.m-p.h);
   if(o.maxDist!==undefined&&d>o.maxDist)add('range',p.t);if(o.minDist!==undefined&&d<o.minDist)add('range',p.t);
   if(i===0){ref=sgn(p.m-p.h);prev=ref;return}
   var g=sgn(p.m-p.h);if(g&&!prev)prev=g;
   var q=ps[i-1],s1=Math.abs(q.m-q.h),s2=d,dm=p.m-q.m,dh=p.h-q.h,same=dm*dh>0,crossed=g!==0&&prev!==0&&g!==prev;
   if(crossed)add('cross',p.t);if(g)prev=g;
   var s0=sgn(q.m-q.h);if(s0&&!crossed&&(s0*(p.m-q.h)<0||s0*(q.m-p.h)<0))add('overlap',p.t);
   if(same&&s1%12===7&&s2%12===7)add('par5',p.t);
   if(same&&s1%12===0&&s2%12===0)add('par8',p.t);
   if(same&&((s2%12===7&&s1%12!==7)||(s2%12===0&&s1%12!==0))){var up=(p.m>=p.h)?dm:dh;if(o.hidStrict||Math.abs(up)>2)add('hid',p.t)}});
  if(o.uni)ps.forEach(function(p,i){if(i>0&&i<ps.length-1&&p.m===p.h)add('uni',p.t)});
  if(o.start&&ps.length){var f=ps[0],sm=Math.abs(f.m-f.h)%12,lowerHarm=f.h<f.m;if(!(sm===0||(!lowerHarm&&sm===7)))add('start',f.t)}
  if(o.end&&ps.length){var e=ps[ps.length-1];if(Math.abs(e.m-e.h)%12!==0)add('end',e.t)}
  if(o.max36!==undefined){var c=0;ps.forEach(function(p,i){var g3=gen(p.m-p.h),ok=g3===3||g3===6;
   if(i&&ok&&g3===gen(ps[i-1].m-ps[i-1].h)&&(p.m-ps[i-1].m)*(p.h-ps[i-1].h)>0)c++;else c=ok?1:0;if(c>o.max36)add('par36',p.t)})}
  if(o.maxPar!==undefined){var r=0;ps.forEach(function(p,i){if(i&&(p.m-ps[i-1].m)*(p.h-ps[i-1].h)>0&&gen(p.m-p.h)===gen(ps[i-1].m-ps[i-1].h))r++;else r=0;if(r>o.maxPar)add('parrun',p.t)})}
  if(o.dis)ps.forEach(function(p){if(p.t%o.dis===0&&kind(p.m-p.h,{two:o.two})==='dissonant')add('dis',p.t)});
  if(o.susp){var u=o.susp;ps.forEach(function(p){if(p.t%u||kind(p.m-p.h,{two:o.two})!=='dissonant')return;var j=-1;harm.forEach(function(n,i){if(n[0]<=p.t&&p.t<n[0]+n[1])j=i});if(j<0)return;var n=harm[j];
   if(n[0]===p.t){add('susp',p.t);return}
   var pm=snd(main,n[0]),nx=harm[j+1],ok=pm!==null&&kind(pm-n[2],{two:o.two})!=='dissonant'&&!!nx&&nx[0]===n[0]+n[1]&&(nx[2]-n[2]===-1||nx[2]-n[2]===-2);
   if(ok){var qm=snd(main,nx[0]);ok=qm!==null&&kind(qm-nx[2],{two:o.two})!=='dissonant'}if(!ok)add('susp',p.t)})}
  if(o.chordAt)SD.MEH.check(harm,{chordAt:o.chordAt}).forEach(function(x){if(x.kind==='strong')add('strong',x.st)});
  return out};

 /* 定旋律(sc が合うものを idx 番目〔循環〕。乱数なし) */
 var cantus=function(sc,idx){var L=HMC.filter(function(c){return c.sc===sc});if(!L.length)return null;var c=L[((idx|0)%L.length+L.length)%L.length];return {id:c.id,n:c.n,sc:c.sc,len:c.len,notes:c.notes.map(function(n){return n.slice()})}};
 /* 種別の対旋律の枠 [[st,len,tie]]。定旋律1音=8ステップ。第4種は2音目をタイ(前の音から保持)、第5種は 4+2+2 の混合 */
 var SP={1:[[0,8]],2:[[0,4],[4,4]],3:[[0,2],[2,2],[4,2],[6,2]],4:[[0,4],[4,4,1]],5:[[0,4],[4,2],[6,2]]};
 var species=function(cf,kd){var sp=SP[kd];if(!sp)return [];var out=[];(cf.notes||cf).forEach(function(n){sp.forEach(function(s){out.push(s[2]?[n[0]+s[0],s[1],1]:[n[0]+s[0],s[1]])})});return out};

 var track=function(mel,key,o){return SD.MEH.track(mel,key,o)};
 var tracks=function(main,harm,key,o){o=o||{};var a=SD.MEH.track(main,key,{len:o.len,sc:o.sc,name:o.nameMain||'主旋律',p:o.p}),b=SD.MEH.track(harm,key,{len:o.len,sc:o.sc,name:o.nameHarm||'ハモリ',p:o.p});return [a,b]};

 /* お手本(HM-0 は動作確認用の3本。HM-1 以降で増やす)。harm は harmonize で作る(型 typ)。bad=禁則の違反例 */
 var M=function(id,n,sc,tier,typ,main,tip,bad,okk){var m=P(main);return {id:id,n:n,sc:sc,tier:tier,bars:2,main:m,harm:harmonize(m,sc,typ,0),typ:typ,tip:tip,bad:!!bad,ok:okk||[]}};
 var A='0:4:4 4:4:5 8:4:7 12:4:5 16:4:4 20:4:2 24:8:0';
 var B='0:4:7 4:2:9 6:2:7 8:4:4 12:2:5 14:2:4 16:4:2 20:4:4 24:8:0';
 var HMM=[
  M('ha1','3度上でそろえる','major',1,'t3u',A,'同じ動きで、スケールの音を2つ上にずらす。'),
  M('ha2','6度下で支える','major',1,'s6d',A,'下に広げて、土台を作る。'),
  M('ha3','3度下で支える','major',1,'t3d',A,'下に足すと、落ち着く。'),
  M('ha4','3度上(別の旋律)','major',1,'t3u',B,'長い3度と短い3度が混ざる。'),
  M('ha5','6度上で広げる','major',1,'s6u',B,'3度より広がって聞こえる。'),
  M('ha6','ユニゾン重ね','major',1,'uni',A,'同じ高さを重ねて太くする。',false,['par8']),
  M('ha7','オクターブ上','major',1,'octu',B,'同じ音に聞こえる高さを足す。',false,['par8']),
  M('ha8','オクターブ下','major',1,'octd',A,'低くして土台にする。',false,['par8']),
  M('hb1','5度が続く例(悪い例)','major',3,'p5u',A,'2つの声が1つに溶けて聞こえる。',true)];

 SD.HMT=HMT;SD.HMR=HMR;SD.HMC=HMC;SD.HMM=HMM;
 SD.HMH={interval:interval,kind:kind,motion:motion,harmonize:harmonize,check:check,cantus:cantus,species:species,track:track,tracks:tracks,gen:gen,P:P};
})();
