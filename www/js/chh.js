/* v12.1 X-0 CH かんたん複雑コード用の型ライブラリ(SD.CHT)と操作(SD.CHH)。純粋関数・決定的・乱数なし。
   bars = 4小節の配列。1小節 = {c:[[根音オフセット,種類(,転回)],…](1〜2個), ant?:true}。bars.key = 調(0〜11。fit が付ける)。
   型は C 基準の根音オフセットで持つ。種類は SD.CHORDS の id(maj min 7 maj7 m7 など)。 */
(function(){
 var mod=function(x){return ((x%12)+12)%12};
 var B=function(){return {c:Array.prototype.slice.call(arguments)}};
 var C=function(r,t){return [r,t]};
 SD.CHT=[
  {id:'sunny',name:'明るい王道',mood:'明るい',bars:[B(C(0,'maj')),B(C(7,'maj')),B(C(9,'min')),B(C(5,'maj'))]},
  {id:'loopm',name:'せつないループ',mood:'せつない',bars:[B(C(9,'min')),B(C(5,'maj')),B(C(0,'maj')),B(C(7,'maj'))]},
  {id:'descend',name:'順に下がる',mood:'下っていく',bars:[B(C(0,'maj'),C(7,'maj')),B(C(9,'min'),C(4,'min')),B(C(5,'maj'),C(0,'maj')),B(C(5,'maj'),C(7,'maj'))]},
  {id:'jazz',name:'おしゃれ(7th)',mood:'おしゃれ',bars:[B(C(2,'m7')),B(C(7,'7')),B(C(0,'maj7')),B(C(0,'maj7'))]},
  {id:'minfall',name:'暗い下降',mood:'暗い',bars:[B(C(9,'min')),B(C(7,'maj')),B(C(5,'maj')),B(C(4,'maj'))]},
  {id:'turn',name:'ひとまわり(7th)',mood:'ひとまわり',bars:[B(C(0,'maj7')),B(C(9,'m7')),B(C(2,'m7')),B(C(7,'7'))]},
  {id:'calm',name:'おだやか',mood:'おだやか',bars:[B(C(0,'maj')),B(C(5,'maj')),B(C(0,'maj')),B(C(7,'maj'))]},
  {id:'shade',name:'かげり',mood:'かげり',bars:[B(C(9,'min')),B(C(2,'min')),B(C(7,'maj')),B(C(0,'maj'))]}];

 var clone=function(bars){var o=bars.map(function(b){var n={c:b.c.map(function(x){return x.slice()})};if(b.ant)n.ant=true;return n});o.key=bars.key|0;return o};
 var keyOf=function(bars){return mod(bars.key|0)};
 var TRI={maj:1,min:1,dim:1};
 var tpl=function(t){return typeof t==='string'?SD.CHT.find(function(x){return x.id===t}):t};

 /* 型を調に当てる。全根音に key を足す(mod 12)。種類は変えない */
 var fit=function(t,key){t=tpl(t);key=mod(key|0);var o=t.bars.map(function(b){return {c:b.c.map(function(x){var y=x.slice();y[0]=mod(x[0]+key);return y})}});o.key=key;return o};
 /* 小節 i を差し替える。end=C(おわる)/go=G7(つづく)/twist=A♭(ひねる。♭VI)。根音は調に対する相対 */
 var swapBar=function(bars,i,kind){var o=clone(bars),k=keyOf(bars),c=kind==='go'?[mod(k+7),'7']:kind==='twist'?[mod(k+8),'maj']:[k,'maj'];o[i]={c:[c]};if(bars[i].ant)o[i].ant=true;return o};
 /* 小節 i の後半だけ替える。pre=次の小節(最後なら先頭)の和音の根音の5度上の7th */
 var splitBar=function(bars,i,kind){var o=clone(bars),nx=bars[(i+1)%bars.length].c[0],first=o[i].c[0];
  var c=[mod(nx[0]+7),'7'];o[i].c=[first,c];return o};
 /* 次の和音を8分音符ぶん早く入れる(小節 i のステップ14から)。フラグ ant を立てる */
 var anticipate=function(bars,i){var o=clone(bars);o[i].ant=true;return o};
 /* from 小節以降を全体で同じ幅だけ動かす。種類・小節数は変えない。semis=12 は恒等 */
 var shift=function(bars,semis,from){var o=clone(bars);for(var i=from|0;i<o.length;i++)o[i].c=o[i].c.map(function(x){var y=x.slice();y[0]=mod(x[0]+semis);return y});return o};
 /* 全体を暗くする。I→i・IV→iv・vi→♭VI。V と他の和音はそのまま */
 var minorize=function(bars){var o=clone(bars),k=keyOf(bars);
  o.forEach(function(b){b.c=b.c.map(function(x){var d=mod(x[0]-k),t=x[1],y=x.slice();
   if(d===0||d===5){if(t==='maj')y[1]='min';else if(t==='maj7')y[1]='m7'}
   else if(d===9){if(t==='min'||t==='m7'){y[0]=mod(k+8);y[1]=t==='min'?'maj':'maj7'}}
   return y})});return o};
 /* 転回の選択: 全転回の総当たりで、声の動きの合計(隣り合う和音の昇順の音どうしの差の絶対値の和)が最小。同点は転回番号が小さい方 */
 var move=function(a,b){var s=0,n=Math.min(a.length,b.length);for(var i=0;i<n;i++)s+=Math.abs(a[i]-b[i]);return s+Math.abs(a.length-b.length)*12};
 var notesOf=function(x,inv){return SD.chordNotes(60+x[0],x[1],inv)};
 var seq=function(bars){var a=[];bars.forEach(function(b){b.c.forEach(function(x){a.push(x)})});return a};
 var total=function(cs,invs){var s=0;for(var i=1;i<cs.length;i++)s+=move(notesOf(cs[i-1],invs[i-1]),notesOf(cs[i],invs[i]));return s};
 var smooth=function(bars){var cs=seq(bars),n=cs.length,cnt=cs.map(function(x){return SD.chordNotes(60+x[0],x[1],0).length}),best=null,cur=[];
  var rec=function(i){if(i===n){var s=total(cs,cur);if(best===null||s<best.s)best={s:s,v:cur.slice()};return}for(var v=0;v<cnt[i];v++){cur[i]=v;rec(i+1)}};
  if(n>1)rec(0);else best={s:0,v:[0]};
  var o=clone(bars),k=0;o.forEach(function(b){b.c=b.c.map(function(x){var y=x.slice();y[2]=best.v[k++];return y})});return o};
 smooth.total=function(bars,inv0){var cs=seq(bars),v=cs.map(function(x,i){return inv0?0:(x[2]|0)});return total(cs,v)};

 /* 複雑さのはしご(1〜5)。level n は level n-1 の操作を含む。基準は C(key=0)に当てた型 */
 var tri=function(t){return t==='7'?'maj':t==='maj7'?'maj':t==='m7'?'min':t==='m7b5'?'dim':t};
 var seventh=function(r,t,k){var d=mod(r-k),minor=(t==='min'||t==='m7'||t==='dim'||t==='m7b5');
  if(minor)return 'm7';if(d===0||d===5)return 'maj7';return '7'};
 var ladder=function(t,level){var o=fit(t,0),k=0;level=Math.max(1,Math.min(5,level|0));
  o.forEach(function(b){b.c=b.c.map(function(x){return [x[0],tri(x[1])]})});
  if(level>=2)o.forEach(function(b){b.c=b.c.map(function(x){return [x[0],seventh(x[0],x[1],k)]})});
  if(level>=3)o=splitBar(o,1,'pre');
  if(level>=4){var done=false;o.forEach(function(b){if(done)return;b.c=b.c.map(function(x){if(!done&&x[1]==='7'){done=true;return [mod(x[0]+6),'7']}return x})})}
  if(level>=5)o=shift(o,2,2);
  return o};

 /* 小節の列を和音イベント(ステップ)にする。1小節16ステップ。先行(ant)は次の和音を14ステップから */
 var events=function(bars){var ev=[],bl=16;
  bars.forEach(function(b,i){var n=b.c.length;b.c.forEach(function(x,j){ev.push({st:i*bl+(n===1?0:j*bl/2),len:bl/n,r:x[0],t:x[1],i:x[2]|0})})});
  bars.forEach(function(b,i){if(!b.ant||i+1>=bars.length)return;var nx=bars[i+1].c[0],at=i*bl+14;
   ev.forEach(function(e){if(e.st<at&&e.st+e.len>at)e.len=at-e.st});
   ev.forEach(function(e){if(e.st===(i+1)*bl&&e.r===nx[0]&&e.t===nx[1]){e.st=at;e.len+=2}})});
  return ev.sort(function(a,b){return a.st-b.st})};
 /* 面(0=A面・1=B面)のコードのトラック。2小節(32ステップ) */
 var track=function(name,bars,face,key,o){var ev=events(bars),f=face|0,from=f*32,list=[],at=[],len=[];
  ev.forEach(function(e){var s=e.st,l=e.len;if(s+l<=from||s>=from+32)return;if(s<from){l-=from-s;s=from}if(s+l>from+32)l=from+32-s;list.push([e.r,e.t,e.i]);at.push(s-from);len.push(l)});
  return SD.BLH.chords(name,list,at,len,key,o)};

 SD.CHH={fit:fit,swapBar:swapBar,splitBar:splitBar,anticipate:anticipate,shift:shift,minorize:minorize,smooth:smooth,ladder:ladder,events:events,track:track,clone:clone,tpl:tpl};
})();
