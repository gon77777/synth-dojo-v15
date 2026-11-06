/* v12.1 X-0 BL ベースライン用の共通ヘルパー(SD.BLH)と ジャンル表(SD.BLG)。純粋関数・決定的・乱数なし。
   トラックの形は既存と同じ {id,idx,o}。2小節用は o.len=32(レッスンに meter:{n:8,d:4})。
   ベースの音は「C2=MIDI36 からの半音 r」(低音は負も可)、メロディの音は「C4=MIDI60 からの半音」で持つ(MUH と同じ)。
   和音は [根音オフセット, 種類] の配列(種類は SD.CHORDS の id)。1小節 = 和音の配列(1〜2個)。 */
(function(){
 var BASS=36,MEL=60,LO=28,HI=52,RLO=LO-BASS,RHI=HI-BASS;
 var mod=function(x){return ((x%12)+12)%12};
 var kk=function(k){return mod(k|0)};
 var cdef=function(t){return SD.CHORDS.find(function(c){return c.id===t})||null};
 var ch=function(c){return Array.isArray(c)?{r:c[0],t:c[1]}:c};
 var BASSP={o1Wave:'sawtooth',o1Lvl:.38,subLvl:.3,o2Lvl:0,noiseLvl:0,cutoff:700,res:0,envAmt:0,drive:0,aA:.003,aD:.2,aS:.6,aR:.08};
 var MAJ=[0,2,4,5,7,9,11];

 /* 和音の構成音(根音からの半音。1・3・5・7度の順。三和音は3つ) */
 var tones=function(c){c=ch(c);var d=cdef(c.t);return d?d.iv.slice(0,4).map(mod):[]};
 /* その音の役目。note は半音(KEY=C基準なので MIDI 番号でもよい)。root/3rd/5th/7th/scale(Cメジャーの音)/chrom */
 var role=function(note,c){c=ch(c);var iv=tones(c),rel=mod(note-c.r),i=iv.indexOf(rel);
  if(i>=0)return ['root','3rd','5th','7th'][i];return MAJ.indexOf(mod(note))>=0?'scale':'chrom'};
 /* アプローチ音。kind='semi'|'whole'、dir=-1(下から)/1(上から) */
 var approach=function(target,kind,dir){var d=kind==='whole'?2:1;return target+(dir>0?d:-d)};

 /* 根音を低い音域(-8〜3 = MIDI28〜39)に置く */
 var rootLow=function(r){return mod(r+8)-8};
 /* pc に近いオクターブ(音域内で prev に最も近い。同点は低い方) */
 var nearest=function(pc,prev){var best=null;for(var p=RLO;p<=RHI;p++){if(mod(p)!==mod(pc))continue;if(best===null||Math.abs(p-prev)<Math.abs(best-prev))best=p}return best};

 /* prog(小節の配列)を和音の列に。bar は [[r,t]] か [[r,t],[r,t]](または {c:[…]})。bl=1小節のステップ数 */
 var flat=function(prog,bl){bl=bl||16;var o=[];(prog||[]).forEach(function(bar,b){var cs=(bar&&bar.c)||bar,n=Math.min(2,cs.length);
  for(var i=0;i<n;i++)o.push({r:cs[i][0],t:cs[i][1],st:b*bl+(n===1?0:i*bl/2),len:bl/n,bar:b})});return o};
 var chordFn=function(prog,bl){var fl=flat(prog,bl);return function(st){for(var i=fl.length-1;i>=0;i--)if(st>=fl[i].st)return [fl[i].r,fl[i].t];return null}};
 var nextRoot=function(T,fl,i,loop){return i+1<fl.length?T[i+1]:nearest(fl[0].r,T[T.length-1])};
 var rootSeq=function(fl){var T=[],prev=null;fl.forEach(function(c,i){var p=prev===null?rootLow(c.r):nearest(c.r,prev);T.push(p);prev=p});return T};

 /* ウォーキング(§4.3)。戻り値 [[st,len,r],…](4分音符×4/小節。1小節=16ステップ) */
 var walk=function(prog,o){o=o||{};var bl=o.bl||16,fl=flat(prog,bl),T=rootSeq(fl),out=[],leap=o.leap||5,bars={};
  fl.forEach(function(c,i){(bars[c.bar]=bars[c.bar]||[]).push(i)});
  Object.keys(bars).map(Number).sort(function(a,b){return a-b}).forEach(function(b){
   var ix=bars[b],i0=ix[0],c0=fl[i0],b1=T[i0],lastIdx=ix[ix.length-1],Tn=nextRoot(T,fl,lastIdx),dir=(Math.floor(b/2)%2===0)?1:-1,
       b2,b3,b4,best=null,
       inR=function(p){return p>=RLO&&p<=RHI},
       dirV=function(d,want){return d===0?1:(d>0)===(want>0)?0:1};
   var cand4=function(from,T0,sameRoot,tone5,tone7){var a=[];
    if(sameRoot){for(var p=Tn-8;p<=Tn+8;p++){if(!inR(p)||p===Tn)continue;if(mod(p)===tone5||mod(p)===tone7)a.push(p)}
     a.sort(function(x,y){return Math.abs(x-from)-Math.abs(y-from)||x-y})}
    else{[Tn-1,Tn+1,Tn-2,Tn+2].forEach(function(p,k){if(inR(p))a.push(p)})}
    return a};
   var c4;
   if(ix.length===2){var c1=fl[ix[1]],T2=T[ix[1]];b3=T2;
    [T2-1,T2+1,T2-2,T2+2].forEach(function(p,k){if(!inR(p)||p===b1||Math.abs(p-b1)>leap)return;
     var kd=k<2?0:1,cost=dirV(p-b1,dir)*5+kd;
     cand4(b3,T2,mod(Tn-T2)===0,mod(c1.r+(tones(c1)[2]||7)),mod(c1.r+(tones(c1)[3]||10))).forEach(function(q){if(q===b3||Math.abs(q-b3)>leap)return;
      var cc=cost*10+(Math.abs(q-Tn)>1?1:0);if(best===null||cc<best.c)best={c:cc,b2:p,b4:q}})});
    if(best){b2=best.b2;b4=best.b4}}
   else{var iv=tones(c0),third=mod(c0.r+iv[1]),fifth=mod(c0.r+iv[2]),sev=iv[3]!==undefined?mod(c0.r+iv[3]):mod(c0.r+10),sameRoot=mod(Tn-b1)===0;
    for(var p2=b1-4;p2<=b1+4;p2++){if(!inR(p2)||p2===b1||Math.abs(p2-b1)<1)continue;if(role(p2,c0)==='chrom')continue;
     for(var p3=b1-12;p3<=b1+12;p3++){if(!inR(p3)||p3===b1||p3===p2||Math.abs(p3-p2)>leap)continue;if(mod(p3)!==third&&mod(p3)!==fifth)continue;
      cand4(p3,b1,sameRoot,fifth,sev).forEach(function(q){if(q===p3||Math.abs(q-p3)>leap)return;
       var cost=dirV(p2-b1,dir)*40+dirV(p3-p2,dir)*40+Math.abs(p2-b1)*3+(mod(p3)===fifth?0:1)+Math.abs(p3-p2)+(Math.abs(q-Tn)>1?2:0);
       if(best===null||cost<best.c)best={c:cost,b2:p2,b3:p3,b4:q}})}}
    if(best){b2=best.b2;b3=best.b3;b4=best.b4}}
   if(!best){/* 規則内で見つからないとき(テストで検出する)。半音で下から入る素朴な形 */
    b2=b1+(inR(b1+2)?2:-2);b3=b2;b4=Tn-1}
   var s=b*bl;out.push([s,4,b1],[s+4,4,b2],[s+8,4,b3],[s+12,4,b4])});
  return out};

 /* ジャンル表(§4.4。一般的な特徴だけ。曲名・人名・年号・起源は書かない) */
 var BLG=[
  {id:'pop',name:'ポップ・ロック',tier:1,meter:{n:4,d:4},bl:16,rhythm:'8分の連打、または4分+8分',pick:'ルート中心。小節末に5度かアプローチ1音',avoid:'細かく動いて歌とぶつかる'},
  {id:'house',name:'ハウス・ディスコ',tier:1,meter:{n:4,d:4},bl:16,rhythm:'キックの間(裏拍)にルート。オクターブ交互',pick:'ルートとオクターブ上',avoid:'キックと同時に長く鳴らす'},
  {id:'reggae',name:'レゲエ風',tier:1,meter:{n:4,d:4},bl:16,rhythm:'1拍目を空け、長い音と休符を主役に',pick:'ルートと5度。低い音域',avoid:'音を詰め込む'},
  {id:'blues',name:'ブルース(シャッフル)',tier:2,meter:{n:12,d:8},bl:24,rhythm:'3連系のノリ',pick:'1・3・5・6・♭7 の順に歩く',avoid:'4/4の8分に直して弾く'},
  {id:'funk',name:'ファンク',tier:2,meter:{n:4,d:4},bl:16,rhythm:'16分の細かい刻み。休符。短い音',pick:'ルート・オクターブ・5度。ゴーストノート',avoid:'全部の音を同じ強さで鳴らす'},
  {id:'bossa',name:'ボサ・ラテン風',tier:2,meter:{n:4,d:4},bl:16,rhythm:'3-3-2。2拍ごとに動く',pick:'ルートと5度の交互',avoid:'4分で均等に刻む'},
  {id:'walk',name:'ジャズ(ウォーキング)',tier:3,meter:{n:4,d:4},bl:16,rhythm:'4分音符',pick:'§4.3 の規則',avoid:'同じ型の繰り返し'},
  {id:'dance',name:'ダンス系(サブ+オクターブ)',tier:3,meter:{n:4,d:4},bl:16,rhythm:'16分の裏。長い音と休符',pick:'ルート固定+オクターブ',avoid:'コードごとに低音が動きすぎる'}];
 SD.BLG=BLG;

 /* 型(1小節ぶん)。[st,len,kind,acc] kind: r=根音 o=オクターブ上 5=5度上 a=次の根音へのアプローチ */
 var TPL={
  pop:[[0,2,'r'],[2,2,'r'],[4,2,'r'],[6,2,'r'],[8,2,'r'],[10,2,'r'],[12,2,'r'],[14,2,'a']],
  house:[[2,2,'r'],[6,2,'o'],[10,2,'r'],[14,2,'o']],
  reggae:[[4,4,'r'],[10,4,'5'],[14,2,'r']],
  funk:[[0,2,'r',1],[3,1,'r',0],[6,1,'o',1],[8,2,'r',1],[10,1,'r',0],[11,1,'5',1],[14,1,'r',0],[15,1,'a',1]],
  bossa:[[0,3,'r'],[3,3,'5'],[6,2,'r'],[8,3,'r'],[11,3,'5'],[14,2,'a']],
  dance:[[0,6,'r',1],[6,1,'o',0],[8,6,'r',1],[14,1,'o',0]]};
 var BLUES=[[0,0],[4,4],[7,6],[9,10],[10,12],[9,16],[7,18],[4,22]];/* [根音からの半音, ステップ]。1・3・5・6・♭7・6・5・3(12/8 の長・短)。7thコード(I7・IV7)前提 */
 /* ジャンルの型どおりに置く。戻り値 [[st,len,r,acc?],…]。o.fixed=true で最初の和音の根音に固定(dance) */
 var pattern=function(id,prog,o){o=o||{};if(id==='walk')return walk(prog,o);
  var g=BLG.find(function(x){return x.id===id});if(!g)return [];var bl=g.bl,fl=flat(prog,bl),out=[],nb=(prog||[]).length;
  var at=function(st){for(var i=fl.length-1;i>=0;i--)if(st>=fl[i].st)return i;return 0};
  var rt=function(i){return rootLow(o.fixed?fl[0].r:fl[i].r)};
  var nx=function(i,st){var b=Math.floor(st/bl),j=-1;for(var k=0;k<fl.length;k++)if(fl[k].bar===(b+1)%nb){j=k;break}return rootLow(o.fixed?fl[0].r:fl[j<0?0:j].r)};
  for(var b=0;b<nb;b++){
   if(id==='blues'){var i0=at(b*bl),r0=rt(i0);BLUES.forEach(function(x,k){out.push([b*bl+x[1],k%2?2:4,r0+x[0]])});continue}
   TPL[id].forEach(function(t){var st=b*bl+t[0],i=at(st),r=rt(i),p;
    if(t[2]==='r')p=r;else if(t[2]==='o')p=r+12;else if(t[2]==='5')p=r+7;
    else{var T=nx(i,st);p=(T-1>=RLO)?T-1:T+1}
    var n=[st,t[1],p];if(t[3]!==undefined)n.push(t[3]);out.push(n)})}
  return out};

 /* ぶつかりの検出(§4.2)。bass は C2 基準、mel は C4 基準の [st,len,r]。chordAt(st)=[r,t]|null。
    kind: 'strong'(短2度・長7度。必ず直す)/'tritone'(注意)/'low'(R4・注意)/'above'(低音がメロディ以上・注意) */
 var clash=function(bass,mel,chordAt){var out=[],seen={};
  (bass||[]).forEach(function(b,bi){var bp=b[2]+BASS;(mel||[]).forEach(function(m,mi){var mp=m[2]+MEL,s0=Math.max(b[0],m[0]),s1=Math.min(b[0]+b[1],m[0]+m[1]);if(s1<=s0)return;
   var d=mod(bp-mp),kind=null,c=chordAt?chordAt(s0):null;
   if(d===1||d===11)kind='strong';
   else if(d===6){var ok=false;if(c){var cc=ch(c),iv=tones(cc),a=mod(bp-cc.r),z=mod(mp-cc.r);ok=iv.length>3&&((a===iv[1]&&z===iv[3])||(a===iv[3]&&z===iv[1]))}if(!ok)kind='tritone'}
   else if(bp>=mp)kind='above';
   if(kind){var key=bi+'-'+mi+'-'+kind;if(!seen[key]){seen[key]=1;out.push({st:s0,kind:kind,a:bp,b:mp})}}})});
  /* R4: 低音どうし(MIDI40未満で同時・3度以内=4半音以内)。bass に重なる音が2つ以上あるとき */
  (bass||[]).forEach(function(a,i){(bass||[]).forEach(function(b,j){if(j<=i)return;var s0=Math.max(a[0],b[0]),s1=Math.min(a[0]+a[1],b[0]+b[1]);if(s1<=s0)return;
   var pa=a[2]+BASS,pb=b[2]+BASS;if(pa<40&&pb<40&&Math.abs(pa-pb)<=4&&pa!==pb)out.push({st:s0,kind:'low',a:pa,b:pb})})});
  out.sort(function(x,y){return x.st-y.st});return out};

 /* 音域(MIDI28〜52)。notes は C2 基準の [st,len,r] */
 var range=function(notes){var bad=[],mn=999,mx=-999;(notes||[]).forEach(function(n){var p=n[2]+BASS;if(p<mn)mn=p;if(p>mx)mx=p;if(p<LO||p>HI)bad.push(n)});return {ok:!bad.length,min:mn,max:mx,bad:bad}};

 /* ベース(または melody)の2小節トラック。notes=[[st,len,r,acc?],…]、st は 0〜len-1。len>1 はタイで伸ばす。
    o.len=32(既定)・o.mel=true でメロディ(C4基準)・o.p=音色・o.sc=スケール・o.bad=true で悪い例(自動検査から外す) */
 var line=function(name,notes,key,o){o=o||{};var len=o.len||32,q={},tie=[],acc=[],k=kk(key),mel=!!o.mel;
  (notes||[]).forEach(function(n){var st=n[0]|0,ln=Math.max(1,n[1]|0),r=n[2]|0;if(st<0||st>=len)return;q[st]=r;if(n[3]===1)acc.push(st);
   for(var j=1;j<ln&&st+j<len;j++){q[st+j]=r;tie.push(st+j)}});
  return {id:'bass',idx:q,o:{name:name,tr:mel?24+k:(k>6?k-12:k),scale:o.sc||'major',key:k,p:o.p||(mel?SD.MUH.BASE:BASSP),acc:acc,tie:tie,len:len,role:mel?'mel':'bass',bad:o.bad?true:undefined}}};
 /* コードのトラック。list=[[根音,種類,転回?],…]、at=開始ステップ、len=長さ(数または配列) */
 var chords=function(name,list,at,len,key,o){o=o||{};var L=o.len||32,idx={},cd={},tie=[],k=kk(key);
  list.forEach(function(c,i){var a=at[i],ln=Array.isArray(len)?len[i]:len;for(var j=0;j<ln&&a+j<L;j++){idx[a+j]=c[0];if(j)tie.push(a+j)}cd[a]={t:c[1],i:c[2]|0}});
  return {id:'bass',idx:idx,o:{name:name,tr:24+k,scale:o.sc||'major',key:k,p:o.p||SD.MUH.PAD,cd:cd,tie:tie,len:L,role:'chord',bad:o.bad?true:undefined}}};
 /* prog からコードのトラック(1小節に1〜2個) */
 var progTrack=function(name,prog,key,o){o=o||{};var fl=flat(prog,o.bl||16);
  return chords(name,fl.map(function(c){return [c.r,c.t]}),fl.map(function(c){return c.st}),fl.map(function(c){return c.len}),key,o)};
 /* 面の切り出し: notes のうち st が [from,from+len) の音を 0 始まりにずらす(A面=0〜31、B面=32〜63) */
 var slice=function(notes,from,len){len=len||32;return (notes||[]).filter(function(n){return n[0]>=from&&n[0]<from+len}).map(function(n){var m=n.slice();m[0]=n[0]-from;m[1]=Math.min(n[1],from+len-n[0]);return m})};
 /* 面の mute 用: 全トラック数 n のうち k 番目(0始まり)の配列以外 */
 var only=function(n,keep){var r=[];for(var i=0;i<n;i++)if(keep.indexOf(i)<0)r.push(i);return r};

 SD.BLH={BASS:BASS,MEL:MEL,LO:LO,HI:HI,BASSP:BASSP,tones:tones,role:role,approach:approach,walk:walk,pattern:pattern,clash:clash,range:range,
  line:line,chords:chords,progTrack:progTrack,flat:flat,chordFn:chordFn,slice:slice,only:only,rootLow:rootLow};
})();
