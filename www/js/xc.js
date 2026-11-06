/* v11.20 MX-5 XC 上級ダイナミクス(xc01〜xc10 完成)。lv3・TRK+MIXタブ。xc01〜xc05=MX-4、xc06〜xc10=MX-5。
   聞き比べの cmp.g は tools/xc-cal.js(オフライン描画。COMP・2段目・キーも通す test/cmest.js)が出す。test/xc.js が差1dB以内・目標が達成できること・本文の主張が音に出ることを検査する。
   数値は目安(SD.GUIDE の {g:} か、つまみ値と同じ数字のみ)。年号・人名・機材名は書かない */
(function(){
 var T=SD.TERMS,A=function(id,name,kana,en,def,see,tags){T.push({id:id,name:name,kana:kana,en:en,def:def,see:see,tags:tags||['XC','COMP']})};
 A('xc_grtarget','目標GR','もくひょうじーあーる','target gain reduction','何dB減らすかの狙い。GRメーターで確かめ、THRESHとRATIOで量を決める。同じ値でも曲で聞こえ方は変わる。',['xc01']);
 A('xc_relbeat','リリースの拍合わせ','りりーすのはくあわせ','release timing','RELEASEを拍の長さと比べて決めること。次の音の前に戻りきるか、持ち越すかを選べる。',['xc02']);
 A('xc_twostage','2段コンプ','にだんこんぷ','two-stage compression','軽いコンプを2つ直列に入れる使い方。1段で強くかけるより自然になりやすく、役割も分けられる。',['xc03']);
 A('xc_parmix','混ぜる量','まぜるりょう','parallel mix amount','パラレルコンプで、圧縮した音を原音に足す割合(MIX)。少ないほど勢いが残り、多いほど密度が増す。',['xc04']);
 A('xc_schpf','SC HPF','えすしーえいちぴーえふ','sidechain high-pass','判定に使う音の低域を削るつまみ。上げると低い音に反応しにくくなり、へこみが浅くなる。',['xc05']);
 A('xc_atkdesign','アタックの設計','あたっくのせっけい','attack design','頭を通して立てるか、抑えて余韻を持ち上げるかを決めること。ATTACKとRELEASE、MAKEUPで作る。',['xc06']);
 A('xc_peakcatch','ピーク止め','ぴーくどめ','peak catching','コンプで中身を整え、リミッター風の2段目で大きい山だけを止める分担。下げすぎると平らになる。',['xc07']);
 A('xc_ordereff','処理の順番','しょりのじゅんばん','processing order','EQとCOMPのどちらを先にするか。前のEQは、COMPに聞かせる帯域を決める。',['xc08']);
 A('xc_bandcomp','帯域別圧縮','おびいきべつあっしゅく','band-split compression','低域と高域を分けて別々に圧縮すること。低音に引っぱられない。2トラックの近似は分け目にずれが出る。',['xc09']);
 A('xc_buschain','バスの流れ','ばすのながれ','bus signal chain','トラック→バス→マスターの順に、軽い処理を少しずつ重ねて整える考え方。',['xc10']);
 [['comp',['xc03','xc04']],['gr',['xc01','xc03']],['thresh',['xc01']],['cratio',['xc01']],['catk',['xc02']],['crel',['xc02']],['parallel',['xc04']],['sidechain',['xc05']],['limiter',['xc07']],['makeup',['xc06']],['busc',['xc10']],['pump',['xc10']],['catk',['xc06','xc07']],['crel',['xc06']],['gr',['xc07','xc08','xc09','xc10']],['thresh',['xc09']],['cratio',['xc09']]].forEach(function(p){T.forEach(function(t){if(t.id===p[0])p[1].forEach(function(s){if(t.see.indexOf(s)<0)t.see.push(s)})})});
 var P=SD.PATS,TK=P.tk;
 var GT={'xc01s11':0,'xc01s12':-4.8,'xc01s13':-2.9,'xc01s41':0,'xc01s42':-1.4,'xc01s43':-2.5,'xc01s51':0,'xc01s52':-2.2,'xc01s53':-2.9,'xc02s11':-3.4,'xc02s12':-1.9,'xc02s13':0,'xc02s41':-1.6,'xc02s42':-0.6,'xc02s43':0,'xc02s51':-2.3,'xc02s52':0,'xc02s53':-0.9,'xc03s11':0,'xc03s12':-4.3,'xc03s13':-6.9,'xc03s51':-2.6,'xc03s52':0,'xc03s53':-5.7,'xc04s11':0,'xc04s12':-0.1,'xc04s13':-0.3,'xc04s41':-0.1,'xc04s42':0,'xc04s43':0,'xc04s51':0,'xc04s52':-0.1,'xc04s53':-0.6,'xc05s11':0,'xc05s12':-0.2,'xc05s13':-0.7,'xc05s41':0,'xc05s42':-0.7,'xc05s43':-0.2,'xc05s51':-1,'xc05s52':0,'xc05s53':-0.1,'xc06s11':0,'xc06s12':-5.9,'xc06s13':-6.7,'xc06s41':0,'xc06s42':-1.3,'xc06s43':-2.2,'xc06s51':-5.9,'xc06s52':-6.7,'xc06s53':0,'xc07s11':0,'xc07s12':-2.5,'xc07s13':-5.7,'xc07s41':-1.6,'xc07s42':-2.2,'xc07s43':0,'xc07s51':-3.2,'xc07s52':0,'xc07s53':-0.1,'xc08s11':0,'xc08s12':-1.6,'xc08s31':-3.2,'xc08s32':-1.8,'xc08s33':0,'xc08s41':-1.1,'xc08s42':-2.7,'xc08s43':0,'xc09s11':-0.2,'xc09s12':0,'xc09s41':0,'xc09s42':-0.5,'xc09s43':-0.7,'xc09s51':-6.2,'xc09s52':-5.9,'xc09s53':0,'xc10s11':0,'xc10s12':-4.5,'xc10s41':0,'xc10s42':-0.6,'xc10s43':-0.8,'xc10s51':0,'xc10s52':-1,'xc10s53':-1.7};/* tools/xc-cal.js が出す cmp.g(COMP・2段目・キーも通したオフライン測定)。ここに貼る */
 var cm=function(key,items){return items.map(function(it,i){var o=Object.assign({l:it[0]},it[1]);var g=GT[key+(i+1)];if(g!==undefined)o.g=g;return o})};
 var z=function(a){var q={};a.forEach(function(i){q[i]=0});return q};
 var CPD={iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:3,iCpAtk:10,iCpRel:250,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20};
 var CP=function(o){return Object.assign({},CPD,o||{})},OFF={iCpOn:0},NO=CP({iCpThr:0,iCpRatio:1});
 var sfx=function(o){var r={};Object.keys(o).forEach(function(k){r[k+'_2']=o[k]});return r};
 var ORD=['gt','eq','cp','cp_2','ds','sa','md'];
 var BASS={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:.3,noiseLvl:0,fType:'lowpass',cutoff:700,res:.1,envAmt:.3,drive:0,aA:.004,aD:.25,aS:.7,aR:.1};
 var withM=function(t,cp,mix,eq,out){t.o.mx={eq:eq||{iEqOn:0},cp:cp||NO};if(mix)t.o.mix=mix;if(out)t.o.out=out;return t};
 var KIK=function(cp,mix,eq,out){return withM(TK('kick',P.fourFloor(),'キック'),cp,mix,eq,out)};
 var SNR=function(cp,mix,eq,out){return withM(TK('snare',{idx:z([4,12]),o:{}},'スネア'),cp,mix,eq,out)};
 var HAT=function(cp,mix,eq,out){return withM(TK('hat',{idx:z([2,6,10,14]),o:{}},'ハット',{acc:[2,6,10,14]}),cp,mix,eq,out)};
 var BAS=function(cp,mix,eq,out){return withM(TK('bass',P.bassPattern('eighth',0),'ベース',{scale:'minor',p:BASS,acc:[0,4,8,12]}),cp,mix,eq,out)};
 var PLUCK={o1Wave:'sawtooth',o1Lvl:.5,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:2500,res:.2,envAmt:.4,drive:0,aA:.002,aD:.12,aS:0,aR:.08};
 var PLK=function(cp,mix,eq,out){return withM(TK('bass',P.bassPattern('eighth',0),'プラック',{scale:'minor',tr:12,p:PLUCK,acc:[0,4,8,12]}),cp,mix,eq,out)};
 var PAD={o1Wave:'sawtooth',o1Lvl:.25,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:3000,res:.1,envAmt:0,drive:0,aA:.01,aD:.2,aS:.7,aR:.2};
 var CHD=function(cp,mix,eq,out){return withM(TK('bass',{idx:z([2,6,10,14]),o:{}},'コード',{scale:'minor',tr:12,p:PAD}),cp,mix,eq,out)};
 var RICH={o1Wave:'sawtooth',o1Lvl:.25,o2Lvl:0,subLvl:0,noiseLvl:0,fType:'lowpass',cutoff:8000,res:0,envAmt:0,drive:0,aA:.004,aD:.25,aS:.8,aR:.1};
 var BND=function(name,eq){return withM(TK('bass',P.bassPattern('eighth',0),name,{scale:'minor',p:RICH,acc:[0,4,8,12]}),NO,null,eq)};
 var SPL=function(eq,cp){return Object.assign({},eq,CP(cp))};
 var BX=function(f){return {1:SPL({iEqOn:1,iEqLpf:f,iEqHpf:20},{iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:150,iCpMake:4}),2:SPL({iEqOn:1,iEqLpf:20000,iEqHpf:f},{iCpThr:-30,iCpRatio:2.5,iCpAtk:10,iCpRel:250})}};
 var O1=['gt','eq','cp','ds','sa','md'],O2=['gt','cp','eq','ds','sa','md'];
 var eo=function(ord,g,hpf){return Object.assign({ord:ord,iEqOn:1,iEqB1f:250,iEqB1g:g,iEqHpf:hpf},CP({iCpThr:-26,iCpRatio:4,iCpAtk:10,iCpRel:150}))};
 var two=function(a,b){return Object.assign({ord:ORD},a,sfx(b))};
 var LIM=function(o){return CP(Object.assign({iCpThr:-14,iCpRatio:20,iCpAtk:.1,iCpRel:60,iCpKnee:0},o||{}))},SOFT=CP({iCpThr:-24,iCpRatio:2.5,iCpAtk:10,iCpRel:120});
 var BCP=function(o){return Object.assign({iCpOn:1,iCpModel:3,iCpThr:-24,iCpRatio:2,iCpAtk:30,iCpRel:150,iCpMake:0,iCpKnee:6,iCpMix:1,iCpScHpf:20},o||{})},BOFF={iCpOn:0};
 var SNB=CP({iCpThr:-44,iCpRatio:12,iCpAtk:1,iCpRel:60}),SNG=CP({iCpThr:-22,iCpRatio:3,iCpAtk:20,iCpRel:100}),BSB=CP({iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:900}),BSG=CP({iCpThr:-28,iCpRatio:4,iCpAtk:10,iCpRel:200});
 var qz=function(q,ans,ex){return {q:q,ans:ans,ex:ex}};
 var MX=function(trk,k,lo,hi,ins){return {trk:trk,ins:ins||'cp',k:k,rng:[lo,hi]}};
 var base=function(o){return SD.XM.base(Object.assign({cat:'xc1',course:'XC'},o))};
 var SQ=CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100});/* パラレルの潰す側 */
 var SCM=function(o){return SD.scMix({src:0,depth:.8,key:-14,extra:o})};/* キックをキーにしたベース(SC HPF だけ変える) */
 var CPS=function(o){return Object.assign({},SCM(),o||{})};
 SD.LESSONS.push(
/* ---------------- xc01 ---------------- */
base({id:'xc01',pre:['cm04'],terms:['xc_grtarget','gr','thresh','cratio'],title:'GRの見方',sub:'目標GRと、音色・押し出しの関係',ts:2,save:{name:'目標GRで整えたベース',kind:'kit'},
 tk:[KIK(),BAS()],steps:[
 {h:'減らす量を決める',b:'コンプで何dB減らすかの狙いが【目標GR】。ベースにかけない・浅い・深いの3つを、音量をそろえて聞き比べよう。',tab:'mix',
  cmp:cm('xc01s1',[['COMPなし',{tm:{2:OFF}}],['浅い',{tm:{2:CP({iCpThr:-25,iCpRatio:3})}}],['深い',{tm:{2:CP({iCpThr:-44,iCpRatio:8})}}]])},
 {h:'ベースは軽く',b:'ベースのGRは{g:dyn.grBass}が目安。T2のTHRESHを-28〜-22dB、RATIOを2〜4にして、GRメーターをその範囲に入れよう。',tab:'mix',
  mx:[MX(2,'iCpThr',-28,-22),MX(2,'iCpRatio',2,4)],mt:[{trk:2,m:'gr',rng:[3,6],hold:1}]},
 {h:'深くすると平らになる',b:'THRESHを-46〜-36dB、RATIOを6〜10にして、GRを10dB以上にする。強弱の差が小さくなり、ベースの動きが平らになる。',tab:'mix',
  mx:[MX(2,'iCpThr',-46,-36),MX(2,'iCpRatio',6,10)],mt:[{trk:2,m:'gr',rng:[10,30],hold:1}]},
 {h:'同じ設定でもATTACKで変わる',b:'GRの数字だけでは、押し出しは分からない。同じTHRESHでもATTACKが遅いと頭が通り、速いと頭から抑えられる。聞き比べよう。',tab:'mix',
  cmp:cm('xc01s4',[['1 ATTACK 1ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpAtk:1})}}],['2 ATTACK 10ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpAtk:10})}}],['3 ATTACK 30ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpAtk:30})}}]]),
  quiz:qz('頭の押し出しが、いちばん残っているのは?',3,'3が正解(ATTACK 30ms)。頭が抑えられる前に通り抜けるので、GRの平均が小さくても頭が立つ。1は頭から抑えられて丸くなる。')},
 {h:'浅い・ちょうど・深い',b:'3つを聞き比べて、潰れて元気がないものを選ぼう。GRは、耳で決める前の入口にすぎない。',tab:'mix',
  cmp:cm('xc01s5',[['1 GR約27dB',{tm:{2:CP({iCpThr:-50,iCpRatio:10})}}],['2 GR約11dB',{tm:{2:CP({iCpThr:-34,iCpRatio:4})}}],['3 GR約4dB',{tm:{2:CP({iCpThr:-25,iCpRatio:3})}}]]),
  quiz:qz('潰れて元気がないのは?',1,'1が正解(GR約27dB)。深すぎて強弱がなくなり、音が平らになる。3は浅く、動きがそのまま残る。')},
 {h:'GRで量、耳で仕上げ',b:'まずGRで量を決め、次にATTACKとRELEASEで形を整え、最後に耳で足し引きする。レシピを保存して次の曲でも使おう。',tab:'mix',
  col:{h:'GRは「結果」の数字',b:'GRは、THRESHとRATIOと音量の組み合わせでできる結果。同じ値でも、曲や音色で聞こえ方は変わる。目安は出発点で、最後は耳で決める。'}}
]}),
/* ---------------- xc02 ---------------- */
base({id:'xc02',pre:['cm03','au71'],terms:['xc_relbeat','crel','catk'],title:'リリースを拍に合わせる',sub:'戻りきる・戻りきらないで乗りが変わる',ts:2,save:{name:'拍に合わせたベース',kind:'kit'},
 tk:[KIK(),BAS(CP({iCpThr:-30,iCpRatio:4,iCpAtk:10,iCpRel:400}))],steps:[
 {h:'拍の長さを知る',b:'1拍の長さは60000÷BPM(ms)。120BPMなら500ms、8分音符なら250ms。【リリースの拍合わせ】は、この長さと戻る時間を比べて決める。',tab:'mix',
  cmp:cm('xc02s1',[['短い(30ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:30})}}],['戻りきる(150ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:150})}}],['長い(900ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:900})}}]])},
 {h:'8分の間に戻す',b:'ベースは8分で動く。次の音が来る前に抑えが戻るよう、T2のRELEASEを100〜200msにしよう。音の間で、GRが小さく戻る。',tab:'mix',
  mx:[MX(2,'iCpRel',100,200)]},
 {h:'戻りきらないと',b:'RELEASEを700〜1200msにすると、次の音が来ても戻りきらず、ずっと抑えたままになる。音量の起伏が減って平らになる。',tab:'mix',
  mx:[MX(2,'iCpRel',700,1200)]},
 {h:'1拍に合わせる',b:'RELEASEを1拍(500ms)前後にすると、次の拍の頭あたりで戻る。8分に合わせた場合と、うねりの長さが変わる。聞き比べよう。',tab:'mix',
  cmp:cm('xc02s4',[['8分に合わせる(200ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:200})}}],['1拍に合わせる(500ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:500})}}],['2拍(1000ms)',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:1000})}}]])},
 {h:'どれ?',b:'聞き比べて、次の音が来ても抑えが戻りきらず、ずっと平らなものを選ぼう。',tab:'mix',
  cmp:cm('xc02s5',[['1 RELEASE 150ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:150})}}],['2 RELEASE 1500ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:1500})}}],['3 RELEASE 500ms',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpRel:500})}}]]),
  quiz:qz('戻りきらず、ずっと抑えたままなのは?',2,'2が正解(RELEASE 1500ms)。8分の間隔は250msなので、戻る前に次の音が来て、抑えが持ち越される。')},
 {h:'テンポが変わったら',b:'BPMが倍になれば、拍の長さは半分。RELEASEも半分が目安。テンポを決めてから、60000÷BPMで計算して合わせよう。',tab:'mix',
  col:{h:'リリースは「戻る時間」',b:'RELEASEが拍より長いと、抑えが次の拍に持ち越される。わざと持ち越して「うねり」を作る使い方もある。狙いがあるときだけ長くする。'}}
]}),
/* ---------------- xc03 ---------------- */
base({id:'xc03',pre:['cm04','vo04'],terms:['xc_twostage','comp','gr'],title:'2段コンプ(軽く2回)',sub:'1段で強くより、軽く2回',ts:2,save:{name:'2段コンプのベース',kind:'kit'},
 tk:[KIK(),BAS(NO,Object.assign({ord:ORD},sfx(NO)))],steps:[
 {h:'1回で強く・2回で軽く',b:'同じ量を抑えるなら、1回で強くかけるより、軽く2回に分けたほうが自然なことが多い。【2段コンプ】を、音量をそろえて聞き比べよう。',tab:'mix',
  cmp:cm('xc03s1',[['COMPなし',{tm:{2:OFF}}],['1段で強く',{tm:{2:CP({iCpThr:-28,iCpRatio:3})}}],['2段で軽く',{tm:{2:Object.assign({ord:ORD},CP({iCpThr:-22,iCpRatio:2,iCpAtk:5,iCpRel:100}),sfx(CP({iCpThr:-22,iCpRatio:2,iCpAtk:30,iCpRel:300})))}}]])},
 {h:'1段目は速くて浅く',b:'1段目は頭を軽く受け止める役。T2のTHRESHを-24〜-18dB、RATIOを1.5〜2.5、ATTACKを2〜8msにしよう。',tab:'mix',
  mx:[MX(2,'iCpThr',-24,-18),MX(2,'iCpRatio',1.5,2.5),MX(2,'iCpAtk',2,8)]},
 {h:'2段目は遅くて浅く',b:'2段目は全体をならす役。INSERTのCOMPは2段入っている(COMP 2)。THRESHを-24〜-18dB、ATTACKを20〜40ms、RELEASEを200〜400msにしよう。',tab:'mix',
  mx:[MX(2,'iCpThr_2',-24,-18),MX(2,'iCpAtk_2',20,40),MX(2,'iCpRel_2',200,400)]},
 {h:'GRは足し算',b:'2段のGRは足し算で考える。各段を数dBに抑えれば、合計は1段で強くかけた量と同じくらいになる。合計がやりすぎないよう気をつけよう。',tab:'mix'},
 {h:'どれ?',b:'聞き比べて、やりすぎて潰れているものを選ぼう。',tab:'mix',
  cmp:cm('xc03s5',[['1 2段で軽く',{tm:{2:Object.assign({ord:ORD},CP({iCpThr:-22,iCpRatio:2,iCpAtk:5,iCpRel:100}),sfx(CP({iCpThr:-22,iCpRatio:2,iCpAtk:30,iCpRel:300})))}}],['2 1段で強く',{tm:{2:CP({iCpThr:-28,iCpRatio:3})}}],['3 2段とも強く',{tm:{2:Object.assign({ord:ORD},CP({iCpThr:-40,iCpRatio:8,iCpAtk:5,iCpRel:100}),sfx(CP({iCpThr:-40,iCpRatio:8,iCpAtk:30,iCpRel:300})))}}]]),
  quiz:qz('やりすぎて潰れているのは?',3,'3が正解。2段とも強くかけると、GRが足し算で大きくなり、強弱がなくなる。1は各段が浅いので、合計もほどほど。')},
 {h:'役割を分ける',b:'1段目=頭を受け止める、2段目=全体をならす。役割が違えば、ATTACKとRELEASEも変えられる。1段で足りるなら、増やさない。',tab:'mix',
  col:{h:'段数を増やしすぎない',b:'COMPは重い処理で、2段目を足すと負荷が増える。1段で足りるなら1段のままにする。強くかけたい理由があるときだけ、軽く2回に分ける。'}}
]}),
/* ---------------- xc04 ---------------- */
base({id:'xc04',pre:['cm10'],terms:['xc_parmix','parallel','comp'],title:'パラレル圧縮の上級',sub:'強く潰して、薄く混ぜる',ts:2,save:{name:'パラレルで太くしたドラム',kind:'kit'},
 tk:[KIK(SQ),SNR(),HAT()],steps:[
 {h:'密度と勢いの釣り合い',b:'cm10のパラレルを、混ぜる量の決め方まで深める。潰す側を強く作り、MIXで密度と勢いの釣り合いを決める。MIXを3通り聞き比べよう。',tab:'mix',
  cmp:cm('xc04s1',[['MIX 15%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.15})}}],['MIX 40%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4})}}],['MIX 70%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.7})}}]])},
 {h:'潰す側を作る',b:'T2のTHRESHを-52〜-40dB、RATIOを8〜12、ATTACKを0.1〜3msにしよう。MIXは100%のまま、潰した音だけを聴いて強さを確かめる。',tab:'mix',
  mx:[MX(2,'iCpThr',-52,-40),MX(2,'iCpRatio',8,12),MX(2,'iCpAtk',.1,3)]},
 {h:'混ぜる量は少なめから',b:'T2のMIXを15〜40%にしよう。【混ぜる量】が多いほど密度が増え、頭の勢いは減る。迷ったら少なめから足していく。',tab:'mix',
  mx:[MX(2,'iCpMix',.15,.4)]},
 {h:'潰す強さを比べる',b:'MIXを同じにして、潰す強さだけ変える。強く潰すほど余韻が持ち上がる。THRESH -34・-44・-54dBを聞き比べよう。',tab:'mix',
  cmp:cm('xc04s4',[['THRESH -34dB',{tm:{2:CP({iCpThr:-34,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4})}}],['THRESH -44dB',{tm:{2:CP({iCpThr:-44,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4})}}],['THRESH -54dB',{tm:{2:CP({iCpThr:-54,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4})}}]])},
 {h:'どれ?',b:'聞き比べて、頭の勢いが失われて平らになっているものを選ぼう。',tab:'mix',
  cmp:cm('xc04s5',[['1 MIX 15%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.15})}}],['2 MIX 40%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:.4})}}],['3 MIX 100%',{tm:{2:CP({iCpThr:-40,iCpRatio:10,iCpAtk:1,iCpRel:100,iCpMix:1})}}]]),
  quiz:qz('勢いが失われて平らなのは?',3,'3が正解(MIX 100%)。潰した音だけになり、原音の頭が混ざらない。1は原音が多く、勢いはそのまま。')},
 {h:'トラックごとに変える',b:'T1のキックは潰す側が作ってある。キックのMIXは10〜30%、スネアは15〜40%にしよう。ハットは粒が消えないよう、さらに少なめにする。',tab:'mix',
  mx:[MX(1,'iCpMix',.1,.3),MX(2,'iCpMix',.15,.4)],
  col:{h:'MIXは「味付け」',b:'潰した音を原音に混ぜる量は、薄味から足していく。多すぎると勢いが失われ、ただ潰した音になる。トラックごとに量を変えるのがコツ。'}}
]}),
/* ---------------- xc05 ---------------- */
base({id:'xc05',pre:['cm12'],terms:['xc_schpf','sidechain'],title:'サイドチェインのHPF',sub:'低域を判定に使う・使わない',ts:2,save:{name:'SC HPFを決めたベース',kind:'kit'},
 tk:[KIK(),BAS(SCM({iCpScHpf:120}))],steps:[
 {h:'キーの低い音をどうするか',b:'キックのキーには、低いドスンと高いカチッの両方がある。【SC HPF】は、判定に使うキーの低い音を削るつまみ。20・120・300Hzを聞き比べよう。',tab:'mix',
  cmp:cm('xc05s1',[['SC HPF 20Hz',{tm:{2:CPS({iCpScHpf:20})}}],['SC HPF 120Hz',{tm:{2:CPS({iCpScHpf:120})}}],['SC HPF 300Hz',{tm:{2:CPS({iCpScHpf:300})}}]])},
 {h:'低域も判定に使う',b:'T2のSC HPFを20〜40Hzにしよう。キックの低い音も判定に使うので、ベースが深くへこむ。',tab:'mix',
  mx:[MX(2,'iCpScHpf',20,40)]},
 {h:'低域を避ける',b:'SC HPFを150〜300Hzにしよう。低い音は判定に入らず、カチッとした高い成分だけで動くので、へこみが浅くなる。',tab:'mix',
  mx:[MX(2,'iCpScHpf',150,300)]},
 {h:'どれ?',b:'聞き比べて、ベースがいちばん深くへこむものを選ぼう。',tab:'mix',
  cmp:cm('xc05s4',[['1 SC HPF 20Hz',{tm:{2:CPS({iCpScHpf:20})}}],['2 SC HPF 300Hz',{tm:{2:CPS({iCpScHpf:300})}}],['3 SC HPF 120Hz',{tm:{2:CPS({iCpScHpf:120})}}]]),
  quiz:qz('いちばん深くへこむのは?',1,'1が正解(SC HPF 20Hz)。キックの低い音まで判定に使うので、深く抑える。2は低い音が判定に入らず、浅い。')},
 {h:'ふつうのコンプでも効く',b:'SC SRCをINTにした、ふつうのコンプでもSC HPFは効く。低い音に引っぱられず、中高域の動きで判定できる。聞き比べよう。',tab:'mix',
  cmp:cm('xc05s5',[['1 SC HPF 300Hz',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpScHpf:300})}}],['2 SC HPF 20Hz',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpScHpf:20})}}],['3 SC HPF 100Hz',{tm:{2:CP({iCpThr:-30,iCpRatio:4,iCpScHpf:100})}}]]),
  quiz:qz('低い音に引っぱられて、いちばん強く抑えているのは?',2,'2が正解(SC HPF 20Hz)。ベースの低い音が判定の中心になり、強く抑える。1は低い音を聞かないので、浅い。')},
 {h:'使い分け',b:'キックの低い音まで使って深くへこませたいなら低め。カチッとだけ避けたいなら高め。迷ったら中間から始めよう。',tab:'mix',
  col:{h:'キーの音は聞こえなくてもよい',b:'キーに使うトラックは、鳴っていれば判定に使える。SC LISTENをONにすると、HPFのあとの判定用の音だけを聴いて確かめられる。'}}
]}),
/* ---------------- xc06 ---------------- */
base({id:'xc06',pre:['cm06'],terms:['xc_atkdesign','catk','crel','makeup','transient'],title:'アタック・サステインを作る',sub:'頭を通す・抑える。ドラムとプラック',ts:2,save:{name:'アタックを設計したリズム',kind:'kit'},
 tk:[KIK(),SNR(),PLK()],steps:[
 {h:'頭を通すか、抑えるか',b:'cm06のスネアの考え方を、設計として深める。【アタックの設計】は、頭を通して立てるか、抑えて余韻を持ち上げるかを決めること。T3のプラックで3つを聞き比べよう。',tab:'mix',
  cmp:cm('xc06s1',[['COMPなし',{tm:{3:OFF}}],['頭を通す',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:30,iCpRel:100})}}],['頭を抑える',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:.5,iCpRel:60,iCpMake:4})}}]])},
 {h:'キックの頭を残す',b:'T1のATTACKを15〜50ms、RELEASEを60〜200ms、THRESHを-30〜-22dB、RATIOを3〜6にしよう。キックの頭が通って、ドンと抜ける。',tab:'mix',
  mx:[MX(1,'iCpAtk',15,50),MX(1,'iCpRel',60,200),MX(1,'iCpThr',-30,-22),MX(1,'iCpRatio',3,6)]},
 {h:'プラックの余韻を持ち上げる',b:'逆向きも作る。T3のATTACKを0.1〜3ms、RELEASEを40〜120ms、THRESHを-34〜-26dB、RATIOを4〜8、MAKEUPを3〜9dBにしよう。頭が抑えられ、余韻が太くなる。',tab:'mix',
  mx:[MX(3,'iCpAtk',.1,3),MX(3,'iCpRel',40,120),MX(3,'iCpThr',-34,-26),MX(3,'iCpRatio',4,8),MX(3,'iCpMake',3,9)]},
 {h:'ATTACKで頭の量が決まる',b:'ほかを同じにして、ATTACKだけ変える。遅いほど、頭がそのまま通る。T3のATTACK 1・10・30msを聞き比べよう。',tab:'mix',
  cmp:cm('xc06s4',[['ATTACK 1ms',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:1,iCpRel:100})}}],['ATTACK 10ms',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:10,iCpRel:100})}}],['ATTACK 30ms',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:30,iCpRel:100})}}]])},
 {h:'どれ?',b:'聞き比べて、頭が抑えられて、余韻が持ち上がっているものを選ぼう。',tab:'mix',
  cmp:cm('xc06s5',[['1 ATTACK 30ms',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:30,iCpRel:100})}}],['2 ATTACK 0.5ms+MAKEUP',{tm:{3:CP({iCpThr:-30,iCpRatio:4,iCpAtk:.5,iCpRel:60,iCpMake:4})}}],['3 COMPなし',{tm:{3:OFF}}]]),
  quiz:qz('頭が抑えられて、余韻が持ち上がっているのは?',2,'2が正解。ATTACKが速くRELEASEも短いので、頭が抑えられ、余韻が相対的に持ち上がる。1は頭が通っている。3はCOMPなし。')},
 {h:'スネアにも使う',b:'T2のスネアは、頭を立てたいならATTACKを5〜30ms、THRESHを-26〜-18dBに。同じ道具でも、素材と狙いで向きを選ぶ。',tab:'mix',
  mx:[MX(2,'iCpAtk',5,30),MX(2,'iCpThr',-26,-18)],
  col:{h:'先に「何を立てたいか」を決める',b:'頭を通す設定と抑える設定は逆向き。先に狙いを決めてから、つまみを選ぶ。迷ったらCOMPなしと聞き比べて、良くなっているかを確かめよう。'}}
]}),
/* ---------------- xc07 ---------------- */
base({id:'xc07',pre:['cm11','ms03'],terms:['xc_peakcatch','limiter','catk','gr'],title:'リミッターの多段',sub:'コンプで整え、リミッター風でピークだけ止める',ts:2,save:{name:'2段でピークを止めたスネア',kind:'kit'},
 tk:[KIK(),SNR(NO,Object.assign({ord:ORD},sfx(NO)))],steps:[
 {h:'役割を分ける',b:'コンプは音の中身を整え、リミッターは大きい山だけを止める。この分担が【ピーク止め】。T2の2段で、COMPなし・リミッター風だけ・コンプ→リミッター風を聞き比べよう。',tab:'mix',
  cmp:cm('xc07s1',[['COMPなし',{tm:{2:Object.assign({ord:ORD},OFF,sfx(OFF))}}],['リミッター風だけ',{tm:{2:two(OFF,LIM())}}],['コンプ→リミッター風',{tm:{2:two(SOFT,LIM())}}]])},
 {h:'1段目は軽く整える',b:'T2の1段目は、THRESHを-30〜-20dB、RATIOを2〜3.5、ATTACKを5〜20msにしよう。中身を軽く整える役。強くかけない。',tab:'mix',
  mx:[MX(2,'iCpThr',-30,-20),MX(2,'iCpRatio',2,3.5),MX(2,'iCpAtk',5,20)]},
 {h:'2段目は山だけ',b:'2段目をリミッター風にする。THRESHを-16〜-10dB、RATIOを14〜20、ATTACKを0.05〜1ms、RELEASEを40〜150msに。大きい山だけが止まる。',tab:'mix',
  mx:[MX(2,'iCpThr_2',-16,-10),MX(2,'iCpRatio_2',14,20),MX(2,'iCpAtk_2',.05,1),MX(2,'iCpRel_2',40,150)]},
 {h:'2段目を下げすぎると',b:'2段目のTHRESHを下げるほど、止める山が増える。-8・-16・-30dBを聞き比べよう。下げすぎると、山以外も抑えられて平らになる。',tab:'mix',
  cmp:cm('xc07s4',[['THRESH -8dB',{tm:{2:two(SOFT,LIM({iCpThr:-8}))}}],['THRESH -16dB',{tm:{2:two(SOFT,LIM({iCpThr:-16}))}}],['THRESH -30dB',{tm:{2:two(SOFT,LIM({iCpThr:-30}))}}]])},
 {h:'どれ?',b:'聞き比べて、リミッター風が下がりすぎて、頭が潰れているものを選ぼう。',tab:'mix',
  cmp:cm('xc07s5',[['1 軽く整えて山だけ',{tm:{2:two(SOFT,LIM())}}],['2 リミッター風だけ',{tm:{2:two(OFF,LIM())}}],['3 リミッター風を下げすぎ',{tm:{2:two(SOFT,LIM({iCpThr:-34}))}}]]),
  quiz:qz('頭が潰れているのは?',3,'3が正解。2段目のTHRESHが低く、山以外も強く止めるので、頭が潰れる。1は山だけを止めている。')},
 {h:'ピークで確かめる',b:'整えたら、MASTERのPEAKを見よう。-9〜-3dBに収まれば、余裕がある。音量を上げるのは、ピークに余裕があるときだけ。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}],
  col:{h:'保険は最後に',b:'リミッターは、ピークを止める保険。バランスを先に整え、足りない音量をリミッターで補おうとしない。強くかけすぎると、潰れた音になる。'}}
]}),
/* ---------------- xc08 ---------------- */
base({id:'xc08',pre:['cx08','ef16'],terms:['xc_ordereff','gr','comp'],title:'処理の順番とダイナミクス',sub:'EQ→COMPか、COMP→EQか',ts:2,save:{name:'順番を決めたベース',kind:'kit'},
 tk:[KIK(),BAS(CP({iCpThr:-26,iCpRatio:4,iCpAtk:10,iCpRel:150}),null,{iEqOn:1})],steps:[
 {h:'足したEQは、COMPが聞く',b:'EQをCOMPの前に置くと、EQで足した帯域をCOMPが聞く。【処理の順番】で、COMPの反応が変わる。T2の250Hzを+9dB足して、順番を聞き比べよう。',tab:'mix',
  cmp:cm('xc08s1',[['EQ→COMP',{tm:{2:eo(O1,9,0)}}],['COMP→EQ',{tm:{2:eo(O2,9,0)}}]])},
 {h:'GRメーターで見る',b:'T2のBELL1のGAINを+6〜+12dBにして、ORDERをEQ→COMPにしよう。COMP→EQに替えるとGRが減る。順番で、COMPの量が変わる。',tab:'mix',
  mx:[MX(2,'iEqB1g',6,12,'eq')]},
 {h:'切るEQは前に',b:'T2のLOW CUTを40〜100Hzにしよう。COMPの前で切ると、聞こえない低音にCOMPが反応しない。後ろで切ると、反応したあとで削るだけ。',tab:'mix',
  mx:[MX(2,'iEqHpf',40,100,'eq')],
  cmp:cm('xc08s3',[['LOW CUTなし',{tm:{2:eo(O1,0,20)}}],['COMPの前で切る',{tm:{2:eo(O1,0,80)}}],['COMPの後ろで切る',{tm:{2:eo(O2,0,80)}}]])},
 {h:'どれ?',b:'聞き比べて、足した低域をCOMPが強く抑えて、ベースの動きが小さいものを選ぼう。',tab:'mix',
  cmp:cm('xc08s4',[['1 EQ→COMP(足した)',{tm:{2:eo(O1,9,0)}}],['2 COMP→EQ(足した)',{tm:{2:eo(O2,9,0)}}],['3 EQ→COMP(足さない)',{tm:{2:eo(O1,0,0)}}]]),
  quiz:qz('足した低域をCOMPが強く抑えているのは?',1,'1が正解。EQで足した帯域がそのままCOMPに入り、よく反応する。2は足したあとでCOMPが聞かない。3は足していない。')},
 {h:'迷ったときの目安',b:'足したい音色はCOMPの後ろ、削りたい不要な帯域は前。これが始めの目安。COMPの反応を変えたいときだけ、足すEQを前に置く。',tab:'mix',
  col:{h:'順番は「何を聞かせるか」',b:'COMPの前のEQは、COMPに聞かせる帯域を決める。後ろのEQは、仕上がりの音色を決める。聞かせたいものを先に決めてから、順番を選ぼう。'}}
]}),
/* ---------------- xc09 ---------------- */
base({id:'xc09',pre:['cm14','mb01'],terms:['xc_bandcomp','gr','thresh','cratio'],title:'帯域別圧縮の使いどころ',sub:'何のために分け、何に使わないか(近似)',ts:2,save:{name:'低域だけ強く圧縮した音',kind:'kit'},
 tk:[BND('低域側',{iEqOn:1,iEqLpf:1500,iEqHpf:20}),BND('高域側',{iEqOn:1,iEqLpf:20000,iEqHpf:1500})],steps:[
 {h:'低音が全体を引っぱる',b:'低い音は大きく、COMPの判定を左右する。全体に強くかけると高域まで抑えられる。【帯域別圧縮】は、低域だけ強くかける使い方。T1が低域側、T2が高域側。',tab:'mix',
  cmp:cm('xc09s1',[['まとめて強く',{mt:[1],tm:{1:SPL({iEqOn:0},{iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:150,iCpMake:4})}}],['わけて(低域だけ強く)',{tm:{1:SPL({iEqOn:1,iEqLpf:800,iEqHpf:20},{iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:150,iCpMake:4}),2:SPL({iEqOn:1,iEqLpf:20000,iEqHpf:800},{iCpThr:0,iCpRatio:1,iCpAtk:10,iCpRel:250})}}]])},
 {h:'分け目をそろえる',b:'T1のHIGH CUTとT2のLOW CUTを、同じ500〜1000Hzにそろえる。分け目がずれると、つなぎ目の音量が変わる。',tab:'mix',
  mx:[MX(1,'iEqLpf',500,1000,'eq'),MX(2,'iEqHpf',500,1000,'eq')]},
 {h:'低域は強く、高域は軽く',b:'T1のTHRESHを-48〜-36dB、RATIOを6〜10にしよう。T2は-34〜-26dB、RATIO 2〜3。低域だけが締まり、高域の抜けは残る。',tab:'mix',
  mx:[MX(1,'iCpThr',-48,-36),MX(1,'iCpRatio',6,10),MX(2,'iCpThr',-34,-26),MX(2,'iCpRatio',2,3)]},
 {h:'分け目を動かすと',b:'分け目は動かすほど、つなぎ目の違和感が出やすい。300・800・3000Hzで聞き比べよう。低域の揺れが残る所と、つなぎ目が目立つ所がある。',tab:'mix',
  cmp:cm('xc09s4',[['分け目 300Hz',{tm:BX(300)}],['分け目 800Hz',{tm:BX(800)}],['分け目 3000Hz',{tm:BX(3000)}]])},
 {h:'どれ?',b:'聞き比べて、低域だけを強くかけて、高域の抜けがいちばん残っているものを選ぼう。',tab:'mix',
  cmp:cm('xc09s5',[['1 まとめて強く',{mt:[1],tm:{1:SPL({iEqOn:0},{iCpThr:-42,iCpRatio:8,iCpAtk:10,iCpRel:150,iCpMake:4})}}],['2 低域だけ強く',{tm:BX(800)}],['3 まとめて軽く',{mt:[1],tm:{1:SPL({iEqOn:0},{iCpThr:-30,iCpRatio:2.5,iCpAtk:10,iCpRel:150})}}]]),
  quiz:qz('高域の抜けがいちばん残っているのは?',2,'2が正解。低域側だけ強く抑え、高域側は軽いので、高域の抜けが残る。1は全体を強く抑え、高域まで引っぱられる。')},
 {h:'使わない場面',b:'音が1つで安定しているときや、軽くかけるだけで足りるときは、1つのCOMPで十分。分けるほど、つなぎ目のずれや手間が増える。',tab:'mix',
  col:{h:'本物のマルチバンドとのちがい',b:'ここは2トラックに分けた近似。本物はFXタブのMULTIBAND(mb01)で、位相をそろえて分ける。近似は分け目で音量・位相が少しずれる。分ける目的が、はっきりしたときだけ使おう。'}}
]}),
/* ---------------- xc10 ---------------- */
base({id:'xc10',pre:['xc01','xc02','xc03','xc04','xc05','xc06','xc07','xc08','xc09'],terms:['xc_buschain','busc','pump','gr'],title:'ダイナミクス総合演習',sub:'トラック→ドラムバス→ミュージックバス→マスター',ts:2,save:{name:'ダイナミクスを整えたミックス',kind:'kit'},
 tk:[KIK(NO,null,null,'A'),SNR(SNB,null,null,'A'),HAT(NO,null,null,'A'),BAS(BSB,null,null,'B'),CHD(NO,null,null,'B')],steps:[
 {h:'直す前と、直した後',b:'ドラムはT1〜T3(BUS A)、ベースとコードはT4・T5(BUS B)。スネアは強すぎ、ベースは戻りが遅い。【バスの流れ】は、トラック→バス→マスターの順。直す前と後を聞き比べよう。',tab:'mix',
  cmp:cm('xc10s1',[['直す前',{tm:{2:SNB,4:BSB},bm:{A:BOFF,B:BOFF}}],['直した後',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-14,iCpRatio:2}),B:BOFF}}]])},
 {h:'スネアの頭を取り戻す',b:'T2のATTACKを10〜40ms、THRESHを-26〜-18dB、RATIOを2〜4にしよう。xc01・xc06で学んだ、頭が通る浅い設定。',tab:'mix',
  mx:[MX(2,'iCpAtk',10,40),MX(2,'iCpThr',-26,-18),MX(2,'iCpRatio',2,4)]},
 {h:'ベースの戻りを拍に',b:'T4のRELEASEを100〜300ms、THRESHを-32〜-24dB、RATIOを3〜5にしよう。次の音の前に戻って、ベースが揺れない。',tab:'mix',
  mx:[MX(4,'iCpRel',100,300),MX(4,'iCpThr',-32,-24),MX(4,'iCpRatio',3,5)]},
 {h:'バスは軽く',b:'BUS AのCOMPを、数dB(ドラムバスのGRは{g:dyn.grDrumBus}が目安)のごく軽い設定にする。深さ違いの3つを聞き比べよう。',tab:'mix',
  cmp:cm('xc10s4',[['浅い',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-12,iCpRatio:2}),B:BOFF}}],['ふつう',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-24,iCpRatio:2}),B:BOFF}}],['深い',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5}),B:BOFF}}]])},
 {h:'どれ?',b:'聞き比べて、バスで潰しすぎて、ドラムの頭と強弱が失われているものを選ぼう。',tab:'mix',
  cmp:cm('xc10s5',[['1 バスなし',{tm:{2:SNG,4:BSG},bm:{A:BOFF,B:BOFF}}],['2 バス・軽く',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-14,iCpRatio:2}),B:BOFF}}],['3 バス・強く',{tm:{2:SNG,4:BSG},bm:{A:BCP({iCpThr:-40,iCpRatio:8,iCpAtk:5}),B:BOFF}}]]),
  quiz:qz('潰しすぎているのは?',3,'3が正解。バスのTHRESHが低くRATIOも高いので、ドラム全体が強く押さえられ、頭と強弱が失われる。')},
 {h:'マスターで確かめる',b:'最後に、MASTERのPEAKを-9〜-3dBに収めよう。トラックを軽く整え、バスで少しまとめれば、ピークに余裕が残る。',tab:'mix',
  mt:[{trk:'M',m:'peak',rng:[-9,-3],hold:2}],
  col:{h:'軽く、何度か',b:'トラック・バス・マスターで、少しずつ整える。1か所で強くかけるより、ずっと自然。まとまらないときは、先にトラックのバランスを疑おう。'}}
]})

 );
})();
