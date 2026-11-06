// 上級ミックス(XE・XC・XS・XB・XG・XD)の検査(MX-1 基盤): node test/xmix.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');if(files.indexOf('xmix.js')<0)throw new Error('validate の読み込みに xmix.js が無い');
if(files.indexOf('xmix.js')<files.indexOf('mf.js'))throw new Error('xmix.js は mf.js のあとに読む');
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const CS=['XE','XC','XS','XB','XG','XD'],CAT={XE:'xe1',XC:'xc1',XS:'xs1',XB:'xb1',XG:'xg1',XD:'xd1'};
// コース枠
CS.forEach(c=>{const k=SD.CATS.filter(x=>x.id===CAT[c]);ok(k.length===1,c+' の cat が1つ');if(k[0])ok(k[0].course===c&&k[0].chapter==='course'&&k[0].synth==='analog'&&/^X[A-Z] /.test(k[0].name),c+' の cat の形')});
ok(SD.CATS.filter(x=>/^x[ecsbgd]1$/.test(x.id)).length===6,'上級ミックスの cat は6つ');
ok(SD.XM&&SD.XM.COURSES.length===6&&SD.XM.base({id:'t'}).lv===3&&SD.XM.base({id:'t'}).kind==='recipe','SD.XM.base');
// 既存コースが変わっていない(MX は13本・lv2)
ok(SD.LESSONS.filter(l=>l.course==='MX').length===13&&SD.LESSONS.filter(l=>l.course==='MX').every(l=>l.lv===2),'既存 MX は13本・lv2');
ok(SD.LESSONS.filter(l=>l.course==='CX').length===12,'既存 CX は12本');
// レッスン(MX-2 以降で増える)の規則: lv3・cat・5〜8ステップ・cmp・col・tab・目標・pre実在・ID形式・診断
const X=SD.LESSONS.filter(l=>CS.indexOf(l.course)>=0),ids=new Set(SD.LESSONS.map(l=>l.id)),G=SD.MixGoal;
X.forEach(L=>{const w=L.id+' ';
 ok(L.cat===CAT[L.course]&&L.lv===3,w+'cat/lv');ok(new RegExp('^'+L.course.toLowerCase()+'\\d\\d$').test(L.id),w+'ID形式');
 ok(L.steps.length>=5&&L.steps.length<=8,w+'ステップ数5〜8');ok(L.steps.some(s=>s.cmp),w+'cmp');ok(L.steps.some(s=>s.col),w+'col');
 ok(L.steps.every(s=>s.tab),w+'tab');ok((L.pre||[]).length>=1&&(L.pre||[]).every(p=>ids.has(p)),w+'pre が無いか実在しない');
 ok(L.mode==='trk'&&L.tk&&L.tk.length>=1&&L.tk.every(t=>t.o&&t.o.mx&&t.o.mx.eq&&t.o.mx.cp),w+'各トラックに mx.eq と mx.cp');
 if(L.kind==='recipe')ok(L.steps.some(s=>(s.mx||[]).length||(s.mt||[]).length||(s.f||[]).length||(s.c||[]).length||(s.sp||[]).length),w+'recipe は目標が要る');
 if(L.kind==='diag')ok(L.save&&L.steps.some(s=>s.quiz),w+'diag は save・quiz');
 L.steps.forEach((s,i)=>{if(s.quiz)ok(s.cmp&&s.quiz.ans>=1&&s.quiz.ans<=s.cmp.length,w+'step'+(i+1)+' quiz.ans')});
 ok((L.terms||[]).every(t=>SD.TERMS.some(x=>x.id===t)),w+'terms が未登録');
 G.check(L).forEach(m=>bad(m))});
// 用語ID: 新コースの接頭辞(xe_ など)の語は、see が実在のレッスンを指す
SD.TERMS.filter(t=>/^x[ecsbgd]_/.test(t.id)).forEach(t=>ok(t.see.every(s=>ids.has(s)),t.id+' の see'));
console.log(err?'FAIL '+err:'OK: 上級ミックス基盤(コース枠6・既存MX13本/CX12本は不変・新レッスン'+X.length+'本)');process.exit(err?1:0)
