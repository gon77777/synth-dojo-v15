// PRG コード進行ドリルの検査: node test/prg.js(jsdom 不要)
// 1) データの整合 2) 度数→コード名 3) 声部 4) 採点・進捗・出題順 5) index.html の読み込み順(seq.js が先)
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),www=path.join(__dirname,'..','www');
let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const J=JSON.stringify;

// ---- 5) 読み込み順: index.html の順で全スクリプト(app.js 以外)を読んで、1つも落ちないこと ----
{const order=[...fs.readFileSync(path.join(www,'index.html'),'utf8').matchAll(/<script src="js\/([^"]+)\.js/g)].map(m=>m[1]);
 ok(order.indexOf('prg')>=0&&order.indexOf('prg')<order.indexOf('app'),'index.html: prg.js が app.js より前にある');
 ok(order.indexOf('seq')>=0&&order.indexOf('seq')<order.indexOf('mu'),'index.html: seq.js(SD.SCALES・SD.chordNotes)が、それを読み込み時に使う mu.js より前にある');
 const sw=fs.readFileSync(path.join(www,'sw.js'),'utf8');
 ok(sw.indexOf("'js/prg.js'")>=0,'sw.js: キャッシュ一覧に js/prg.js がある');
 const c={console,setTimeout,clearTimeout};c.window=c;vm.createContext(c);const fails=[];
 order.filter(f=>f!=='app').forEach(f=>{try{vm.runInContext(fs.readFileSync(path.join(w,f+'.js'),'utf8'),c,{filename:f+'.js'})}catch(e){fails.push(f+': '+String(e.message).slice(0,70))}});
 ok(fails.length===0,'index.html の読み込み順で落ちるファイルがある: '+fails.join(' / '));
 ok(c.SD&&c.SD.LESSONS&&c.SD.LESSONS.length===785,'index.html の順で読むと、レッスンが785本そろう(実際: '+(c.SD&&c.SD.LESSONS&&c.SD.LESSONS.length)+')');
 var SD=c.SD;
 // (store.js は localStorage を使うので、進捗の検査用に差し替える)
 var mem={};SD.store={get:(k,d)=>k in mem?JSON.parse(mem[k]):d,set:(k,v)=>{mem[k]=JSON.stringify(v)}};
 vm.runInContext(fs.readFileSync(path.join(w,'prg.js'),'utf8'),c,{filename:'prg.js'});}
const P=SD.PRG,items=P.items,D=P.degrees;

// ---- 1) データの整合 ----
ok(items.length===18,'18問');
ok(new Set(items.map(x=>x.id)).size===18,'id が重複しない');
ok(new Set(items.map(x=>x.name)).size===18,'名前が重複しない(出題の見出しが同じにならない)');
ok(J(items.map(x=>x.imp).sort((a,b)=>a-b))===J(Array.from({length:18},(_,i)=>i+1)),'重要度は 1〜18 の順位で重複・欠けなし');
ok(items.every(x=>x.lv>=1&&x.lv<=3),'難易度は 1〜3');
ok(J([1,2,3].map(l=>items.filter(x=>x.lv===l).length))===J([7,6,5]),'難易度の内訳 入門7・ふつう6・むずかしい5');
ok(items.filter(x=>x.imp<=4).every(x=>x.lv===1),'重要度の上位4つ(まず覚える)は入門');
ok(P.byLv().every((x,i,a)=>i===0||a[i-1].lv<x.lv||(a[i-1].lv===x.lv&&a[i-1].imp<x.imp)),'難易度順: 難易度→重要度の順');
ok(P.byImp().every((x,i)=>x.imp===i+1),'重要度順: 1位から並ぶ');
items.forEach(x=>{
 ok(x.seq.length>=3&&x.seq.length<=12,x.id+': コード数');
 ok(P.pal[x.pal]&&x.seq.every(id=>P.pal[x.pal].indexOf(id)>=0),x.id+': 答えのコードがすべて選択肢に含まれる');
 ok(x.seq.every(id=>D[id]&&SD.chordDef(D[id].t)),x.id+': 度数→SD.CHORDS の種類が引ける');
 ok(x.given>=0&&x.given<x.seq.length,x.id+': 最初から出す数は全部未満');
 ok(x.desc&&x.desc.length>20,x.id+': 説明あり');
 ok(!x.nick||/このアプリでの呼び名/.test(x.desc),x.id+': 呼び名(nick)はこのアプリでの呼び名と明記');
 ok(!x.nick||x.given>=1,x.id+': 呼び名の問題は最初の1つを出して、順序のあいまいさを避ける');
 ok(x.mode==='maj'||x.mode==='min',x.id+': mode');});
Object.keys(P.pal).forEach(k=>ok(new Set(P.pal[k]).size===P.pal[k].length,'選択肢の重複 '+k));
Object.keys(D).forEach(k=>ok(D[k].d>=0&&D[k].d<12,'度数の半音数 '+k));

// ---- 2) 度数→コード名(Cメジャー / マイナーは Aマイナー=9) ----
const smp=(id,key)=>P.sample(P.item(id),key).join(' ');
ok(smp('ouda',0)==='F G Em Am','王道進行 in C = F G Em Am');
ok(smp('komuro',0)==='Am F G C','小室進行 in C = Am F G C');
ok(smp('canon',0)==='C G Am Em F C F G','カノン進行 in C');
ok(smp('251',0)==='Dm7 G7 CM7','ツーファイブワン in C');
ok(smp('ouda7',0)==='FM7 G7 Em7 Am','王道進行(7th) in C');
ok(smp('jt2us',0)==='FM7 E7 Am7 Gm7 C7','Just The Two of Us進行 in C');
ok(smp('oudae7',0)==='F G E7 Am','王道の変形(Ⅲ7) in C');
ok(smp('andalu',9)==='Am G F E','アンダルシア in Aマイナー');
ok(smp('ura',0)==='Dm7 D♭7 CM7','裏コード in C');
ok(smp('subm',0)==='F Fm C'&&smp('borrow',0)==='A♭ B♭ C','サブドミナントマイナー・借用和音 in C');
ok(smp('down',0)==='F Em Dm C'&&smp('loop6',0)==='Am F C G'&&smp('pop4',0)==='C G Am F'&&smp('hitome',0)==='C Am F G','nick 4つ in C');
ok(smp('blues',7).split(' ').length===12&&smp('blues',7).split(' ')[0]==='G7','ブルース 12コード・Gなら G7 から');
ok(smp('ouda',2)==='G A F♯m Bm','キーを D に移す(2半音上)');
ok(P.keyName(P.item('andalu'),9)==='Am'&&P.keyName(P.item('ouda'),3)==='E♭','キー名(マイナーは m が付く・♭表記)');

// ---- 3) 声部: 全問・全12キーで、音域内・隣のコードとの動きが小さい ----
{let maxStep=0,minN=999,maxN=0,cnt=0;
 items.forEach(it=>{for(let k=0;k<12;k++){const v=P.voices(it,k);ok(v.length===it.seq.length,it.id+' 声部の数');
  v.forEach((a,i)=>{ok(a.length>=4&&a.length<=5,it.id+' 1コードの音数(低音+3〜4音)');a.forEach(m=>{minN=Math.min(minN,m);maxN=Math.max(maxN,m)});
   if(i>0){const u=a.slice(1),p=v[i-1].slice(1);let s=0;for(let j=0;j<Math.min(u.length,p.length);j++)s+=Math.abs(u[j]-p[j]);maxStep=Math.max(maxStep,s);cnt++}})}});
 ok(minN>=24&&maxN<=96,'音域が SD.NMIN〜NMAX 内('+minN+'〜'+maxN+')');
 ok(maxStep<=26,'隣のコードへの声の動きの合計が大きすぎない(最大 '+maxStep+')');
 ok(P.voices(P.item('ouda'),0)[0][0]===36+5,'低音は根音(Fなら 36+5)');}

// ---- 4) 採点・進捗・出題順 ----
{const it=P.item('ouda');
 ok(P.grade(it,['IV','V','IIIm','VIm']).all&&P.grade(it,['IV','V','IIIm','VIm']).n===4,'採点: 全問正解');
 const g=P.grade(it,['IV','V','VIm','IIIm']);ok(!g.all&&g.n===2&&J(g.ok)===J([true,true,false,false]),'採点: 順序違いは2/4');
 ok(P.grade(it,[null,null,null,null]).n===0,'採点: 空は0');
 for(const k of Object.keys(mem))delete mem[k];
 ok(P.pickNext(P.prog(),0).id==='ouda','最初の出題は重要度1位の王道進行');
 ok(P.pickNext(P.prog(),0,'ouda').id==='komuro','直前の問題は1回とばす');
 ok(P.pickNext(P.prog(),3).id==='jt2us'&&P.pickNext(P.prog(),2).id==='canon'&&P.pickNext(P.prog(),1).id==='ouda','難易度をしぼると、その中で重要度が高い順');
 let x=P.rec('ouda',true,false);ok(x.a===1&&x.c===1&&x.s===1&&!P.mastered(P.prog(),'ouda')&&P.seen(P.prog(),'ouda'),'1回正解: 挑戦ずみ・まだ◎ではない');
 x=P.rec('ouda',true,true);ok(x.s===1&&x.c===2,'ヒントを使った正解は連続に数えない(連続は保つ)');
 x=P.rec('ouda',false,false);ok(x.s===0,'不正解で連続が0に戻る');
 P.rec('ouda',true,false);x=P.rec('ouda',true,false);ok(x.s===2&&P.mastered(P.prog(),'ouda'),'ヒントなし2回連続で ◎ おぼえた');
 ok(P.pickNext(P.prog(),0).id==='komuro','◎ のものは飛ばして次の重要度');
 P.items.forEach(i=>{P.rec(i.id,true,false);P.rec(i.id,true,false)});
 ok(P.pickNext(P.prog(),0).id!==undefined,'全部おぼえても出題は止まらない(復習)');
 const old=P.prog();old.hitome.t=1;SD.store.set('prg',old);
 ok(P.pickNext(P.prog(),0,'ouda').id==='hitome','全部おぼえたら、最後に解いたのが古いものから復習');
 const rn=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return s/2147483647}})();
 for(let t=0;t<30;t++){const c=P.choices(P.item('komuro'),rn);ok(c.length===4&&new Set(c.map(y=>y.id)).size===4&&c.some(y=>y.id==='komuro'),'名前あて: 選択肢4つ・重複なし・正解を含む')}}

console.log(err?'NG '+err+'件':'OK: PRG データ('+items.length+'問)・度数→コード名・声部・採点・出題順・読み込み順');
process.exit(err?1:0);
