/* v12.1 X-0 RH リハーモナイズ用の素材メロディ(SD.RHM)と関数(SD.RHH)。純粋関数・決定的・乱数なし。
   メロディは [st,len,r](st=0〜63の通し、1小節=16ステップ。r は C4=60 からの半音)。素材は mel:[A面(小節1〜2), B面(小節3〜4)] の2面で持つ。
   和音は [根音オフセット,種類]、1小節 = 和音の配列(1〜2個)。bars = 4小節。すべてオリジナル(既存の曲は使わない)。 */
(function(){
 var mod=function(x){return ((x%12)+12)%12};
 var MAJ=[0,2,4,5,7,9,11],T7=['maj7','m7','m7','maj7','7','m7','m7b5'],T3=['maj','min','min','maj','maj','min','dim'],FUNC=['T','S','T','S','D','T','D'];
 var ROLES=['root','3rd','5th','7th'];
 var cdef=function(t){return SD.CHORDS.find(function(c){return c.id===t})||null};
 var tones=function(c){var d=cdef(c[1]);return d?d.iv.slice(0,4).map(function(v){return mod(c[0]+v)}):[]};
 var cs=function(bar){return (bar&&bar.c)||bar};
 var cloneBars=function(bars){return bars.map(function(b){return cs(b).map(function(x){return x.slice()})})};

 /* mel が [A面,B面] なら通しの列に直す */
 var flat=function(mel){var pair=mel&&mel.length===2&&Array.isArray(mel[0])&&(mel[0].length===0||Array.isArray(mel[0][0]));
  return pair?mel[0].concat(mel[1].map(function(n){var m=n.slice();m[0]+=32;return m})):mel};

 /* 要の音: 各小節で最も長い音(同点は先)+小節の最高音(同点は先。重なればまとめる)。拍頭(小節内 st が 0 か 8)に印 */
 var keynotes=function(mel){var m=flat(mel),out=[],bars={};
  m.forEach(function(n){var b=Math.floor(n[0]/16);(bars[b]=bars[b]||[]).push(n)});
  Object.keys(bars).map(Number).sort(function(a,b){return a-b}).forEach(function(b){var ns=bars[b],lo=ns[0],hi=ns[0];
   ns.forEach(function(n){if(n[1]>lo[1])lo=n;if(n[2]>hi[2])hi=n});
   var put=function(n,why){var f=out.find(function(o){return o.st===n[0]});if(f){if(f.why.indexOf(why)<0)f.why.push(why);return}
    out.push({st:n[0],len:n[1],r:n[2],bar:b,why:[why],beat:[0,8].indexOf(n[0]%16)>=0})};
   put(lo,'long');put(hi,'top')});
  return out.sort(function(a,b){return a.st-b.st})};

 /* その音(pc)を含む調内の和音。7th(既定)か三和音(o.triad)。{deg(1〜7),root,type,role,func} */
 var cands=function(pc,key,o){o=o||{};var out=[];key=mod(key|0);
  for(var d=0;d<7;d++){var c=[mod(key+MAJ[d]),o.triad?T3[d]:T7[d]],t=tones(c),i=t.indexOf(mod(pc));if(i>=0)out.push({deg:d+1,root:c[0],type:c[1],role:ROLES[i],func:FUNC[d]})}
  return out};

 /* 同じ働きの代理(T: I⇄iii⇄vi / S: IV⇄ii / D: V⇄vii°)。chord=[r,t]。三和音なら三和音・それ以外は7thで返す。調内でなければ [] */
 var degOf=function(c,key){return MAJ.indexOf(mod(c[0]-(key|0)))};
 var subs=function(c,key){key=mod(key|0);var d=degOf(c,key);if(d<0)return [];var f=FUNC[d],tri=(c[1]==='maj'||c[1]==='min'||c[1]==='dim'),out=[];
  for(var k=0;k<7;k++)if(k!==d&&FUNC[k]===f)out.push([mod(key+MAJ[k]),tri?T3[k]:T7[k]]);return out};

 /* ぶつかりの検出。長さ4ステップ以上の音と拍頭の音について、その音が鳴る間の和音のどれかの構成音と短2度・長7度なら strong。
    例外: 長7th(maj7)の和音で、メロディがその根音のとき(根音と長7度は和音の中の関係) */
 var check=function(mel,bars){var m=flat(mel),strong=[];
  m.forEach(function(n){if(!(n[1]>=4||[0,8].indexOf(n[0]%16)>=0))return;var b=Math.floor(n[0]/16),list=cs(bars[b]||[]),np=mod(n[2]),k=list.length;
   list.forEach(function(c,j){var s0=b*16+j*16/k,s1=s0+16/k;if(n[0]+n[1]<=s0||n[0]>=s1)return;
    tones(c).forEach(function(tp){var d=mod(np-tp);if(d!==1&&d!==11)return;if(c[1]==='maj7'&&np===mod(c[0])&&tp===mod(c[0]+11))return;
     strong.push({st:n[0],bar:b,note:np,chord:c,tone:tp})})})});
  return {strong:strong,ok:!strong.length}};

 /* 前置: 小節 i の前の小節を、小節 i の和音への ii-V にする(前半 ii m7(短調の和音へは m7♭5)・後半 V7=根音の5度上の7th)。i=0 のときは最後の小節 */
 var pre=function(bars,i){var o=cloneBars(bars),n=o.length,t=o[i][0],mi=(t[1]==='min'||t[1]==='m7'||t[1]==='m7b5'||t[1]==='dim'),p=(i-1+n)%n;
  o[p]=[[mod(t[0]+2),mi?'m7b5':'m7'],[mod(t[0]+7),'7']];return o};
 /* 裏コード: V7(種類 '7')を根音+6半音の7thに。ほかは変えない */
 var tritone=function(c){return c[1]==='7'?[mod(c[0]+6),'7']:c.slice()};
 /* 同主短調から借りる: I→i・IV→iv・vi→♭VI。小節 i のその和音だけ替える。対応表は BORROW */
 var BORROW=[{from:'I',deg:0,types:{maj:'min',maj7:'m7'},root:0},{from:'IV',deg:5,types:{maj:'min',maj7:'m7'},root:0},{from:'vi',deg:9,types:{min:'maj',m7:'maj7'},root:-1}];
 var borrow=function(bars,i,key){key=mod(key|0);var o=cloneBars(bars);
  o[i]=o[i].map(function(c){var d=mod(c[0]-key);for(var k=0;k<BORROW.length;k++){var b=BORROW[k];if(b.deg===d&&b.types[c[1]])return [mod(c[0]+b.root),b.types[c[1]]]}return c});return o};

 /* 素材メロディ6本(オリジナル)。mel=[A面,B面]、orig=小節ごとの和音、alts=3案(メロディは案ごとに変えない)。
    method: sub=同じ働きの代理 / pre=ii-Vの前置 / bor=借用 / tri=裏コード。素材ごとに成り立つ案が違うので、M1 は前置の代わりに代理をもう1つ */
 var C=function(r,t){return [r,t]};
 var put=function(orig,ch){var o=cloneBars(orig);Object.keys(ch).forEach(function(i){o[i]=ch[i]});return o};
 var alt=function(id,label,method,bars){return {id:id,label:label,method:method,bars:bars}};
 var mk=function(id,name,key,A,B,orig,mk2){return {id:id,name:name,key:key,mel:[A,B],orig:orig,alts:mk2(orig)}};
 SD.RHM=[
  mk('rm1','階段をのぼって降りる','maj',
   [[0,8,4],[8,4,7],[12,4,4],[16,8,2],[24,4,5],[28,4,2]],[[0,8,4],[8,4,0],[12,4,4],[16,16,0]],
   [[C(0,'maj')],[C(7,'7')],[C(9,'min')],[C(0,'maj')]],
   function(o){return [alt('a','Am7に代理','sub',put(o,{0:[C(9,'m7')]})),alt('b','ドミナントを代理','sub',put(o,{1:[C(11,'m7b5')]})),alt('c','終わりを同主短調から借用','bor',put(o,{3:[C(0,'min')]}))]}),
  mk('rm2','ゆれて広がる','maj',
   [[0,8,7],[8,4,4],[12,4,7],[16,8,9],[24,4,12],[28,4,9]],[[0,8,11],[8,4,14],[12,4,11],[16,16,12]],
   [[C(0,'maj')],[C(5,'maj')],[C(7,'7')],[C(0,'maj')]],
   function(o){return [alt('a','最初をAmに代理','sub',put(o,{0:[C(9,'min')]})),alt('b','Fの前にii-Vを足す','pre',put(o,{0:[C(7,'m7'),C(0,'7')]})),alt('c','終わりを同主短調から借用','bor',put(o,{3:[C(0,'min')]}))]}),
  mk('rm3','ふわっと着地','maj',
   [[0,8,4],[8,4,2],[12,4,0],[16,8,7],[24,4,11],[28,4,7]],[[0,8,9],[8,8,12],[16,8,11],[24,8,17]],
   [[C(0,'maj')],[C(4,'min')],[C(5,'maj')],[C(7,'7')]],
   function(o){return [alt('a','最初をAmに代理','sub',put(o,{0:[C(9,'min')]})),alt('b','G7の前にii-Vを足す','pre',put(o,{2:[C(9,'m7'),C(2,'7')]})),alt('c','G7を裏コードに','tri',put(o,{3:[C(1,'7')]}))]}),
  mk('rm4','のびやかな上り','maj',
   [[0,12,7],[12,4,4],[16,8,9],[24,8,12]],[[0,8,7],[8,8,4],[16,8,11],[24,8,17]],
   [[C(0,'maj')],[C(5,'maj')],[C(0,'maj')],[C(7,'7')]],
   function(o){return [alt('a','最初をAmに代理','sub',put(o,{0:[C(9,'min')]})),alt('b','Fの前にii-Vを足す','pre',put(o,{0:[C(7,'m7'),C(0,'7')]})),alt('c','G7を裏コードに','tri',put(o,{3:[C(1,'7')]}))]}),
  mk('rm5','いつもの4つの和音','maj',
   [[0,8,12],[8,8,7],[16,8,11],[24,8,14]],[[0,8,9],[8,8,12],[16,16,9]],
   [[C(0,'maj')],[C(7,'maj')],[C(9,'min')],[C(5,'maj')]],
   function(o){return [alt('a','最初をAmに代理','sub',put(o,{0:[C(9,'min')]})),alt('b','Gの前にii-Vを足す','pre',put(o,{1:[C(11,'m7b5'),C(4,'7')]})),alt('c','最初を同主短調から借用','bor',put(o,{0:[C(0,'min')]}))]}),
  mk('rm6','かげりのうた(短調)','min',
   [[0,8,9],[8,4,12],[12,4,9],[16,8,2],[24,8,9]],[[0,8,8],[8,8,14],[16,16,9]],
   [[C(9,'min')],[C(2,'min')],[C(4,'7')],[C(9,'min')]],
   function(o){return [alt('a','最初をCに代理','sub',put(o,{0:[C(0,'maj')]})),alt('b','E7の前にii-Vを足す','pre',put(o,{1:[C(6,'m7b5'),C(11,'7')]})),alt('c','E7を裏コードに','tri',put(o,{2:[C(10,'7')]}))]})];
 SD.RHH={flat:flat,keynotes:keynotes,cands:cands,subs:subs,check:check,pre:pre,tritone:tritone,borrow:borrow,BORROW:BORROW,tones:tones,cloneBars:cloneBars,MAJ:MAJ};
})();
