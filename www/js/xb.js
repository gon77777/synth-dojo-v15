/* v11.24 MX-9 XB バス・低域・全体設計(xb01〜xb10 の全10本)。lv3・TRK+MIXタブ。xb01〜xb05=MX-8、xb06〜xb10=MX-9。
   マスターのFXの並びは固定(EQ→COMP→MB→WIDTH の順)。xb07 のステムは、アプリが書き出さないので聴き方の練習。
   バスは A=ドラム役・B=音楽役・C=声役(送りのDELAY/REVERBはバスを通らない)。LUFS は測れないので、PEAK で言う。
   聞き比べの cmp.g は未測定(GT は空)。xb02 の MAKEUP の聞き比べは「大きいと良く聞こえる」を体験させるため、わざと音量を揃えない。
   数値は目安(SD.GUIDE の {g:} か、つまみ値と同じ数字のみ)。年号・人名・機材名は書かない */
(function(){
 var T=SD.TERMS,A=function(id,name,kana,en,def,see,tags){T.push({id:id,name:name,kana:kana,en:en,def:def,see:see,tags:tags||['XB','MIX']})};
 A('xb_busplan','バスの設計図','ばすのせっけいず','bus plan','どの音をどのバスに束ねるかの計画。ドラム・音楽・主役のように、役割ごとに分けて軽く処理する。',['xb01']);
 A('xb_gainflow','音量の流れ','おんりょうのながれ','gain flow','シンセの音→トラックのVOL→バス→マスターの順に、前から音量を決めていくこと。',['xb02']);
 A('xb_kickbass','三つの手','みっつのて','kick-bass split','キックとベースの低域を分ける3つの方法。EQで帯域を分け、サイドチェインで時間を分け、戻りで拍を合わせる。',['xb03']);
 A('xb_harmonic','倍音を足す','ばいおんをたす','adding harmonics','低すぎて小さなスピーカーで聞こえない音に、1オクターブ上などの倍音を足して聞こえるようにすること。',['xb04']);
 A('xb_room','ヘッドルームの余白','へっどるーむのよはく','headroom margin','最大の山(PEAK)とあふれる所までの余白。余白があれば、あとの処理や書き出しで割れにくい。',['xb05']);
 A('xb_refsteps','リファレンスの手順','りふぁれんすのてじゅん','reference steps','お手本と比べる順番。音量を合わせ、帯域、広がり、密度の順に1つずつ比べる。',['xb06']);
 A('xb_stem','ステム','すてむ','stem','役割ごとにまとめた音の束。ドラム・音楽・主役などに分けると、1つずつ聴いて直せる。',['xb07']);
 A('xb_parbus','パラレルバス','ぱられるばす','parallel bus','同じ音を複製して強く潰し、原音に混ぜる並列処理。足りない密度と勢いを足す。',['xb08']);
 A('xb_masterchain','マスターチェーン','ますたーちぇーん','master chain','マスターの処理の並び。EQで色、COMPでまとめ、MBで偏り、WIDTHで広げる順。',['xb09']);
 A('xb_lowcut','ローカット表','ろーかっとひょう','low-cut table','トラックごとに、どこから下を切るかを決めた表。上に居場所のある音は低域を譲る。',['xb10']);
 [['bus',['xb01','xb07','xb08']],['busc',['xb01']],['balance',['xb01','xb06','xb10']],['gainst',['xb02']],['headroom',['xb02','xb05','xb06','xb09']],['makeup',['xb02']],['peak',['xb05','xb07']],['sidechain',['xb03']],['gr',['xb03']],['hpf',['xb03','xb04','xb10']],['sat',['xb04']],['refmix',['xb06']],['parallel',['xb08']],['subbass',['xb04']],['limiter',['xb05','xb09']]].forEach(function(p){T.forEach(function(t){if(t.id===p[0])p[1].forEach(function(s){if(t.see.indexOf(s)<0)t.see.push(s)})})});
 var P=SD.PATS,TK=P.tk;
 var GT={};
 var cm=function(key,items){return items.map(function(it,i){var o=Object.assign({l:it[0]},it[1]);var g=GT[key+(i+1)];if(g!==undefined)o.g=g;return o})};
 var z=function(a){var q={};a.forEach(function(i){q[i]=0});return q};
 var CPD={iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20};
 var CP=function(o){return Object.assign({},CPD,o||{})},NO=CP({iCpThr:0,iCpRatio:1});
 var BCP=function(o){return Object.assign({iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:2,iCpAtk:30,iCpRel:150,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20},o||{})},BOFF={iCpOn:0};
 var E=function(o){return Object.assign({iEqOn:1,iEqHpf:20,iEqLpf:20000,iEqLg:0,iEqB1g:0,iEqB2g:0,iEqHg:0},o||{})};
 var BASS={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:.3,noiseLvl:0,fType:'lowpass',cutoff:700,res:.1,envAmt:.3,drive:0,aA:.004,aD:.25,aS:.7,aR:.1};
 var PAD={o1Wave:'sawtooth',o1Lvl:.25,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:3000,res:.1,envAmt:0,drive:0,aA:.01,aD:.2,aS:.7,aR:.2};
 var LEADP={o1Wave:'sawtooth',o1Lvl:.3,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:5000,res:.1,envAmt:.2,drive:0,aA:.004,aD:.2,aS:.5,aR:.15};
 var SUBP={o1Wave:'sine',o1Lvl:.6,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:600,res:0,envAmt:0,drive:0,aA:.005,aD:.2,aS:.9,aR:.1};
 var HRMP={o1Wave:'sawtooth',o1Lvl:.3,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:1500,res:.1,envAmt:0,drive:0,aA:.005,aD:.2,aS:.8,aR:.1};
 var withM=function(t,cp,mix,eq,out){t.o.mx={eq:eq||{iEqOn:0},cp:cp||NO};if(mix)t.o.mix=mix;if(out)t.o.out=out;return t};
 var KIK=function(cp,mix,eq,out){return withM(TK('kick',P.fourFloor(),'キック'),cp,mix,eq,out)};
 var SNR=function(cp,mix,eq,out){return withM(TK('snare',{idx:z([4,12]),o:{}},'スネア'),cp,mix,eq,out)};
 var HAT=function(cp,mix,eq,out){return withM(TK('hat',{idx:z([2,6,10,14]),o:{}},'ハット',{acc:[2,6,10,14]}),cp,mix,eq,out)};
 var BAS=function(cp,mix,eq,out){return withM(TK('bass',P.bassPattern('eighth',0),'ベース',{scale:'minor',p:BASS,acc:[0,4,8,12]}),cp,mix,eq,out)};
 var SUB=function(cp,mix,eq,out){return withM(TK('bass',P.bassPattern('eighth',0),'サブ',{scale:'minor',p:SUBP,acc:[0,4,8,12]}),cp,mix,eq,out)};
 var HRM=function(cp,mix,eq,out){return withM(TK('bass',P.bassPattern('eighth',0),'倍音',{scale:'minor',tr:12,p:HRMP,acc:[0,4,8,12]}),cp,mix,eq,out)};
 var CHD=function(cp,mix,eq,out){var q={},t=[],i;for(i=0;i<16;i++)q[i]=0;for(i=0;i<16;i++)if(i!==0&&i!==8)t.push(i);return withM({id:'bass',idx:q,o:{name:'コード',scale:'minor',tr:12,tie:t,p:PAD}},cp,mix,eq,out)};
 var LED=function(cp,mix,eq,out){return withM({id:'bass',idx:z([0,3,6,10,12]),o:{name:'リード',scale:'minor',tr:24,p:LEADP}},cp,mix,eq,out)};
 var CPS=function(o){return SD.scMix({src:0,depth:.8,key:-14,extra:o})};
 var qz=function(q,ans,ex){return {q:q,ans:ans,ex:ex}};
 var MX=function(trk,k,lo,hi,ins){return {trk:trk,ins:ins||'mix',k:k,rng:[lo,hi]}};
 var base=function(o){return SD.XM.base(Object.assign({cat:'xb1',course:'XB'},o))};
 var V=function(v){return {tVol:v}};
 SD.LESSONS.push(
/* ---------------- xb01 ---------------- */
base({id:'xb01',pre:['mx12'],terms:['xb_busplan','bus','busc','balance'],title:'バスの設計図',sub:'ドラム・音楽・主役を束ねる',ts:2,save:{name:'バスを設計したミックス',kind:'kit'},
 tk:[KIK(NO,V(1),null,'A'),SNR(NO,V(1),null,'A'),HAT(NO,V(1),null,'A'),BAS(NO,V(1),null,'B'),CHD(NO,V(1),null,'B'),LED(NO,V(1),null,'C')],steps:[
 {h:'バスは役割の束',b:'【バスの設計図】は、どの音をどのバスに束ねるかの計画。ドラムはBUS A、ベースとコードはBUS B、リードはBUS C。バスなしと、軽く処理した3バスを聞き比べよう。',tab:'mix',
  cmp:cm('xb01s1',[['バスなし',{bm:{A:BOFF,B:BOFF,C:BOFF}}],['3バス・軽く',{bm:{A:BCP({iCpThr:-12,iCpRatio:2}),B:BCP({iCpThr:-18,iCpRatio:2}),C:BCP({iCpThr:-12,iCpRatio:2})}}]])},
 {h:'ドラムは1つの塊',b:'ドラム(T1〜T3)は、1つの塊として鳴らす。BUS AのCOMPは軽く。GRの始めは{g:dyn.grDrumBus}が目安。深いものと浅いものを聞き比べて、頭がつぶれているほうを選ぼう。',tab:'mix',
  cmp:cm('xb01s2',[['1',{bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5}),B:BOFF,C:BOFF}}],['2',{bm:{A:BCP({iCpThr:-12,iCpRatio:2}),B:BOFF,C:BOFF}}]]),
  quiz:qz('ドラムの頭がつぶれているのは?',1,'1が正解。THRESHが低くRATIOも高いので、ドラム全体が強く押さえられ、頭が失われる。')},
 {h:'音楽バスで濁りを引く',b:'ベースとコード(T4・T5)はBUS B。まとめてEQで、濁りを少し引ける。BELL1を350Hz付近で-2dBにして、なしと聞き比べよう。引きすぎないのがコツ。',tab:'mix',
  cmp:cm('xb01s3',[['BUS B のEQなし',{bm:{A:BOFF,B:Object.assign({iEqOn:0},BOFF),C:BOFF}}],['BUS B のEQあり',{bm:{A:BOFF,B:Object.assign(E({iEqB1f:350,iEqB1g:-2}),BOFF),C:BOFF}}]])},
 {h:'主役は別のバス',b:'リード(T6)は主役なので、BUS Cに分ける。ここだけ動かせば、主役の扱いが変わる。BUS Cのコンプを、なし・軽く・深くで聞き比べて、つぶれすぎを選ぼう。',tab:'mix',
  cmp:cm('xb01s4',[['1 なし',{bm:{A:BOFF,B:BOFF,C:BOFF}}],['2 軽く',{bm:{A:BOFF,B:BOFF,C:BCP({iCpThr:-12,iCpRatio:2})}}],['3 深く',{bm:{A:BOFF,B:BOFF,C:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5})}}]]),
  quiz:qz('主役が平らにつぶれているのは?',3,'3が正解。深く圧縮すると、強弱が失われる。主役ほど、軽く扱う。')},
 {h:'バスの中の釣り合い',b:'バスの中の釣り合いは、トラックのVOLで取る。T2(スネア)を50〜80%、T3(ハット)を25〜50%にして、ドラムの主役のキックを残そう。',tab:'mix',
  mx:[MX(2,'tVol',.5,.8),MX(3,'tVol',.25,.5)]},
 {h:'余白を確かめる',b:'バスで整えると、全体の音量が変わる。最後に、MASTERのPEAKを-9〜-3dBに収めて、余白があるか確かめよう。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}],
  col:{h:'バスは「束ねる」道具',b:'バスは足すほど良くなる道具ではない。役割ごとに束ね、軽く整え、まとまりが足りないときだけ使う。迷ったら、バスのON/OFFを切り替えて確かめよう。'}}
]}),
/* ---------------- xb02 ---------------- */
base({id:'xb02',pre:['mx02'],terms:['xb_gainflow','gainst','headroom','makeup'],title:'ゲイン構造の設計',sub:'入口→トラック→バス→マスターの音量の流れ',ts:2,save:{name:'音量の流れを整えたミックス',kind:'kit'},
 tk:[KIK(NO,V(1),null,'A'),BAS(NO,V(1)),CHD(NO,V(1)),LED(NO,V(1))],steps:[
 {h:'音量は前から決める',b:'【音量の流れ】は、シンセの音→トラックのVOL→バス→マスターの順に決める。全部100%のときと、役割で配分したときを聞き比べよう。',tab:'mix',
  cmp:cm('xb02s1',[['全部100%',{tm:{1:V(1),2:V(1),3:V(1),4:V(1)}}],['配分した',{tm:{1:V(1),2:V(.7),3:V(.45),4:V(.6)}}]])},
 {h:'主役を決めて、ほかを下げる',b:'いちばん大きくしたいのはキック。T1は100%のまま、ほかを下げる。T2(ベース)を50〜80%、T3(コード)を30〜60%、T4(リード)を40〜70%にしよう。',tab:'mix',
  mx:[MX(2,'tVol',.5,.8),MX(3,'tVol',.3,.6),MX(4,'tVol',.4,.7)]},
 {h:'マスターのPEAKで確かめる',b:'MASTERのPEAKを-9〜-3dBに収めよう。あふれるなら、マスターでなく、前のトラックを下げる。後ろで直すと、前の歪みは残る。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}]},
 {h:'バスの持ち上げに注意',b:'バスのMAKEUPで音を持ち上げると、大きいだけで良くなったと感じやすい。BUS AのMAKEUPを0dBと6dBにして聞き比べ、大きいほうを選ぼう。',tab:'mix',
  cmp:cm('xb02s4',[['1 MAKEUP 0dB',{bm:{A:BCP({iCpThr:-24,iCpRatio:2,iCpMake:0})}}],['2 MAKEUP 6dB',{bm:{A:BCP({iCpThr:-24,iCpRatio:2,iCpMake:6})}}]]),
  quiz:qz('大きく聞こえるのは?',2,'2が正解。MAKEUPが大きいほど、出力が持ち上がる。大きい音は良く聞こえるので、比べるときは音量を合わせる。')},
 {h:'流れを決めて保存',b:'前から順に決めれば、あとで迷わない。トラックで配分し、バスで軽くまとめ、マスターのPEAKに余白を残す。決めたら保存しよう。',tab:'mix',
  col:{h:'あふれたら、前に戻る',b:'割れたり、PEAKがあふれたら、まず入口とトラックのVOLを疑う。マスターで下げれば見かけは収まるが、原因は前に残る。流れの前から直そう。'}}
]}),
/* ---------------- xb03 ---------------- */
base({id:'xb03',pre:['fq02','fq03','cm12'],terms:['xb_kickbass','sidechain','hpf','gr'],title:'キックとベースの住み分け',sub:'EQ・サイドチェイン・戻りの三つの手',ts:2,save:{name:'キックとベースを分けたミックス',kind:'kit'},
 tk:[KIK(NO,V(1),E()),BAS(CPS({iCpThr:0,iCpRatio:1,iCpRel:600}),V(1),E())],steps:[
 {h:'低域の取り合い',b:'キックとベースは、どちらも低い。重なると、にごって力が出ない。【三つの手】は、EQで帯域を分ける・サイドチェインで時間を分ける・戻りを拍に合わせる。まず、何もしない音と、三つ使った音を聞き比べよう。',tab:'mix',
  cmp:cm('xb03s1',[['何もしない',{tm:{1:E(),2:Object.assign(E(),CPS({iCpThr:0,iCpRatio:1,iCpRel:600}))}}],['三つの手',{tm:{1:E({iEqLg:3}),2:Object.assign(E({iEqLg:-3}),CPS({iCpThr:-46,iCpRatio:8,iCpRel:150}))}}]])},
 {h:'手1: EQで帯域を分ける',b:'キック(T1)のLOW GAINを2〜5dB上げ、ベース(T2)を-5〜-2dB下げよう。キックは重さ、ベースは音程が聞こえる所を担当する。',tab:'mix',
  mx:[MX(1,'iEqLg',2,5,'eq'),MX(2,'iEqLg',-5,-2,'eq')]},
 {h:'手2: サイドチェインで時間を分ける',b:'キックが鳴る瞬間だけ、ベースを引く。T2のTHRESHを-52〜-40dB、RATIOを6〜12にしよう。キックが出る間、ベースが道をあける。',tab:'mix',
  mx:[MX(2,'iCpThr',-52,-40,'cp'),MX(2,'iCpRatio',6,12,'cp')],
  cmp:cm('xb03s3',[['なし',{tm:{2:Object.assign(E(),CPS({iCpThr:0,iCpRatio:1,iCpRel:600}))}}],['あり',{tm:{2:Object.assign(E(),CPS({iCpThr:-46,iCpRatio:8,iCpRel:150}))}}]])},
 {h:'手3: 戻りを拍に合わせる',b:'ベースが戻るまでの時間は、RELEASEで決まる。T2のRELEASEを80〜200msにしよう。長すぎると、次のキックまで戻らず、ベースが痩せる。',tab:'mix',
  mx:[MX(2,'iCpRel',80,200,'cp')],
  cmp:cm('xb03s4',[['RELEASE 600ms',{tm:{2:Object.assign(E(),CPS({iCpThr:-46,iCpRatio:8,iCpRel:600}))}}],['RELEASE 150ms',{tm:{2:Object.assign(E(),CPS({iCpThr:-46,iCpRatio:8,iCpRel:150}))}}]]),
  quiz:qz('ベースが痩せたままなのは?',1,'1が正解。戻りが長く、次のキックまで戻りきらない。短くすると、キックの間にベースが戻る。')},
 {h:'どれがきいている?',b:'何もなし・EQだけ・サイドチェインだけ・三つ、の4つを聞き比べよう。低域がいちばん整理されているのはどれか。',tab:'mix',
  cmp:cm('xb03s5',[['1 なし',{tm:{1:E(),2:Object.assign(E(),CPS({iCpThr:0,iCpRatio:1,iCpRel:600}))}}],['2 EQだけ',{tm:{1:E({iEqLg:3}),2:Object.assign(E({iEqLg:-3}),CPS({iCpThr:0,iCpRatio:1,iCpRel:600}))}}],['3 SCだけ',{tm:{1:E(),2:Object.assign(E(),CPS({iCpThr:-46,iCpRatio:8,iCpRel:150}))}}],['4 三つ',{tm:{1:E({iEqLg:3}),2:Object.assign(E({iEqLg:-3}),CPS({iCpThr:-46,iCpRatio:8,iCpRel:150}))}}]]),
  quiz:qz('低域がいちばん整理されているのは?',4,'4が正解。帯域・時間・戻りの三つがそろうと、キックとベースがぶつからない。')},
 {h:'三つを少しずつ',b:'1つで強く直すより、三つを少しずつ。決めたら保存して、次の曲の出発点にしよう。',tab:'mix',
  col:{h:'足りないときは、順番に',b:'低域が整理できないときは、EQ、サイドチェイン、戻りの順に確かめる。1つずつON/OFFして、どの手がきいているかを耳で見つけよう。'}}
]}),
/* ---------------- xb04 ---------------- */
base({id:'xb04',pre:['ef04','fq03'],terms:['xb_harmonic','subbass','sat','hpf'],title:'サブベースと小さいスピーカー',sub:'倍音を足して聞こえるようにする',ts:2,save:{name:'サブに倍音を足したミックス',kind:'kit'},
 tk:[KIK(NO,V(1)),SUB(NO,V(1),E()),HRM(NO,V(.8),E()),CHD(NO,V(.5))],steps:[
 {h:'低すぎる音は聞こえない',b:'サブベースのような低い音は、小さなスピーカーでは再生されにくい。【倍音を足す】と、基音が出なくても音程が聞こえる。サブだけと、倍音を足した音を聞き比べよう。',tab:'mix',
  cmp:cm('xb04s1',[['サブだけ',{tm:{3:V(0)}}],['サブ+倍音',{tm:{3:V(.4)}}]])},
 {h:'手1: SATで倍音を作る',b:'サブ(T2)にSATをONにして、DRIVEを40〜70%にしよう。波がゆがむと、1オクターブ上などの倍音ができる。SATなしと、ありを聞き比べよう。',tab:'mix',
  mx:[MX(2,'iSaDrive',.4,.7,'sa')],
  cmp:cm('xb04s2',[['SATなし',{tm:{2:{iSaOn:0}}}],['SATあり',{tm:{2:{iSaOn:1,iSaType:0,iSaDrive:.55,iSaTone:20000,iSaMix:1,iSaOut:0}}}]]),
  quiz:qz('倍音が増えているのは?',2,'2が正解。SATで波が変形すると、基音の上に倍音が足される。')},
 {h:'手2: 倍音のトラックを足す',b:'もう1つの方法は、1オクターブ上のトラック(T3)を足すこと。T3のVOLを20〜50%にしよう。上げすぎると、サブよりそちらが主役になる。',tab:'mix',
  mx:[MX(3,'tVol',.2,.5)],
  cmp:cm('xb04s3',[['VOL 80%',{tm:{3:V(.8)}}],['VOL 35%',{tm:{3:V(.35)}}]]),
  quiz:qz('サブが主役のままなのは?',2,'2が正解。倍音は添える程度。上げすぎると、低域の重さが失われる。')},
 {h:'倍音は低域から離す',b:'倍音のトラックに低い成分が残ると、サブと重なってにごる。T3のHPFを100〜200Hzにしよう。サブは土台、倍音は輪郭、と帯域を分ける。',tab:'mix',
  mx:[MX(3,'iEqHpf',100,200,'eq')],
  cmp:cm('xb04s4',[['HPFなし',{tm:{3:E({iEqHpf:20})}}],['HPF 150Hz',{tm:{3:E({iEqHpf:150})}}]])},
 {h:'小さいスピーカーで確かめる',b:'MIXタブのMONで、小スピーカー風をONにして聴こう。サブだけの音と、倍音を足した音で、ベースの音程が聞こえるかを比べる。確かめたら、元に戻す。',tab:'mix',
  cmp:cm('xb04s5',[['サブだけ',{tm:{3:V(0),2:{iSaOn:0}}}],['倍音あり',{tm:{3:V(.35),2:{iSaOn:1,iSaType:0,iSaDrive:.55,iSaTone:20000,iSaMix:1,iSaOut:0}}}]]),
  quiz:qz('小スピーカー風で音程が分かりやすいのは?',2,'2が正解。倍音が高い所にあるので、小さなスピーカーでも再生される。')},
 {h:'重さと聞こえの両立',b:'サブで重さ、倍音で聞こえ。この二層があれば、大きなスピーカーでも、小さなスピーカーでも、ベースが伝わる。決めたら保存しよう。',tab:'mix',
  col:{h:'低音は、2つの場所で鳴らす',b:'基音は土台、倍音は輪郭。どちらかだけだと、重いのに聞こえない、または、聞こえるのに軽い、になる。小さなスピーカーでの確認を、習慣にしよう。'}}
]}),
/* ---------------- xb05 ---------------- */
base({id:'xb05',pre:['ms03'],terms:['xb_room','headroom','peak','limiter'],title:'ヘッドルームの決め方',sub:'余白と最終音量。数値は目安',ts:2,save:{name:'余白を決めたミックス',kind:'kit'},
 tk:[KIK(NO,V(1)),BAS(NO,V(1)),CHD(NO,V(1)),LED(NO,V(1)),HAT(NO,V(1))],steps:[
 {h:'余白とは',b:'【ヘッドルームの余白】は、いちばん大きい山(PEAK)から、あふれる所までの余り。全部100%の音と、配分した音を聞き比べよう。余白が無いと、あとで手が出せない。',tab:'mix',
  cmp:cm('xb05s1',[['全部100%',{tm:{1:V(1),2:V(1),3:V(1),4:V(1),5:V(1)}}],['配分した',{tm:{1:V(1),2:V(.7),3:V(.45),4:V(.6),5:V(.4)}}]])},
 {h:'PEAKで余白を作る',b:'MASTERのPEAKを-9〜-3dBに収めよう。0dBに近いと、あとの処理でも書き出しでも、割れやすい。T2〜T5のVOLを下げて合わせる。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}]},
 {h:'余白を使って整える',b:'余白があれば、マスターのCOMPで少しだけ持ち上げられる。FXタブのCOMPをONにして、MAKEUPを2dB前後にしよう。持ち上げるのは余白の範囲で。',tab:'fx',
  f:[['cpOn',1],['cpMake',2]],tol:.1,
  cmp:cm('xb05s3',[['COMPなし',{s:{cpOn:0}}],['COMP・MAKEUP 2dB',{s:{cpOn:1,cpThr:-18,cpRatio:2,cpMake:2}}]])},
 {h:'比べるときは音量を合わせる',b:'MAKEUPを上げた音は、大きいので良く聞こえる。0dBと6dBを聞き比べ、大きいほうを選ぼう。本当に良いかは、音量を合わせて確かめる。',tab:'fx',
  cmp:cm('xb05s4',[['1 MAKEUP 0dB',{s:{cpOn:1,cpThr:-18,cpRatio:2,cpMake:0}}],['2 MAKEUP 6dB',{s:{cpOn:1,cpThr:-18,cpRatio:2,cpMake:6}}]]),
  quiz:qz('大きく聞こえるのは?',2,'2が正解。MAKEUPが大きいほど音が持ち上がる。大きさと良さは別なので、音量を合わせて比べる。')},
 {h:'最後にもう一度PEAK',b:'持ち上げたあとも、MASTERのPEAKが-9〜-3dBにあるかを確かめる。あふれていたら、MAKEUPを戻すか、前のトラックを下げよう。決めたら保存しよう。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}],
  col:{h:'数値は目安・耳で最後に',b:'-9〜-3dBは目安。曲や再生環境で変わる。このアプリでは、PEAKとRMSの目盛りで見る。最後は、音量を合わせて聞き比べ、割れていないかを耳で確かめよう。'}}
]}),
/* ---------------- xb06 ---------------- */
base({id:'xb06',pre:['mx13'],terms:['xb_refsteps','refmix','balance','headroom'],title:'リファレンスの手順',sub:'音量を合わせ→帯域→広がり→密度の順に比べる',ts:2,save:{name:'お手本に近づけたミックス',kind:'kit'},
 init:{rvbMix:.2,rvbType:3,rvbSize:1.8,rvbPre:30,rvbDamp:.5,dlyMix:0,swOn:0,cpOn:0},
 tk:[KIK(NO,V(1)),BAS(NO,V(1)),CHD(NO,V(1)),LED(NO,V(1)),HAT(NO,V(1))],steps:[
 {h:'比べる順番がある',b:'【リファレンスの手順】は、お手本と比べる順番のこと。①音量を合わせる ②帯域 ③広がり ④密度。順番を守ると、何が違うのかを切り分けられる。まず、荒い状態と配分後を聞き比べよう。',tab:'mix',
  cmp:cm('xb06s1',[['荒い状態',{tm:{1:V(1),2:V(1),3:V(1),4:V(1),5:V(1)}}],['配分後',{tm:{1:V(.9),2:V(.7),3:V(.45),4:V(.6),5:V(.4)}}]])},
 {h:'①音量を合わせる',b:'大きい音は良く聞こえる。だから、最初に音量を合わせる。T2〜T5のVOLを下げ、MASTERのPEAKを-9〜-3dBに収めよう。音量計の値は目安なので、PEAKと耳で合わせる。',tab:'mix',
  mx:[MX(2,'tVol',.5,.8),MX(3,'tVol',.3,.6),MX(4,'tVol',.4,.7),MX(5,'tVol',.25,.5)],mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}]},
 {h:'②帯域を比べる',b:'音量が合ったら、明るさと重さを比べる。お手本より暗いか、明るいか。マスターEQのHIGHを-3dBと+1.5dBにして、暗いほうを選ぼう。',tab:'fx',
  cmp:cm('xb06s3',[['1',{s:{eqOn:1,eqHi:-3}}],['2',{s:{eqOn:1,eqHi:1.5}}]]),
  quiz:qz('暗く聞こえるのは?',1,'1が正解。HIGHを下げると、高域が減り、こもって暗く聞こえる。')},
 {h:'③広がりを比べる',b:'次は左右の広さ。WIDTHを50%と140%にして、狭いほうを選ぼう。お手本より狭いなら、広げる音を選び直す(xs05)。広げる前に、モノでも確かめる。',tab:'fx',
  cmp:cm('xb06s4',[['1',{s:{swOn:1,swWidth:1.4}}],['2',{s:{swOn:1,swWidth:.5}}]]),
  quiz:qz('狭く聞こえるのは?',2,'2が正解。WIDTHを下げると、左右の差が減り、中央に寄って狭くなる。')},
 {h:'④密度を比べる',b:'最後は密度。マスターのCOMPがなしと、軽くありを聞き比べよう。お手本より隙間が多いなら、バスで軽くまとめる。強く掛けると、勢いが失われる。',tab:'fx',
  cmp:cm('xb06s5',[['COMPなし',{s:{cpOn:0}}],['軽く',{s:{cpOn:1,cpThr:-18,cpRatio:2,cpAtk:30,cpRel:200,cpMake:0}}]])},
 {h:'1つずつ直す',b:'違いが見つかったら、1つずつ直す。音量→帯域→広がり→密度の順。決めたら保存しよう。',tab:'mix',
  col:{h:'お手本に「なる」のでなく、近づく',b:'お手本は、目標ではなく、ものさし。同じ曲でなければ、同じ音にはならない。差が大きい所を1つだけ見つけ、1つだけ直す。それを繰り返そう。'}}
]}),
/* ---------------- xb07 ---------------- */
base({id:'xb07',pre:['ms07'],terms:['xb_stem','bus','peak'],title:'ステムで考える',sub:'役割ごとに分けて聴く・整える',ts:2,save:{name:'ステムで整えたミックス',kind:'kit'},
 tk:[KIK(NO,V(1),null,'A'),SNR(NO,V(1),null,'A'),BAS(NO,V(1),null,'B'),CHD(NO,V(1),null,'B'),LED(NO,V(1),null,'C')],steps:[
 {h:'【ステム】とは',b:'【ステム】は、役割ごとにまとめた音の束。ここでは、ドラム(BUS A)・音楽(BUS B)・主役(BUS C)の3つ。全体と、ドラムだけを聞き比べよう。',tab:'mix',
  cmp:cm('xb07s1',[['全体',{tm:{}}],['ドラムだけ',{mt:[2,3,4]}]])},
 {h:'1つずつ聴く',b:'ステムを1つずつ単独で聴くと、足りない所や、ぶつかる所が見える。ドラムだけ・音楽だけ・主役だけを聞き比べ、低い音が入っているのはどれかを選ぼう。',tab:'mix',
  cmp:cm('xb07s2',[['1 ドラムだけ',{mt:[2,3,4]}],['2 音楽だけ',{mt:[0,1,4]}],['3 主役だけ',{mt:[0,1,2,3]}]]),
  quiz:qz('低い音が入っているのは?',2,'2が正解。ベースは音楽のステムに入っている。主役のリードは、高い音が中心。')},
 {h:'ステムの中の釣り合い',b:'ステムの中の釣り合いは、トラックのVOLで取る。T2(スネア)を50〜80%、T4(コード)を30〜60%にして、キックとベースを主役に残そう。',tab:'mix',
  mx:[MX(2,'tVol',.5,.8),MX(4,'tVol',.3,.6)]},
 {h:'足し合わせて確かめる',b:'ステムを足し合わせた全体で、MASTERのPEAKを-9〜-3dBに収めよう。どのステムも単独で成立し、足しても余白が残る状態が目標。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}]},
 {h:'書き出しはアプリの外',b:'このアプリはWAVの書き出しをしない。ステムで分けて書き出すのは、外のDAWでの話。ここでの経験は、ステムの分け方を決める練習として持ち出そう。',tab:'mix',
  col:{h:'分けておくと、あとで直せる',b:'ステムに分けておくと、全体を作り直さなくても、1つだけ直せる。分けすぎると管理が大変なので、役割の違う3〜4つ程度から始めよう。'}}
]}),
/* ---------------- xb08 ---------------- */
base({id:'xb08',pre:['cx02'],terms:['xb_parbus','parallel','bus'],title:'パラレルバスで太くする',sub:'ドラムの並列処理の組み方',ts:2,save:{name:'パラレルでドラムを太くしたミックス',kind:'kit'},
 tk:[KIK(NO,V(1)),SNR(NO,V(1)),withM(TK('kick',P.fourFloor(),'キック(並列)'),NO,V(.8),null,'A'),withM(TK('snare',{idx:z([4,12]),o:{}},'スネア(並列)'),NO,V(.8),null,'A')],steps:[
 {h:'原音と並列を混ぜる',b:'【パラレルバス】は、同じドラムを2つ用意して、片方を強く潰し、原音に混ぜる方法。T1・T2が原音、T3・T4が並列(BUS A)。原音だけと、並列を足した音を聞き比べよう。',tab:'mix',
  cmp:cm('xb08s1',[['原音だけ',{tm:{3:V(0),4:V(0)},bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5,iCpRel:100})}}],['並列あり',{tm:{3:V(.4),4:V(.4)},bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5,iCpRel:100})}}]])},
 {h:'並列の側は強く潰す',b:'並列の側(BUS A)は、強く潰すのが役目。浅いものと深いものを聞き比べて、並列として深く潰れているものを選ぼう。原音は、そのまま残る。',tab:'mix',
  cmp:cm('xb08s2',[['1 浅い',{bm:{A:BCP({iCpThr:-12,iCpRatio:2})}}],['2 深い',{bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5,iCpRel:100})}}]]),
  quiz:qz('並列の役目に合っているのは?',2,'2が正解。深く潰して、密度と勢いを足す。原音と混ぜるので、潰れた感じは薄まる。')},
 {h:'混ぜる量を決める',b:'T3・T4のVOLが、混ぜる量。20〜50%から始めよう。多すぎると、潰れた音が主役になり、頭の鋭さが失われる。0・35・100%を聞き比べて、多すぎるものを選ぼう。',tab:'mix',
  mx:[MX(3,'tVol',.2,.5),MX(4,'tVol',.2,.5)],
  cmp:cm('xb08s3',[['1 0%',{tm:{3:V(0),4:V(0)}}],['2 35%',{tm:{3:V(.35),4:V(.35)}}],['3 100%',{tm:{3:V(1),4:V(1)}}]]),
  quiz:qz('並列が多すぎるのは?',3,'3が正解。潰れた音が主役になり、頭の立ち上がりや強弱が失われる。')},
 {h:'原音を主役に残す',b:'並列は、原音を助ける役。原音が主役のときと、並列が主役のときを聞き比べよう。混ぜる量で、太さと勢いの釣り合いが決まる。',tab:'mix',
  cmp:cm('xb08s4',[['原音が主役',{tm:{1:V(1),2:V(1),3:V(.3),4:V(.3)}}],['並列が主役',{tm:{1:V(.4),2:V(.4),3:V(1),4:V(1)}}]])},
 {h:'並列の組み方',b:'手順は、同じ音を複製→複製を強く潰す→少しずつ混ぜる。決めたら保存しよう。低い成分は、潰すと痩せやすいので、聞いて確かめる。',tab:'mix',
  col:{h:'足りないものだけ足す',b:'並列は、足りないものがあるときだけ使う。原音で十分太ければ不要。少しずつ混ぜ、ON/OFFを切り替えて、良くなっているかを確かめよう。'}}
]}),
/* ---------------- xb09 ---------------- */
base({id:'xb09',pre:['ms01','ms02','ms03'],terms:['xb_masterchain','limiter','headroom'],title:'マスターバスの組み方',sub:'EQ→COMP→MB→WIDTHの順番と理由',ts:2,save:{name:'マスターを組んだミックス',kind:'kit'},
 init:{rvbMix:.2,rvbType:3,rvbSize:1.8,rvbPre:30,rvbDamp:.5,dlyMix:0,swOn:0,cpOn:0,eqOn:0,mbOn:0},
 tk:[KIK(NO,V(.9)),BAS(NO,V(.7)),CHD(NO,V(.45),null),LED(NO,V(.5)),HAT(NO,V(.4))],steps:[
 {h:'【マスターチェーン】',b:'マスターのFXは、並びが決まっている。EQ→COMP→MB→WIDTHの順に音が流れる。まず、何も掛けない音と、四つを軽く掛けた音を聞き比べよう。',tab:'fx',
  cmp:cm('xb09s1',[['なし',{s:{eqOn:0,cpOn:0,mbOn:0,swOn:0}}],['四つ・軽く',{s:{eqOn:1,eqHi:1.5,cpOn:1,cpThr:-18,cpRatio:2,cpMake:2,mbOn:1,swOn:1,swWidth:1.2}}]])},
 {h:'EQ: 色を決める',b:'最初のEQは、全体の色を決める。HIGHを1.5dB、LOWを1dBだけ動かそう。あとのCOMPは、このEQで整った音を聞いて動く。',tab:'fx',
  f:[['eqOn',1],['eqHi',1.5],['eqLo',1]],tol:.1},
 {h:'COMP: まとめる',b:'COMPは、色の決まった音を、軽くまとめる。THRESHを-18dB、RATIOを2、MAKEUPを2dBにしよう。GRの始めの目安は{g:dyn.grMaster}。',tab:'fx',
  f:[['cpOn',1],['cpThr',-18],['cpRatio',2],['cpMake',2]],tol:.1},
 {h:'MB: 帯域のバランス',b:'MBは、帯域ごとの強弱を、ならす道具。これはCOMPのあとなので、全体の締まったあとの偏りを直す。ONにして、なしと聞き比べよう。',tab:'fx',
  f:[['mbOn',1]],
  cmp:cm('xb09s4',[['MBなし',{s:{eqOn:1,eqHi:1.5,cpOn:1,cpThr:-18,cpRatio:2,cpMake:2,mbOn:0}}],['MBあり',{s:{eqOn:1,eqHi:1.5,cpOn:1,cpThr:-18,cpRatio:2,cpMake:2,mbOn:1}}]])},
 {h:'WIDTH: 最後に広げる',b:'WIDTHは最後。圧縮が終わってから広げると、広がりが圧縮に押さえられない。WIDTH AMTを120%にしよう。広げた分は、モノでも確かめる。',tab:'fx',
  f:[['swOn',1],['swWidth',1.2]],tol:.1,
  cmp:cm('xb09s5',[['WIDTH 100%',{s:{eqOn:1,eqHi:1.5,cpOn:1,cpThr:-18,cpRatio:2,cpMake:2,swOn:1,swWidth:1}}],['WIDTH 120%',{s:{eqOn:1,eqHi:1.5,cpOn:1,cpThr:-18,cpRatio:2,cpMake:2,swOn:1,swWidth:1.2}}]])},
 {h:'順番と理由',b:'EQで色→COMPでまとめ→MBで偏り→WIDTHで広げる。前の処理が、後ろの処理が聞く音を決める。この順で軽く重ねて、決めたら保存しよう。',tab:'fx',
  col:{h:'全部ONにしなくていい',b:'四つ全部が要るとは限らない。足りないものだけONにする。迷ったら、1つずつOFFにして、なくても困らないものは外そう。軽く、少なく、が基本。'}}
]}),
/* ---------------- xb10 ---------------- */
base({id:'xb10',pre:['fq09','xb03'],terms:['xb_lowcut','hpf','balance'],title:'低域の総合演習',sub:'全トラックのローカット表を作って確かめる',ts:2,save:{name:'ローカットを決めたミックス',kind:'kit'},
 tk:[KIK(NO,V(.9),E()),SNR(NO,V(.8),E()),BAS(NO,V(.7),E()),CHD(NO,V(.45),E()),LED(NO,V(.5),E()),HAT(NO,V(.4),E())],steps:[
 {h:'全員、20Hzのまま',b:'【ローカット表】は、トラックごとに、どこから下を切るかを決めた表。いまは全員が20Hz。聞こえない低い成分が、全員に残っている。表どおりに切った音と聞き比べよう。',tab:'mix',
  cmp:cm('xb10s1',[['全員 20Hz',{tm:{1:E(),2:E(),3:E(),4:E(),5:E(),6:E()}}],['表どおり',{tm:{1:E({iEqHpf:30}),2:E({iEqHpf:100}),3:E({iEqHpf:30}),4:E({iEqHpf:150}),5:E({iEqHpf:200}),6:E({iEqHpf:400})}}]])},
 {h:'土台は、ほとんど切らない',b:'キック(T1)とベース(T3)は、土台。HPFは{g:kick.hpf}と{g:bass.hpf}程度の、聞こえない帯域だけを切る。切りすぎると、重さが失われる。',tab:'mix',
  mx:[MX(1,'iEqHpf',25,35,'eq'),MX(3,'iEqHpf',25,35,'eq')]},
 {h:'コードとリード',b:'コード(T4)は{g:pad.hpf}、リード(T5)は{g:lead.hpf}を目安に切る。上に居場所のある音は、低域を譲る。譲った分、ベースが見えやすくなる。',tab:'mix',
  mx:[MX(4,'iEqHpf',100,200,'eq'),MX(5,'iEqHpf',150,250,'eq')]},
 {h:'スネアとハット',b:'スネア(T2)は{g:snare.hpf}、ハット(T6)は{g:hat.hpf}を目安に切る。ハットは高い音なので、大きく切っても、キャラが残る。',tab:'mix',
  mx:[MX(2,'iEqHpf',90,110,'eq'),MX(6,'iEqHpf',300,500,'eq')]},
 {h:'低域に残る音を聴く',b:'表どおりに切ったら、低域が、キックとベースだけになっているかを確かめる。全員20Hzのときと、表どおりのときで、キックとベースだけを残して聞き比べよう。',tab:'mix',
  cmp:cm('xb10s5',[['1 全員20Hz',{tm:{1:E({iEqHpf:20}),2:E({iEqHpf:20}),3:E({iEqHpf:20}),4:E({iEqHpf:20}),5:E({iEqHpf:20}),6:E({iEqHpf:20})}}],['2 表どおり',{tm:{1:E({iEqHpf:30}),2:E({iEqHpf:100}),3:E({iEqHpf:30}),4:E({iEqHpf:150}),5:E({iEqHpf:200}),6:E({iEqHpf:400})}}]]),
  quiz:qz('低域がすっきりしているのは?',2,'2が正解。上の音が低域を譲ると、キックとベースの居場所が空き、にごりが減る。')},
 {h:'表を作って保存',b:'T1とT3は低く、T2とT4は中、T5とT6は高め、の順で表ができた。切りすぎたら戻す。決めたら保存して、次の曲の出発点にしよう。',tab:'mix',
  col:{h:'表は、出発点',b:'ローカット表は、あくまで出発点。曲によって、居場所は変わる。表で始めて、ON/OFFで比べ、痩せたら緩める。サブを足すとき(xb04)は、キックとの住み分け(xb03)も確かめよう。'}}
]})

 );
})();
