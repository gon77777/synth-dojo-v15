/* v13.1 ME-0 ME メロディの作り方コース用の表(SD.MEG ジャンル・SD.MER リズム型・SD.MEM お手本)と関数(SD.MEH)。
   純粋関数・決定的・乱数なし。仕様: docs/SPEC_ME_melody_course.md
   音は [st,len,r]。st・len は16分単位、r は C4=60 からの半音(KEY=C 基準。KEY は o.tr=24+key で移調)。
   1小節=16ステップ(12/8 は24)。2小節は o.len=32、4小節は 64(A面=小節1〜2・B面=小節3〜4)。
   ジャンル id は SD.BLG と同じ。すべてオリジナル(既存の曲は使わない)。本文に年号・人名・曲名・機種名は書かない */
(function(){
 var mod=function(x){return ((x%12)+12)%12};
 var kk=function(k){return mod(k|0)};
 var P=function(t){return t.trim().split(/\s+/).map(function(x){return x.split(':').map(Number)})};

 /* ジャンル(初期値案。耳で確かめて直す)。span=音域の半音幅・dens=1小節の音数[最小,最大]・mer=合うリズム型 */
 var G=function(id,n,tier,sc,sc2,span,dens,mv,avoid,mer){return {id:id,n:n,tier:tier,sc:sc,sc2:sc2,span:span,dens:dens,mv:mv,avoid:avoid,mer:mer}};
 var MEG=[
  G('pop','ポップ・ロック',1,'penta','major',12,[4,8],'順次進行中心。小節末で着地','跳躍の連続',['r_even8','r_q8']),
  G('house','ハウス・ディスコ',1,'mpent','minor',7,[2,5],'短い音形のくり返し。休符が多い','長く動き回る',['r_off','r_sparse']),
  G('reggae','レゲエ風',1,'penta','mpent',7,[2,4],'長い音と間。1拍目を空ける','音を詰め込む',['r_long','r_off']),
  G('blues','ブルース',2,'blues','mpent',12,[4,8],'3連系。♭5は通り過ぎる','♭5で伸ばす',['r_shuf']),
  G('funk','ファンク',2,'mpent','dorian',9,[3,8],'短い音と休符。同じ音の反復','全部同じ強さ・長さ',['r_sync','r_funk16']),
  G('bossa','ボサ・ラテン風',2,'major','dorian',12,[4,7],'3-3-2。長めの音で歌う','4分で均等に刻む',['r_332','r_pickup']),
  G('walk','ジャズ系',3,'major','dorian',14,[6,10],'3度・7度でつなぐ。8分中心','同じスケールで押し通す',['r_even8','r_pickup']),
  G('dance','ダンス系',3,'minor','harmonic',9,[3,8],'短いフレーズの反復と変化','コードごとに大きく動く',['r_funk16','r_hemi'])];

 /* リズム型(1小節ぶん。bars>1 は通しの st)。steps=[[st,len],…]。12/8 は bl=24 */
 var R=function(id,n,tier,steps,feel,o){o=o||{};return {id:id,n:n,tier:tier,meter:o.meter||{n:4,d:4},bl:o.bl||16,bars:o.bars||1,steps:P(steps),feel:feel}};
 var MER=[
  R('r_even8','8分の連打',1,'0:2 2:2 4:2 6:2 8:2 10:2 12:2 14:2','まっすぐ・進む'),
  R('r_q8','4分+8分',1,'0:4 4:2 6:2 8:4 12:2 14:2','歌いやすい'),
  R('r_long','長い音+休み',1,'0:6 8:4 12:4','ゆったり・間'),
  R('r_off','裏から入る',1,'2:2 4:2 6:2 8:6','軽い・前のめり'),
  R('r_sparse','3音だけ',1,'0:4 4:4 8:8','休符の練習'),
  R('r_sync','シンコペ',2,'0:2 2:4 6:2 8:2 10:4 14:2','裏がタイで拍をまたぐ'),
  R('r_332','3-3-2',2,'0:3 3:3 6:2 8:3 11:3 14:2','ラテン風・弾む'),
  R('r_shuf','12/8の跳ね',2,'0:4 4:2 6:4 10:2 12:4 16:2 18:4 22:2','長短の組・ブルース',{meter:{n:12,d:8},bl:24}),
  R('r_pickup','後ろから入る',2,'10:2 12:2 14:2','小節をまたぐ'),
  R('r_funk16','16分の刻み',3,'0:1 2:1 3:1 6:2 8:1 10:2 13:1 15:1','細かい・休符が効く'),
  R('r_hemi','3つずつ',3,'0:3 3:3 6:3 9:3 12:3 15:1','拍とずれる'),
  R('r_dens','密度が変わる',3,'0:8 8:8 16:4 20:4 24:4 28:4 32:2 34:2 36:2 38:2 40:2 42:2 44:2 46:2 48:8 56:8','疎→中→密→疎',{bars:4})];

 /* お手本(ME-0 は動作確認用の3本。ME-1 以降で増やす)。notes は C4 基準 */
 var M=function(id,n,gid,sc,tier,bars,notes,tip){return {id:id,n:n,gid:gid,sc:sc,tier:tier,bars:bars,notes:P(notes),tip:tip}};
 var MEM=[
  M('mp1','5音で上がって下りる','pop','penta',1,2,'0:4:4 4:2:7 6:2:9 8:4:7 12:2:2 14:2:4 16:4:7 20:2:4 22:2:2 24:8:0','上がって、下りて、ルートで終わる。'),
  M('mp2','小さな動きをつなぐ','pop','penta',1,2,'0:2:0 2:2:2 4:2:4 6:2:7 8:4:9 12:2:7 14:2:4 16:2:7 18:2:4 20:2:2 22:2:4 24:8:0','隣の音へ動いて、最後にルートへ戻る。'),
  M('mh1','短い音形をくり返す','house','mpent',1,2,'2:2:3 4:2:5 6:2:3 8:6:0 18:2:3 20:2:5 22:2:3 24:8:0','裏から入り、休みを残す。'),
  M('mh2','3音を行き来する','house','mpent',1,2,'0:2:0 4:2:3 8:2:5 10:2:3 12:4:0 16:2:0 20:2:3 24:8:0','少ない音で、間を作る。'),
  M('mr1','長い音で間を作る','reggae','penta',1,2,'4:6:7 10:4:4 14:2:0 20:4:4 24:8:0','1拍目を空けて、長い音を置く。'),
  M('mr2','3音でゆったり','reggae','penta',1,2,'4:4:4 8:4:2 12:4:4 20:4:7 24:8:0','音数を減らして、休みで歌わせる。'),
  M('mb1','♭5を通り過ぎる','blues','blues',2,2,'0:2:10 2:2:7 4:2:6 6:2:5 8:4:3 12:4:0 16:4:3 20:2:5 22:2:6 24:8:0','♭5は短く通り、最後はルートへ。'),
  M('mf1','短い音と休符で刻む','funk','mpent',2,2,'0:2:7 2:2:7 6:2:5 8:2:7 10:2:3 14:2:5 16:2:7 18:2:7 22:2:5 24:2:3 26:2:5 28:4:0','同じ音をくり返し、休符を挟む。'),
  M('mbo1','3+3+2で歌う','bossa','major',2,2,'0:3:4 3:3:7 6:2:9 8:3:7 11:3:4 14:2:2 16:3:4 19:3:2 22:2:4 24:8:0','長めの音で、3+3+2に区切る。')];

 /* 検索 */
 var genre=function(id){return MEG.filter(function(g){return g.id===id})[0]||null};
 var rhythm=function(id){return MER.filter(function(r){return r.id===id})[0]||null};
 var mel_=function(m){return m||[]};

 /* スケール内の音(半音)。key=主音(0〜11)。lo〜hi は C4=60 からの半音(両端を含む) */
 var scaleNotes=function(sc,key,lo,hi){var S=SD.SCALES[sc],k=kk(key),out=[];if(!S)return out;
  for(var m=lo;m<=hi;m++)if(S.indexOf(mod(m-k))>=0)out.push(m);return out};

 /* リズム型(id か [[st,len],…])に音高を順に割り当てる。pitches は足りなければ先頭に戻る。o.off=開始位置のずらし */
 var place=function(rh,pitches,o){o=o||{};var st=typeof rh==='string'?(rhythm(rh)||{steps:[]}).steps:rh,off=o.off|0,n=(pitches||[]).length,out=[];
  if(!n)return out;st.forEach(function(s,i){out.push([s[0]+off,s[1],pitches[i%n]])});return out};
 var rhythmOf=function(mel){return mel_(mel).map(function(n){return [n[0],n[1]]})};

 /* 小節ごとの音数。bl=1小節のステップ数(既定16)・o.bars で小節数を固定 */
 var density=function(mel,bl,bars){bl=bl||16;var a=[],nb=bars||0;mel_(mel).forEach(function(n){var b=Math.floor(n[0]/bl);if(b+1>nb)nb=b+1});
  for(var i=0;i<nb;i++)a.push(0);mel_(mel).forEach(function(n){a[Math.floor(n[0]/bl)]++});return a};

 /* 時間方向にずらす。0〜max(既定64)に収まらない音は捨て、はみ出す長さは切る */
 var shift=function(mel,steps,max){max=max||64;var out=[];mel_(mel).forEach(function(n){var s=n[0]+steps;if(s<0||s>=max)return;out.push([s,Math.min(n[1],max-s),n[2]])});return out};

 /* スケール内で音度を d だけずらす(シーケンス)。スケール外の音は、直下のスケール音を基準にする */
 var seq=function(mel,d,sc,key){var L=scaleNotes(sc,key||0,-48,72);if(!L.length)return mel_(mel).map(function(n){return n.slice()});
  return mel_(mel).map(function(n){var i=-1;for(var j=0;j<L.length;j++){if(L[j]<=n[2])i=j;else break}
   if(i<0)i=0;var t=Math.max(0,Math.min(L.length-1,i+d));var o=n.slice();o[2]=L[t];return o})};

 /* 変形。'end'=最後の音を主音にして小節の終わりまで伸ばす / 'rhythm'=奇数番めの音を1ステップ遅らせる(次の音に重ならない範囲) / 'pitch'=スケール内で1つ上げる(sc 必須) */
 var vary=function(mel,kind,sc,o){o=o||{};var bl=o.bl||16,m=mel_(mel).map(function(n){return n.slice()});if(!m.length)return m;
  if(kind==='end'){var l=m[m.length-1],end=(Math.floor(l[0]/bl)+1)*bl;l[1]=end-l[0];l[2]=Math.round(l[2]/12)*12;return m}
  if(kind==='rhythm'){m.forEach(function(n,i){if(i%2!==1)return;var nx=m[i+1],lim=nx?nx[0]:n[0]+n[1]+1;if(n[0]+1<lim&&n[1]>1){n[0]+=1;n[1]-=1}});return m}
  if(kind==='pitch')return seq(m,1,sc,o.key);
  return m};

 /* 検査。mel=[[st,len,r],…]。o={sc,lo,hi,maxLeap(既定9),span,chordAt(st)->[根音,種類]|null,extra:スケール外でも許す半音の配列}
    戻り値 [{kind,st}]: out=スケール外 / range=音域外 / leap=大きな跳躍 / strong=強拍(st%8==0)で和音の音に半音でぶつかる */
 var check=function(mel,o){o=o||{};var out=[],S=o.sc?SD.SCALES[o.sc]:null,k=kk(o.key),ml=o.maxLeap===undefined?9:o.maxLeap,ex=o.extra||[];
  mel_(mel).forEach(function(n,i){var r=n[2],pc=mod(r-k);
   if(S&&S.indexOf(pc)<0&&ex.indexOf(pc)<0)out.push({kind:'out',st:n[0]});
   if((o.lo!==undefined&&r<o.lo)||(o.hi!==undefined&&r>o.hi))out.push({kind:'range',st:n[0]});
   if(i&&Math.abs(r-mel[i-1][2])>ml)out.push({kind:'leap',st:n[0]});
   if(o.chordAt&&n[0]%8===0){var c=o.chordAt(n[0]);if(c&&SD.BLH){var t=SD.BLH.tones(c),z=mod(r-c[0]);
     if(t.indexOf(z)<0&&t.some(function(x){var d=mod(z-x);return d===1||d===11}))out.push({kind:'strong',st:n[0]})}}});
  if(o.span!==undefined&&mel_(mel).length){var a=mel.map(function(n){return n[2]});if(Math.max.apply(null,a)-Math.min.apply(null,a)>o.span)out.push({kind:'range',st:0})}
  return out};

 /* TRK 用トラック {id,idx,o}。o.len=ステップ数(既定16。2小節=32・4小節=64)・o.sc=スケール・o.name・o.p=音色。長い音はタイで伸ばす */
 var track=function(mel,key,o){o=o||{};var q={},tie=[],k=kk(key),len=o.len||16,base=(SD.MUH&&SD.MUH.BASE)||{};
  mel_(mel).forEach(function(n){var st=n[0]|0,ln=Math.max(1,n[1]|0);if(st<0||st>=len)return;q[st]=n[2]|0;for(var j=1;j<ln&&st+j<len;j++){q[st+j]=n[2]|0;tie.push(st+j)}});
  var oo={name:o.name||'メロディ',tr:24+k,scale:o.sc||'major',key:k,p:o.p||base,tie:tie};if(len!==16)oo.len=len;
  return {id:'bass',idx:q,o:oo}};

 SD.MEG=MEG;SD.MER=MER;SD.MEM=MEM;
 SD.MEH={genre:genre,rhythm:rhythm,scaleNotes:scaleNotes,place:place,rhythmOf:rhythmOf,density:density,shift:shift,seq:seq,vary:vary,check:check,track:track,P:P};
})();
