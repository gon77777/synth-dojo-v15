/* v11.13 MU-F 鍵盤判定(step.play)と耳トレ(mf01〜mf03)。判定は純粋関数 SD.MF.judge。本文に年号・人名・曲名は書かない。
   step.play={notes:[音名0〜11(C=0)],seq:true|false,tol:許す余分な音の数(既定0),win:和音とみなす時間ms(既定2500)}
   音名は押した鍵そのもの(KEYやオクターブに依らない)。seq=順に弾く/省略=同時に(少しずらしてもよい) */
(function(){
 var NM=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
 var pc=function(m){return ((m%12)+12)%12};
 /* hist=[{pc,t}] 古い順。true なら「できた」 */
 var judge=function(p,hist){
  if(!p||!p.notes||!p.notes.length||!hist||!hist.length)return false;
  var tol=p.tol|0,N=p.notes;
  if(p.seq){var tail=hist.slice(-(N.length+tol)),j=0;tail.forEach(function(h){if(j<N.length&&h.pc===N[j])j++});
   return j===N.length&&tail.length>=N.length&&tail[tail.length-1].pc===N[N.length-1]}
  var win=p.win||2500,end=hist[hist.length-1].t,set={};
  hist.forEach(function(h){if(end-h.t<=win)set[h.pc]=1});
  var has=N.every(function(n){return set[n]}),extra=Object.keys(set).filter(function(k){return N.indexOf(+k)<0}).length;
  return has&&extra<=tol};
 var label=function(p){return p.notes.map(function(n){return NM[pc(n)]}).join(p.seq?' → ':' + ')};
 /* ランダム出題: s.rnd={pool:[トラック番号…],info:{番号:特徴の一言}}。正解1+ほか2をプールから選び、並びを混ぜて s.cmp・s.quiz・s.b を作り直す(rng 差し替え可) */
 var draw=function(L,s,rng){rng=rng||Math.random;var r=s.rnd,p=r.pool.slice(),pick=function(){return p.splice(Math.floor(rng()*p.length),1)[0]};
  var t=pick(),o=[t,pick(),pick()];for(var i=2;i>0;i--){var j=Math.floor(rng()*(i+1)),x=o[i];o[i]=o[j];o[j]=x}
  var nm=function(k){return L.tk[k].o.name},n=L.tk.length;
  s.cmp=o.map(function(k,i){var m=[];for(var q=0;q<n;q++)if(q!==k)m.push(q);return {l:String(i+1),mt:m}});
  s.b='3つを聴いて、'+nm(t)+'を選ぼう。目安: '+r.info[t];
  s.quiz={q:nm(t)+'はどれ?',ans:o.indexOf(t)+1,ex:nm(t)+'が正解。'+r.info[t]+' ほかは、'+o.filter(function(k){return k!==t}).map(function(k){return nm(k)+'('+r.info[k]+')'}).join('、')+'。'};
  return t};
 SD.MF={judge:judge,label:label,pc:pc,NAMES:NM,draw:draw};
 /* ===== 既存レッスンの一部のステップに「弾いてみよう」を付ける(本文・ステップ数は変えない) ===== */
 var PL={mu01:{0:{notes:[0,2,4],seq:true,tol:1}},mu03:{0:{notes:[0,2,4,5,7,9,11],seq:true,tol:2}},mu04:{0:{notes:[0,2,3,5,7,8,10],seq:true,tol:2}},
  mu06:{0:{notes:[0,4,7]},1:{notes:[0,3,7]},2:{notes:[0,3,6]},3:{notes:[0,4,8]}},mu07:{0:{notes:[0,4,7,11]},1:{notes:[0,4,7,10]}},
  /* MF2: 応用(MU2/AL2)。C基準の音名で判定 */
  mu20:{1:{notes:[11,5]},2:{notes:[1,0],seq:true}},mu21:{2:{notes:[11,2,5,8]},3:{notes:[0,3,6,9]}},
  mu22:{1:{notes:[4,5,8,9,11,0,2],seq:true,tol:2}},
  mu25:{1:{notes:[0,2,4,7,10],seq:true,tol:2},2:{notes:[0,3,5,6,10],seq:true,tol:2},3:{notes:[0,2,4,5,7,9,10,11],seq:true,tol:2}},
  al20:{0:{notes:[0,4,7,11],seq:true,tol:1}}};
 Object.keys(PL).forEach(function(id){var L=SD.LESSONS.find(function(l){return l.id===id});if(!L)return;
  Object.keys(PL[id]).forEach(function(i){if(L.steps[i])L.steps[i].play=PL[id][i]})});
 /* ===== 耳トレ: 既存のコース MU に mf01〜mf03 を足す(th12 と同じ聴き比べ+クイズ) ===== */
 var H=SD.MUH,on2=function(a,n){var r=[];for(var i=0;i<n;i++)if(a.indexOf(i)<0)r.push(i);return r};
 var L=function(o){o.cat='mu1';o.synth='analog';o.lv=2;o.course='MU';o.kind='read';o.mode='trk';o.tab='trk';o.ts=0;o.oct=0;o.demo={n:[60,64,67]};o.terms=o.terms||[];SD.LESSONS.push(o)};
 var cm=function(opts,n){return opts.map(function(k,i){return {l:String(i+1),mt:on2([k],n)}})};
 var iv=function(nm,r){return H.mel(nm,'chrom',[0,r])},ch=function(nm,t){return H.chd(nm,[[0,t],[0,t]],[0,8],6)};
 var ln=function(nm,a){return H.lick(a.map(function(s){return [s,1,0]}),0,{name:nm})};
 /* mf01 音程を聴き分ける */
 L({id:'mf01',pre:['mu02'],title:'耳トレ: 音程を聴き分ける',sub:'2音の距離を耳で当てる',
  tk:[iv('長3度',4),iv('短3度',3),iv('完全5度',7),iv('完全4度',5),iv('三全音',6),iv('オクターブ',12)],steps:[
  {h:'距離を耳で当てる',b:'2つの音の距離を、名前でなく響きで聞き分ける練習。まず低い音から高い音へ上がる2音を聴き、半音の数ごとの顔つきを覚えよう。何度でも聴き直してよい。',tab:'trk'},
  {h:'長3度と短3度',b:'半音4つの長3度は明るく、半音3つの短3度は少し暗い。差は半音1つだけ。両方を聴き比べて、明るさの違いをつかもう。',tab:'trk',cmp:[{l:'長3度',mt:on2([0],6)},{l:'短3度',mt:on2([1],6)}]},
  {h:'ランダム問題1',b:'3つを聴いて、半音7つの完全5度を選ぼう。開けて安定した、素直に澄んだ響きがする。',tab:'trk',cmp:cm([1,2,4],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るい。',1:'少し暗い。',2:'澄んで安定。',3:'落ち着くが開く。',4:'とがって不安定。',5:'同じ名前へ跳ぶ。'}},quiz:{q:'完全5度はどれ?',ans:2,ex:'2が完全5度で、澄んで安定している。1は短3度で暗め、3は三全音で落ち着かない。'}},
  {h:'ランダム問題2',b:'3つを聴いて、半音3つの短3度を選ぼう。近い距離で、少し影のある響きがする。',tab:'trk',cmp:cm([3,5,1],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るい。',1:'少し暗い。',2:'澄んで安定。',3:'落ち着くが開く。',4:'とがって不安定。',5:'同じ名前へ跳ぶ。'}},quiz:{q:'短3度はどれ?',ans:3,ex:'3が短3度。1の完全4度はもう少し開いて落ち着き、2のオクターブは同じ名前の音へ跳ぶ。'}},
  {h:'ランダム問題3',b:'3つを聴いて、半音6つの三全音を選ぼう。どこにも落ち着けない、とがった距離。',tab:'trk',cmp:cm([4,2,0],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るい。',1:'少し暗い。',2:'澄んで安定。',3:'落ち着くが開く。',4:'とがって不安定。',5:'同じ名前へ跳ぶ。'}},quiz:{q:'三全音はどれ?',ans:1,ex:'1が三全音で、不安定に響く。2の完全5度は澄んで安定し、3の長3度は明るく落ち着く。'}},
  {h:'まとめ',b:'3度は明暗、5度は安定、三全音は不安定、とそれぞれの顔つきがある。間違えたら mu02 の聴き比べに戻り、半音の数と響きを結び付け直そう。',tab:'trk',
   col:{h:'毎日1分でよい',b:'長く続けるより、短くても毎日聴くほうが耳は育つ。弾いた音をすぐ歌ってみると、距離の感覚がさらに早く身に付く。'}}
 ]});
 /* mf02 和音の種類を聴き分ける */
 L({id:'mf02',pre:['mu06'],title:'耳トレ: 和音の種類を聴き分ける',sub:'長・短・減・増・7thを耳で当てる',
  tk:[ch('C 長三和音','maj'),ch('Cm 短三和音','min'),ch('Cdim 減三和音','dim'),ch('Caug 増三和音','aug'),ch('C7','7'),ch('CM7','maj7')],steps:[
  {h:'響きで種類を当てる',b:'和音の種類を、名前でなく響きの性格で聞き分ける練習。明るい・暗い・とがる・浮く・濁る・澄む、という違いを手がかりにしよう。',tab:'trk'},
  {h:'長と短',b:'長三和音は明るく、短三和音は暗い。違いは真ん中の音が半音1つ低いだけ。両方を聴いて、まず明暗で分けられるようにしよう。',tab:'trk',cmp:[{l:'長三和音',mt:on2([0],6)},{l:'短三和音',mt:on2([1],6)}]},
  {h:'ランダム問題1',b:'3つを聴いて、暗くて落ち着いた短三和音を選ぼう。',tab:'trk',cmp:cm([0,1,3],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るく安定。',1:'暗いが落ち着く。',2:'とがって不安定。',3:'ふわっと浮く。',4:'濁って進みたくなる。',5:'澄んで浮かぶ。'}},quiz:{q:'短三和音はどれ?',ans:2,ex:'2が短三和音で、暗いが落ち着いている。1は長三和音で明るく、3は増三和音で浮いている。'}},
  {h:'ランダム問題2',b:'3つを聴いて、濁りがあって次へ進みたくなるC7を選ぼう。',tab:'trk',cmp:cm([5,4,1],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るく安定。',1:'暗いが落ち着く。',2:'とがって不安定。',3:'ふわっと浮く。',4:'濁って進みたくなる。',5:'澄んで浮かぶ。'}},quiz:{q:'C7はどれ?',ans:2,ex:'2がC7で、短7度が濁りと緊張を作る。1のM7は澄んで浮かび、3は7度のない短三和音。'}},
  {h:'ランダム問題3',b:'3つを聴いて、とがって不安定な減三和音を選ぼう。',tab:'trk',cmp:cm([3,0,2],6),rnd:{pool:[0,1,2,3,4,5],info:{0:'明るく安定。',1:'暗いが落ち着く。',2:'とがって不安定。',3:'ふわっと浮く。',4:'濁って進みたくなる。',5:'澄んで浮かぶ。'}},quiz:{q:'減三和音はどれ?',ans:3,ex:'3が減三和音で、5度が縮んで不安定。1は増三和音でふわっと浮き、2は長三和音で明るく安定している。'}},
  {h:'まとめ',b:'明暗は3度、とがりや浮きは5度、濁りや澄みは7度が決める。聞き分けに迷ったら mu06・mu07 へ戻り、式と響きを結び直そう。',tab:'trk',
   col:{h:'歌うと覚えやすい',b:'和音の音を下から順に歌って、構成音を1つずつ確かめる。耳と声がつながると、弾く前に響きが想像できるようになる。'}}
 ]});
 /* mf03 リズムを聴き分ける(1小節の打音の位置) */
 var A=[0,4,8,12],B=[0,2,4,6,8,10,12,14],C=[0,3,6,10,12],D=[2,6,10,14],E=[0,4,12];
 L({id:'mf03',pre:['th06'],title:'耳トレ: リズムを聴き分ける',sub:'打つ位置を耳で当てる',
  tk:[ln('4分音符',A),ln('8分音符',B),ln('ずらした型',C),ln('裏拍',D),ln('3拍目が休み',E)],steps:[
  {h:'打つ位置を聴く',b:'音の高さは同じにして、打つ位置だけが違う1小節を聴く。強く感じる拍はどこか、空いている拍はどこかを手がかりに聞き分けよう。',tab:'trk'},
  {h:'表と裏',b:'1・2・3・4の拍の頭に打つと表拍で、安定して進む。拍と拍の間に打つと裏拍で、前へ傾いて聞こえる。両方を聴き比べよう。',tab:'trk',cmp:[{l:'4分音符',mt:on2([0],5)},{l:'裏拍',mt:on2([3],5)}]},
  {h:'ランダム問題1',b:'3つを聴いて、拍の頭を外し、間だけで打つものを選ぼう。',tab:'trk',cmp:cm([0,3,1],5),rnd:{pool:[0,1,2,3,4],info:{0:'拍の頭だけ。',1:'休まず細かく刻む。',2:'間隔が不ぞろい。',3:'拍の間だけ。',4:'3拍目が抜ける。'}},quiz:{q:'裏拍だけはどれ?',ans:2,ex:'2が裏拍だけ。1は拍の頭だけの4分音符で、3は表も裏も細かく打つ8分音符。'}},
  {h:'ランダム問題2',b:'3つを聴いて、拍の頭も間も休まず、等間隔で細かく刻むものを選ぼう。',tab:'trk',cmp:cm([1,2,0],5),rnd:{pool:[0,1,2,3,4],info:{0:'拍の頭だけ。',1:'休まず細かく刻む。',2:'間隔が不ぞろい。',3:'拍の間だけ。',4:'3拍目が抜ける。'}},quiz:{q:'8分音符で刻むのはどれ?',ans:1,ex:'1が8分音符の連打。2は間隔が不ぞろいで、3は拍の頭だけを打っている。'}},
  {h:'ランダム問題3',b:'3つを聴いて、4つのうち3つ目の拍だけ音が抜けているものを選ぼう。',tab:'trk',cmp:cm([0,1,4],5),rnd:{pool:[0,1,2,3,4],info:{0:'拍の頭だけ。',1:'休まず細かく刻む。',2:'間隔が不ぞろい。',3:'拍の間だけ。',4:'3拍目が抜ける。'}},quiz:{q:'3拍目が休みなのは?',ans:3,ex:'3が3拍目の休み。1は4拍とも打ち、2は8分音符で全部に打っている。'}},
  {h:'まとめ',b:'リズムは、どこに打つかだけでなく、どこを打たないかでも決まる。休みの位置に気づけると、フレーズの形が見えてくる。',tab:'trk',
   col:{h:'足でカウント',b:'足で拍を踏みながら聴くと、打つ位置のずれがはっきり分かる。拍が体に入ると、速さが変わっても迷わなくなる。'}}
 ]});
})();
