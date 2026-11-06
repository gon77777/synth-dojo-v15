/* v11.22 MX-7 XS 上級空間・ステレオ(xs01〜xs10 の全10本)。lv3・TRK+MIX/FXタブ。xs06〜xs10=位相とモノ互換・奥行きの三層・動く空間・近い/遠いの境目・総合演習。
   WIDTH は中央/左右差(M/S)なので、モノにすると広げる前と同じ(xs06)。AUTO で動かせるのは PAN・送り・音量など(WIDTH は動かせない)。
   このアプリのリバーブ・ディレイは1つずつ(トラックごとの送り tRvb・tDly で量を決める)。リターンに EQ・COMP は無いので、
   DAMP・TONE・DUCK・送り元のEQ(送りはインサートの後ろから取る)で整える。WIDTH は低い成分を広げない作り(ef13)。LUFS・位相相関は測れない。
   聞き比べの cmp.g は tools/xs-cal.js(オフライン描画)で出して GT に貼る。この版では未測定(GT は空)。test/xs.js は g があれば差1dB以内を検査する。
   数値は目安(SD.GUIDE の {g:} か、つまみ値と同じ数字のみ)。年号・人名・機材名は書かない */
(function(){
 var T=SD.TERMS,A=function(id,name,kana,en,def,see,tags){T.push({id:id,name:name,kana:kana,en:en,def:def,see:see,tags:tags||['XS','FX']})};
 A('xs_roleverb','役割別リバーブ','やくわりべつりばーぶ','role-based reverb','1つのリバーブを共有し、トラックごとの送りの量で役割を分けること。低い音は送らず、主役は少なめ、空間の音は多め。',['xs01']);
 A('xs_predtempo','プリディレイのテンポ合わせ','ぷりでぃれいのてんぽあわせ','tempo-matched pre-delay','PRE DLYを、拍を細かく割った長さに合わせること。120BPMの32分音符は約62ms。上限100msの範囲で選ぶ。',['xs02']);
 A('xs_delayclean','ディレイの整形','でぃれいのせいけい','delay shaping','返りの高域(TONE)・低域(送り元のLOW CUT)・音量(DUCK)を整えて、濁らず主役の後ろに置くこと。',['xs03']);
 A('xs_retshape','リターンの整形','りたーんのせいけい','return shaping','リバーブやディレイの戻りを、DAMP・DUCK・送り元のEQで整えること。このアプリの戻りにEQやCOMPは無い。',['xs04']);
 A('xs_widthdesign','幅の設計','はばのせっけい','width design','低域は中央、中域は中央寄り、高域は広く、と帯域ごとに左右の広がりを決めること。最後はモノで確かめる。',['xs05']);
 A('xs_monocompat','モノ互換','ものごかん','mono compatibility','モノにしても音が崩れないこと。WIDTHはモノで変わらないが、短いずれや揺れで作った広がりは濃淡が出ることがある。',['xs06']);
 A('xs_layer3','奥行きの三層','おくゆきのさんそう','three depth layers','音を前・中・奥の3つの層に分けること。前は響き少なめ、奥は響き多めで小さく暗くする。',['xs07']);
 A('xs_motion','動く空間','うごくくうかん','moving space','パンや響きの送りを時間で動かして、音の位置や距離を変えること。動かすのは飾りの音に絞る。',['xs08']);
 A('xs_distance','距離の4つの手','きょりのよっつのて','distance cues','ドライの量・高域の明るさ・音量・プリディレイの4つで、近い・遠いを決めること。',['xs09']);
 A('xs_spacedesign','空間の設計','くうかんのせっけい','space design','低域を中央に、左右を分け、前後を三層にし、幅を足してモノで確かめる順番で配置を決めること。',['xs10']);
 [['reverb',['xs01','xs02','xs04','xs07']],['send',['xs01','xs04','xs08']],['rtn',['xs01','xs04']],['predly',['xs02','xs09']],['damp',['xs04']],['dry',['xs02','xs07','xs09']],['delay',['xs03']],['duckd',['xs03','xs04']],['wide',['xs05','xs06','xs10']],['mono',['xs05','xs06']],['stereo',['xs05']],['haas',['xs06']],['depth',['xs07','xs09','xs10']],['pan',['xs08','xs10']],['lfo',['xs08']]].forEach(function(p){T.forEach(function(t){if(t.id===p[0])p[1].forEach(function(s){if(t.see.indexOf(s)<0)t.see.push(s)})})});
 var P=SD.PATS,TK=P.tk;
 /* 聞き比べの音量補正 g(dB)。tools/xs-cal.js が出す表をここに貼る(キーは レッスンID+'s'+ステップ+案の番号。0=補正なし)。未測定 */
 var GT={};
 var cm=function(key,items){return items.map(function(it,i){var o=Object.assign({l:it[0]},it[1]);var g=GT[key+(i+1)];if(g!==undefined)o.g=g;return o})};
 var z=function(a){var q={};a.forEach(function(i){q[i]=0});return q};
 var CPD={iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20};
 var NO=Object.assign({},CPD,{iCpThr:0,iCpRatio:1});
 var ED={iEqOn:1,iEqHpf:20,iEqLpf:20000,iEqLg:0,iEqB1g:0,iEqB2g:0,iEqHg:0},E=function(o){return Object.assign({},ED,o||{})};
 var MDC={iMdOn:1,iMdType:0,iMdRate:.8,iMdDepth:.5,iMdFb:0,iMdMix:.5};
 var RV=function(o){return Object.assign({rvbMix:.4,rvbType:2,rvbSize:2,rvbPre:0,rvbDamp:.5,rvDuckOn:0,dlyMix:0},o)};
 var DL=function(o){return Object.assign({dlyMix:.45,dlyFb:.5,dlySync:1,dlyDiv:4,dlyTone:12000,dlyPP:0,dlyMode:1,dlDuckOn:0,rvbMix:0},o)};
 var SW=function(o){return Object.assign({swOn:1,swWidth:1,dlyMix:0,rvbMix:0},o)};
 var withM=function(t,mix,eq){t.o.mx={eq:eq||{iEqOn:0},cp:NO};t.o.mix=mix||{};return t};
 var BASS={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:.3,noiseLvl:0,fType:'lowpass',cutoff:700,res:.1,envAmt:.3,drive:0,aA:.004,aD:.25,aS:.7,aR:.1};
 var PAD={o1Wave:'sawtooth',o1Lvl:.25,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:3000,res:.1,envAmt:0,drive:0,aA:.01,aD:.2,aS:.7,aR:.2};
 var LEADP={o1Wave:'sawtooth',o1Lvl:.3,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:5000,res:.1,envAmt:.2,drive:0,aA:.004,aD:.2,aS:.5,aR:.15};
 var KIK=function(mix){return withM(TK('kick',P.fourFloor(),'キック'),mix)};
 var SNR=function(mix){return withM(TK('snare',{idx:z([4,12]),o:{}},'スネア'),mix)};
 var HAT=function(mix){return withM(TK('hat',{idx:z([2,6,10,14]),o:{}},'ハット',{acc:[2,6,10,14]}),mix)};
 var BAS=function(mix){return withM(TK('bass',P.bassPattern('eighth',0),'ベース',{scale:'minor',p:BASS,acc:[0,4,8,12]}),mix)};
 var LED=function(mix,eq){return withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード',scale:'minor',tr:24,p:LEADP}},mix,eq)};
 var PDH=function(mix,eq){var q={},t=[],i;for(i=0;i<16;i++)q[i]=0;for(i=0;i<16;i++)if(i!==0&&i!==8)t.push(i);return withM({id:'bass',idx:q,o:{name:'パッド',scale:'minor',tr:12,tie:t,p:PAD}},mix,eq)};
 var L4=1536,sine=function(c,lo,hi){var a=[],n=c*16,i;for(i=0;i<=n;i++)a.push([Math.round(L4*i/n),+((lo+hi)/2+(hi-lo)/2*Math.sin(2*Math.PI*i/16)).toFixed(3),'L']);return a};
 var snd=function(a,b,c,d){return {1:{tRvb:a},2:{tRvb:b},3:{tRvb:c},4:{tRvb:d}}};
 var qz=function(q,ans,ex){return {q:q,ans:ans,ex:ex}};
 var MV=function(trk,k,lo,hi){return {trk:trk,ins:'mix',k:k,rng:[lo,hi]}};
 var base=function(o){return SD.XM.base(Object.assign({cat:'xs1',course:'XS'},o))};
 var INIT={dlyMix:0,rvbMix:.4,rvbType:2,rvbSize:2,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0};
 SD.LESSONS.push(
/* ---------------- xs01 ---------------- */
base({id:'xs01',pre:['ef12'],terms:['xs_roleverb','reverb','send','rtn'],title:'リバーブの設計(共有+役割別)',sub:'部屋は1つ、役割は送りで分ける',ts:2,save:{name:'役割別の送りを決めたミックス',kind:'kit'},
 init:INIT,tk:[KIK({tDly:0,tRvb:.6}),SNR({tDly:0,tRvb:.6}),LED({tDly:0,tRvb:.6}),PDH({tDly:0,tRvb:.6})],steps:[
 {h:'部屋は1つ・役割は送りで',b:'このアプリのリバーブは1つ。部屋の広さを1つ決め、トラックごとの送りで【役割別リバーブ】を作る。まず3つの部屋を、送りをそろえて聞き比べよう。',tab:'mix',
  cmp:cm('xs01s1',[['短い部屋',{s:RV({rvbType:1,rvbSize:.6})}],['中くらい',{s:RV({rvbType:2,rvbSize:1.6})}],['長いホール',{s:RV({rvbType:2,rvbSize:3.5})}]])},
 {h:'低い音は送らない',b:'キックに響きを足すと低域がにごる。T1の送りをほぼ0%、T2(スネア)を15〜35%にして、密度だけを足そう。',tab:'mix',
  mx:[MV(1,'tRvb',0,.05),MV(2,'tRvb',.15,.35)],
  cmp:cm('xs01s2',[['全員に同じ送り',{tm:snd(.6,.6,.6,.6)}],['キックは送らない',{tm:snd(0,.25,.6,.6)}]]),
  quiz:qz('キックの低域がにごりやすいのは?',1,'1が正解。キックにも同じ量を送ると、低い音に響きが重なって、土台がぼやける。')},
 {h:'主役は少なめ・空間は多め',b:'リード(T3)は主役なので25〜50%。パッド(T4)は空間を作る役なので70〜100%にしよう。送りの差が、前後の差になる。',tab:'mix',
  mx:[MV(3,'tRvb',.25,.5),MV(4,'tRvb',.7,1)]},
 {h:'役割別を聞き比べる',b:'全員同じ送り・役割別・全員多めを聞き比べよう。役割別は、主役が前に残り、パッドが奥で広がる。',tab:'mix',
  cmp:cm('xs01s4',[['全員多め',{tm:snd(1,1,1,1)}],['全員同じ',{tm:snd(.6,.6,.6,.6)}],['役割別',{tm:snd(0,.25,.4,.9)}]]),
  quiz:qz('主役が前に残り、パッドが奥に広がるのは?',3,'3が正解。送りに差をつけると、少ない音は手前、多い音は奥に聞こえる。1は全員が響きに包まれて前後が出ない。')},
 {h:'長い響きは送る相手を絞る',b:'響きを長くするほど、重なって濁りやすい。RVB SIZEを約3秒にして、パッドだけに送る。全員に送った場合と比べよう。',tab:'fx',f:[['rvbSize',3]],tol:.1,
  cmp:cm('xs01s5',[['長い響き・全員に',{s:RV({rvbSize:3}),tm:snd(.6,.6,.6,.6)}],['長い響き・パッドだけ',{s:RV({rvbSize:3}),tm:snd(0,0,0,.9)}]])},
 {h:'誰に送るかで決める',b:'響きの種類を増やさなくても、「誰に・どれだけ送るか」で空間の設計はできる。決めたら保存して、次の曲でも使おう。',tab:'mix',
  col:{h:'低い音は送らない',b:'キックやベースの低域は、響きに混ぜるとにごりやすい。送るのは、中高域に居場所のある音から。足りなければ、少しずつ足す。'}}
]}),
/* ---------------- xs02 ---------------- */
base({id:'xs02',pre:['ef11','pn08'],terms:['xs_predtempo','predly','dry'],title:'プリディレイとテンポ',sub:'響き出しを拍の細かい長さに合わせる',ts:3,save:{name:'プリディレイを決めたミックス',kind:'kit'},
 init:INIT,tk:[KIK({tDly:0,tRvb:0}),SNR({tDly:0,tRvb:.3}),LED({tDly:0,tRvb:1}),HAT({tDly:0,tRvb:.2})],steps:[
 {h:'響き出しを遅らせる',b:'リバーブの響きが始まるまでの間が【プリディレイ】。長いほど、もとの音(ドライ)が先にはっきり聞こえる。0・31・62msを聞き比べよう。',tab:'fx',
  cmp:cm('xs02s1',[['PRE 0ms',{s:RV({rvbPre:0})}],['PRE 31ms',{s:RV({rvbPre:31.25})}],['PRE 62ms',{s:RV({rvbPre:62.5})}]])},
 {h:'拍から長さを計算',b:'1拍の長さは60000÷BPM(ms)。120BPMなら500ms、16分音符は125ms、32分音符は62.5ms。PRE DLYの上限は100msなので、32分以下を使う。',tab:'fx'},
 {h:'32分音符に合わせる',b:'FXタブの PRE DLY を62msにしよう。次の16分の頭より手前で響きが始まるので、リズムを邪魔しにくい。これが【プリディレイのテンポ合わせ】。',tab:'fx',
  f:[['rvbPre',62.5]],tol:.08},
 {h:'長すぎると別の音',b:'PRE DLYを上限の100msにすると、響きがもとの音から離れて、エコーのように別の音として聞こえはじめる。3つを聞き比べよう。',tab:'fx',
  cmp:cm('xs02s4',[['PRE 31ms',{s:RV({rvbPre:31.25})}],['PRE 62ms',{s:RV({rvbPre:62.5})}],['PRE 100ms',{s:RV({rvbPre:100})}]]),
  quiz:qz('響きが別の音のように離れて聞こえるのは?',3,'3が正解(PRE 100ms)。もとの音との間が広がり、響きだけが遅れて聞こえる。')},
 {h:'主役の送りと合わせる',b:'プリディレイで前に出した主役でも、送りが多すぎれば響きに埋もれる。T3(リード)の送りを40〜80%にして、前後を整えよう。',tab:'mix',
  mx:[MV(3,'tRvb',.4,.8)],
  cmp:cm('xs02s5',[['送り100%・PRE 0',{tm:{3:{tRvb:1}},s:RV({rvbPre:0})}],['送り60%・PRE 62',{tm:{3:{tRvb:.6}},s:RV({rvbPre:62.5})}]]),
  quiz:qz('リードがいちばん前に聞こえるのは?',2,'2が正解。送りが少なく、プリディレイで響きが遅れるので、ドライの頭が前に残る。')},
 {h:'テンポが変わったら',b:'BPMが遅いほど拍は長い。90BPMなら32分は約83msで、上限に近づく。上限を超えるなら、64分に切り替える。BPMが決まってから計算しよう。',tab:'fx',
  col:{h:'合わせすぎなくてよい',b:'プリディレイは、響きを拍の中に収める目安。ぴったりでなくても大きな問題はない。迷ったら、32分音符から始めて、耳で少し足し引きする。'}}
]}),
/* ---------------- xs03 ---------------- */
base({id:'xs03',pre:['ef09'],terms:['xs_delayclean','delay','duckd'],title:'ディレイを空間にする',sub:'高域・低域・ダッキングで濁らせない',ts:3,save:{name:'整えたディレイのミックス',kind:'kit'},
 init:{dlyMix:.45,dlyFb:.5,dlySync:1,dlyDiv:4,dlyTone:12000,dlyPP:0,dlyMode:1,dlDuckOn:0,rvbMix:0,swOn:0},
 tk:[KIK({tDly:0,tRvb:0}),BAS({tDly:0,tRvb:0}),LED({tDly:1,tRvb:0},ED),HAT({tDly:.2,tRvb:0})],steps:[
 {h:'返りは主役の後ろに',b:'ディレイの返りが明るく太いままだと、主役と取り合って濁る。【ディレイの整形】は、高域・低域・音量の3つで返りを後ろへ下げる。まず整える前と後を聞き比べよう。',tab:'fx',
  cmp:cm('xs03s1',[['整える前',{s:DL({}),tm:{3:E({iEqHpf:20})}}],['整えた後',{s:DL({dlyTone:3000,dlDuckOn:1,dlDuckSrc:2,dlDuckDepth:.6}),tm:{3:E({iEqHpf:300})}}]])},
 {h:'高域を丸める',b:'繰り返すたびに高域を削るのが TONE。下げるほど暗くなり、主役の後ろに引っ込む。FXタブの DLY TONE を3000Hz前後にしよう。',tab:'fx',
  f:[['dlyTone',3000]],tol:.1,
  cmp:cm('xs03s2',[['TONE 12000Hz',{s:DL({dlyTone:12000})}],['TONE 4500Hz',{s:DL({dlyTone:4500})}],['TONE 1500Hz',{s:DL({dlyTone:1500})}]]),
  quiz:qz('返りがいちばん暗いのは?',3,'3が正解(TONE 1500Hz)。繰り返すたびに高域が削られ、こもって聞こえる。')},
 {h:'低域は送り元で削る',b:'ディレイに戻る低域は、にごりの元。送りはEQのあとから取るので、T3のLOW CUTを200〜400Hzにすれば、返りの低域も減る。',tab:'mix',
  mx:[{trk:3,ins:'eq',k:'iEqHpf',rng:[200,400]}],
  cmp:cm('xs03s3',[['LOW CUT 20Hz',{tm:{3:E({iEqHpf:20})}}],['LOW CUT 300Hz',{tm:{3:E({iEqHpf:300})}}]]),
  quiz:qz('返りの低域がすっきりしているのは?',2,'2が正解(LOW CUT 300Hz)。送る前に低域を削るので、返りにも低域が残らない。')},
 {h:'鳴っている間はへこませる',b:'ディレイのダッキングは、リードが鳴っている間だけ返りをへこませる。DLY DUCKをON、DLY SRCをT3、DEPTHを60%にしよう。',tab:'fx',
  f:[['dlDuckOn',1],['dlDuckSrc',2],['dlDuckDepth',.6]],tol:.1,
  cmp:cm('xs03s4',[['ダッキングなし',{s:DL({dlDuckOn:0})}],['ダッキングあり',{s:DL({dlDuckOn:1,dlDuckSrc:2,dlDuckDepth:.6})}]]),
  quiz:qz('リードの音の頭が、返りに埋もれにくいのは?',2,'2が正解。リードが鳴っている間は返りが下がり、音のすき間で戻る。')},
 {h:'繰り返しは数回で消す',b:'FBが高いと、いつまでも続いて濁る。FBを25〜45%、MIXを25〜40%にして、3〜4回で消える程度にしよう。',tab:'fx',
  f:[['dlyFb',.35],['dlyMix',.3]],tol:.1,
  cmp:cm('xs03s5',[['FB 80%',{s:DL({dlyFb:.8})}],['FB 50%',{s:DL({dlyFb:.5})}],['FB 20%',{s:DL({dlyFb:.2})}]]),
  quiz:qz('いつまでも続いて濁るのは?',1,'1が正解(FB 80%)。返りが減らないまま重なり、次の音を邪魔する。')},
 {h:'3つを合わせる',b:'高域(TONE)・低域(送り元のLOW CUT)・音量(DUCK)の3つを整えれば、ディレイは濁らずに空間を足せる。決めたら保存しよう。',tab:'fx',
  col:{h:'全部やらなくてよい',b:'3つすべてを深くかける必要はない。濁っている原因が、高域か、低域か、主役との重なりかを聞き分けて、必要なものだけ使う。'}}
]}),
/* ---------------- xs04 ---------------- */
base({id:'xs04',pre:['xs01'],terms:['xs_retshape','reverb','duckd'],title:'リターンの整形',sub:'DAMP・DUCK・送り元のEQで戻りを整える',ts:4,save:{name:'戻りを整えたミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:.4,rvbType:2,rvbSize:3,rvbPre:0,rvbDamp:.2,rvDuckOn:0,rvDuckSrc:2,rvDuckDepth:.5,rtDuckAtk:5,rtDuckHold:40,rtDuckRel:60,swOn:0},
 tk:[KIK({tDly:0,tRvb:0}),SNR({tDly:0,tRvb:.3}),LED({tDly:0,tRvb:.5}),PDH({tDly:0,tRvb:.8},ED)],steps:[
 {h:'戻りも整える',b:'【リターンの整形】は、送った先から戻る音を整えること。このアプリの戻りにEQやCOMPは無いので、DAMP・DUCK・送り元のEQを使う。整える前と後を聞き比べよう。',tab:'fx',
  cmp:cm('xs04s1',[['そのまま',{s:RV({rvbSize:3,rvbDamp:.2,rvDuckOn:0}),tm:{4:E({iEqHpf:20})}}],['整えた',{s:RV({rvbSize:3,rvbDamp:.6,rvDuckOn:1,rvDuckSrc:2,rvDuckDepth:.5}),tm:{4:E({iEqHpf:150})}}]])},
 {h:'送る前に低域を削る',b:'送りはEQのあとから取る。T4(パッド)のLOW CUTを{g:pad.hpf}にすると、戻りの低域も減って、ベースとぶつからない。',tab:'mix',
  mx:[{trk:4,ins:'eq',k:'iEqHpf',rng:[100,200]}]},
 {h:'DAMPで高域を丸める',b:'戻りの高域が明るいと、ハットや主役と取り合う。DAMPを上げると高域が早く消える。FXタブのRVB DAMPを60%にして聞き比べよう。',tab:'fx',
  f:[['rvbDamp',.6]],tol:.1,
  cmp:cm('xs04s3',[['DAMP 20%',{s:RV({rvbSize:3,rvbDamp:.2})}],['DAMP 50%',{s:RV({rvbSize:3,rvbDamp:.5})}],['DAMP 90%',{s:RV({rvbSize:3,rvbDamp:.9})}]]),
  quiz:qz('戻りがいちばん明るく残るのは?',1,'1が正解(DAMP 20%)。高域があまり削られず、きらびやかな響きが長く残る。')},
 {h:'主役の間はへこませる',b:'リバーブのダッキングは、リードが鳴っている間だけ戻りをへこませる。RVB DUCKをON、RVB SRCをT3、DEPTHを50%にしよう。',tab:'fx',
  f:[['rvDuckOn',1],['rvDuckSrc',2],['rvDuckDepth',.5]],tol:.1,
  cmp:cm('xs04s4',[['ダッキングなし',{s:RV({rvbSize:3,rvDuckOn:0})}],['ダッキングあり',{s:RV({rvbSize:3,rvDuckOn:1,rvDuckSrc:2,rvDuckDepth:.5,rtDuckRel:250})}]]),
  quiz:qz('リードの頭が、響きに埋もれにくいのは?',2,'2が正解。リードが鳴る間は戻りが下がるので、頭がはっきり聞こえる。')},
 {h:'戻る速さを決める',b:'へこんだ戻りが元に戻る速さが RET REL。短いと響きが急に戻って不自然、長いと戻りが遅い。50・250・800msを聞き比べよう。',tab:'fx',
  f:[['rtDuckRel',250]],tol:.1,
  cmp:cm('xs04s5',[['RET REL 50ms',{s:RV({rvbSize:3,rvDuckOn:1,rvDuckSrc:2,rvDuckDepth:.5,rtDuckRel:50})}],['RET REL 250ms',{s:RV({rvbSize:3,rvDuckOn:1,rvDuckSrc:2,rvDuckDepth:.5,rtDuckRel:250})}],['RET REL 800ms',{s:RV({rvbSize:3,rvDuckOn:1,rvDuckSrc:2,rvDuckDepth:.5,rtDuckRel:800})}]]),
  quiz:qz('響きがいちばん急に戻ってくるのは?',1,'1が正解(RET REL 50ms)。へこみがすぐ解けて、音のすき間で響きが勢いよく戻る。')},
 {h:'DAWなら戻りにEQ',b:'一般的なDAWでは、戻りのトラックにEQやCOMPを挿せる。ここでは同じ役目を、送り元のEQ(低域)とDAMP(高域)、DUCK(音量)で果たす。',tab:'fx',
  col:{h:'戻りは「後ろ」に置く',b:'リバーブの戻りは、主役の後ろにある背景。低域と高域を整え、主役が鳴る間は少し下げる。背景が主役と取り合わなければ、全体がすっきりする。'}}
]}),
/* ---------------- xs05 ---------------- */
base({id:'xs05',pre:['cx09','ef13'],terms:['xs_widthdesign','wide','mono','stereo'],title:'ステレオ幅の設計',sub:'低域は中央・高域は広く・モノで確かめる',ts:3,save:{name:'幅を設計したミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:0,swOn:0,swWidth:1},
 tk:[KIK({tDly:0,tRvb:0}),BAS({tDly:0,tRvb:0,tPan:.4}),PDH(Object.assign({tDly:0,tRvb:0,tPan:0},MDC)),HAT({tDly:0,tRvb:0,tPan:0})],steps:[
 {h:'帯域ごとに幅を決める',b:'【幅の設計】は、帯域ごとに広げる量を決めること。低域は中央、中域は中央寄り、高域は広く。WIDTHの0・100・200%を聞き比べよう。',tab:'fx',
  cmp:cm('xs05s1',[['WIDTH 0%(モノ)',{s:SW({swWidth:0})}],['WIDTH 100%',{s:SW({swWidth:1})}],['WIDTH 200%',{s:SW({swWidth:2})}]])},
 {h:'低域は中央に置く',b:'T2のベースが右に寄っている。PANを中央(-5〜+5%)に戻そう。低い音は中央に集めると、小さなスピーカーでも安定する。',tab:'mix',
  mx:[MV(2,'tPan',-.05,.05)],
  cmp:cm('xs05s2',[['ベースが右寄り',{tm:{2:{tPan:.4}}}],['ベースが中央',{tm:{2:{tPan:0}}}]]),
  quiz:qz('低域が安定して聞こえるのは?',2,'2が正解。低い音は中央に集めると、左右のスピーカーで力がそろう。')},
 {h:'高域は少し広げる',b:'ハット(T4)は{g:hat.pan}。PANを右へ10〜30%ずらそう。端いっぱいに振ると、片側に偏りすぎる。',tab:'mix',
  mx:[MV(4,'tPan',.1,.3)],
  cmp:cm('xs05s3',[['中央',{tm:{4:{tPan:0}}}],['右へ20%',{tm:{4:{tPan:.2}}}],['右いっぱい',{tm:{4:{tPan:1}}}]]),
  quiz:qz('位置が極端に偏っているのは?',3,'3が正解。右いっぱいは片側だけで鳴り、反対側のスピーカーで聞こえない。')},
 {h:'中域は揺れで広げる',b:'パッド(T3)のコーラス(MOD)は左右に差を作る。WIDTHをONにして、WIDTH AMTを140%前後にしよう。もとがモノの音は広がらない。',tab:'fx',
  f:[['swOn',1],['swWidth',1.4]],tol:.1,
  cmp:cm('xs05s4',[['MODなし+200%',{s:SW({swWidth:2}),tm:{3:{iMdOn:0}}}],['MODあり+100%',{s:SW({swWidth:1}),tm:{3:{iMdOn:1}}}],['MODあり+200%',{s:SW({swWidth:2}),tm:{3:{iMdOn:1}}}]])},
 {h:'モノで確かめる',b:'WIDTHだけで広げた音は、モノにすると広げる前と同じ音に戻る(xs06)。聞き比べたあと、MIX画面のMONOを押して、3つの差が消えるか確かめよう。',tab:'fx',
  cmp:cm('xs05s5',[['WIDTH 100%',{s:SW({swWidth:1})}],['WIDTH 150%',{s:SW({swWidth:1.5})}],['WIDTH 200%',{s:SW({swWidth:2})}]]),
  quiz:qz('ステレオで、いちばん広く聞こえるのは?',3,'3が正解(WIDTH 200%)。ただしMONOにすると3つとも同じ音。WIDTHだけなら、モノで薄くはならない。')},
 {h:'低・中・高を決める',b:'低域は中央、パッドで中域に揺れ、ハットで高域に広がり。この3つの役割で幅を作ると、モノでも崩れにくい。決めたら保存しよう。',tab:'fx',
  col:{h:'幅は「足す」より「選ぶ」',b:'全体を一度に広げるより、広げる音を選ぶほうが芯が残る。中央に置く音と広げる音の対比が、広がりを感じさせる。最後は必ずモノで確かめる。'}}
]}),
/* ---------------- xs06 ---------------- */
base({id:'xs06',pre:['pn03','pn07'],terms:['xs_monocompat','haas','mono','wide'],title:'位相とモノ互換',sub:'ずれ・揺れで作った広がりは、モノで確かめる',ts:3,save:{name:'モノで確かめたミックス',kind:'kit'},
 init:{dlyMix:.35,dlySync:0,dlyTime:.3,dlyFb:0,dlyPP:1,dlyMode:1,rvbMix:0,swOn:0,swWidth:1},
 tk:[KIK({tDly:0,tRvb:0}),BAS({tDly:0,tRvb:0}),LED({tDly:1,tRvb:0}),PDH(Object.assign({tDly:0,tRvb:0},MDC))],steps:[
 {h:'短いずれで広げる',b:'同じ音が数ms〜数十msずれて重なると、広がりや厚みになる。DLY TIMEを最短の20msにして、リード(T3)に短いずれを足そう。300msでは繰り返しに聞こえる。',tab:'fx',f:[['dlyTime',.02]],tol:.01,
  cmp:cm('xs06s1',[['ディレイなし',{s:DL({dlyMix:0})}],['20ms',{s:DL({dlySync:0,dlyTime:.02,dlyFb:0,dlyPP:1,dlyMix:.35})}],['300ms',{s:DL({dlySync:0,dlyTime:.3,dlyFb:0,dlyPP:1,dlyMix:.35})}]])},
 {h:'【モノ互換】とは',b:'モノにしても音が崩れないことを【モノ互換】という。小さなスピーカーや片耳では、左右が足し合わされる。20msのずれを足した音を、ステレオとモノで聞き比べよう。',tab:'fx',
  cmp:cm('xs06s2',[['ステレオ',{s:DL({dlySync:0,dlyTime:.02,dlyFb:0,dlyPP:1,dlyMix:.35})}],['モノ',{s:Object.assign(DL({dlySync:0,dlyTime:.02,dlyFb:0,dlyPP:1,dlyMix:.35}),{swOn:1,swWidth:0})}]])},
 {h:'WIDTHはモノで変わらない',b:'WIDTHは中央と左右の差に分けて広げる作り。モノにすると、左右の差は消えて中央だけが残る。つまり、WIDTHで広げただけなら、モノの音は広げる前と同じ。',tab:'fx',
  cmp:cm('xs06s3',[['WIDTH 200%',{s:SW({swWidth:2})}],['WIDTH 100%',{s:SW({swWidth:1})}],['モノ(0%)',{s:SW({swWidth:0})}]])},
 {h:'揺れは濃淡として残る',b:'一方、MODの揺れは、短い遅れを混ぜて作る。モノにすると、音の濃淡として残る。パッド(T4)のMODなし・CHORUS・FLANGERを、モノで聞き比べよう。',tab:'fx',
  cmp:cm('xs06s4',[['MODなし(モノ)',{s:SW({swWidth:0}),tm:{4:{iMdOn:0}}}],['CHORUS(モノ)',{s:SW({swWidth:0}),tm:{4:{iMdOn:1,iMdType:0}}}],['FLANGER(モノ)',{s:SW({swWidth:0}),tm:{4:{iMdOn:1,iMdType:2,iMdFb:.6}}}]]),
  quiz:qz('モノで、濃淡がいちばんはっきり動くのは?',3,'3が正解。FLANGERは短い遅れを戻して重ねるので、モノにすると濃淡が強く出る。')},
 {h:'手順: モノで確かめて弱める',b:'手順は、MONOを押す→痩せる音を探す→その音のMODやずれを弱める。パッドのMOD MIXを100%と30%にして、モノで聞き比べよう。',tab:'mix',
  cmp:cm('xs06s5',[['MOD MIX 100%',{s:SW({swWidth:0}),tm:{4:{iMdOn:1,iMdType:2,iMdMix:1}}}],['MOD MIX 30%',{s:SW({swWidth:0}),tm:{4:{iMdOn:1,iMdType:2,iMdMix:.3}}}]]),
  quiz:qz('モノでも芯が残りやすいのは?',2,'2が正解。混ぜる量が少ないほど、モノで足し合わされても、元の音が残る。')},
 {h:'広げた音ごとにMONO',b:'広げ方は3つ。WIDTH・短いずれ・揺れ。WIDTHは崩れにくく、ずれと揺れは崩れうる。広げた音ごとにMONOを押す手順を決めて、保存しよう。',tab:'fx',
  col:{h:'位相の数値は測れない',b:'このアプリには位相を数字で見るメーターが無い。だから、耳とMONOで確かめる。痩せる・こもる・消える音があれば、ずれや揺れを弱める。'}}
]}),
/* ---------------- xs07 ---------------- */
base({id:'xs07',pre:['pn08','pn10'],terms:['xs_layer3','depth','dry','reverb'],title:'奥行きの三層',sub:'前・中・奥に置く。音量・高域・ドライ比率',ts:3,save:{name:'三層に置いたミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:.45,rvbType:2,rvbSize:1.5,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0},
 tk:[KIK({tDly:0,tRvb:.6}),SNR({tDly:0,tRvb:.6}),LED({tDly:0,tRvb:.6},E()),PDH({tDly:0,tRvb:.6,tVol:1},E())],steps:[
 {h:'前・中・奥の三層',b:'前後は【奥行きの三層】で考える。前はスネア、中はリード、奥はパッド。全員が同じ位置のときと、三層に分けたときを聞き比べよう。',tab:'mix',
  cmp:cm('xs07s1',[['全員 同じ位置',{tm:snd(.6,.6,.6,.6)}],['三層',{tm:{1:{tRvb:.6},2:{tRvb:.1},3:{tRvb:.4},4:{tRvb:.9,tVol:.7}}}]])},
 {h:'前: 響きを足さない',b:'スネア(T2)は前の層。RVB SENDを0〜20%まで下げよう。響きの付いていない音(ドライ)が多いほど、近くで鳴って聞こえる。',tab:'mix',
  mx:[MV(2,'tRvb',0,.2)],
  cmp:cm('xs07s2',[['送り 60%',{tm:{2:{tRvb:.6}}}],['送り 10%',{tm:{2:{tRvb:.1}}}]]),
  quiz:qz('スネアが近くに聞こえるのは?',2,'2が正解。ドライが多いほど、響きに埋もれず、手前で鳴って聞こえる。')},
 {h:'中: ほどよく響かせる',b:'リード(T3)は中の層。RVB SENDを30〜50%にしよう。前のスネアよりは奥、パッドよりは手前に置くのがコツ。',tab:'mix',
  mx:[MV(3,'tRvb',.3,.5)]},
 {h:'奥: 送りを増やし、音量を下げる',b:'パッド(T4)は奥の層。RVB SENDを80〜100%、VOLを55〜85%にしよう。響きが多く、音が小さいほど、遠くに聞こえる。',tab:'mix',
  mx:[MV(4,'tRvb',.8,1),MV(4,'tVol',.55,.85)],
  cmp:cm('xs07s4',[['奥(送り90%・VOL 70%)',{tm:{4:{tRvb:.9,tVol:.7}}}],['手前(送り10%・VOL 100%)',{tm:{4:{tRvb:.1,tVol:1}}}]])},
 {h:'奥は高域も減らす',b:'遠い音は、高域が空気で減る。パッド(T4)のEQのLPFを4000〜9000Hzにしよう。響きと音量と高域を同じ向きに動かすと、奥行きがはっきりする。',tab:'mix',
  mx:[{trk:4,ins:'eq',k:'iEqLpf',rng:[4000,9000]}],
  cmp:cm('xs07s5',[['LPF 20000Hz',{tm:{4:{iEqOn:1,iEqLpf:20000}}}],['LPF 6000Hz',{tm:{4:{iEqOn:1,iEqLpf:6000}}}]]),
  quiz:qz('パッドが遠くに聞こえるのは?',2,'2が正解。高域が減ると、空気を挟んだように、遠い音に聞こえる。')},
 {h:'三層を決める',b:'前は響き少なめ、中はほどほど、奥は響き多めで小さく暗く。この3つの差が奥行きになる。決めたら保存して、MIXマップでも確かめよう。',tab:'mix',
  col:{h:'奥行きは「差」で作る',b:'全員を奥にすると、ただ遠いだけのミックスになる。手前に残す音があるから、奥が奥に聞こえる。前・中・奥に、役割を割り振ろう。'}}
]}),
/* ---------------- xs08 ---------------- */
base({id:'xs08',pre:['pn09','au25'],terms:['xs_motion','pan','lfo','send'],title:'動く空間',sub:'パン・送りをオートメーションで動かす',ts:3,save:{name:'空間を動かしたミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:.5,rvbType:2,rvbSize:2,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0},
 tk:[KIK({tDly:0,tRvb:0}),BAS({tDly:0,tRvb:0,tPan:.4}),LED({tDly:0,tRvb:.3,tPan:0}),PDH({tDly:0,tRvb:.5,tPan:0})],steps:[
 {h:'送りを動かして遠ざける',b:'空間は止まっていなくてよい。AUTOタブでT3(リード)のRVB SENDを、2小節目は20%、3小節目の頭で80%へ上げよう。リードがだんだん遠ざかる。',tab:'au',clr:'au',bars:4,
  au:[{id:'tRvb',trk:2,at:[[768,.2,.15],[1152,.8,.15]]}],ref:[{id:'tRvb',trk:2,pts:[[0,.2,'S'],[768,.2,'L'],[1152,.8,'L'],[L4,.8]]}],
  cmp:[{l:'固定',au:false},{l:'送りを上げる',ln:[{id:'tRvb',trk:2,pts:[[0,.2,'S'],[768,.2,'L'],[1152,.8,'L'],[L4,.8]]}]}]},
 {h:'下げて近づける',b:'逆に、送りを80%から10%へ下げると、リードが前に出てくる。サビの頭や、歌い出しの前に使うと効く。遠いまま・近づく、を聞き比べよう。',tab:'au',bars:4,
  cmp:[{l:'遠いまま',ln:[{id:'tRvb',trk:2,pts:[[0,.8,'S'],[L4,.8]]}]},{l:'近づく',ln:[{id:'tRvb',trk:2,pts:[[0,.8,'S'],[768,.8,'L'],[1152,.1,'L'],[L4,.1]]}]}],
  quiz:qz('途中でリードが前に出てくるのは?',2,'2が正解。送りが減ると、響きが減って、ドライが目立ち、近づいて聞こえる。')},
 {h:'パンは小さく動かす',b:'パッド(T4)のPANを、サインでゆっくり往復させる。大きく振るより、小さな動きのほうが、落ち着いて動きが分かる。',tab:'au',bars:4,
  cmp:[{l:'大きく往復(80%)',ln:[{id:'tPan',trk:3,pts:sine(2,-.8,.8)}]},{l:'小さく往復(30%)',ln:[{id:'tPan',trk:3,pts:sine(2,-.3,.3)}]},{l:'固定',au:false}],
  quiz:qz('落ち着いて、動きも分かるのは?',2,'2が正解。大きな動きは落ち着かない。小さな往復なら、気づく程度に空間が動く。')},
 {h:'低い音は動かさない',b:'動かすのはリードやパッドなどの飾り。ベース(T2)は右に寄っている。PANを中央に戻して、動かさない音を決めよう。',tab:'mix',
  mx:[MV(2,'tPan',-.05,.05)]},
 {h:'動かすのは1度に1つ',b:'パンと送りを同時に動かすと、何が動いているか分かりにくい。送りだけ動かした場合と、両方動かした場合を聞き比べよう。',tab:'au',bars:4,
  cmp:[{l:'両方動かす',ln:[{id:'tRvb',trk:2,pts:[[0,.2,'S'],[768,.2,'L'],[1152,.8,'L'],[L4,.8]]},{id:'tPan',trk:2,pts:sine(2,-.5,.5)}]},{l:'送りだけ',ln:[{id:'tRvb',trk:2,pts:[[0,.2,'S'],[768,.2,'L'],[1152,.8,'L'],[L4,.8]]}]}]},
 {h:'ここぞで動かす',b:'動かすのは、場面が変わる所と、聞かせたい所だけ。動かした所と固定の所の差が、空間の動きとして伝わる。決めたら保存しよう。',tab:'au',
  col:{h:'WIDTHは動かさない',b:'このアプリで動かせるのは、PAN・送り・音量など。WIDTHのつまみは動かせない。広さは固定で決め、動きはパンと送りで作ろう。'}}
]}),
/* ---------------- xs09 ---------------- */
base({id:'xs09',pre:['xs07'],terms:['xs_distance','dry','depth','predly'],title:'近い/遠いの境目',sub:'ドライ・明るさ・音量・プリディレイで距離を決める',ts:3,save:{name:'距離を決めたミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:.45,rvbType:2,rvbSize:1.5,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0},
 tk:[KIK({tDly:0,tRvb:0}),BAS({tDly:0,tRvb:0}),LED({tDly:0,tRvb:.5,tVol:1},E()),PDH({tDly:0,tRvb:.5,tVol:1},E())],steps:[
 {h:'距離を決める4つの手',b:'距離は、ドライの量・明るさ・音量・プリディレイで決まる。リード(T3)を近い・中間・遠いの3つに置いて、聞き比べよう。',tab:'mix',
  cmp:cm('xs09s1',[['近い',{tm:{3:{tRvb:.1,tVol:1,iEqHg:3}}}],['中間',{tm:{3:{tRvb:.4,tVol:.85,iEqHg:0}}}],['遠い',{tm:{3:{tRvb:.9,tVol:.6,iEqHg:-4}}}]])},
 {h:'近い: ドライと高域',b:'近い音は、響きが少なく、高域がはっきりする。T3のRVB SENDを0〜15%、HIGH GAINを2〜4にしよう。息づかいが聞こえる距離になる。',tab:'mix',
  mx:[MV(3,'tRvb',0,.15),{trk:3,ins:'eq',k:'iEqHg',rng:[2,4]}]},
 {h:'遠い: 響きと暗さ',b:'遠い音は、響きが多く、高域が減る。T3のRVB SENDを70〜100%、HIGH GAINを-6〜-2にしよう。同時にVOLも少し下げる。',tab:'mix',
  mx:[MV(3,'tRvb',.7,1),{trk:3,ins:'eq',k:'iEqHg',rng:[-6,-2]}]},
 {h:'プリディレイで境目を動かす',b:'送りが同じでも、PRE DLYを長くすると、ドライが先に届いて前に感じる。PRE DLYを60〜100msにして、0msと聞き比べよう。',tab:'fx',
  f:[['rvbPre',80]],tol:.2,
  cmp:cm('xs09s4',[['PRE 0ms',{s:RV({rvbPre:0,rvbMix:.45})}],['PRE 80ms',{s:RV({rvbPre:80,rvbMix:.45})}]]),
  quiz:qz('リードが前に感じるのは?',2,'2が正解。響きの始まりが遅れると、ドライが先に聞こえ、近くで鳴っているように感じる。')},
 {h:'聞き分ける',b:'3つの置き方を、順番を変えて聞こう。遠い・近い・中間のどれかを、耳で当ててみよう。境目は、4つの手がそろって初めてはっきりする。',tab:'mix',
  cmp:cm('xs09s5',[['A',{tm:{3:{tRvb:.9,tVol:.6,iEqHg:-4}}}],['B',{tm:{3:{tRvb:.1,tVol:1,iEqHg:3}}}],['C',{tm:{3:{tRvb:.4,tVol:.85,iEqHg:0}}}]]),
  quiz:qz('いちばん遠くに聞こえるのは?',1,'1(A)が正解。響きが多く、音量が小さく、高域が減っている。')},
 {h:'距離を決めて保存',b:'主役は近く、飾りは遠く。距離は1つの手でなく、4つの手をそろえて決める。決めた設定を保存して、次の曲でも出発点にしよう。',tab:'mix',
  col:{h:'中間をつくる',b:'近いと遠いのあいだにも、距離がある。4つの手を半分ずつ動かせば、中間の距離ができる。主役・伴奏・飾りの3段階に分けると、決めやすい。'}}
]}),
/* ---------------- xs10 ---------------- */
base({id:'xs10',pre:['xs01','xs02','xs03','xs04','xs05','xs06','xs07','xs08','xs09'],terms:['xs_spacedesign','depth','pan','wide'],title:'空間総合演習',sub:'MIXマップで1曲の配置を設計して直す',ts:4,save:{name:'空間を設計した曲',kind:'kit'},
 init:{dlyMix:0,rvbMix:.5,rvbType:2,rvbSize:1.5,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0,swWidth:1},
 tk:[KIK({tDly:0,tRvb:.8}),BAS({tDly:0,tRvb:.6,tPan:.5}),PDH(Object.assign({tDly:0,tRvb:.3,tPan:0},MDC)),LED({tDly:0,tRvb:.3,tPan:0}),HAT({tDly:0,tRvb:.6,tPan:0})],steps:[
 {h:'いまの配置を見る',b:'いまのミックスは、全員が中央に集まり、低い音にも響きが付いている。MIXタブのMIXマップで、丸の位置と大きさ、ぼやけを見よう。直したあとの音と聞き比べる。',tab:'mix',
  cmp:cm('xs10s1',[['直す前',{tm:{1:{tRvb:.8},2:{tRvb:.6,tPan:.5},3:{tPan:0,tRvb:.3},4:{tRvb:.3},5:{tPan:0,tRvb:.6}}}],['直したあと',{tm:{1:{tRvb:0},2:{tRvb:0,tPan:0},3:{tPan:-.45,tRvb:.9},4:{tRvb:.3},5:{tPan:.2,tRvb:.4}}}]])},
 {h:'低域をそろえる',b:'キック(T1)とベース(T2)には響きを送らない(0〜5%)。ベースは右に寄っている。PANを中央(-5〜+5%)に戻そう。低い音は中央で、ドライのまま。',tab:'mix',
  mx:[MV(1,'tRvb',0,.05),MV(2,'tRvb',0,.05),MV(2,'tPan',-.05,.05)]},
 {h:'左右を分ける',b:'パッド(T3)を左(-60〜-30%)、ハット(T5)を右(10〜30%)にしよう。リード(T4)は中央に残す。中央は低域とリード、左右は飾りの音。',tab:'mix',
  mx:[MV(3,'tPan',-.6,-.3),MV(5,'tPan',.1,.3)]},
 {h:'前後を分ける',b:'奥のパッド(T3)は送り70〜100%、中のリード(T4)は20〜40%、ハット(T5)は送りを減らして前へ。三層に分ければ、MIXマップの丸のぼやけに差が出る。',tab:'mix',
  mx:[MV(3,'tRvb',.7,1),MV(4,'tRvb',.2,.4),MV(5,'tRvb',0,.25)]},
 {h:'幅を足してモノで確かめる',b:'FXタブでWIDTHをONにして、WIDTH AMTを140%前後に。パッドのMODは、広げた音ごとにMONOで確かめる。痩せる音があれば、MODを弱めよう。',tab:'fx',
  f:[['swOn',1],['swWidth',1.4]],tol:.15,
  cmp:cm('xs10s5',[['WIDTH 100%',{s:SW({swWidth:1})}],['WIDTH 140%',{s:SW({swWidth:1.4})}],['モノ',{s:SW({swWidth:0})}]])},
 {h:'設計をまとめる',b:'低域は中央でドライ、中域は主役を中央、飾りは左右へ。前後は送りで三層。最後は幅とMONO。この順で決めれば、どの曲でも空間を設計できる。保存しよう。',tab:'mix',
  col:{h:'空間の設計は順番で',b:'①低域を中央に ②左右を分ける ③前後を分ける ④幅を足す ⑤MONOで確かめる。この順で決めると、あとの手が前の手を壊さない。迷ったら①に戻る。'}}
]})

 );
})();
