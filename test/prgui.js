// コード進行ドリルの画面検査(jsdom): npm i --no-save jsdom && node test/prgui.js
// 目次から開く/出題(度数を1つずつ選ぶ)/ヒント/答え合わせ/進捗/一覧(難易度順・重要度順)/名前あて(4択)
const {JSDOM}=require('jsdom'),fs=require('fs'),path=require('path');
const root=require('path').join(__dirname,'..','www');
const html=fs.readFileSync(root+'/index.html','utf8').replace(/<script src="[^"]+"><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/'});
const w=dom.window;w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true});
const errs=[];w.addEventListener('error',e=>errs.push(e.message));
// 最小のWebAudioモック
const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:prm(),frequency:prm(),detune:prm(),Q:prm(),delayTime:prm(),pan:prm(),curve:null,buffer:null,port:{postMessage(){},onmessage:null},parameters:{get(){return prm()}},setPeriodicWave(){}});
const prm=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
w.AudioContext=function(){return {sampleRate:48000,currentTime:0,state:'running',destination:node(),resume(){},createGain:node,createConstantSource:()=>Object.assign(node(),{offset:prm()}),createOscillator:node,createBiquadFilter:node,createWaveShaper:node,createDelay:node,createConvolver:node,createDynamicsCompressor:()=>Object.assign(node(),{threshold:prm(),knee:prm(),ratio:prm(),attack:prm(),release:prm()}),createAnalyser:()=>Object.assign(node(),{frequencyBinCount:1024,getByteFrequencyData(){},getByteTimeDomainData(){},getFloatTimeDomainData(){}}),createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(l)}),createBufferSource:node,createStereoPanner:node,createPeriodicWave:()=>({}),audioWorklet:{addModule:()=>Promise.resolve()}}};
w.AudioWorkletNode=function(){return node()};
w.URL.createObjectURL=()=>'blob:x';w.requestAnimationFrame=()=>0;
const files=[...fs.readFileSync(root+'/index.html','utf8').matchAll(/<script src="js\/([^"]+)\.js/g)].map(m=>m[1]);/* MA-3: index.html の読み込み順に自動で合わせる(手書きの一覧は sched などが抜けていた) */
const t0=Date.now();
files.forEach(f=>{if(f==='app')w.eval(`SD.LESSONS.push({id:'t_x',cat:'basic',title:'テスト',sub:'',synth:'analog',demo:{n:[55],gap:1,len:.5},init:{},steps:[{h:'基盤',b:'本文',f:[['cutoff',2000]],col:{h:'歴史メモ',b:'コラム本文'},cmp:[{l:'A',s:{o1Wave:'sine'}},{l:'B',s:{o1Wave:'square'}}],dm:[{t:0,s:{cutoff:500}},{t:.1,s:{res:.8},r:.1}]},{h:'次',b:'x'}]})`);w.eval(fs.readFileSync(`${root}/js/${f}.js`,'utf8'))});
if(w.document.readyState==='loading')w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const SD=w.SD,$=s=>w.document.querySelector(s);
const ok=(c,m)=>{if(!c){console.error('NG:',m);process.exitCode=1}};
const P=SD.PRG,$$=s=>[...w.document.querySelectorAll(s)];
const click=s=>{const e=typeof s==='string'?$(s):s;if(!e)throw new Error('見つからない: '+s);e.click()};
const txt=()=>$('#ov').textContent;
w.confirm=()=>true;
$('#start').click();
click('[data-act="toc"]');
ok($$('#ov [data-act="prg"]').length===1,'目次に「コード進行ドリル」の入口がある');
click('#ov [data-act="prg"]');
ok(/コード進行ドリル/.test(txt())&&$$('#ov [data-act="prgstart"]').length===4,'ドリルのメニュー(重要なものから+難易度3つ)');
ok(/◎ おぼえた 0 \/ 18/.test(txt()),'最初は 0 / 18');
ok(/次は「王道進行」/.test(txt()),'最初の出題は重要度1位の王道進行');
// ---- 出題: 重要なものから ----
click('#ov [data-act="prgstart"][data-lv="0"]');
ok(/「王道進行」は\?/.test(txt()),'見出し「王道進行は?」');
ok($$('#ov .pg-s').length===4&&$$('#ov .pg-p').length===6,'マス4つ・選択肢6つ');
ok($$('#ov .pg-p b').map(e=>e.textContent).join(' ')==='Ⅰ Ⅱm Ⅲm Ⅳ Ⅴ Ⅵm','選択肢の度数表示(Ⅰ Ⅱm Ⅲm Ⅳ Ⅴ Ⅵm)');
ok($('#ov [data-act="prgcheck"]').disabled,'全部埋まるまで答え合わせは押せない');
const pick=id=>click(`#ov [data-act="prgpick"][data-id="${id}"]`);
['IV','V','VIm','IIIm'].forEach(pick);
ok($$('#ov .pg-s b').map(e=>e.textContent).join(' ')==='Ⅳ Ⅴ Ⅵm Ⅲm','選んだ順にマスが埋まる');
click('#ov [data-act="prgcheck"]');
ok(/2 \/ 4 合っています/.test(txt())&&$$('#ov .pg-s.ng').length===2&&$$('#ov .pg-s.ok').length===2,'順序違いは 2/4(赤2・緑2)');
ok(P.prog().ouda.a===1&&P.prog().ouda.s===0,'不正解が進捗に記録される');
// ---- もう一度 → 1つ消す・ヒント ----
click('#ov [data-act="prgretry"]');
pick('IV');pick('V');
click('#ov [data-act="prgundo"]');
ok($$('#ov .pg-s b').map(e=>e.textContent).join(' ')==='Ⅳ ? ? ?'||$$('#ov .pg-s b').map(e=>e.textContent).join(' ')==='Ⅳ Ⅴ ? ?','1つ消すで最後に選んだマスが空に戻る');
click('#ov [data-act="prghint"]');
ok($$('#ov .pg-s.lock').length===1,'ヒントで答えが1マス入り、固定される');
{const e=$$('#ov .pg-s b').map(x=>x.textContent);['IIIm','VIm'].forEach(x=>{if(P.pal.tri.indexOf(x)>=0&&$$('#ov .pg-s b').some(b=>b.textContent==='?'))pick(x)});}
// 空きを全部埋めて、正しい答えにそろえる(ヒント後に正解しても連続に数えない)
{const it=P.item('ouda');for(let i=0;i<4;i++){const cur=$$('#ov .pg-s b')[i].textContent;if(cur!==P.label(it.seq[i])){click(`#ov .pg-s[data-i="${i}"]`);pick(it.seq[i])}}}
click('#ov [data-act="prgcheck"]');
ok(/正解!/.test(txt())&&/ヒントを使った/.test(txt()),'ヒント使用の正解は連続に数えないと表示');
ok(P.prog().ouda.s===0&&P.prog().ouda.c===1,'ヒント使用の正解: 連続は増えない');
ok(/F → G → Em → Am/.test(txt()),'答え合わせのあと、コード名(キーC)が出る');
// ---- ヒントなしで2回連続 → ◎ ----
for(let r=0;r<2;r++){click('#ov [data-act="prgretry"]');P.item('ouda').seq.forEach(pick);click('#ov [data-act="prgcheck"]')}
ok(/◎ おぼえました/.test(txt())&&P.mastered(P.prog(),'ouda'),'ヒントなし2回連続で ◎ おぼえました');
click('#ov [data-act="prgnext"]');
ok(/「小室進行」は\?/.test(txt()),'次の問題は重要度2位の小室進行(◎ は飛ばす)');
// ---- 最初の1つを見せる問題 ----
click('[data-act="prgtab"][data-v="list"]');
click('#ov [data-act="prgsolve"][data-id="pop4"]');
ok($$('#ov .pg-s.lock').length===1&&$$('#ov .pg-s b')[0].textContent==='Ⅰ','ポップ・ループは最初のⅠが見えている');
ok(/最初の1つは見せてあります/.test(txt()),'見せている数の案内');
// ---- 一覧(難易度順・重要度順) ----
click('#ov [data-act="prgtab"][data-v="list"]');
ok($$('#ov .row').length===18,'一覧に18問');
click('#ov [data-act="prgord"][data-v="lv"]');
{const hs=$$('#ov h4').map(e=>e.textContent);ok(hs.join('|')==='入門(7問)|ふつう(6問)|むずかしい(5問)','難易度順: 見出しが 入門7・ふつう6・むずかしい5');
 const nm=$$('#ov .row .rt b').map(e=>e.textContent.replace(/^\d+\.\s*(入門|ふつう|むずかしい)/,''));
 ok(nm[0]==='王道進行'&&nm[17]==='裏コード','難易度順: 先頭が王道進行・最後が裏コード');
 const L=P.byLv().map(x=>x.name);ok(JSON.stringify(nm)===JSON.stringify(L),'難易度順の並びが byLv と一致');}
click('#ov [data-act="prgord"][data-v="imp"]');
{ok($$('#ov h4').length===0,'重要度順は見出しなし');const nm=$$('#ov .row .rt b').map(e=>e.textContent.replace(/^\d+\.\s*(入門|ふつう|むずかしい)/,''));
 ok(JSON.stringify(nm)===JSON.stringify(P.byImp().map(x=>x.name)),'重要度順の並びが byImp と一致');
 ok(/重要度 1位/.test($('#ov .row').textContent)&&/◎ おぼえた/.test($('#ov .row').textContent),'1位は ◎ おぼえた と表示');}
click('#ov [data-act="prgopen"][data-id="canon"]');
ok(/Ⅰ → Ⅴ → Ⅵm → Ⅲm → Ⅳ → Ⅰ → Ⅳ → Ⅴ/.test(txt())&&/C → G → Am → Em → F → C → F → G/.test(txt()),'「見る」で度数とコード名が出る');
// ---- 難易度をしぼる ----
click('#ov [data-act="prgtab"][data-v="home"]');
click('#ov [data-act="prgstart"][data-lv="3"]');
ok(/「Just The Two of Us進行」は\?/.test(txt()),'むずかしいだけ: 重要度の高い jt2us から');
// ---- キー ----
click('#ov [data-act="prgtab"][data-v="home"]');
click('#ov [data-act="prgkey"][data-v="2"]');click('#ov [data-act="prgstart"][data-lv="0"]');
ok(/キー D。/.test(txt())&&$$('#ov .pg-p small').map(e=>e.textContent).join(' ')!=='','キーを D にすると D で出る');
// ---- 名前あて(4択) ----
click('#ov [data-act="prgtab"][data-v="home"]');
click('#ov [data-act="prgmode"][data-v="name"]');click('#ov [data-act="prgstart"][data-lv="0"]');
ok(/この進行の名前は\?/.test(txt())&&$$('#ov .pg-ch button').length===4,'名前あて: 4択');
{const id=P.pickNext(P.prog(),0,'komuro')&&null;}
const cur=[...$$('#ov .pg-ch button')];ok(cur.length===4,'4つのボタン');
const names=cur.map(b=>b.textContent),ans=P.items.find(x=>names.indexOf(x.name)>=0&&P.sample(x,2).join(' ')===$$('#ov .pg-s b').map(e=>e.textContent).join(' '));
ok(!!ans,'選択肢に正解の名前が含まれる');
click(cur[names.indexOf(ans.name)]);
ok(/正解!|おぼえました/.test(txt())&&$$('#ov .pg-ch button.ok').length===1,'正しい名前を選ぶと正解');
// ---- 閉じる ----
click('#ov [data-act="close"]');ok(!$('#ov').classList.contains('on'),'閉じられる');
// ---- 設定の保存(キー・あて方・並び順) ----
{const c=JSON.parse(w.localStorage.getItem('sd_prgcfg')||'null');ok(c&&c.key===2&&c.mode==='name'&&c.ord==='imp','キー・あて方・並び順が保存される')}
ok(errs.length===0,'画面でエラーが出ない: '+errs.join(' / '));
console.log(process.exitCode?'NG(prgui)':'OK: PRG 画面(目次の入口・出題・ヒント・採点・◎・一覧の2つの並び・難易度しぼり・キー・名前あて)');
process.exit(process.exitCode||0);
