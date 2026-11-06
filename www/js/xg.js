/* v11.27 MX-12 XG ジャンル別ミックス演習(xg01〜xg12)。lv3・TRK+MIXタブ。
   各レッスンは「ジャンルの定石→トラックを組む→聞き比べ」。ジャンル名は書いてよいが、曲名・人名・年号・機種名は書かない。
   聞き比べの cmp.g は tools/xg-cal.js で測る(ミュート比較 mt は音量を揃えない)。聞こえ方(耳)は未確認。
   数値は目安(SD.GUIDE の {g:} か、つまみ値と同じ数字のみ)。LUFS は測れないので書かない */
(function(){
 var T=SD.TERMS,A=function(id,name,kana,en,def,see,tags){T.push({id:id,name:name,kana:kana,en:en,def:def,see:see,tags:tags||['XG','MIX']})};
 A('xg_pump','ポンプ','ぽんぷ','pumping','キックの鳴る瞬間に他の音が引き、すぐ戻ることで生まれる脈動。サイドチェインで作る。ダンス曲の勢いの元。',['xg01']);
 A('xg_loopvar','ループの変化','るーぷのへんか','loop variation','同じ繰り返しを、音を足す・引く・動かすことで飽きさせない工夫。低域は安定させ、高域を動かす。',['xg02']);
 A('xg_subhead','低域の主役','ていいきのしゅやく','sub-led low end','長く伸びる低い音を主役にし、キックは短い打点に回す設計。声はその上の中域に置く。',['xg03']);
 A('xg_wall','音の壁','おとのかべ','wall of sound','同じコードを複数重ねて左右に置き、中域を密に埋めること。リードの席は別に空けておく。',['xg04']);
 A('xg_vocalfirst','声が主役','こえがしゅやく','vocal first','歌ものの設計。声を中央・手前に置き、伴奏は声の帯域を譲って引き算で整理する。',['xg05']);
 A('xg_lofi','ローファイ設計','ろーふぁいせっけい','lo-fi','わざと暗く・狭く・揺らして、粗さや古さを味にする作り。足りなさを欠点でなく個性にする。',['xg06']);
 A('xg_space','空間が主役','くうかんがしゅやく','space-led','音そのものより、響きと広がりが主役の設計。リバーブを深く、ダイナミクスは広く残す。',['xg07']);
 A('xg_lowsplit','低域の分離','ていいきのぶんり','low-end split','速いリズムの中で、キックとサブを時間と帯域で分け、どちらも埋もれさせないこと。',['xg08']);
 A('xg_midbass','ミッドベース','みっどべーす','mid bass','サブの上で輪郭を担当する、中域のベース音。サブに低域を譲り、中域で存在感を出す。',['xg09']);
 A('xg_gloss','艶','つや','gloss','コーラスの揺れと明るい高域で作る、なめらかで華やかな質感。足しすぎると耳に刺さる。',['xg10']);
 A('xg_fewvoices','少音源の設計','しょうおんげんのせっけい','few-voice design','使える音が少ない曲で、1音ずつに役割を決め、切る帯域と音量の差でぶつからないようにする作り。',['xg11']);
 A('xg_styleear','ジャンルの聴き分け','じゃんるのききわけ','style ear','同じ素材でも、音量・EQ・揺れ・声の置き方で流儀が変わる。その違いを耳で言えること。',['xg12']);
 [['sidechain',['xg01','xg08']],['hpf',['xg02','xg03','xg04','xg05','xg08','xg09','xg11']],['balance',['xg01','xg02','xg03','xg05','xg10']],['wide',['xg01','xg04','xg06']],['stereo',['xg04']],['gr',['xg01']],['reverb',['xg07']]].forEach(function(p){T.forEach(function(t){if(t.id===p[0])p[1].forEach(function(s){if(t.see.indexOf(s)<0)t.see.push(s)})})});
 var P=SD.PATS,TK=P.tk;
 /* 聞き比べの音量補正 g(dB)。tools/xg-cal.js が出す表(VOLは反映・PANとマスターWIDTHは未反映の近似。ミュート・WIDTHの比較は g なし) */
 var GT={'xg01s11':-1.4,'xg01s12':0,'xg01s21':-0.5,'xg01s22':0,'xg01s31':0,'xg01s32':-7.2,'xg02s21':-0.3,'xg02s22':0,'xg02s31':0,'xg02s32':0,'xg03s11':0,'xg03s12':-4,'xg03s21':0,'xg03s22':-4,'xg03s31':0,'xg03s32':0,'xg03s41':0,'xg03s42':0,'xg03s51':0,'xg03s52':-4,'xg03s53':-4,'xg04s11':0,'xg04s12':-0.3,'xg04s21':0,'xg04s22':0,'xg04s31':-0.1,'xg04s32':0,'xg04s41':0,'xg04s42':0,'xg04s51':-0.1,'xg04s52':-0.1,'xg04s53':0,'xg04s54':0,'xg05s11':0,'xg05s12':-2.4,'xg05s21':0,'xg05s22':-2.4,'xg05s31':0,'xg05s32':-0.1,'xg05s41':-0.2,'xg05s42':0,'xg05s51':-0.2,'xg05s52':-2.7,'xg05s53':-2.6,'xg05s54':0,'xg06s11':0,'xg06s12':0,'xg06s21':0,'xg06s22':0,'xg06s41':0,'xg06s42':-0.1,'xg06s51':0,'xg06s52':0,'xg06s53':-0.1,'xg06s54':-0.1,'xg07s31':0,'xg07s32':0,'xg07s41':-5.4,'xg07s42':0,'xg08s11':-3.8,'xg08s12':0,'xg08s21':-2.3,'xg08s22':0,'xg08s31':-1.3,'xg08s32':0,'xg08s41':0,'xg08s42':0,'xg08s51':-3.8,'xg08s52':-1.5,'xg08s53':-2.4,'xg08s54':0,'xg09s11':0,'xg09s12':-1.5,'xg09s21':-0.1,'xg09s22':0,'xg09s31':-1.5,'xg09s32':0,'xg09s41':0,'xg09s42':0,'xg09s51':-1.7,'xg09s52':-1.5,'xg09s53':0,'xg09s54':-0.2,'xg10s11':0,'xg10s12':0,'xg10s21':-0.1,'xg10s22':0,'xg10s31':0,'xg10s32':0,'xg10s33':0,'xg10s41':0,'xg10s42':-2.6,'xg10s51':0,'xg10s52':0,'xg10s53':0,'xg10s54':-2.6,'xg11s11':-0.9,'xg11s12':0,'xg11s21':-0.2,'xg11s22':0,'xg11s31':0,'xg11s32':-0.9,'xg11s41':0,'xg11s42':0,'xg11s43':0,'xg11s51':-0.9,'xg11s52':-0.1,'xg11s53':-0.8,'xg11s54':0,'xg12s11':-4.4,'xg12s12':-4.8,'xg12s13':0,'xg12s21':-4.4,'xg12s22':-4.8,'xg12s23':0,'xg12s31':0,'xg12s32':-4.4,'xg12s33':-4.8,'xg12s41':-4.8,'xg12s42':0,'xg12s43':-4.4,'xg12s51':0,'xg12s52':0};
 var cm=function(key,items){return items.map(function(it,i){var o=Object.assign({l:it[0]},it[1]);var g=GT[key+(i+1)];if(g!==undefined)o.g=g;return o})};
 var z=function(a){var q={};a.forEach(function(i){q[i]=0});return q},all16=function(){var q={};for(var i=0;i<16;i++)q[i]=0;return q};
 var CPD={iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20};
 var CP=function(o){return Object.assign({},CPD,o||{})},NO=CP({iCpThr:0,iCpRatio:1});
 var E=function(o){return Object.assign({iEqOn:1,iEqHpf:20,iEqLpf:20000,iEqLf:200,iEqLg:0,iEqB1f:250,iEqB1g:0,iEqB1q:1,iEqB2f:2500,iEqB2g:0,iEqB2q:1,iEqHf:4000,iEqHg:0},o||{})};
 var BASS={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:.3,noiseLvl:0,fType:'lowpass',cutoff:700,res:.1,envAmt:.3,drive:0,aA:.004,aD:.25,aS:.7,aR:.1};
 var SUBP={o1Wave:'sine',o1Lvl:.6,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:600,res:0,envAmt:0,drive:0,aA:.005,aD:.2,aS:.9,aR:.1};
 var PAD={o1Wave:'sawtooth',o1Lvl:.25,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:3000,res:.1,envAmt:0,drive:0,aA:.01,aD:.2,aS:.7,aR:.2};
 var LEADP={o1Wave:'sawtooth',o1Lvl:.3,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:5000,res:.1,envAmt:.2,drive:0,aA:.004,aD:.2,aS:.5,aR:.15};
 var withM=function(t,cp,mix,eq){t.o.mx={eq:eq||E(),cp:cp||NO};t.o.mix=mix||{};return t};
 var KIK=function(mix,cp,eq){return withM(TK('kick',P.fourFloor(),'キック'),cp,mix,eq)};
 var SNR=function(mix,cp,eq){return withM(TK('snare',{idx:z([4,12]),o:{}},'スネア'),cp,mix,eq)};
 var HAT=function(mix,cp,eq){return withM(TK('hat',{idx:z([2,6,10,14]),o:{}},'ハット',{acc:[2,6,10,14]}),cp,mix,eq)};
 var HAT16=function(mix,cp,eq){return withM(TK('hat',{idx:z([0,2,4,6,8,10,12,14]),o:{}},'ハット',{acc:[0,4,8,12]}),cp,mix,eq)};
 var BAS=function(mix,cp,eq){return withM(TK('bass',P.bassPattern('eighth',0),'ベース',{scale:'minor',p:BASS,acc:[0,4,8,12]}),cp,mix,eq)};
 var SUB=function(mix,cp,eq){return withM(TK('bass',P.bassPattern('eighth',0),'サブ',{scale:'minor',p:SUBP,acc:[0,4,8,12]}),cp,mix,eq)};
 var CHD=function(name,mix,cp,eq){var q=all16(),t=[],i;for(i=0;i<16;i++)if(i!==0&&i!==8)t.push(i);return withM({id:'bass',idx:q,o:{name:name,scale:'minor',tr:12,tie:t,p:PAD}},cp,mix,eq)};
 var LED=function(mix,cp,eq){return withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード',scale:'minor',tr:24,p:LEADP}},cp,mix,eq)};
 var VOX=function(mix,cp,eq){return withM(TK('vo_a',{idx:{0:0,3:2,6:3,8:2,11:0,14:-2},o:{}},'声(代役)',{acc:[0,3,8]}),cp,mix,eq)};
 var CPS=function(o){return SD.scMix({src:0,depth:.8,key:-14,extra:o})};
 var SCOFF=CPS({iCpThr:0,iCpRatio:1,iCpRel:150}),SCON=CPS({iCpThr:-46,iCpRatio:8,iCpRel:150});
 var SW=function(o){return Object.assign({swOn:1,swWidth:1,dlyMix:0,rvbMix:0},o)};
 var qz=function(q,ans,ex){return {q:q,ans:ans,ex:ex}};
 var MX=function(trk,k,lo,hi,ins){return {trk:trk,ins:ins||'mix',k:k,rng:[lo,hi]}};
 var base=function(o){return SD.XM.base(Object.assign({cat:'xg1',course:'XG'},o))};
 var V=function(v,p,r){return {tVol:v,tPan:p||0,tDly:0,tRvb:r||0}};
 var MDC={iMdOn:1,iMdType:0,iMdRate:.8,iMdDepth:.5,iMdFb:0,iMdMix:.5};
 var KIK2=function(mix,cp,eq){return withM(TK('kick',{idx:z([0,10]),o:{}},'キック'),cp,mix,eq)};
 var IN=function(o){return Object.assign({},E(),o)};
 var M=function(e,v,x){return Object.assign({},E(e),v,x||{})};
 var DAN=function(){return {1:M({},V(.9)),2:M({},V(.6),SCON),3:M({iEqHpf:150},V(.5),SCON),4:M({},V(.4)),5:M({iEqHg:2,iEqHpf:400},V(.5)),6:M({},V(.25))}};
 var LOFI=function(){return {1:M({iEqLpf:3000},V(.55)),2:M({iEqLpf:1500},V(.55)),3:M({iEqLpf:4000},V(.5),Object.assign({},MDC,{iMdMix:.5})),4:M({iEqLpf:4000},V(.35)),5:M({iEqLpf:5000},V(.25)),6:M({iEqLpf:3500},V(.4))}};
 var POP=function(){return {1:M({},V(.6)),2:M({iEqHpf:30},V(.55)),3:M({iEqHpf:150,iEqB2g:-3},V(.35)),4:M({},V(.25)),5:M({},V(.3)),6:M({iEqHpf:100,iEqB2g:2},V(.85))}};
 SD.LESSONS.push(
/* ---------------- xg01 ---------------- */
base({id:'xg01',pre:['gn06','gn07'],terms:['xg_pump','sidechain','wide','balance'],title:'ダンス(EDM風)',sub:'キック前面・サイドチェイン・サビの広さ',ts:2,save:{name:'ダンス曲のミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:0,swOn:0,swWidth:1},
 tk:[KIK(V(.6)),BAS(V(.9),SCOFF),CHD('パッド',V(.8),SCOFF),LED(V(.6)),HAT(V(.4)),SNR(V(.6))],steps:[
 {h:'ダンス曲の定石',b:'ダンス曲の定石は3つ。キックを最前面に置く・【ポンプ】を作る・サビで広げる。何もしない音と、定石どおりの音を聞き比べよう。',tab:'mix',
  cmp:cm('xg01s1',[['何もしない',{tm:{1:V(.6),2:Object.assign(IN(),SCOFF,V(.9)),3:Object.assign(IN(),SCOFF,V(.8))}}],['定石どおり',{tm:{1:V(.95),2:Object.assign(IN(),SCON,V(.65)),3:Object.assign(IN(),SCON,V(.8))}}]])},
 {h:'キックを最前面に',b:'キック(T1)のVOLを85〜100%、ベース(T2)を55〜75%にしよう。このジャンルは、キックが主役。ベースは下から支える役で、キックより小さくていい。',tab:'mix',
  mx:[MX(1,'tVol',.85,1),MX(2,'tVol',.55,.75)],
  cmp:cm('xg01s2',[['1 キックが小さい',{tm:{1:V(.6),2:V(.9)}}],['2 キックが最前面',{tm:{1:V(.95),2:V(.65)}}]]),
  quiz:qz('ダンス曲らしい土台なのは?',2,'2が正解。キックを最前面に出し、ベースは一歩下げる。拍の芯がはっきりして、踊れる。')},
 {h:'ポンプを作る',b:'ベース(T2)とパッド(T3)のTHRESHを-52〜-40dB、RATIOを6〜12にしよう。キックが鳴る瞬間だけ両方が引き、戻る。RELEASEは150msのまま。',tab:'mix',
  mx:[MX(2,'iCpThr',-52,-40,'cp'),MX(3,'iCpThr',-52,-40,'cp'),MX(2,'iCpRatio',6,12,'cp'),MX(3,'iCpRatio',6,12,'cp')],
  cmp:cm('xg01s3',[['1 ポンプあり',{tm:{2:Object.assign(IN(),SCON),3:Object.assign(IN(),SCON)}}],['2 ポンプなし',{tm:{2:Object.assign(IN(),SCOFF),3:Object.assign(IN(),SCOFF)}}]]),
  quiz:qz('キックの間に、パッドが膨らんで戻るのは?',1,'1が正解。キックで引いて戻すと、拍ごとに音が脈打つ。2は一定で、動きがない。')},
 {h:'サビで広げる',b:'マスターのWIDTH AMTを140%前後にしよう。キックとベースはもとが中央のモノなので広がらず、芯が残る。広がるのは上の音だけ。',tab:'fx',
  f:[['swOn',1],['swWidth',1.4]],tol:.1,
  cmp:cm('xg01s4',[['WIDTH 100%',{s:SW({swWidth:1})}],['WIDTH 140%',{s:SW({swWidth:1.4})}]])},
 {h:'通しで聞き比べる',b:'何もなし・キックだけ前面・前面+ポンプ・前面+ポンプ+広さ、の4つを聞き比べよう。いちばん「ダンス曲らしい」のはどれか。',tab:'mix',
  cmp:cm('xg01s5',[['1 なし',{tm:{1:V(.6),2:Object.assign(IN(),SCOFF,V(.9)),3:Object.assign(IN(),SCOFF,V(.8))},s:SW({swWidth:1})}],['2 前面だけ',{tm:{1:V(.95),2:Object.assign(IN(),SCOFF,V(.65)),3:Object.assign(IN(),SCOFF,V(.8))},s:SW({swWidth:1})}],['3 前面+ポンプ',{tm:{1:V(.95),2:Object.assign(IN(),SCON,V(.65)),3:Object.assign(IN(),SCON,V(.8))},s:SW({swWidth:1})}],['4 前面+ポンプ+広さ',{tm:{1:V(.95),2:Object.assign(IN(),SCON,V(.65)),3:Object.assign(IN(),SCON,V(.8))},s:SW({swWidth:1.4})}]]),
  quiz:qz('いちばんダンス曲らしいのは?',4,'4が正解。前面・ポンプ・広さの3つがそろうと、拍が立ち、サビが開く。')},
 {h:'ポンプは足しすぎない',b:'3つを少しずつ決めたら、保存して次の曲の出発点にしよう。',tab:'mix',
  col:{h:'ポンプは深すぎると痩せる',b:'ポンプが深いと、ベースやパッドがキックの間に戻りきらず痩せる。RATIOを下げるか、RELEASEを短くして、元の音が残る深さで止めよう。'}}
]}),
/* ---------------- xg02 ---------------- */
base({id:'xg02',pre:['gn01','gn02'],terms:['xg_loopvar','hpf','balance'],title:'ハウス・テクノ',sub:'低域は安定・高域は動かす・引いて飽きさせない',ts:2,save:{name:'ループを設計したミックス',kind:'kit'},
 tk:[KIK(V(.9)),SNR(V(.6)),HAT(V(.5)),BAS(V(.75)),CHD('コード',V(.6)),LED(V(.5))],steps:[
 {h:'ループは、足して引いて動かす',b:'ハウスやテクノは、短いループの繰り返し。【ループの変化】で飽きさせない。基本は、低域を安定させ、高域を動かす。まず全員の音と、ハットを抜いた音を聞き比べよう。',tab:'mix',
  cmp:cm('xg02s1',[['全員',{mt:[]}],['ハットを抜く',{mt:[2]}]])},
 {h:'低域は安定させる',b:'キック(T1)とベース(T4)のHPFを25〜35Hz、コード(T5)を100〜200Hz、リード(T6)を150〜250Hzにしよう。低域を空けると、土台が毎回同じに聞こえる。',tab:'mix',
  mx:[MX(1,'iEqHpf',25,35,'eq'),MX(4,'iEqHpf',25,35,'eq'),MX(5,'iEqHpf',100,200,'eq'),MX(6,'iEqHpf',150,250,'eq')],
  cmp:cm('xg02s2',[['全員 20Hz',{tm:{1:E(),4:E(),5:E(),6:E()}}],['表どおり',{tm:{1:E({iEqHpf:30}),4:E({iEqHpf:30}),5:E({iEqHpf:150}),6:E({iEqHpf:200})}}]])},
 {h:'高域はハットで動かす',b:'ハット(T3)のPANを右へ10〜30%、HIGH GAINを1〜4dB上げよう。きらめきが出る。動かすのは高域で、低域には手を触れない。',tab:'mix',
  mx:[MX(3,'tPan',.1,.3),MX(3,'iEqHg',1,4,'eq')],
  cmp:cm('xg02s3',[['そのまま',{tm:{3:Object.assign(E(),V(.5))}}],['右+明るく',{tm:{3:Object.assign(E({iEqHg:2.5}),V(.5,.2))}}]]),
  quiz:qz('高域が動いて聞こえるのは?',2,'2が正解。位置と明るさを少し動かすと、ハットが跳ねる。低域を触らないので、土台は揺れない。')},
 {h:'引いて、戻す',b:'ループを変えるいちばん簡単な手は、引くこと。同じ長さで、ハットだけ・キックとベース・コードを抜いた音を聞き比べよう。',tab:'mix',
  cmp:cm('xg02s4',[['1 ハットを抜く',{mt:[2]}],['2 キックとベースを抜く',{mt:[0,3]}],['3 コードを抜く',{mt:[4]}]]),
  quiz:qz('抜いたとき、いちばんがらんとするのは?',2,'2が正解。低域を抜くと土台が消える。戻ったとき低域が際立つので、大きな場面転換に使う。')},
 {h:'低域は動かさない',b:'低域を毎回同じにして、高域とコードを動かす。この分担で保存しよう。',tab:'mix',
  col:{h:'足すより、引く',b:'変化が足りないと感じたら、音を足す前に、1つ抜けないか試す。抜いて戻すだけで、同じループが新しく聞こえる。'}}
]}),
/* ---------------- xg03 ---------------- */
base({id:'xg03',pre:['gn08'],terms:['xg_subhead','hpf','balance'],title:'ヒップホップ・トラップ風',sub:'低域が主役・ハットの粒・声の位置',ts:2,save:{name:'トラップ風のミックス',kind:'kit'},
 tk:[KIK(V(.9)),SUB(V(.6)),SNR(V(.7)),HAT16(V(.6)),VOX(V(.5,.15))],steps:[
 {h:'低域が主役',b:'このジャンルは、長く伸びる低い音が主役。【低域の主役】は、サブを大きく、キックを短い打点にする設計。サブが小さい音と、主役の音を聞き比べよう。',tab:'mix',
  cmp:cm('xg03s1',[['サブが控えめ',{tm:{1:V(.9),2:V(.6)}}],['サブが主役',{tm:{1:V(.65),2:V(.95)}}]])},
 {h:'サブを上、キックを下に',b:'サブ(T2)のVOLを85〜100%、キック(T1)を55〜75%にしよう。サブが長く鳴り、キックは頭の打点だけを受け持つ。',tab:'mix',
  mx:[MX(2,'tVol',.85,1),MX(1,'tVol',.55,.75)],
  cmp:cm('xg03s2',[['1 キックが大きい',{tm:{1:V(.9),2:V(.6)}}],['2 サブが主役',{tm:{1:V(.65),2:V(.95)}}]]),
  quiz:qz('低域が長く伸びて聞こえるのは?',2,'2が正解。サブを上げると、低い音が尾を引く。キックは打点として頭に残る。')},
 {h:'ハットは細かい分だけ薄く',b:'ハット(T4)は音数が多い。HPFを{g:hat.hpf}にして、VOLを30〜45%に下げよう。粒は残り、他の音を隠さない。',tab:'mix',
  mx:[MX(4,'iEqHpf',300,500,'eq'),MX(4,'tVol',.3,.45)],
  cmp:cm('xg03s3',[['HPF 20Hz',{tm:{4:Object.assign(E(),V(.6))}}],['HPF 400Hz',{tm:{4:Object.assign(E({iEqHpf:400}),V(.6))}}]]),
  quiz:qz('ハットの粒がすっきりしているのは?',1,'1が正解(HPF 400Hz)。細かい音は低域を切ると、粒が立ち、サブとぶつからない。')},
 {h:'声は中央・手前',b:'声(T5)は、PANを中央(-5〜+5%)、HPFを{g:vocal.hpf}にしよう。低い音が主役でも、声は中央の手前に置く。',tab:'mix',
  mx:[MX(5,'tPan',-.05,.05),MX(5,'iEqHpf',80,120,'eq')],
  cmp:cm('xg03s4',[['声が右寄り・HPFなし',{tm:{5:Object.assign(E(),V(.5,.15))}}],['声が中央・HPFあり',{tm:{5:Object.assign(E({iEqHpf:100}),V(.5,0))}}]])},
 {h:'通しで聞き比べる',b:'全部初期・全部直した・低域だけ直した、の3つを聞き比べよう。声がいちばん聞き取りやすいのはどれか。',tab:'mix',
  cmp:cm('xg03s5',[['1 全部初期',{tm:{1:V(.9),2:V(.6),4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.5,.15))}}],['2 全部直した',{tm:{1:V(.65),2:V(.95),4:Object.assign(E({iEqHpf:400}),V(.4)),5:Object.assign(E({iEqHpf:100}),V(.5,0))}}],['3 低域だけ直した',{tm:{1:V(.65),2:V(.95),4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.5,.15))}}]]),
  quiz:qz('声がいちばん聞き取りやすいのは?',2,'2が正解。ハットの低域を切り、声を中央に置くと、主役の低音の上でも声が埋もれない。')},
 {h:'主役は1つ',b:'低域の主役、粒、声。決めたら保存しよう。',tab:'mix',
  col:{h:'低域を大きくしすぎない',b:'サブは小さいスピーカーで聞こえにくい。大きくしすぎる前に、小さいスピーカー(MON)でも聞こえるか確かめよう。倍音を足す手は xb04 で学ぶ。'}}
]}),
/* ---------------- xg04 ---------------- */
base({id:'xg04',pre:['gn07','mx07'],terms:['xg_wall','wide','stereo','hpf'],title:'ロック風のシンセ曲',sub:'中域の密度・壁のような広がり',ts:2,save:{name:'壁のあるミックス',kind:'kit'},
 tk:[KIK(V(.85)),SNR(V(.75)),BAS(V(.7)),CHD('コードA',V(.5)),CHD('コードB',V(.5)),LED(V(.55))],steps:[
 {h:'音の壁を作る',b:'この定石は、中域を密に埋めること。【音の壁】は、同じコードを2枚重ねて左右に置く。1枚だけの音と、2枚重ねた音を聞き比べよう。',tab:'mix',
  cmp:cm('xg04s1',[['壁1枚(中央)',{tm:{4:Object.assign(E(),V(.5,0)),5:Object.assign(E(),V(0,0))}}],['壁2枚(左右)',{tm:{4:Object.assign(E(),V(.5,-.5)),5:Object.assign(E(),V(.5,.5))}}]])},
 {h:'左右に置く',b:'コードA(T4)のPANを左へ30〜70%、コードB(T5)を右へ30〜70%にしよう。左右に壁ができ、真ん中が空いて、キック・スネア・ベースの席になる。',tab:'mix',
  mx:[MX(4,'tPan',-.7,-.3),MX(5,'tPan',.3,.7)],
  cmp:cm('xg04s2',[['1 2枚とも中央',{tm:{4:Object.assign(E(),V(.5,0)),5:Object.assign(E(),V(.5,0))}}],['2 左右に置く',{tm:{4:Object.assign(E(),V(.5,-.5)),5:Object.assign(E(),V(.5,.5))}}]]),
  quiz:qz('真ん中の土台が見えやすいのは?',2,'2が正解。壁を左右に分けると、中央が空き、キックとベースが聞き取りやすくなる。')},
 {h:'壁は低域を譲る',b:'壁が低いと、ベースとぶつかる。2枚のHPFを{g:pad.hpf}にしよう。壁は中域から上を担当し、低域はベースとキックに渡す。',tab:'mix',
  mx:[MX(4,'iEqHpf',100,200,'eq'),MX(5,'iEqHpf',100,200,'eq')],
  cmp:cm('xg04s3',[['HPF 20Hz',{tm:{4:Object.assign(E(),V(.5,-.5)),5:Object.assign(E(),V(.5,.5))}}],['HPF 150Hz',{tm:{4:Object.assign(E({iEqHpf:150}),V(.5,-.5)),5:Object.assign(E({iEqHpf:150}),V(.5,.5))}}]])},
 {h:'リードの席を空ける',b:'リードの主役は中高域。壁(T4・T5)のBAND 2を-3〜-1dB下げ、リード(T6)を+1〜+3dB上げよう。壁を削った所に、リードが座る。',tab:'mix',
  mx:[MX(4,'iEqB2g',-3,-1,'eq'),MX(5,'iEqB2g',-3,-1,'eq'),MX(6,'iEqB2g',1,3,'eq')],
  cmp:cm('xg04s4',[['1 席を空けない',{tm:{4:Object.assign(E(),V(.5,-.5)),5:Object.assign(E(),V(.5,.5)),6:Object.assign(E(),V(.55))}}],['2 席を空ける',{tm:{4:Object.assign(E({iEqB2g:-2}),V(.5,-.5)),5:Object.assign(E({iEqB2g:-2}),V(.5,.5)),6:Object.assign(E({iEqB2g:2}),V(.55))}}]]),
  quiz:qz('リードが壁から抜けて聞こえるのは?',2,'2が正解。壁の同じ帯域を少し削ると、リードの居場所が生まれ、音量を上げなくても抜ける。')},
 {h:'通しで聞き比べる',b:'初期・左右だけ・左右+低域を譲る・全部、の4つを聞き比べよう。壁が厚く、土台もリードも見えるのはどれか。',tab:'mix',
  cmp:cm('xg04s5',[['1 初期',{tm:{4:Object.assign(E(),V(.5,0)),5:Object.assign(E(),V(.5,0)),6:Object.assign(E(),V(.55))}}],['2 左右だけ',{tm:{4:Object.assign(E(),V(.5,-.5)),5:Object.assign(E(),V(.5,.5)),6:Object.assign(E(),V(.55))}}],['3 左右+低域を譲る',{tm:{4:Object.assign(E({iEqHpf:150}),V(.5,-.5)),5:Object.assign(E({iEqHpf:150}),V(.5,.5)),6:Object.assign(E(),V(.55))}}],['4 全部',{tm:{4:Object.assign(E({iEqHpf:150,iEqB2g:-2}),V(.5,-.5)),5:Object.assign(E({iEqHpf:150,iEqB2g:-2}),V(.5,.5)),6:Object.assign(E({iEqB2g:2}),V(.55))}}]]),
  quiz:qz('壁が厚く、土台もリードも見えるのは?',4,'4が正解。左右・低域・席の3つがそろうと、壁は厚いまま、どの音も埋もれない。')},
 {h:'壁は2枚まで',b:'左右・低域・席。決めたら保存しよう。',tab:'mix',
  col:{h:'壁を増やすと濁る',b:'壁を3枚、4枚と重ねると、中域が詰まって濁る。足したくなったら、まず削る。2枚で足りない時は、音量でなく、帯域を分けて足そう。'}}
]}),
/* ---------------- xg05 ---------------- */
base({id:'xg05',pre:['vo13','mx07','gn15'],terms:['xg_vocalfirst','hpf','balance'],title:'ポップ(歌もの)',sub:'声が主役・伴奏は引き算',ts:2,save:{name:'歌ものミックス',kind:'kit'},
 tk:[VOX(V(.55,.15)),KIK(V(.8)),BAS(V(.65)),CHD('パッド',V(.6)),LED(V(.7)),HAT(V(.4))],steps:[
 {h:'歌ものの定石',b:'歌ものは【声が主役】。声を中央・手前に置き、伴奏は声の帯域を譲る。伴奏のままの音と、声を主役にした音を聞き比べよう。',tab:'mix',
  cmp:cm('xg05s1',[['伴奏のまま',{tm:{1:Object.assign(E(),V(.55,.15)),4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.7))}}],['声が主役',{tm:{1:Object.assign(E({iEqHpf:100,iEqB2g:2}),V(.9,0)),4:Object.assign(E({iEqB2g:-3}),V(.6)),5:Object.assign(E(),V(.4))}}]])},
 {h:'声を中央・手前に',b:'声(T1)のVOLを80〜100%、PANを中央(-5〜+5%)にしよう。声が右に寄っていると、聞き手の注意が散る。主役は、中央の手前に置く。',tab:'mix',
  mx:[MX(1,'tVol',.8,1),MX(1,'tPan',-.05,.05)],
  cmp:cm('xg05s2',[['1 声が小さく右寄り',{tm:{1:Object.assign(E(),V(.55,.15))}}],['2 声が中央・手前',{tm:{1:Object.assign(E(),V(.9,0))}}]]),
  quiz:qz('声が主役に聞こえるのは?',2,'2が正解。中央の手前に置くと、聞き手の耳が声に集まる。')},
 {h:'声を整える',b:'声のHPFを{g:vocal.hpf}にして、BAND 2を{g:dyn.eqStart}上げよう。低い濁りを切り、明瞭さを足す。足しすぎず、少しだけ。',tab:'mix',
  mx:[MX(1,'iEqHpf',80,120,'eq'),MX(1,'iEqB2g',1,3,'eq')],
  cmp:cm('xg05s3',[['整えない',{tm:{1:Object.assign(E(),V(.9,0))}}],['整える',{tm:{1:Object.assign(E({iEqHpf:100,iEqB2g:2}),V(.9,0))}}]])},
 {h:'伴奏は声に席を譲る',b:'パッド(T4)のBAND 2を-4〜-1dB下げ、リード(T5)のVOLを30〜50%にしよう。声の帯域を空け、伴奏は一歩下がる。引き算でまとめる。',tab:'mix',
  mx:[MX(4,'iEqB2g',-4,-1,'eq'),MX(5,'tVol',.3,.5)],
  cmp:cm('xg05s4',[['1 伴奏が主張する',{tm:{4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.7))}}],['2 伴奏が譲る',{tm:{4:Object.assign(E({iEqB2g:-3}),V(.6)),5:Object.assign(E(),V(.4))}}]]),
  quiz:qz('歌詞が聞き取りやすいのは?',2,'2が正解。伴奏が声の帯域を譲ると、声を上げなくても言葉がはっきり届く。')},
 {h:'通しで聞き比べる',b:'初期・声だけ整えた・伴奏だけ整えた・全部、の4つを聞き比べよう。声がいちばん楽に聞こえるのはどれか。',tab:'mix',
  cmp:cm('xg05s5',[['1 初期',{tm:{1:Object.assign(E(),V(.55,.15)),4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.7))}}],['2 声だけ',{tm:{1:Object.assign(E({iEqHpf:100,iEqB2g:2}),V(.9,0)),4:Object.assign(E(),V(.6)),5:Object.assign(E(),V(.7))}}],['3 全部',{tm:{1:Object.assign(E({iEqHpf:100,iEqB2g:2}),V(.9,0)),4:Object.assign(E({iEqB2g:-3}),V(.6)),5:Object.assign(E(),V(.4))}}],['4 伴奏だけ',{tm:{1:Object.assign(E(),V(.55,.15)),4:Object.assign(E({iEqB2g:-3}),V(.6)),5:Object.assign(E(),V(.4))}}]]),
  quiz:qz('声がいちばん楽に聞こえるのは?',3,'3が正解。声を整え、伴奏が席を譲ると、声が自然に前へ出る。')},
 {h:'声から決める',b:'声を決めてから伴奏を引く。この順で保存しよう。',tab:'mix',
  col:{h:'順番は、声が先',b:'先に伴奏を作り込むと、声の席がなくなる。まず声の位置と音を決め、伴奏はその残りで組む。迷ったら、伴奏を1つ抜いて、声が楽になるか聞こう。'}}
]}),
/* ---------------- xg06 ---------------- */
base({id:'xg06',pre:['gn11','ef05'],terms:['xg_lofi','wide'],title:'ローファイ',sub:'わざと暗く・狭く・揺らす',ts:2,save:{name:'ローファイのミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:0,swOn:0,swWidth:1},
 tk:[KIK(V(.85)),SNR(V(.6)),HAT(V(.45),null,E()),CHD('コード',Object.assign(V(.6),MDC)),BAS(V(.7)),LED(V(.5))],steps:[
 {h:'足りなさを味にする',b:'【ローファイ設計】は、きれいに整えず、暗く・狭く・揺らして味にする。ふつうの音と、ローファイの音を聞き比べよう。',tab:'mix',
  cmp:cm('xg06s1',[['ふつう',{tm:{3:E(),4:Object.assign(E(),V(.6)),6:E()}}],['ローファイ',{tm:{3:E({iEqLpf:8000}),4:Object.assign(E({iEqLpf:4500}),V(.6)),6:E({iEqLpf:4500})}}]])},
 {h:'高域を削って暗くする',b:'コード(T4)とリード(T6)のLPFを3000〜6000Hz、ハット(T3)を6000〜9000Hzにしよう。きらびやかさが消え、古い音になる。',tab:'mix',
  mx:[MX(4,'iEqLpf',3000,6000,'eq'),MX(6,'iEqLpf',3000,6000,'eq'),MX(3,'iEqLpf',6000,9000,'eq')],
  cmp:cm('xg06s2',[['1 LPFなし',{tm:{3:E(),4:E(),6:E()}}],['2 LPFあり',{tm:{3:E({iEqLpf:8000}),4:E({iEqLpf:4500}),6:E({iEqLpf:4500})}}]]),
  quiz:qz('古い録音のように聞こえるのは?',2,'2が正解。高域を削ると、ざらついた暗い音になる。')},
 {h:'わざと狭くする',b:'マスターのWIDTH AMTを60%前後にしよう。広げるのと逆に、中央へ寄せる。小さなスピーカーで鳴っているような近さが出る。',tab:'fx',
  f:[['swOn',1],['swWidth',.6]],tol:.1,
  cmp:cm('xg06s3',[['WIDTH 100%',{s:SW({swWidth:1})}],['WIDTH 60%',{s:SW({swWidth:.6})}]])},
 {h:'ゆっくり揺らす',b:'コード(T4)のMODを、RATEを0.2〜0.5、DEPTHを0.6〜0.9にしよう。遅く深く揺らすと、音程がよれたような古さが出る。',tab:'mix',
  mx:[MX(4,'iMdRate',.2,.5,'md'),MX(4,'iMdDepth',.6,.9,'md')],
  cmp:cm('xg06s4',[['1 ふつうの揺れ',{tm:{4:Object.assign(E(),V(.6),MDC)}}],['2 遅く深い揺れ',{tm:{4:Object.assign(E(),V(.6),MDC,{iMdRate:.3,iMdDepth:.8})}}]]),
  quiz:qz('よれた古さが出るのは?',2,'2が正解。遅く深い揺れは、テープがゆがんだような不安定さを生む。')},
 {h:'通しで聞き比べる',b:'ふつう・暗いだけ・暗い+揺れ・揺れだけ、の4つを聞き比べよう。ローファイらしいのはどれか。',tab:'mix',
  cmp:cm('xg06s5',[['1 ふつう',{tm:{3:E(),4:Object.assign(E(),V(.6),MDC),6:E()}}],['2 暗いだけ',{tm:{3:E({iEqLpf:8000}),4:Object.assign(E({iEqLpf:4500}),V(.6),MDC),6:E({iEqLpf:4500})}}],['3 暗い+揺れ',{tm:{3:E({iEqLpf:8000}),4:Object.assign(E({iEqLpf:4500}),V(.6),MDC,{iMdRate:.3,iMdDepth:.8}),6:E({iEqLpf:4500})}}],['4 揺れだけ',{tm:{3:E(),4:Object.assign(E(),V(.6),MDC,{iMdRate:.3,iMdDepth:.8}),6:E()}}]]),
  quiz:qz('ローファイらしいのは?',3,'3が正解。暗さと揺れがそろうと、古い質感になる(狭さはマスターで足す)。')},
 {h:'やりすぎない',b:'暗さ・狭さ・揺れ。決めたら保存しよう。',tab:'mix',
  col:{h:'足りなくしすぎない',b:'暗くしすぎると、輪郭が消えて何の音かわからなくなる。キックとスネアの打点は残し、削るのは上の音から。MONOでも確かめよう。'}}
]}),
/* ---------------- xg07 ---------------- */
base({id:'xg07',pre:['gn13','xs01'],terms:['xg_space','reverb'],title:'アンビエント',sub:'空間が主役・ダイナミクスは広く',ts:2,save:{name:'アンビエントのミックス',kind:'kit'},
 init:{dlyMix:0,rvbMix:.2,rvbType:2,rvbSize:1.2,rvbPre:0,rvbDamp:.5,rvDuckOn:0,swOn:0},
 tk:[CHD('パッドA',V(.6,-.3,.2),CP({iCpThr:-30,iCpRatio:6})),CHD('パッドB',V(.5,.3,.2)),SUB(V(.6,0,.4)),LED(V(.4,0,.2))],steps:[
 {h:'響きが主役',b:'【空間が主役】は、音より響きを聴かせる作り。リバーブを深く、音をつぶさず広く残す。響きの浅い音と、深い音を聞き比べよう。',tab:'mix',
  cmp:cm('xg07s1',[['浅い響き',{s:{rvbMix:.2,rvbType:2,rvbSize:1.2,dlyMix:0}}],['深い響き',{s:{rvbMix:.5,rvbType:2,rvbSize:3.5,dlyMix:0}}]])},
 {h:'部屋を大きく',b:'リバーブは、部屋を大きく、響きを多くする。長い余韻が、音と音をつなげる。小さな部屋と大きな部屋を聞き比べよう。',tab:'fx',
  cmp:cm('xg07s2',[['1 小さな部屋',{s:{rvbMix:.2,rvbType:2,rvbSize:1.2,dlyMix:0}}],['2 大きな部屋',{s:{rvbMix:.5,rvbType:2,rvbSize:3,dlyMix:0}}]]),
  quiz:qz('広い空間に聞こえるのは?',2,'2が正解。部屋が大きく響きが多いほど、遠くまで広がる。')},
 {h:'送りを役割で分ける',b:'パッドA・B(T1・T2)の送りを60〜90%、サブ(T3)を0〜5%にしよう。低い音に響きを足すと、にごって空間が濁る。',tab:'mix',
  mx:[MX(1,'tRvb',.6,.9),MX(2,'tRvb',.6,.9),MX(3,'tRvb',0,.05)],
  cmp:cm('xg07s3',[['1 サブにも送る',{tm:{1:Object.assign(E(),CP({iCpThr:-30,iCpRatio:6}),V(.6,-.3,.2)),3:Object.assign(E(),V(.6,0,.4))}}],['2 サブは送らない',{tm:{1:Object.assign(E(),CP({iCpThr:-30,iCpRatio:6}),V(.6,-.3,.8)),3:Object.assign(E(),V(.6,0,0))}}]]),
  quiz:qz('空間が澄んで聞こえるのは?',2,'2が正解。低い音は送らず、上の音だけを響かせると、空間が濁らない。')},
 {h:'ダイナミクスは広く',b:'パッドA(T1)のRATIOを1〜1.5に戻そう。つぶすと、音の大小が消えて、空間の動きがなくなる。静かな所は静かなままにする。',tab:'mix',
  mx:[MX(1,'iCpRatio',1,1.5,'cp')],
  cmp:cm('xg07s4',[['1 つぶす',{tm:{1:Object.assign(E(),CP({iCpThr:-30,iCpRatio:6}),V(.6,-.3,.8))}}],['2 つぶさない',{tm:{1:Object.assign(E(),NO,V(.6,-.3,.8))}}]]),
  quiz:qz('音の大小が自然に残るのは?',2,'2が正解。圧縮を止めると、音が膨らんで消える動きがそのまま残る。')},
 {h:'通しで聞き比べる',b:'初期・響きだけ・送りだけ・全部、の4つを聞き比べよう。空間が主役に聞こえるのはどれか。',tab:'mix',
  cmp:cm('xg07s5',[['1 初期',{tm:{1:Object.assign(E(),CP({iCpThr:-30,iCpRatio:6}),V(.6,-.3,.2)),3:Object.assign(E(),V(.6,0,.4))},s:{rvbMix:.2,rvbType:2,rvbSize:1.2,dlyMix:0}}],['2 全部',{tm:{1:Object.assign(E(),NO,V(.6,-.3,.8)),2:Object.assign(E(),V(.5,.3,.8)),3:Object.assign(E(),V(.6,0,0))},s:{rvbMix:.5,rvbType:2,rvbSize:3,dlyMix:0}}],['3 響きだけ',{tm:{1:Object.assign(E(),CP({iCpThr:-30,iCpRatio:6}),V(.6,-.3,.2)),3:Object.assign(E(),V(.6,0,.4))},s:{rvbMix:.5,rvbType:2,rvbSize:3,dlyMix:0}}]]),
  quiz:qz('空間が主役に聞こえるのは?',2,'2が正解。大きな部屋・役割別の送り・つぶさない、の3つがそろうと、響きが主役になる。')},
 {h:'足さずに待つ',b:'響き・送り・広さ。決めたら保存しよう。',tab:'mix',
  col:{h:'音を足したくなったら',b:'空間の曲は、音を足すほど響きが詰まる。足す前に、休符や間をそのまま聴く。何もない時間も、空間の一部になる。'}}
]}),
/* ---------------- xg08 ---------------- */
base({id:'xg08',pre:['gn05'],terms:['xg_lowsplit','sidechain','hpf'],title:'ドラムンベース',sub:'速いリズムと低域の分離',ts:2,save:{name:'ドラムンベースのミックス',kind:'kit'},
 tk:[KIK2(V(.8)),SNR(V(.75)),HAT16(V(.45)),SUB(V(.85),SCOFF),BAS(V(.5))],steps:[
 {h:'速いリズムは、低域が詰まる',b:'この曲は拍が細かく、低域が詰まりやすい。【低域の分離】は、キックとサブを時間と帯域で分けること。何もしない音と、分けた音を聞き比べよう。',tab:'mix',
  cmp:cm('xg08s1',[['何もしない',{tm:{1:E(),4:Object.assign(E(),SCOFF),5:E()}}],['分けた',{tm:{1:E({iEqHpf:30}),4:Object.assign(E({iEqHpf:30}),SCON),5:E({iEqHpf:150})}}]])},
 {h:'時間で分ける',b:'サブ(T4)のTHRESHを-52〜-40dB、RATIOを6〜12、RELEASEを80〜200msにしよう。キックが鳴る間だけサブが引き、拍の間で戻る。',tab:'mix',
  mx:[MX(4,'iCpThr',-52,-40,'cp'),MX(4,'iCpRatio',6,12,'cp'),MX(4,'iCpRel',80,200,'cp')],
  cmp:cm('xg08s2',[['1 なし',{tm:{4:Object.assign(E(),SCOFF)}}],['2 あり',{tm:{4:Object.assign(E(),SCON)}}]]),
  quiz:qz('キックの打点がはっきり見えるのは?',2,'2が正解。キックの瞬間だけサブが引くと、頭の打点が埋もれない。')},
 {h:'帯域で分ける',b:'キック(T1)のHPFを25〜35Hz、ミッドベース(T5)のHPFを100〜200Hzにしよう。サブより上を中域のベースが担当し、低域は重ならない。',tab:'mix',
  mx:[MX(1,'iEqHpf',25,35,'eq'),MX(5,'iEqHpf',100,200,'eq')],
  cmp:cm('xg08s3',[['1 HPFなし',{tm:{1:E(),5:E()}}],['2 HPFあり',{tm:{1:E({iEqHpf:30}),5:E({iEqHpf:150})}}]]),
  quiz:qz('低域がすっきりしているのは?',2,'2が正解。中域のベースが低域を譲ると、サブの居場所が空く。')},
 {h:'ハットは細かい分だけ薄く',b:'ハット(T3)のHPFを{g:hat.hpf}、VOLを30〜45%にしよう。細かい音は、大きいと低域の分離を邪魔する。',tab:'mix',
  mx:[MX(3,'iEqHpf',300,500,'eq'),MX(3,'tVol',.3,.45)],
  cmp:cm('xg08s4',[['HPFなし',{tm:{3:Object.assign(E(),V(.45))}}],['HPF 400Hz',{tm:{3:Object.assign(E({iEqHpf:400}),V(.45))}}]])},
 {h:'通しで聞き比べる',b:'初期・時間だけ・帯域だけ・両方、の4つを聞き比べよう。いちばん分離できているのはどれか。',tab:'mix',
  cmp:cm('xg08s5',[['1 初期',{tm:{1:E(),4:Object.assign(E(),SCOFF),5:E()}}],['2 時間だけ',{tm:{1:E(),4:Object.assign(E(),SCON),5:E()}}],['3 帯域だけ',{tm:{1:E({iEqHpf:30}),4:Object.assign(E({iEqHpf:30}),SCOFF),5:E({iEqHpf:150})}}],['4 両方',{tm:{1:E({iEqHpf:30}),4:Object.assign(E({iEqHpf:30}),SCON),5:E({iEqHpf:150})}}]]),
  quiz:qz('いちばん分離できているのは?',4,'4が正解。時間と帯域の両方で分けると、速いリズムでも低域が重ならない。')},
 {h:'2つの手を重ねる',b:'時間と帯域、決めたら保存しよう。',tab:'mix',
  col:{h:'分離は、足し算でなく引き算',b:'低域が詰まったら、音量を上げずに、誰かが引く。サブが引くか、ミッドが譲るか。1つずつON/OFFして、きいている手を耳で見つける。'}}
]}),
/* ---------------- xg09 ---------------- */
base({id:'xg09',pre:['gn04','xb04'],terms:['xg_midbass','hpf'],title:'ベースミュージック(重低音系)',sub:'サブの設計・ミッドベースの輪郭',ts:2,save:{name:'重低音のミックス',kind:'kit'},
 tk:[KIK2(V(.7)),SUB(V(.9)),BAS(V(.55)),SNR(V(.7)),HAT(V(.4)),LED(V(.4))],steps:[
 {h:'低域を二層で考える',b:'重低音の曲は、低い層が2つ。サブは重さ、【ミッドベース】は輪郭を担当する。サブだけの音と、2層そろった音を聞き比べよう。',tab:'mix',
  cmp:cm('xg09s1',[['サブだけ',{tm:{2:Object.assign(E(),V(.9)),3:Object.assign(E(),V(0))}}],['サブ+ミッド',{tm:{2:Object.assign(E(),V(.9)),3:Object.assign(E(),V(.55))}}]])},
 {h:'サブは土台に',b:'サブ(T2)のHPFを25〜35Hz、LPFを500〜800Hzにしよう。聞こえない低さと、上の余計な成分を切ると、重さだけが残る。',tab:'mix',
  mx:[MX(2,'iEqHpf',25,35,'eq'),MX(2,'iEqLpf',500,800,'eq')],
  cmp:cm('xg09s2',[['1 そのまま',{tm:{2:E()}}],['2 整えた',{tm:{2:E({iEqHpf:30,iEqLpf:600})}}]]),
  quiz:qz('重さだけがきれいに残るのは?',2,'2が正解。上と下の余計な成分を切ると、サブが他の音にかぶらない。')},
 {h:'ミッドは低域を譲る',b:'ミッドベース(T3)のHPFを100〜200Hzにしよう。サブに低域を渡し、中域で輪郭を作る。小さなスピーカーでも聞こえる。',tab:'mix',
  mx:[MX(3,'iEqHpf',100,200,'eq')],
  cmp:cm('xg09s3',[['HPFなし',{tm:{3:Object.assign(E(),V(.55))}}],['HPF 150Hz',{tm:{3:Object.assign(E({iEqHpf:150}),V(.55))}}]])},
 {h:'輪郭を作る',b:'ミッド(T3)のBAND 2を1〜3dB上げ、BAND 1(にごり)を-4〜-1dB下げよう。にごりを削り、輪郭を足すと、音の形が見える。',tab:'mix',
  mx:[MX(3,'iEqB2g',1,3,'eq'),MX(3,'iEqB1g',-4,-1,'eq')],
  cmp:cm('xg09s4',[['1 そのまま',{tm:{3:Object.assign(E({iEqHpf:150}),V(.55))}}],['2 輪郭あり',{tm:{3:Object.assign(E({iEqHpf:150,iEqB2g:2,iEqB1g:-2.5}),V(.55))}}]]),
  quiz:qz('ベースの輪郭が見えるのは?',2,'2が正解。にごりを削り、中域を少し足すと、音の形がはっきりする。')},
 {h:'通しで聞き比べる',b:'初期・サブだけ整えた・ミッドだけ整えた・全部、の4つを聞き比べよう。重く、かつ輪郭が見えるのはどれか。',tab:'mix',
  cmp:cm('xg09s5',[['1 初期',{tm:{2:E(),3:E()}}],['2 サブだけ',{tm:{2:E({iEqHpf:30,iEqLpf:600}),3:E()}}],['3 全部',{tm:{2:E({iEqHpf:30,iEqLpf:600}),3:E({iEqHpf:150,iEqB2g:2,iEqB1g:-2.5})}}],['4 ミッドだけ',{tm:{2:E(),3:E({iEqHpf:150,iEqB2g:2,iEqB1g:-2.5})}}]]),
  quiz:qz('重く、輪郭も見えるのは?',3,'3が正解。サブは土台、ミッドは輪郭と役割を分けると、両方がはっきりする。')},
 {h:'重さは小さなスピーカーでも',b:'サブとミッド、決めたら保存しよう。',tab:'mix',
  col:{h:'サブは聞こえなくても入っている',b:'サブは小さなスピーカーでは聞こえない。MONと小スピーカーで、ミッドだけでも曲が成り立つか確かめよう。倍音の足し方は xb04 を思い出そう。'}}
]}),
/* ---------------- xg10 ---------------- */
base({id:'xg10',pre:['gn16'],terms:['xg_gloss','balance'],title:'シティポップ風(日本)',sub:'艶・コーラス・明るい高域',ts:2,save:{name:'シティポップ風のミックス',kind:'kit'},
 tk:[KIK(V(.8)),SNR(V(.65)),BAS(V(.65)),CHD('コード',Object.assign(V(.6),MDC,{iMdMix:.1})),LED(V(.55)),HAT(V(.45))],steps:[
 {h:'艶と明るさ',b:'この風合いは、なめらかで華やか。【艶】は、コーラスの揺れと明るい高域で作る。素のままの音と、艶を足した音を聞き比べよう。',tab:'mix',
  cmp:cm('xg10s1',[['素のまま',{tm:{4:Object.assign(E(),V(.6),MDC,{iMdMix:.1}),5:E(),6:E()}}],['艶あり',{tm:{4:Object.assign(E({iEqHg:2}),V(.6),MDC,{iMdMix:.5}),5:E({iEqHg:2}),6:E({iEqHg:2})}}]])},
 {h:'コーラスで艶を出す',b:'コード(T4)のMODを、DEPTH 0.2〜0.4、MIX 30〜60%にしよう。浅く少し重ねると、音がなめらかに広がる。深いと、音程がぐらつく。',tab:'mix',
  mx:[MX(4,'iMdDepth',.2,.4,'md'),MX(4,'iMdMix',.3,.6,'md')],
  cmp:cm('xg10s2',[['1 揺れなし',{tm:{4:Object.assign(E(),V(.6),MDC,{iMdMix:0})}}],['2 揺れあり',{tm:{4:Object.assign(E(),V(.6),MDC,{iMdMix:.45,iMdDepth:.3})}}]]),
  quiz:qz('なめらかに広がるのは?',2,'2が正解。揺れを少し重ねると、音が厚くなめらかになる。')},
 {h:'高域を明るく',b:'コード(T4)・リード(T5)のHIGH GAINを{g:dyn.eqStart}上げよう。華やかさが出る。上げすぎると、耳に刺さる。',tab:'mix',
  mx:[MX(4,'iEqHg',1,3,'eq'),MX(5,'iEqHg',1,3,'eq')],
  cmp:cm('xg10s3',[['1 そのまま',{tm:{4:E(),5:E()}}],['2 少し上げる',{tm:{4:E({iEqHg:2}),5:E({iEqHg:2})}}],['3 上げすぎ',{tm:{4:E({iEqHg:8}),5:E({iEqHg:8})}}]]),
  quiz:qz('耳に刺さるのは?',3,'3が正解。上げすぎた高域はきつい。艶は、少し足すだけで出る。')},
 {h:'ベースは太く中央',b:'ベース(T3)のLOW GAINを1〜3dB上げ、VOLを70〜85%にしよう。明るい上の音に負けない土台を、中央に置く。',tab:'mix',
  mx:[MX(3,'iEqLg',1,3,'eq'),MX(3,'tVol',.7,.85)],
  cmp:cm('xg10s4',[['そのまま',{tm:{3:Object.assign(E(),V(.65))}}],['太くした',{tm:{3:Object.assign(E({iEqLg:2}),V(.78))}}]])},
 {h:'通しで聞き比べる',b:'初期・コーラスだけ・高域だけ・全部、の4つを聞き比べよう。華やかで、なめらかなのはどれか。',tab:'mix',
  cmp:cm('xg10s5',[['1 初期',{tm:{3:Object.assign(E(),V(.65)),4:Object.assign(E(),V(.6),MDC,{iMdMix:.1}),5:E()}}],['2 コーラスだけ',{tm:{3:Object.assign(E(),V(.65)),4:Object.assign(E(),V(.6),MDC,{iMdMix:.45}),5:E()}}],['3 高域だけ',{tm:{3:Object.assign(E(),V(.65)),4:Object.assign(E({iEqHg:2}),V(.6),MDC,{iMdMix:.1}),5:E({iEqHg:2})}}],['4 全部',{tm:{3:Object.assign(E({iEqLg:2}),V(.78)),4:Object.assign(E({iEqHg:2}),V(.6),MDC,{iMdMix:.45}),5:E({iEqHg:2})}}]]),
  quiz:qz('華やかでなめらかなのは?',4,'4が正解。揺れ・明るさ・土台の3つがそろうと、艶が出ても崩れない。')},
 {h:'艶は少しだけ',b:'揺れと明るさ。決めたら保存しよう。',tab:'mix',
  col:{h:'足しすぎると古びる',b:'コーラスも高域も、少しが効く。多いと、ぐらついて刺さる。ON/OFFで比べて、なくなると物足りない量で止めよう。'}}
]}),
/* ---------------- xg11 ---------------- */
base({id:'xg11',pre:['gn12'],terms:['xg_fewvoices','hpf'],title:'ゲーム音楽・チップチューン風',sub:'矩形波の整理・小さい音源での聞こえ',ts:2,save:{name:'チップチューン風のミックス',kind:'kit'},
 tk:[KIK2(V(.7)),withM(TK('bass',P.bassPattern('eighth',0),'ベース(三角波)',{scale:'minor',p:Object.assign({},BASS,{o1Wave:'triangle',subLvl:0,cutoff:2000,envAmt:0}),acc:[0,4,8,12]}),NO,V(.6),E()),
  withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード(矩形波)',scale:'minor',tr:24,p:Object.assign({},LEADP,{o1Wave:'square',cutoff:8000,envAmt:0})}},NO,V(.5),E()),
  withM({id:'bass',idx:{0:0,1:2,2:4,3:2,4:0,5:2,6:4,7:2,8:0,9:2,10:4,11:2,12:0,13:2,14:4,15:2},o:{name:'アルペジオ(矩形波)',scale:'minor',tr:12,p:Object.assign({},LEADP,{o1Wave:'square',cutoff:8000,envAmt:0,aD:.1,aS:.3})}},NO,V(.55),E()),
  HAT16(V(.4)),SNR(V(.5))],steps:[
 {h:'少ない音を役割で分ける',b:'この風合いは、使える音が少ない。【少音源の設計】は、1音ずつに役割を決めて、ぶつからないようにすること。整理前と整理後を聞き比べよう。',tab:'mix',
  cmp:cm('xg11s1',[['整理前',{tm:{3:E(),4:Object.assign(E(),V(.55)),5:E()}}],['整理後',{tm:{3:E({iEqHpf:200}),4:Object.assign(E({iEqHpf:150}),V(.3)),5:E({iEqHpf:400})}}]])},
 {h:'矩形波は低域を空ける',b:'矩形波は倍音が多く、中域を埋めやすい。アルペジオ(T4)のHPFを{g:pad.hpf}にして、低域を空けよう。ベースが聞こえやすくなる。',tab:'mix',
  mx:[MX(4,'iEqHpf',100,200,'eq')],
  cmp:cm('xg11s2',[['1 HPFなし',{tm:{4:Object.assign(E(),V(.55))}}],['2 HPF 150Hz',{tm:{4:Object.assign(E({iEqHpf:150}),V(.55))}}]]),
  quiz:qz('ベースが聞こえやすいのは?',2,'2が正解。矩形波の低域を切ると、ベースの席が空く。')},
 {h:'リードを前に出す',b:'リード(T3)のHPFを{g:lead.hpf}、アルペジオ(T4)のVOLを25〜40%にしよう。主役のリードに、伴奏の矩形波を譲らせる。',tab:'mix',
  mx:[MX(3,'iEqHpf',150,250,'eq'),MX(4,'tVol',.25,.4)],
  cmp:cm('xg11s3',[['1 整理した',{tm:{3:E({iEqHpf:200}),4:Object.assign(E({iEqHpf:150}),V(.3))}}],['2 そのまま',{tm:{3:E(),4:Object.assign(E(),V(.55))}}]]),
  quiz:qz('リードが前に聞こえるのは?',1,'1が正解。同じ矩形波どうしは重なるので、伴奏を引くと主役が立つ。')},
 {h:'ノイズの粒を立てる',b:'ハット(T5)のHPFを{g:hat.hpf}にしよう。ノイズの低い成分を切ると、リズムの粒が細かく立つ。切りすぎると薄くなる。',tab:'mix',
  mx:[MX(5,'iEqHpf',300,500,'eq')],
  cmp:cm('xg11s4',[['1 切りすぎ',{tm:{5:E({iEqHpf:3000})}}],['2 そのまま',{tm:{5:E()}}],['3 HPF 400Hz',{tm:{5:E({iEqHpf:400})}}]]),
  quiz:qz('粒が細かく立つのは?',3,'3が正解。低い成分を切ると粒が立つ。切りすぎた1は、薄く消えてしまう。')},
 {h:'通しで聞き比べる',b:'初期・アルペジオだけ・リードだけ・全部、の4つを聞き比べよう。少ない音でも、役割がはっきり聞こえるのはどれか。',tab:'mix',
  cmp:cm('xg11s5',[['1 初期',{tm:{3:E(),4:Object.assign(E(),V(.55)),5:E()}}],['2 アルペジオだけ',{tm:{3:E(),4:Object.assign(E({iEqHpf:150}),V(.3)),5:E()}}],['3 リードだけ',{tm:{3:E({iEqHpf:200}),4:Object.assign(E(),V(.55)),5:E()}}],['4 全部',{tm:{3:E({iEqHpf:200}),4:Object.assign(E({iEqHpf:150}),V(.3)),5:E({iEqHpf:400})}}]]),
  quiz:qz('役割がはっきりしているのは?',4,'4が正解。低域の席・主役・粒の3つを分けると、少ない音でも濁らない。')},
 {h:'小さい音源でも聞こえる',b:'整理できたら保存しよう。',tab:'mix',
  col:{h:'足りない音は、整理で補う',b:'音数が少ないと、1つの音が目立つ。だから切る場所と音量の差で、役割を決める。小さなスピーカーでも、リードとベースが聞き分けられるか確かめよう。'}}
]}),
/* ---------------- xg12 ---------------- */
base({id:'xg12',pre:['xg01','xg05','xg06'],terms:['xg_styleear','xg_pump','xg_lofi','xg_vocalfirst'],title:'同じ素材を3つの流儀で',sub:'聞き比べだけで、ジャンルの違いを耳で言う',ts:2,save:{name:'流儀を決めたミックス',kind:'kit'},
 tk:[KIK(V(.7)),BAS(V(.6)),CHD('コード',V(.5)),LED(V(.45)),HAT(V(.4)),VOX(V(.5))],steps:[
 {h:'素材は同じ',b:'曲は同じ。違うのは、音量・EQ・サイドチェイン・揺れ・声の置き方だけ。【ジャンルの聴き分け】は、その違いを耳で言えること。3つを聞き比べよう。',tab:'mix',
  cmp:cm('xg12s1',[['A',{tm:DAN()}],['B',{tm:POP()}],['C',{tm:LOFI()}]])},
 {h:'暗くて揺れているのは',b:'暗くこもり、ゆらゆら揺れて、全体が小さく狭い。【ローファイ設計】の特徴だ。どれか。',tab:'mix',
  cmp:cm('xg12s2',[['A',{tm:DAN()}],['B',{tm:POP()}],['C',{tm:LOFI()}]]),
  quiz:qz('ローファイ設計は?',3,'Cが正解。高域を落として暗くし、コードを揺らして、全体を小さくしている。')},
 {h:'脈動しているのは',b:'キックの鳴る瞬間に、ベースとコードが引いて戻る。【ポンプ】で、キックが前に出る。どれか。',tab:'mix',
  cmp:cm('xg12s3',[['A',{tm:LOFI()}],['B',{tm:DAN()}],['C',{tm:POP()}]]),
  quiz:qz('脈動しているのは?',2,'Bが正解。キックに合わせて伴奏が引くサイドチェインが効いている。')},
 {h:'声が主役なのは',b:'声が真ん中の一番手前で、伴奏が引いている。【声が主役】の整理だ。どれか。',tab:'mix',
  cmp:cm('xg12s4',[['A',{tm:POP()}],['B',{tm:LOFI()}],['C',{tm:DAN()}]]),
  quiz:qz('声が主役なのは?',1,'Aが正解。声のVOLが高く、コードとリードが小さい。')},
 {h:'ローファイに寄せる',b:'素材のまま、ローファイ側へ寄せよう。コード(T3)のLPFを3000〜6000Hz、ハット(T5)のVOLを20〜30%にする。暗くして、粒を小さくする。',tab:'mix',
  mx:[MX(3,'iEqLpf',3000,6000,'eq'),MX(5,'tVol',.2,.3)],
  cmp:cm('xg12s5',[['1 寄せた',{tm:{3:E({iEqLpf:4500}),5:Object.assign(E(),V(.25))}}],['2 そのまま',{tm:{3:E(),5:Object.assign(E(),V(.4))}}]]),
  quiz:qz('ローファイに近いのは?',1,'1が正解。高域を落とし、細かい音を小さくすると、暗く落ち着く。')},
 {h:'流儀を選んで保存',b:'好きな流儀を決めて保存しよう。',tab:'mix',
  col:{h:'流儀は引き算と足し算の選び方',b:'ダンスは勢いを足し、ローファイは明るさを引き、歌ものは伴奏を引く。どれが正しいかではなく、何を主役にするかの違い。3つの耳を、他の曲でも使おう。'}}
]})

 );
 [['xg_pump','xg12'],['xg_lofi','xg12'],['xg_vocalfirst','xg12']].forEach(function(p){T.forEach(function(t){if(t.id===p[0]&&t.see.indexOf(p[1])<0)t.see.push(p[1])})});
 SD.XM.H={E:E,CP:CP,NO:NO,KIK:KIK,SNR:SNR,HAT:HAT,HAT16:HAT16,BAS:BAS,SUB:SUB,CHD:CHD,LED:LED,VOX:VOX,V:V,MX:MX,qz:qz,z:z,withM:withM};/* xd.js(診断)が使う補助 */
})();
