/* v11.17 MX-2 XE 上級EQ(xe01〜xe05)。lv3・TRK+MIXタブ。xe06〜xe10 は MX-3。
   聞き比べの cmp.g は EQ だけが違う案なので tools/xe-cal.js(test/eqest.js の推定)が出す。test/xe.js が差1dB以内を検査する。
   mt の達成は実機のメーターでしか確かめられないため、本コースは mx(つまみの範囲)で目標を作る。
   共振の位置は「フィルターのカットオフ」で決める(envAmt:0 にして動かない)。数値は目安(SD.GUIDE の {g:} か、つまみ値と同じ数字のみ)。年号・人名・機材名は書かない */
(function(){
 var T=SD.TERMS,A=function(id,name,kana,en,def,see,tags){T.push({id:id,name:name,kana:kana,en:en,def:def,see:see,tags:tags||['XE','EQ']})};
 A('xe_reson','共振','きょうしん','resonance peak','ある帯域だけが飛び出して鳴る点。耳に痛い・うなる・こもるの原因になる。狭く削って外す。',['xe01','xe02']);
 A('xe_notch','ノッチ','のっち','notch','幅をごく狭くして、一点だけを削るカット。共振を外しても、ほかの音色は残せる。',['xe01','xe02']);
 A('xe_cutfirst','カット優先','かっとゆうせん','cut first','前に出したいときは、まず邪魔な音を下げ、足りなければ上げる考え方。音量や歪みへの影響が小さい。',['xe03']);
 A('xe_slope','EQの傾き','いーきゅーのかたむき','EQ slope','広く浅いカットを重ねて、帯域ごとに少しずつ量を変えること。音を自然に奥へ送れる。',['xe03']);
 A('xe_warm','温かさ','あたたかさ','warmth','低めの帯域を少し足して作る、丸くふくよかな印象。足しすぎるとこもる。',['xe04']);

 A('xe_layer','低域の三層','ていいきのさんそう','three layers of bass','ベースをサブ・ボトム・倍音に分けて考えること。層ごとに量を決めると、重さと輪郭が両立する。',['xe06']);
 A('xe_surgical','外科的EQ','げかてきいーきゅー','surgical EQ','狭いQで原因の帯域だけを探して削る使い方。ほかの帯域を残せる。',['xe07']);
 A('xe_pocketdepth','ポケットの深さ','ぽけっとのふかさ','pocket depth','声のために空ける帯域を、どれだけ下げるか。浅いと埋もれ、深いとリードが痩せる。',['xe08']);
 A('xe_tilt','ティルト','てぃると','tilt','低域と高域を逆向きに少しずつ動かして、全体の傾きと色を決めること。小さく動かす。',['xe09']);
 var P=SD.PATS,TK=P.tk;
 var GT={'xe01s11':0,'xe01s12':0,'xe01s41':0,'xe01s42':-0.4,'xe01s51':-0.1,'xe01s52':0,'xe01s53':0,'xe01s61':0,'xe01s62':0,'xe02s11':-0.1,'xe02s12':-0.1,'xe02s13':0,'xe02s51':-1,'xe02s52':-0.9,'xe02s53':0,'xe02s61':-0.1,'xe02s62':0,'xe03s11':-0.1,'xe03s12':0,'xe03s31':0,'xe03s32':-0.6,'xe03s51':-0.4,'xe03s52':0,'xe03s61':0,'xe03s62':0,'xe04s11':0,'xe04s12':-0.4,'xe04s13':-0.1,'xe04s14':0,'xe04s51':-2,'xe04s52':-0.3,'xe04s53':0,'xe04s61':0,'xe04s62':-0.3,'xe05s11':-0.3,'xe05s12':0,'xe05s51':-3.5,'xe05s52':0,'xe05s53':-3.8,'xe06s11':0,'xe06s12':-1.4,'xe06s13':-0.1,'xe06s51':-0.7,'xe06s52':-0.2,'xe06s53':0,'xe06s61':0,'xe06s62':-0.4,'xe07s11':-2.6,'xe07s12':0,'xe07s51':-1,'xe07s52':0,'xe08s11':0,'xe08s12':0,'xe08s51':-0.1,'xe08s52':0,'xe08s53':-0.1,'xe09s11':-0.9,'xe09s12':-1.7,'xe09s13':0,'xe09s41':-0.8,'xe09s42':0,'xe09s43':-6.6,'xe09s51':0,'xe09s52':-0.5,'xe10s11':-0.9,'xe10s12':0,'xe10s61':-0.9,'xe10s62':0};/* tools/xe-cal.js が出す cmp.g(EQだけが違う聞き比べ)。ここに貼る */
 var cm=function(key,items){return items.map(function(it,i){var o=Object.assign({l:it[0]},it[1]);var g=GT[key+(i+1)];if(g!==undefined)o.g=g;return o})};
 var z=function(a){var q={};a.forEach(function(i){q[i]=0});return q},all16=function(){var q={};for(var i=0;i<16;i++)q[i]=0;return q},sus=[1,2,3,4,5,6,7,9,10,11,12,13,14,15];
 var E=function(o){return Object.assign({iEqOn:1,iEqHpf:20,iEqLpf:20000,iEqLf:200,iEqLg:0,iEqB1f:250,iEqB1g:0,iEqB1q:1,iEqB2f:2500,iEqB2g:0,iEqB2q:1,iEqHf:4000,iEqHg:0},o||{})};
 var CPD={iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20},NO=Object.assign({},CPD,{iCpThr:0,iCpRatio:1});
 var BASS={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:.3,noiseLvl:0,fType:'lowpass',cutoff:700,res:.1,envAmt:.3,drive:0,aA:.004,aD:.25,aS:.7,aR:.1};
 var PAD={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:9000,res:0,envAmt:0,drive:0,aA:.01,aD:.2,aS:.9,aR:.15};
 var LEADP={o1Wave:'sawtooth',o1Lvl:.6,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:5000,res:.1,envAmt:.2,drive:0,aA:.004,aD:.2,aS:.5,aR:.15};
 var RES=function(cut,lvl,hold){return {o1Wave:'sawtooth',o1Lvl:lvl,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:cut,res:.55,envAmt:0,drive:0,aA:hold?.01:.004,aD:.2,aS:hold?.9:.5,aR:.15}};/* 共振のピークはカットオフの位置に出る */
 var withM=function(t){t.o.mx={eq:E(),cp:NO};return t};
 var KIK=function(){return withM(TK('kick',P.fourFloor(),'キック'))};
 var SNR=function(){return withM(TK('snare',{idx:z([4,12]),o:{}},'スネア'))};
 var HAT=function(){return withM(TK('hat',{idx:z([2,6,10,14]),o:{}},'ハット',{acc:[2,6,10,14]}))};
 var BAS=function(){return withM(TK('bass',P.bassPattern('eighth',0),'ベース',{scale:'minor',p:BASS,acc:[0,4,8,12]}))};
 var PADT=function(){return withM({id:'bass',idx:all16(),o:{name:'パッド',scale:'minor',tie:sus,p:PAD,tr:12}})};
 var LEAD=function(){return withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード',scale:'minor',tr:24,p:LEADP}})};
 var PADR=function(){return withM({id:'bass',idx:all16(),o:{name:'パッド',scale:'minor',tie:sus,p:RES(700,.35,1),tr:12}})};/* 共振 700Hz */
 var LEADR=function(){return withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード',scale:'minor',tr:24,p:RES(2200,.38)}})};/* 共振 2200Hz */
 var ARPR=function(){return withM({id:'bass',idx:{0:0,2:2,4:4,6:2,8:4,10:7,12:4,14:2},o:{name:'アルペジオ',scale:'minor',tr:24,p:RES(5000,.3)}})};/* 共振 5000Hz */
 var MUDE={iEqHpf:20,iEqB1f:350,iEqB1g:5,iEqB1q:.7};/* 350Hz付近の濁り */
 var MUD=function(){var t=PADT();t.o.mx.eq=E(MUDE);return t};
 var VOX=function(){return withM(TK('vo_a',{idx:{0:0,3:2,6:3,8:2,11:0,14:-2},o:{}},'声(代役)',{acc:[0,3,8]}))};
 var qz=function(q,ans,ex){return {q:q,ans:ans,ex:ex}};
 var MX=function(trk,k,lo,hi){return {trk:trk,ins:'eq',k:k,rng:[lo,hi]}};
 var base=function(o){return SD.XM.base(Object.assign({cat:'xe1',course:'XE'},o))};
 SD.LESSONS.push(
/* ---------------- xe01 ---------------- */
base({id:'xe01',pre:['eq06','fq11'],terms:['xe_reson','xe_notch','sweep','bell','q'],title:'共振を探して外す',sub:'狭く持ち上げて探し、狭く削る',ts:2,save:{name:'共振を外したリード',kind:'kit'},
 tk:[KIK(),BAS(),LEADR()],steps:[
 {h:'飛び出す点がある',b:'音のなかには、ある帯域だけ飛び出して鳴る点がある。これが【共振】。耳に痛い・うなる原因になる。そのままの音と、共振を狭く削った音を聞き比べよう。',tab:'mix',
  cmp:cm('xe01s1',[['そのまま',{tm:{3:E()}}],['狭く削った',{tm:{3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6})}}]])},
 {h:'狭く持ち上げて探す',b:'共振は、聞いただけでは位置が分からない。T3のBELL2のQを4〜8(狭く)・GAINを3〜6dBにし、FREQをゆっくり動かす(【スイープ】)。ひときわきつい所が共振だ。',tab:'mix',
  mx:[MX(3,'iEqB2q',4,8),MX(3,'iEqB2g',3,6)]},
 {h:'見つけた点を狭く削る',b:'共振の場所にFREQを合わせ、GAINを-6〜-3dBに下げる。Qは4〜8のまま。一点だけ削る【ノッチ】のような使い方で、リードの音色は残る。',tab:'mix',
  mx:[MX(3,'iEqB2f',1800,2600),MX(3,'iEqB2g',-6,-3),MX(3,'iEqB2q',4,8)]},
 {h:'広く削るとどうなる',b:'同じ場所を、広く(Qを小さく)深く削るとどうなるか。狭く削った音と聞き比べて、リードが痩せてしまったほうを選ぼう。',tab:'mix',
  cmp:cm('xe01s4',[['1 広く深く',{tm:{3:E({iEqB2f:2200,iEqB2g:-10,iEqB2q:.5})}}],['2 狭く削った',{tm:{3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6})}}]]),
  quiz:qz('痩せているのは?',1,'1が正解。広く深く削ると、共振と一緒に、周りの大事な帯域まで消える。狭く削れば、ほかは残る。')},
 {h:'削る量はちょうどでよい',b:'削る量は、共振が気にならなくなる所まででよい。浅い・ちょうど・深いの3つを聞き比べて、どこまで下げれば十分か、耳で決めよう。',tab:'mix',
  cmp:cm('xe01s5',[['浅い',{tm:{3:E({iEqB2f:2200,iEqB2g:-2,iEqB2q:6})}}],['ちょうど',{tm:{3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6})}}],['深い',{tm:{3:E({iEqB2f:2200,iEqB2g:-12,iEqB2q:6})}}]])},
 {h:'前後を聴く',b:'最後に、直す前と直したあとを聞き比べよう。直したあとは、音が自然に聞こえるまま、きつさだけが消えている。',tab:'mix',
  cmp:cm('xe01s6',[['直す前',{tm:{3:E()}}],['直したあと',{tm:{3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6})}}]]),
  col:{h:'持ち上げるのは探すときだけ',b:'持ち上げると音が大きくなり、大きい音は良く聞こえる。探し終えたら必ず削る側へ戻し、同じ音量で前後を聞き比べよう。'}}
]}),
/* ---------------- xe02 ---------------- */
base({id:'xe02',pre:['xe01'],terms:['xe_reson','xe_notch','bell','q'],title:'複数の共振を片づける',sub:'2〜3か所の狭いカットと、やりすぎの見分け',ts:1,save:{name:'共振を片づけたミックス',kind:'kit'},
 tk:[BAS(),PADR(),LEADR(),ARPR()],steps:[
 {h:'1か所では終わらない',b:'共振は、1つの音に1つとは限らない。パッド・リード・アルペジオに、それぞれ飛び出す点がある。そのまま・1か所だけ・3か所とも直した音を聞き比べよう。',tab:'mix',
  cmp:cm('xe02s1',[['そのまま',{tm:{2:E(),3:E(),4:E()}}],['リードだけ直した',{tm:{2:E(),3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6}),4:E()}}],['3か所とも直した',{tm:{2:E({iEqB1f:700,iEqB1g:-6,iEqB1q:6}),3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6}),4:E({iEqB2f:5000,iEqB2g:-6,iEqB2q:6})}}]])},
 {h:'パッドのうなり',b:'T2パッドは、低めの帯域がうなる。BELL1のQを4〜8(狭く)にして探し、見つけた場所でGAINを-6〜-3dBに下げよう。',tab:'mix',
  mx:[MX(2,'iEqB1f',500,900),MX(2,'iEqB1g',-6,-3),MX(2,'iEqB1q',4,8)]},
 {h:'リードのきつさ',b:'T3リードは、中高域がきつい。BELL2のQを4〜8にして探し、見つけた場所でGAINを-6〜-3dBに下げよう。',tab:'mix',
  mx:[MX(3,'iEqB2f',1800,2600),MX(3,'iEqB2g',-6,-3),MX(3,'iEqB2q',4,8)]},
 {h:'アルペジオの硬さ',b:'T4アルペジオは、高めの帯域が硬い。同じようにBELL2のQを4〜8にして探し、見つけた場所でGAINを-6〜-3dBに下げよう。',tab:'mix',
  mx:[MX(4,'iEqB2f',4000,6000),MX(4,'iEqB2g',-6,-3),MX(4,'iEqB2q',4,8)]},
 {h:'やりすぎを聴き分ける',b:'3か所とも直した音を3つ聞き比べる。狭く削った音と、広く深く削った音のうち、こもって元気がなくなったほうを選ぼう。',tab:'mix',
  cmp:cm('xe02s5',[['1 そのまま',{tm:{2:E(),3:E(),4:E()}}],['2 3か所とも狭く',{tm:{2:E({iEqB1f:700,iEqB1g:-6,iEqB1q:6}),3:E({iEqB2f:2200,iEqB2g:-6,iEqB2q:6}),4:E({iEqB2f:5000,iEqB2g:-6,iEqB2q:6})}}],['3 3か所とも広く深く',{tm:{2:E({iEqB1f:700,iEqB1g:-10,iEqB1q:.5}),3:E({iEqB2f:2200,iEqB2g:-10,iEqB2q:.5}),4:E({iEqB2f:5000,iEqB2g:-10,iEqB2q:.5})}}]]),
  quiz:qz('こもって元気がないのは?',3,'3が正解。広く深い削りが重なると、音の芯まで消えて平らになる。狭く浅くなら、3か所削ってもこもらない。')},
 {h:'直す順番',b:'きつい所から1つ直し、そのたびに聴き直す。1つ直すと、隠れていた別の共振が目立つことがある。直しすぎる前に、前後を聞き比べよう。',tab:'mix',
  cmp:cm('xe02s6',[['直す前',{tm:{2:E(),3:E(),4:E()}}],['直したあと',{tm:{2:E({iEqB1f:700,iEqB1g:-4,iEqB1q:6}),3:E({iEqB2f:2200,iEqB2g:-4,iEqB2q:6}),4:E({iEqB2f:5000,iEqB2g:-4,iEqB2q:6})}}]]),
  col:{h:'削るほど、狭く浅く',b:'共振が増えるほど、削る箇所は増える。そのぶん1つあたりは狭く浅くする。合計で削りすぎると、音全体が痩せる。'}}
]}),
/* ---------------- xe03 ---------------- */
base({id:'xe03',pre:['eq08','cx12'],terms:['xe_cutfirst','xe_slope','boost','cut','bell'],title:'ブーストよりカット',sub:'前に出すなら、まず邪魔な音を下げる',ts:1,save:{name:'カットで整えたミックス',kind:'kit'},
 tk:[BAS(),PADT(),LEAD()],steps:[
 {h:'同じ結果の2つの道',b:'リードを前に出したいとき、リードを持ち上げる道と、同じ帯域のパッドを下げる道がある。どちらも似た結果になる。聞き比べよう。',tab:'mix',
  cmp:cm('xe03s1',[['リードを上げた',{tm:{2:E(),3:E({iEqB2f:2500,iEqB2g:3,iEqB2q:1})}}],['パッドを下げた',{tm:{2:E({iEqB2f:2500,iEqB2g:-3,iEqB2q:1}),3:E()}}]])},
 {h:'まず、カットで空ける',b:'これが【カット優先】。T2パッドのBELL2を{g:pad.cut1}に置き、GAINを{g:dyn.eqStart}だけ下げよう。リードの場所が空き、音量もそのまま。',tab:'mix',
  mx:[MX(2,'iEqB2f',1000,4000),MX(2,'iEqB2g',-3,-1)]},
 {h:'ブーストの副作用',b:'持ち上げると、その帯域だけでなく全体の音量も増える。大きい音は良く聞こえて、判断を誤る。深くカットした音と深くブーストした音のうち、きつく聞こえるほうを選ぼう。',tab:'mix',
  cmp:cm('xe03s3',[['1 パッドを深く下げた',{tm:{2:E({iEqB2f:2500,iEqB2g:-9,iEqB2q:1}),3:E()}}],['2 リードを深く上げた',{tm:{2:E(),3:E({iEqB2f:2500,iEqB2g:9,iEqB2q:1})}}]]),
  quiz:qz('きつく聞こえるのは?',2,'2が正解。深いブーストは、その帯域が飛び出して耳に痛い。音量を合わせても、きつさは残る。')},
 {h:'広く浅い傾きを作る',b:'ベルを2つ重ね、どちらも広く(Qを0.3〜0.8)浅く(-3〜-1dB)下げると、帯域ごとの量がなだらかに変わる【EQの傾き】ができる。T2パッドで作ろう。',tab:'mix',
  mx:[MX(2,'iEqB1g',-3,-1),MX(2,'iEqB1q',.3,.8),MX(2,'iEqB2g',-3,-1),MX(2,'iEqB2q',.3,.8)]},
 {h:'傾きを聴く',b:'傾きをつけたパッドは、不自然な凹みがなく、リードの後ろへ自然に下がる。そのままのパッドと聞き比べよう。',tab:'mix',
  cmp:cm('xe03s5',[['そのまま',{tm:{2:E()}}],['傾きをつけた',{tm:{2:E({iEqB1f:300,iEqB1g:-2,iEqB1q:.5,iEqB2f:3000,iEqB2g:-2,iEqB2q:.5})}}]])},
 {h:'まず下げる',b:'前に出したい音があるときは、まず邪魔な音を下げる。足りなければ、浅く上げる。何もしない音と、カットで整えた音を聞き比べよう。',tab:'mix',
  cmp:cm('xe03s6',[['何もしない',{tm:{2:E(),3:E()}}],['カットで整えた',{tm:{2:E({iEqB2f:2500,iEqB2g:-3,iEqB2q:1}),3:E()}}]]),
  col:{h:'ブーストは最後の手',b:'カットで足りないときだけ、浅く上げる。上げたら、必ずその分を音量で戻して聞き比べる。音量差に耳が惑わされないように。'}}
]}),
/* ---------------- xe04 ---------------- */
base({id:'xe04',pre:['eq07'],terms:['xe_warm','pres','air','shelf'],title:'EQでキャラを作る',sub:'温かさ・存在感・空気感を帯域で作り分ける',ts:0,save:{name:'キャラを作ったミックス',kind:'kit'},
 tk:[PADT(),LEAD(),BAS()],steps:[
 {h:'帯域でキャラが変わる',b:'同じ音でも、足す帯域で印象が変わる。低めは【温かさ】、中高域は【プレゼンス】(存在感)、高域は【エア】(空気感)。4つを聞き比べよう。',tab:'mix',
  cmp:cm('xe04s1',[['そのまま',{tm:{1:E(),2:E()}}],['温かい',{tm:{1:E({iEqB1f:400,iEqB1g:3,iEqB1q:.7}),2:E()}}],['存在感',{tm:{1:E(),2:E({iEqB2f:2500,iEqB2g:3,iEqB2q:1})}}],['空気感',{tm:{1:E({iEqHf:8000,iEqHg:3}),2:E()}}]])},
 {h:'温かさを作る',b:'パッドの【温かさ】は{g:pad.keep0}のボディにある。T1のBELL1をその中に置き、GAINを{g:dyn.eqStart}だけ上げよう。足しすぎると、こもる。',tab:'mix',
  mx:[MX(1,'iEqB1f',250,800),MX(1,'iEqB1g',1,3)]},
 {h:'存在感を作る',b:'リードの存在感は{g:lead.keep0}にある。T2のBELL2をその中に置き、GAINを{g:dyn.eqStart}だけ上げよう。主役が前に出る。',tab:'mix',
  mx:[MX(2,'iEqB2f',1000,4000),MX(2,'iEqB2g',1,3)]},
 {h:'空気感を作る',b:'パッドの空気感は{g:pad.keep1}にある。T1のHIGH FREQをその中に置き、HIGHを{g:dyn.eqStart}だけ上げよう。棚で広く持ち上げると、自然に開く。',tab:'mix',
  mx:[MX(1,'iEqHf',4000,12000),MX(1,'iEqHg',1,3)]},
 {h:'足しすぎを聴く',b:'3つとも足しすぎた音と、控えめに足した音を聞き比べよう。ぼやけて耳が疲れるほうを選ぶ。',tab:'mix',
  cmp:cm('xe04s5',[['1 足しすぎ',{tm:{1:E({iEqB1f:400,iEqB1g:9,iEqB1q:.7,iEqHf:8000,iEqHg:9}),2:E({iEqB2f:2500,iEqB2g:9,iEqB2q:1})}}],['2 控えめ',{tm:{1:E({iEqB1f:400,iEqB1g:2,iEqB1q:.7,iEqHf:8000,iEqHg:2}),2:E({iEqB2f:2500,iEqB2g:2,iEqB2q:1})}}],['3 そのまま',{tm:{1:E(),2:E()}}]]),
  quiz:qz('ぼやけて疲れるのは?',1,'1が正解。足しすぎは、温かさがこもりに、存在感がきつさに、空気感がシャリつきに変わる。控えめが基本。')},
 {h:'足りないのは居場所かも',b:'キャラが足りないと感じても、足す前に確かめよう。ほかの音が同じ帯域を使っていないか。まず下げて空けると、足さずに済むことも多い。',tab:'mix',
  cmp:cm('xe04s6',[['そのまま',{tm:{1:E(),2:E()}}],['控えめに整えた',{tm:{1:E({iEqB1f:400,iEqB1g:2,iEqB1q:.7}),2:E({iEqB2f:2500,iEqB2g:2,iEqB2q:1})}}]]),
  col:{h:'キャラは足す前に空ける',b:'足す前に、同じ帯域を使う音を少し下げる。居場所ができれば、少ない足しで十分にキャラが出る。'}}
]}),
/* ---------------- xe05 ---------------- */
base({id:'xe05',pre:['fq02','fq04','fq05'],terms:['compeq','hpf','mask'],title:'リズム隊のEQ処方',sub:'キック・スネア・ハットの役割を通しで分ける',ts:0,save:{name:'リズム隊を整えたミックス',kind:'kit'},
 tk:[KIK(),SNR(),HAT(),BAS()],steps:[
 {h:'役割で分ける',b:'リズム隊は、キックが重さ、スネアが胴とスナップ、ハットがきらめき。居場所を決めて、それ以外は整理する。何もしない音と、整えた音を聞き比べよう。',tab:'mix',
  cmp:cm('xe05s1',[['そのまま',{tm:{1:E(),2:E(),3:E(),4:E()}}],['役割で整えた',{tm:{1:E({iEqHpf:30,iEqB1f:350,iEqB1g:-2,iEqB1q:1}),2:E({iEqHpf:100,iEqB1f:500,iEqB1g:-2,iEqB1q:1}),3:E({iEqHpf:400}),4:E({iEqHpf:30})}}]])},
 {h:'キック',b:'T1キックのLOW CUTを{g:kick.hpf}、BELL1を{g:kick.cut0}に置いて{g:dyn.eqStart}だけ下げよう。重さは残し、箱っぽさだけ外す。',tab:'mix',
  mx:[MX(1,'iEqHpf',25,40),MX(1,'iEqB1f',250,500),MX(1,'iEqB1g',-3,-1)]},
 {h:'スネア',b:'T2スネアのLOW CUTを{g:snare.hpf}、BELL1を{g:snare.cut0}に置いて{g:dyn.eqStart}だけ下げよう。胴は残し、低い濁りと箱っぽさを外す。',tab:'mix',
  mx:[MX(2,'iEqHpf',80,120),MX(2,'iEqB1f',400,800),MX(2,'iEqB1g',-3,-1)]},
 {h:'ハット',b:'T3ハットのLOW CUTを{g:hat.hpf}にしよう。ハットの低域は不要。さらにHIGH FREQを{g:hat.keep0}に置き、{g:dyn.eqStart}だけ上げると、きらめく。',tab:'mix',
  mx:[MX(3,'iEqHpf',300,500),MX(3,'iEqHf',6000,12000),MX(3,'iEqHg',1,3)]},
 {h:'ローカットしすぎを聴く',b:'3つ聞き比べる。役割で整えた音、そのままの音、全員に強いローカットをかけた音のうち、低域が消えて軽くなったほうを選ぼう。',tab:'mix',
  cmp:cm('xe05s5',[['1 役割で整えた',{tm:{1:E({iEqHpf:30,iEqB1f:350,iEqB1g:-2,iEqB1q:1}),2:E({iEqHpf:100,iEqB1f:500,iEqB1g:-2,iEqB1q:1}),3:E({iEqHpf:400}),4:E({iEqHpf:30})}}],['2 全員に強いローカット',{tm:{1:E({iEqHpf:150}),2:E({iEqHpf:400}),3:E({iEqHpf:400}),4:E({iEqHpf:150})}}],['3 そのまま',{tm:{1:E(),2:E(),3:E(),4:E()}}]]),
  quiz:qz('低域が消えて軽いのは?',2,'2が正解。キックとベースの低域まで削ると、重さが消える。ローカットは、役割ごとに位置を変える。')},
 {h:'1本ずつ外して確かめる',b:'整えたら、キックやハットを順にミュートして聴く。どれが抜けても、ほかの音の居場所に穴が空かないか確かめる。足りなければ、役割を見直す。',tab:'mix',
  cmp:[{l:'全部',mt:[]},{l:'キックなし',mt:[0]},{l:'ハットなし',mt:[2]}],
  col:{h:'1本ずつではなく、全員で決める',b:'EQは、1本ずつ聴くと足したくなる。必ず全員を鳴らして決める。1本では良い音でも、重なると濁ることがある。'}}
]}),
/* ---------------- xe06 ---------------- */
base({id:'xe06',pre:['fq03'],terms:['xe_layer','sub','hpf','lmid'],title:'低域の三層(サブ・ボトム・倍音)',sub:'ベースを3つの帯域で考える',ts:1,save:{name:'三層を整えたベース',kind:'kit'},
 tk:[KIK(),BAS()],steps:[
 {h:'ベースは3つの層',b:'ベースは【低域の三層】で考える。いちばん低いサブ、基音のボトム、輪郭を作る倍音。層ごとに量を決めると、迷わない。3つの強調を聞き比べよう。',tab:'mix',
  cmp:cm('xe06s1',[['そのまま',{tm:{2:E()}}],['ボトムを強調',{tm:{2:E({iEqLf:80,iEqLg:4})}}],['倍音を強調',{tm:{2:E({iEqB2f:1000,iEqB2g:4,iEqB2q:1})}}]])},
 {h:'サブを整える',b:'サブは、聞こえない低さまで出すと、音量だけ食う。T2ベースのLOW CUTを{g:bass.hpf}にして、いちばん下を切ろう。',tab:'mix',
  mx:[MX(2,'iEqHpf',25,40)]},
 {h:'ボトムを足す',b:'ボトムは音の重さ。基音は{g:bass.keep0}にある。T2のLOW FREQをその中に置き、LOWを{g:dyn.eqStart}だけ上げよう。',tab:'mix',
  mx:[MX(2,'iEqLf',50,100),MX(2,'iEqLg',1,3)]},
 {h:'倍音を足す',b:'倍音は輪郭。小さなスピーカーでも、倍音でベースが聞こえる。BELL2を{g:bass.keep1}に置き、GAINを{g:dyn.eqStart}だけ上げよう。',tab:'mix',
  mx:[MX(2,'iEqB2f',700,1500),MX(2,'iEqB2g',1,3)]},
 {h:'濁りを外す',b:'ボトムと倍音の間に、濁りの帯域がある。BELL1を{g:bass.cut0}に置いて{g:dyn.eqStart}だけ下げると、三層が分かれる。聞き比べて、濁っているほうを選ぼう。',tab:'mix',
  mx:[MX(2,'iEqB1f',200,400),MX(2,'iEqB1g',-3,-1)],
  cmp:cm('xe06s5',[['1 濁りを残した',{tm:{2:E({iEqB1f:300,iEqB1g:4,iEqB1q:1})}}],['2 そのまま',{tm:{2:E()}}],['3 濁りを外した',{tm:{2:E({iEqB1f:300,iEqB1g:-3,iEqB1q:1})}}]]),
  quiz:qz('濁っているのは?',1,'1が正解。ボトムと倍音の間が膨らむと、輪郭がぼやける。外すと三層が分かれて聞こえる。')},
 {h:'三層を通して聴く',b:'三層を整えた音と、そのままの音を聞き比べよう。重さと輪郭が両立して、キックとの住み分けも楽になる。',tab:'mix',
  cmp:cm('xe06s6',[['そのまま',{tm:{2:E()}}],['三層を整えた',{tm:{2:E({iEqHpf:30,iEqLf:80,iEqLg:2,iEqB1f:300,iEqB1g:-2,iEqB1q:1,iEqB2f:1000,iEqB2g:2,iEqB2q:1})}}]]),
  col:{h:'層ごとに役目が違う',b:'サブは重さ、ボトムは太さ、倍音は聞こえ方。1つの層だけ足すと偏る。3つのバランスで決めよう。'}}
]}),
/* ---------------- xe07 ---------------- */
base({id:'xe07',pre:['fq06'],terms:['xe_surgical','sweep','lmid','q'],title:'コード・パッドの濁りを外科的に',sub:'ローミッドの整理と、ぶつかる音の探し方',ts:1,save:{name:'濁りを外したパッド',kind:'kit'},
 tk:[BAS(),MUD()],steps:[
 {h:'パッドの濁り',b:'コードやパッドは、ローミッドに音が溜まって濁りやすい。ベースとぶつかるので、特に目立つ。濁ったパッドと、濁りを外したパッドを聞き比べよう。',tab:'mix',
  cmp:cm('xe07s1',[['濁っている',{tm:{2:E(MUDE)}}],['濁りを外した',{tm:{2:E({iEqHpf:150,iEqB1f:350,iEqB1g:-3,iEqB1q:4})}}]])},
 {h:'ローカットで整理',b:'まず広く整理する。T2パッドのLOW CUTを{g:pad.hpf}にしよう。ベースの居場所が空く。',tab:'mix',
  mx:[MX(2,'iEqHpf',100,200)]},
 {h:'濁りを探す',b:'広い盛り上がりが、濁りの正体。BELL1のQを3〜6(狭く)にしてGAINを持ち上げ、FREQを動かす(【スイープ】)。膨らんで聞こえる所が見つかる。',tab:'mix',
  mx:[MX(2,'iEqB1q',3,6),MX(2,'iEqB1g',3,6)]},
 {h:'外科的に削る',b:'見つけた所を、狭く深く削るのが【外科的EQ】。BELL1を、FREQ 250〜500Hz・GAIN -4〜-1dB・Q 3〜6にしよう。ほかの帯域は触らない。',tab:'mix',
  mx:[MX(2,'iEqB1f',250,500),MX(2,'iEqB1g',-4,-1),MX(2,'iEqB1q',3,6)]},
 {h:'広く削ると',b:'同じ所を、広く大きく削ると、パッドが薄くなる。狭く削った音と聞き比べて、薄くなったほうを選ぼう。',tab:'mix',
  cmp:cm('xe07s5',[['1 狭く削った',{tm:{2:E({iEqHpf:150,iEqB1f:350,iEqB1g:-3,iEqB1q:4})}}],['2 広く大きく削った',{tm:{2:E({iEqHpf:150,iEqB1f:350,iEqB1g:-10,iEqB1q:.5})}}]]),
  quiz:qz('薄いのは?',2,'2が正解。広く大きく削ると、パッドのボディまで消える。外科的に、狭く削ろう。')},
 {h:'ぶつかる音を探す',b:'濁りは、パッドだけの問題とは限らない。ベースを少しミュートして、濁りが消えるか確かめよう。消えるなら、ぶつかっているのはベースとの間だ。',tab:'mix',
  cmp:[{l:'パッドとベース',mt:[]},{l:'パッドだけ',mt:[0]}],
  col:{h:'足し算の前に探す',b:'濁りを感じたら、広く下げる前に、狭く探す。原因の帯域が分かれば、削る量は少なくて済む。'}}
]}),
/* ---------------- xe08 ---------------- */
base({id:'xe08',pre:['fq07','vo03'],terms:['pocket','xe_pocketdepth','pres'],title:'リードと声の抜け',sub:'プレゼンスの取り合いと、ポケットの深さ',ts:2,save:{name:'声の居場所を空けたリード',kind:'kit'},
 tk:[BAS(),LEAD(),VOX()],steps:[
 {h:'声とリードの取り合い',b:'声とリードは、同じ中高域を使う。どちらも【プレゼンス】を出すと、取り合って、声が聞き取りにくくなる。そのままの音と、リードにポケットを空けた音を聞き比べよう。',tab:'mix',
  cmp:cm('xe08s1',[['そのまま',{tm:{2:E(),3:E()}}],['ポケットを空けた',{tm:{2:E({iEqB2f:3000,iEqB2g:-3,iEqB2q:1.5}),3:E({iEqB2f:3000,iEqB2g:2,iEqB2q:1})}}]])},
 {h:'声の明瞭さを出す',b:'声の明瞭さは{g:vocal.keep1}にある。T3声のBELL2をその中に置き、GAINを{g:dyn.eqStart}だけ上げよう。',tab:'mix',
  mx:[MX(3,'iEqB2f',2000,5000),MX(3,'iEqB2g',1,3)]},
 {h:'リードにポケットを空ける',b:'声と同じ帯域を、リードで少し下げて居場所を作る。T2リードのBELL2を、声と同じ{g:vocal.keep1}に置き、{g:dyn.eqStart}だけ下げよう。',tab:'mix',
  mx:[MX(2,'iEqB2f',2000,5000),MX(2,'iEqB2g',-3,-1)]},
 {h:'声の低域を整える',b:'声のLOW CUTを{g:vocal.hpf}にしよう。声に要らない低域が、ベースやリードの下で濁るのを防ぐ。',tab:'mix',
  mx:[MX(3,'iEqHpf',80,120)]},
 {h:'ポケットの深さ',b:'【ポケットの深さ】は、浅すぎると声が埋もれ、深すぎるとリードが痩せる。浅い・ちょうど・深いを聞き比べて、リードが痩せたものを選ぼう。',tab:'mix',
  cmp:cm('xe08s5',[['1 浅い',{tm:{2:E({iEqB2f:3000,iEqB2g:-1,iEqB2q:1.5})}}],['2 深い',{tm:{2:E({iEqB2f:3000,iEqB2g:-10,iEqB2q:1.5})}}],['3 ちょうど',{tm:{2:E({iEqB2f:3000,iEqB2g:-3,iEqB2q:1.5})}}]]),
  quiz:qz('リードが痩せたのは?',2,'2が正解。深く削ると、リードの主役の帯域が消える。声が出る分だけ、浅く空ける。')},
 {h:'声が歌っていない所も聴く',b:'声が休む所では、リードのポケットは要らない。声ありと声なしで、リードがどう聞こえるか確かめよう。',tab:'mix',
  cmp:[{l:'声あり',mt:[]},{l:'声なし',mt:[2]}],
  col:{h:'ポケットは声のため',b:'ポケットは声を引き立てる居場所。声が止まる所では、リードが元気に聞こえてよい。声を基準に深さを決める。'}}
]}),
/* ---------------- xe09 ---------------- */
base({id:'xe09',pre:['ms02'],terms:['xe_tilt','shelf'],title:'ティルト(全体の傾き)とマスターの色',sub:'低域と高域を逆に少しずつ動かして色を決める',ts:3,save:{name:'マスターの色を決めたミックス',kind:'kit'},
 tk:[KIK(),HAT(),BAS(),PADT(),LEAD()],steps:[
 {h:'色を決める',b:'マスターEQで、低域と高域を逆向きに少しずつ動かすのが【ティルト】。全体が明るくなったり、暖かくなったりする。3つを聞き比べよう。',tab:'fx',
  cmp:cm('xe09s1',[['そのまま',{s:{eqOn:0}}],['暖かい傾き',{s:{eqOn:1,eqLo:1.5,eqHi:-1.5}}],['明るい傾き',{s:{eqOn:1,eqLo:-1.5,eqHi:1.5}}]])},
 {h:'明るい傾き',b:'FXタブのEQをONにして、LOWを-1.5dB、HIGHを1.5dBにしよう。低域が引かれ、高域が上がって、全体が前に出る。',tab:'fx',f:[['eqOn',1],['eqLo',-1.5],['eqHi',1.5]]},
 {h:'暖かい傾き',b:'次に、LOWを1.5dB、HIGHを-1.5dBにしよう。高域が引かれ、低域が上がって、全体が丸く落ち着く。',tab:'fx',f:[['eqLo',1.5],['eqHi',-1.5]]},
 {h:'動かしすぎを聴く',b:'小さな傾きと、大きく動かした傾きを聞き比べよう。大きく動かして、バランスまで変わってしまったほうを選ぶ。',tab:'fx',
  cmp:cm('xe09s4',[['1 小さい',{s:{eqOn:1,eqLo:1.5,eqHi:-1.5}}],['2 そのまま',{s:{eqOn:0}}],['3 大きい',{s:{eqOn:1,eqLo:9,eqHi:-9}}]]),
  quiz:qz('バランスが崩れたのは?',3,'3が正解。大きな傾きは、低域が膨らみ高域が消えて、ほかの音の関係まで変わる。')},
 {h:'色は最後に決める',b:'色は、トラックの整理が終わってから決める。決めたら、EQなしと聞き比べて、本当に良くなったか、音量をそろえて確かめよう。',tab:'fx',
  cmp:cm('xe09s5',[['EQなし',{s:{eqOn:0}}],['色をつけた',{s:{eqOn:1,eqLo:1,eqHi:-1}}]]),
  col:{h:'足りないのは色ではないかも',b:'マスターで大きく動かしたくなったら、トラックのバランスやEQに戻る。マスターの色は、小さく決める。'}}
]}),
/* ---------------- xe10 ---------------- */
base({id:'xe10',pre:['xe01','xe02','xe03','xe04','xe05','xe06','xe07','xe08','xe09'],terms:['mask','overlap','hpf'],title:'EQ総合演習',sub:'ぶつかり度を見て、全トラックを直す',ts:0,save:{name:'EQを総合で整えたミックス',kind:'kit'},
 tk:[KIK(),BAS(),PADT(),LEAD(),VOX()],steps:[
 {h:'整理前と整理後',b:'ここまでの技を、全トラックに使う。まず、何も整理していない音と、整理した音を聞き比べよう。次のステップから、1つずつ整える。',tab:'mix',
  cmp:cm('xe10s1',[['整理前',{tm:{1:E(),2:E(),3:E(),4:E(),5:E()}}],['整理後',{tm:{1:E({iEqHpf:30}),2:E({iEqHpf:30}),3:E({iEqHpf:150,iEqB2f:3000,iEqB2g:-2,iEqB2q:1.5}),4:E({iEqHpf:200,iEqB2f:4000,iEqB2g:-2,iEqB2q:2}),5:E({iEqHpf:100,iEqB2f:3000,iEqB2g:2,iEqB2q:1})}}]])},
 {h:'低域を整理する',b:'T2ベースを{g:bass.hpf}、T3パッドを{g:pad.hpf}、T4リードを{g:lead.hpf}にしよう。低域の取り合いが減る。',tab:'mix',
  mx:[MX(2,'iEqHpf',25,40),MX(3,'iEqHpf',100,200),MX(4,'iEqHpf',150,250)]},
 {h:'声の居場所を空ける',b:'T3パッドのBELL2を{g:pad.cut1}で{g:dyn.eqStart}下げよう。T5声のBELL2は{g:vocal.keep1}で上げよう。パッドとの【ぶつかり度】も確かめる。',tab:'mix',
  mx:[MX(3,'iEqB2f',1000,4000),MX(3,'iEqB2g',-3,-1),MX(5,'iEqB2f',2000,5000),MX(5,'iEqB2g',1,3)],
  mt:[{trk:3,m:'ovl',vs:5,rng:[0,40],hold:2}]},
 {h:'リードの刺さりを外す',b:'T4リードのBELL2を{g:lead.cut1}で、狭く({g:dyn.eqStart}ほど)削ろう。声とのぶつかり度も、範囲に入るか確かめる。',tab:'mix',
  mx:[MX(4,'iEqB2f',3000,5000),MX(4,'iEqB2g',-3,-1),MX(4,'iEqB2q',2,6)],
  mt:[{trk:4,m:'ovl',vs:5,rng:[0,40],hold:2}]},
 {h:'声を整える',b:'T5声のLOW CUTを{g:vocal.hpf}にしよう。要らない低域を切ると、ベースとの重なりが減る。切りすぎ(広く深く)だと、声が細くなる。',tab:'mix',
  mx:[MX(5,'iEqHpf',80,120)]},
 {h:'全部を聴く',b:'整理前と整理後を聞き比べよう。声が聞き取りやすく、低域がすっきりしたほうを選ぶ。',tab:'mix',
  cmp:cm('xe10s6',[['1 整理前',{tm:{1:E(),2:E(),3:E(),4:E(),5:E()}}],['2 整理後',{tm:{1:E({iEqHpf:30}),2:E({iEqHpf:30}),3:E({iEqHpf:150,iEqB2f:3000,iEqB2g:-2,iEqB2q:1.5}),4:E({iEqHpf:200,iEqB2f:4000,iEqB2g:-2,iEqB2q:2}),5:E({iEqHpf:100,iEqB2f:3000,iEqB2g:2,iEqB2q:1})}}]]),
  quiz:qz('すっきりしているのは?',2,'2が正解。ローカットとポケットで、取り合いが減っている。'),
  col:{h:'足し算より引き算',b:'EQの上達は、触る量が減ること。ぶつかり度の表示を見て、必要な所だけ触る。迷ったら、聴き直す。'}}
]})
 );
 /* 既存の用語は see に参照だけ足す(新語は上で登録済み) */
 SD.LESSONS.filter(function(l){return l.course==='XE'}).forEach(function(L){(L.terms||[]).forEach(function(id){T.forEach(function(t){if(t.id===id&&t.see.indexOf(L.id)<0)t.see.push(L.id)})})});
})();
