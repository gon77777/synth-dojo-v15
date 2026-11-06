/* v11.16 MX-1 上級ミックス(lv3)の基盤。コース XE 上級EQ・XC 上級ダイナミクス・XS 上級空間・XB バス・低域・全体設計・XG ジャンル別ミックス演習・XD 実戦診断。
   レッスンは MX-2 以降で足す(書き方は mx.js の base/KIK/BAS/CHD/E/CP/MX/qz が見本。本ファイルは変えず、補助だけ SD.XM に公開)。
   既定の方針(MX-0 の D): ファイル1つ・SD.GUIDE は足さない(数値はつまみ値と同じ数字のみ)・聞き比べは同じ音量になる操作だけで行う(cmp.g を使うなら2案以上)。
   本文に年号・人名・曲名・機種名は書かない */
(function(){
 var C=[['xe1','XE','XE 上級EQ'],['xc1','XC','XC 上級ダイナミクス'],['xs1','XS','XS 上級空間・ステレオ'],['xb1','XB','XB バス・低域・全体設計'],['xg1','XG','XG ジャンル別ミックス演習'],['xd1','XD','XD 実戦診断']];
 C.forEach(function(c){SD.CATS.push({id:c[0],synth:'analog',chapter:'course',course:c[1],name:c[2]})});
 /* 新レッスンの共通の形(lv3・recipe・trk)。使い方: SD.LESSONS.push(SD.XM.base({id:'xe01',cat:'xe1',course:'XE',…})) */
 var base=function(o){return Object.assign({synth:'analog',lv:3,kind:'recipe',mode:'trk',tab:'trk',oct:-1,demo:{n:[33]},ts:1},o)};
 SD.XM={COURSES:C.map(function(c){return {cat:c[0],course:c[1],name:c[2]}}),base:base};
})();
