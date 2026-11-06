/* PRG コード進行ドリル(v14.9): 「王道進行は?」に、度数(ディグリーネーム)をひとつずつ選んで答える。
   DOM非依存の純粋なデータと関数だけ(画面は app.js の prgXxx)。検査: node test/prg.js
   - 度数 SD.PRG.degrees: id → {d:半音数, t:SD.CHORDS の id, l:音名の文字送り(Ⅰ=0〜Ⅶ=6。綴り用)}
   - 18問 SD.PRG.items: 重要度 imp(1〜18の順位・小さいほど先に覚える)と難易度 lv(1入門 2ふつう 3むずかしい)
   - キー(key)は主音の半音数(C=0)。マイナーの問題は主音を渡す(Aマイナー=9)
   - 進捗は SD.store の 'prg' に {問題id:{a:挑戦,c:正解,s:ヒントなしの連続正解,t:最後に解いた時刻}} */
(function(){
 var mod=function(x){return ((x%12)+12)%12};
 var ROM={I:0,II:1,III:2,IV:3,V:4,VI:5,VII:6};

 /* ---- 度数 ---- */
 var D={};
 var dg=function(id,d,t){D[id]={d:d,t:t,l:ROM[/^b?(VII|VI|IV|V|III|II|I)/.exec(id)[1]]}};
 dg('I',0,'maj');dg('IIm',2,'min');dg('IIIm',4,'min');dg('IV',5,'maj');dg('V',7,'maj');dg('VIm',9,'min');
 dg('IM7',0,'maj7');dg('IIm7',2,'m7');dg('IIIm7',4,'m7');dg('IVM7',5,'maj7');dg('V7',7,'7');dg('VIm7',9,'m7');
 dg('I7',0,'7');dg('III7',4,'7');dg('Vm7',7,'m7');dg('IV7',5,'7');dg('bII7',1,'7');
 dg('Im',0,'min');dg('Im7',0,'m7');dg('IVm',5,'min');dg('IVm7',5,'m7');dg('IIm7b5',2,'m7b5');
 dg('bIII',3,'maj');dg('bVI',8,'maj');dg('bVII',10,'maj');dg('bVIM7',8,'maj7');dg('bVII7',10,'7');

 /* ---- 答えの選択肢(パレット)。度数の低い順 ---- */
 var pal={
  tri:['I','IIm','IIIm','IV','V','VIm'],
  tri7:['I','IIm','IIIm','III7','IV','V','VIm'],
  sev:['IM7','IIm7','IIIm7','IVM7','V7','VIm7','VIm'],
  jt:['IM7','IIm7','IVM7','III7','VIm7','Vm7','V7','I7'],
  ura:['IM7','IIm7','IVM7','V7','bII7','VIm7'],
  bor:['I','IV','IVm','V','bIII','bVI','bVII'],
  blues:['I7','IV7','V7'],
  minor:['Im','IVm','bIII','V','bVI','bVII'],
  min7:['Im7','IIm7b5','IVm7','V7','bVIM7','bVII7']
 };

 /* ---- 18問 ----
    nick を持つ問題は「このアプリでの呼び名」(一般の名前ではない)。ループの始まりの位置があいまいなので最初の1つを出す。 */
 var items=[
  {id:'ouda',name:'王道進行',imp:1,lv:1,mode:'maj',seq:['IV','V','IIIm','VIm'],pal:'tri',given:0,tip:'4→5→3→6(よん・ご・さん・ろく)',
   desc:'Ⅳ→Ⅴ→Ⅲm→Ⅵm。J-POPでいちばんよく聴く定番の進行です。Ⅴのあとにマイナーのコード(Ⅲm)を置くところが切なく、Ⅵmで終わるので余韻が残ります。'},
  {id:'komuro',name:'小室進行',imp:2,lv:1,mode:'maj',seq:['VIm','IV','V','I'],pal:'tri',given:0,tip:'6→4→5→1(ろく・よん・ご・いち)',
   desc:'Ⅵm→Ⅳ→Ⅴ→Ⅰ。小室哲哉さんの曲で多く使われたことから「小室進行」と呼ばれます。マイナーで始まり、Ⅴ→Ⅰで明るく解決します。'},
  {id:'pop4',name:'ポップ・ループ',nick:'ポップ・ループ',imp:3,lv:1,mode:'maj',seq:['I','V','VIm','IV'],pal:'tri',given:1,tip:'1→5→6→4',
   desc:'「ポップ・ループ」はこのアプリでの呼び名です(一般的な名前ではありません)。Ⅰ→Ⅴ→Ⅵm→Ⅳ。世界中のポップスで、同じ4つのコードをぐるぐる回して使われます。回る曲は始まりの位置があいまいなので、最初のⅠだけ見せてあります。'},
  {id:'loop6',name:'せつなループ',nick:'せつなループ',imp:4,lv:1,mode:'maj',seq:['VIm','IV','I','V'],pal:'tri',given:1,tip:'6→4→1→5',
   desc:'「せつなループ」はこのアプリでの呼び名です(一般的な名前ではありません)。Ⅵm→Ⅳ→Ⅰ→Ⅴ。「ポップ・ループ」と同じ4つのコードを、マイナーのⅥmから回し始めたものです。切ない曲に向いています。最初のⅥmだけ見せてあります。'},
  {id:'canon',name:'カノン進行',imp:5,lv:2,mode:'maj',seq:['I','V','VIm','IIIm','IV','I','IV','V'],pal:'tri',given:0,tip:'1→5→6→3→4→1→4→5',
   desc:'Ⅰ→Ⅴ→Ⅵm→Ⅲm→Ⅳ→Ⅰ→Ⅳ→Ⅴ。パッヘルベルの「カノン」で有名な8コードです。低音が1つずつ階段のように下がっていくのが特徴で、最後のⅤからⅠに戻ってまた回ります。'},
  {id:'251',name:'ツーファイブワン',imp:6,lv:2,mode:'maj',seq:['IIm7','V7','IM7'],pal:'sev',given:0,tip:'2→5→1(7thコード)',
   desc:'Ⅱm7→Ⅴ7→ⅠM7。ジャズやおしゃれなポップスの基本になる、いちばん小さな「解決」の形です。Ⅴ7がⅠに戻りたがる力を、Ⅱm7が前から準備します。'},
  {id:'threec',name:'スリーコード',imp:7,lv:1,mode:'maj',seq:['I','IV','V','I'],pal:'tri',given:0,tip:'1→4→5→1',
   desc:'Ⅰ→Ⅳ→Ⅴ→Ⅰ。Ⅰ・Ⅳ・Ⅴの3つだけで作る、ロックやフォークの土台になる進行です。ほかの進行はこの3つの代わりのコードを混ぜて作られている、と考えると整理しやすくなります。'},
  {id:'hitome',name:'レトロ・ループ',nick:'レトロ・ループ',imp:8,lv:1,mode:'maj',seq:['I','VIm','IV','V'],pal:'tri',given:1,tip:'1→6→4→5',
   desc:'「レトロ・ループ」はこのアプリでの呼び名です(一般的な名前ではありません)。Ⅰ→Ⅵm→Ⅳ→Ⅴ。1950年代のポップスでよく使われた形で、懐かしい雰囲気になります。最初のⅠだけ見せてあります。'},
  {id:'andalu',name:'アンダルシア進行',imp:9,lv:1,mode:'min',seq:['Im','bVII','bVI','V'],pal:'minor',given:0,tip:'マイナー: Ⅰm→♭Ⅶ→♭Ⅵ→Ⅴ',
   desc:'Ⅰm→♭Ⅶ→♭Ⅵ→Ⅴ(Aマイナーなら Am→G→F→E)。マイナーキーで低音が1つずつ下がっていく、スペインのフラメンコ由来の進行です。最後のⅤはメジャーのコードで、Ⅰmに戻りたい気持ちを作ります。'},
  {id:'ouda7',name:'王道進行(7th)',imp:10,lv:2,mode:'maj',seq:['IVM7','V7','IIIm7','VIm'],pal:'sev',given:0,tip:'4M7→5(7)→3m7→6m',
   desc:'ⅣM7→Ⅴ7→Ⅲm7→Ⅵm。王道進行のコードに7thを足して、おしゃれで少し大人っぽい響きにしたものです。最後のⅥmだけは7thを付けずに落ち着かせます。'},
  {id:'down',name:'ステップダウン',nick:'ステップダウン',imp:11,lv:2,mode:'maj',seq:['IV','IIIm','IIm','I'],pal:'tri',given:1,tip:'4→3→2→1(低音が順に下がる)',
   desc:'「ステップダウン」はこのアプリでの呼び名です(一般的な名前ではありません)。Ⅳ→Ⅲm→Ⅱm→Ⅰ。コードの根音(低音)が階段のように1つずつ下がって、Ⅰにたどり着きます。最初のⅣだけ見せてあります。'},
  {id:'oudae7',name:'王道の変形(Ⅲ7)',imp:12,lv:2,mode:'maj',seq:['IV','V','III7','VIm'],pal:'tri7',given:0,tip:'4→5→3(7)→6m',
   desc:'Ⅳ→Ⅴ→Ⅲ7→Ⅵm。王道進行のⅢmをⅢ7(メジャーの7thコード)に変えたものです。Ⅲ7はⅥmにとても強く進みたがるので、切なさが一段と強くなります。'},
  {id:'subm',name:'サブドミナントマイナー',imp:13,lv:2,mode:'maj',seq:['IV','IVm','I'],pal:'bor',given:0,tip:'4→4m→1',
   desc:'Ⅳ→Ⅳm→Ⅰ(Cなら F→Fm→C)。メジャーキーの中で、Ⅳをマイナー(Ⅳm)に変えて使う技です。一瞬だけ影がさして、Ⅰに戻ったときにほっとします。'},
  {id:'jt2us',name:'Just The Two of Us進行',imp:14,lv:3,mode:'maj',seq:['IVM7','III7','VIm7','Vm7','I7'],pal:'jt',given:0,tip:'4M7→3(7)→6m7→5m7→1(7)',
   desc:'ⅣM7→Ⅲ7→Ⅵm7→Ⅴm7→Ⅰ7。「Just The Two of Us」から名づけられた、おしゃれな進行です。Ⅲ7→Ⅵm7のあと、Ⅴm7→Ⅰ7でⅣに向かう形になっていて、次のⅣM7へ自然につながります。'},
  {id:'blues',name:'ブルース進行',imp:15,lv:3,mode:'maj',seq:['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7'],pal:'blues',given:0,tip:'12小節: Ⅰ7×4・Ⅳ7×2・Ⅰ7×2・Ⅴ7・Ⅳ7・Ⅰ7・Ⅴ7',
   desc:'12小節ブルース。Ⅰ7が4小節、Ⅳ7が2小節、Ⅰ7が2小節、そのあとⅤ7→Ⅳ7→Ⅰ7→Ⅴ7。使うのは3つのコードだけですが、ブルースやロックンロール、ジャズの土台になる大切な型です。(ここでは1小節に1コードで数えます)'},
  {id:'borrow',name:'借用和音',imp:16,lv:3,mode:'maj',seq:['bVI','bVII','I'],pal:'bor',given:0,tip:'♭6→♭7→1',
   desc:'♭Ⅵ→♭Ⅶ→Ⅰ(Cなら A♭→B♭→C)。同じ主音のマイナーキーから、コードを借りてくる技です。メジャーの中でぐっと力強く、ロックっぽい終わり方になります。'},
  {id:'m251',name:'マイナーのツーファイブワン',imp:17,lv:3,mode:'min',seq:['IIm7b5','V7','Im7'],pal:'min7',given:0,tip:'マイナー: Ⅱm7♭5→Ⅴ7→Ⅰm7',
   desc:'Ⅱm7♭5→Ⅴ7→Ⅰm7(Aマイナーなら Bm7♭5→E7→Am7)。マイナーキーで使うツーファイブワンです。Ⅱが「m7♭5」になるのがメジャーとの違いで、ジャズの定番です。'},
  {id:'ura',name:'裏コード',imp:18,lv:3,mode:'maj',seq:['IIm7','bII7','IM7'],pal:'ura',given:0,tip:'2m7→♭2(7)→1M7',
   desc:'Ⅱm7→♭Ⅱ7→ⅠM7(Cなら Dm7→D♭7→CM7)。ツーファイブワンのⅤ7(G7)を、半音上の♭Ⅱ7(D♭7)に置きかえた形です。低音がⅡ→♭Ⅱ→Ⅰと半音ずつ下がって、なめらかにつながります。'}
 ];
 var byId={};items.forEach(function(x){byId[x.id]=x});
 var item=function(id){return byId[id]||null};
 var byImp=function(){return items.slice().sort(function(a,b){return a.imp-b.imp})};
 var byLv=function(){return items.slice().sort(function(a,b){return a.lv-b.lv||a.imp-b.imp})};
 var LVN=['','入門','ふつう','むずかしい'];

 /* ---- 度数 → コード名(♭/♯の綴りは調に合わせる) ---- */
 var LET=['C','D','E','F','G','A','B'],LPC=[0,2,4,5,7,9,11];
 var TON_MAJ=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
 var TON_MIN=['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'];
 var FLAT=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
 var SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
 var PLAIN={'C♭':'B','F♭':'E','B♯':'C','E♯':'F'};/* 読みにくい綴りは白鍵の名前に */
 var tonic=function(mode,key){return (mode==='min'?TON_MIN:TON_MAJ)[mod(key)]};
 var rootName=function(dg,key,mode){
  var t=tonic(mode,key),li=LET.indexOf(t.charAt(0)),k=(li+dg.l)%7,r=mod(key+dg.d),a=mod(r-LPC[k]+6)-6;
  var nm=LET[k]+(a===1?'♯':a===-1?'♭':'');
  if(a===0||a===1||a===-1)return PLAIN[nm]||nm;
  return ((t.indexOf('♭')>=0||t==='F'||t==='C')?FLAT:SHARP)[r]};
 var symOf=function(t){var d=SD.chordDef(t);return d?d.sym.replace(/b(\d)/,'♭$1').replace(/#(\d)/,'♯$1'):''};
 var chordName=function(id,key,mode){var g=D[id];return g?rootName(g,key,mode)+symOf(g.t):''};
 var keyName=function(it,key){return tonic(it.mode,key)+(it.mode==='min'?'m':'')};
 var sample=function(it,key){return it.seq.map(function(id){return chordName(id,key,it.mode)})};
 /* 画面でキー(C=0。マイナーの問題は Aマイナー=C の平行調)を主音に直す */
 var tonicOf=function(it,k){return it.mode==='min'?mod(k+9):mod(k)};
 /* 度数の表示(Ⅳ・Ⅲm・♭Ⅵ・ⅡM7 など) */
 var UR={I:'Ⅰ',II:'Ⅱ',III:'Ⅲ',IV:'Ⅳ',V:'Ⅴ',VI:'Ⅵ',VII:'Ⅶ'};
 var label=function(id){var m=/^(b?)(VII|VI|IV|V|III|II|I)(.*)$/.exec(id);return m?(m[1]?'♭':'')+UR[m[2]]+m[3].replace('b5','♭5'):id};

 /* ---- 声部: 1コード = [低音(根音), 上3〜4音]。隣のコードへの動きが小さくなるように並べる ---- */
 var LO=52,HI=80,CEN=64;
 var cands=function(pcs){var out=[],n=pcs.length;
  for(var r=0;r<n;r++){
   for(var b=LO+mod(pcs[r]-LO);b<=LO+15;b+=12){
    var a=[b],ok=true;
    for(var j=1;j<n;j++){var pc=pcs[(r+j)%n],x=a[j-1]+1;while(mod(x)!==pc)x++;a.push(x)}
    if(a[n-1]<=HI&&ok)out.push(a)}}
  return out};
 var mean=function(a){var s=0;a.forEach(function(v){s+=v});return s/a.length};
 var voices=function(it,key){var out=[],prev=null;
  it.seq.forEach(function(id){
   var g=D[id],def=SD.chordDef(g.t),root=mod(key+g.d),pcs=def.iv.map(function(v){return mod(root+v)}),best=null,bs=1e9;
   cands(pcs).forEach(function(a){var s=0;
    if(prev){for(var j=0;j<Math.min(a.length,prev.length);j++)s+=Math.abs(a[j]-prev[j])}
    s=s*100+Math.abs(mean(a)-CEN);
    if(s<bs){bs=s;best=a}});
   prev=best;out.push([36+root].concat(best))});
  return out};

 /* ---- 採点・名前あて ---- */
 var grade=function(it,ans){var ok=it.seq.map(function(id,i){return !!ans&&ans[i]===id}),n=ok.filter(Boolean).length;return {ok:ok,n:n,all:n===it.seq.length}};
 var choices=function(it,rnd){rnd=rnd||Math.random;
  var sh=function(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a};
  var others=sh(items.filter(function(x){return x.id!==it.id})),same=others.filter(function(x){return x.mode===it.mode}),diff=others.filter(function(x){return x.mode!==it.mode});
  return sh([it].concat(same.concat(diff).slice(0,3)))};

 /* ---- 進捗 ---- */
 var prog=function(){var p=SD.store.get('prg',{});return p&&typeof p==='object'?p:{}};
 var seen=function(pg,id){return !!(pg[id]&&pg[id].a>0)};
 var mastered=function(pg,id){return !!(pg[id]&&pg[id].s>=2)};
 var rec=function(id,ok,hint){var p=prog(),e=p[id]||{a:0,c:0,s:0,t:0};
  e.a++;if(ok){e.c++;if(!hint)e.s++}else e.s=0;e.t=Date.now();p[id]=e;SD.store.set('prg',p);return e};
 var stats=function(pg){pg=pg||prog();return {total:items.length,seen:items.filter(function(x){return seen(pg,x.id)}).length,mastered:items.filter(function(x){return mastered(pg,x.id)}).length}};
 /* 次の出題: lv(0=全部)の中で、まだ◎でないものを重要度の高い順に。直前の問題は1回とばす。全部◎なら、最後に解いたのが古い順に復習 */
 var pickNext=function(pg,lv,last){
  var L=byImp().filter(function(x){return !lv||x.lv===lv}),C=L.filter(function(x){return x.id!==last});if(!C.length)C=L;
  var un=C.filter(function(x){return !mastered(pg,x.id)});if(un.length)return un[0];
  return C.slice().sort(function(a,b){return ((pg[a.id]||{}).t||0)-((pg[b.id]||{}).t||0)||a.imp-b.imp})[0]};

 SD.PRG={items:items,degrees:D,pal:pal,LVN:LVN,item:item,byImp:byImp,byLv:byLv,
  chordName:chordName,keyName:keyName,sample:sample,tonicOf:tonicOf,label:label,voices:voices,
  grade:grade,choices:choices,prog:prog,seen:seen,mastered:mastered,rec:rec,stats:stats,pickNext:pickNext};
})();
