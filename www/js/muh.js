/* v11.4 MU-1 音楽理論・アドリブ用の共通ヘルパー(SD.MUH)。th.js の mel/chd/steps4 の複製+scl/prog/lick。
   th.js は変えない。TRKの tk 要素 {id,idx,o} を返す(idx=ステップ→基準音からの半音、1ステップ=16分、最大16ステップ)。
   key=0〜11(C=0)。KEYを変えて同じ形を聴くために、o.tr=24+key(基準 C4=60)と o.key を渡す。純粋関数 */
(function(){
 var BASE={o1Wave:'triangle',o1Lvl:.3,subLvl:0,o2Lvl:0,noiseLvl:0,cutoff:5000,res:0,envAmt:0,drive:0,aA:.003,aD:.25,aS:.15,aR:.1};
 var PAD={o1Wave:'sawtooth',o1Lvl:.22,subLvl:0,o2Lvl:0,noiseLvl:0,cutoff:2500,res:0,envAmt:0,drive:0,aA:.02,aD:.4,aS:.6,aR:.3};
 var kk=function(k){return (((k|0)%12)+12)%12};
 /* 旋律: ステップ0,2,4…にオフセット列(th.js の mel と同じ。key を足せる) */
 var mel=function(name,sc,arr,key){var q={};arr.forEach(function(v,i){q[i*2]=v});var k=kk(key);return {id:'bass',idx:q,o:{name:name,tr:24+k,scale:sc,key:k,p:BASE}}};
 /* 和音: list=[[根音オフセット,和音の種類,転回(省略=0)],…]、at=開始ステップ、len=1つの和音の長さ */
 var chd=function(name,list,at,len,sc,key){var idx={},cd={},tie=[],k=kk(key);list.forEach(function(c,i){for(var j=0;j<len;j++){idx[at[i]+j]=c[0];if(j)tie.push(at[i]+j)}cd[at[i]]={t:c[1],i:c[2]|0}});
  return {id:'bass',idx:idx,o:{name:name,tr:24+k,scale:sc||'major',key:k,p:PAD,cd:cd,tie:tie}}};
 var steps4=[0,4,8,12];
 /* スケールを鳴らすトラック。dir='up'(既定・上がるだけ。8音以下は2ステップ刻み)/'updown'(昇って降りる・1ステップ刻み・16音まで) */
 var scl=function(name,key,dir,label){var S=SD.SCALES[name];if(!S)return null;var up=S.concat([12]),a=up.slice();
  if(dir==='updown'){var d=up.slice(0,-1).reverse();a=up.concat(d);if(a.length>16)a=up}
  var q={},sp=a.length<=8?2:1;a.slice(0,16).forEach(function(v,i){if(i*sp<16)q[i*sp]=v});var k=kk(key);
  return {id:'bass',idx:q,o:{name:label||'スケール',tr:24+k,scale:name,key:k,p:BASE}}};
 /* コード進行: list=[[度のオフセット,種類],…]。at 省略=len刻みで0から。len 省略=4(1拍) */
 var prog=function(list,at,len,o){o=o||{};len=len||4;at=at||list.map(function(_,i){return i*len});
  return chd(o.name||'コード',list,at,len,o.sc,o.key)};
 /* リック: notes=[[st,len,r],…](st・len は16分単位、r はルートからの半音)。len>1 はタイで伸ばす。範囲外は捨てる */
 var lick=function(notes,key,o){o=o||{};var q={},tie=[],k=kk(key),sc=o.sc||'mpent';
  (notes||[]).forEach(function(n){var st=n[0]|0,ln=Math.max(1,n[1]|0),r=n[2]|0;if(st<0||st>=16)return;q[st]=r;for(var j=1;j<ln&&st+j<16;j++){q[st+j]=r;tie.push(st+j)}});
  return {id:'bass',idx:q,o:{name:o.name||'リック',tr:24+k,scale:sc,key:k,p:BASE,tie:tie}}};
 SD.MUH={mel:mel,chd:chd,steps4:steps4,scl:scl,prog:prog,lick:lick,BASE:BASE,PAD:PAD};
})();
