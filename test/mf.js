// MU-F 鍵盤判定と耳トレの検査: node test/mf.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');if(files.indexOf('mf.js')<0)throw new Error('validate の読み込みに mf.js が無い');
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..','www','js',f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const H=(a,t0=0,dt=100)=>a.map((n,i)=>({pc:SD.MF.pc(n),t:t0+i*dt}));
const J=SD.MF.judge;
ok(J({notes:[0,4,7]},H([48,52,55]))&&J({notes:[0,4,7]},H([60,67,76])),'和音: オクターブ違いでも可');
ok(!J({notes:[0,4,7]},H([48,52])),'和音: 足りない');
ok(!J({notes:[0,4,7]},H([48,52,55,57])),'和音: 余分な音(tol=0)');
ok(J({notes:[0,4,7],tol:1},H([48,52,55,57])),'和音: tol=1');
ok(!J({notes:[0,4,7]},H([48,52,55],0,3000)),'和音: 時間が離れすぎ');
ok(J({notes:[0,4,7]},[{pc:9,t:0},{pc:0,t:9000},{pc:4,t:9100},{pc:7,t:9200}]),'和音: 古い音は無視');
ok(J({notes:[0,2,4],seq:true},H([60,62,64])),'順: 正しい');
ok(!J({notes:[0,2,4],seq:true},H([60,64,62])),'順: 逆順は不可');
ok(J({notes:[0,2,4],seq:true,tol:1},H([60,61,62,64])),'順: tol=1 の寄り道');
ok(!J({notes:[0,2,4],seq:true},H([60,62])),'順: 途中');
ok(!J(null,H([60]))&&!J({notes:[]},H([60]))&&!J({notes:[0]},[]),'空入力は偽');
ok(SD.MF.label({notes:[0,4,7]})==='C + E + G'&&SD.MF.label({notes:[0,2],seq:true})==='C → D','表示');
// 付けた play の整合
let np=0;SD.LESSONS.forEach(L=>L.steps.forEach((s,i)=>{if(!s.play)return;np++;const p=s.play;
 ok(Array.isArray(p.notes)&&p.notes.length>=2&&p.notes.every(n=>n>=0&&n<12&&n===(n|0)),L.id+' play.notes');
 ok(L.course==='MU'||L.course==='AL',L.id+' play は MU/AL のみ');ok(J(p,H(p.notes.map(n=>60+n),0,p.seq?200:50)),L.id+' step'+(i+1)+' 模範で判定が通る')}));
ok(np>=18,'play 付きステップ数 '+np);
// 耳トレ
['mf01','mf02','mf03'].forEach(id=>{const L=SD.LESSONS.find(l=>l.id===id);if(!L){bad('無い '+id);return}
 ok(L.course==='MU'&&L.cat==='mu1'&&L.lv===2,id+' 所属');const qs=L.steps.filter(s=>s.quiz);ok(qs.length>=3,id+' クイズ数');
 qs.forEach(s=>{ok(s.cmp.length>=2&&s.quiz.ans>=1&&s.quiz.ans<=s.cmp.length,id+' ans');s.cmp.forEach(c=>ok(c.mt.length===L.tk.length-1,id+' 1トラックだけ鳴らす'))});
 ok(new Set(qs.map(s=>s.quiz.ans)).size>=2,id+' 正解位置がばらけている')});
// ランダム出題: 何度引いても形が正しく、正解位置が偏らない
['mf01','mf02','mf03'].forEach(id=>{const L=SD.LESSONS.find(l=>l.id===id),pos={};L.steps.filter(s=>s.rnd).forEach(s=>{for(let k=0;k<200;k++){const t=SD.MF.draw(L,s);
 ok(s.cmp.length===3&&new Set(s.cmp.map(c=>c.mt.join())).size===3,id+' 3択が重ならない');const a=s.quiz.ans;ok(a>=1&&a<=3,id+' ans範囲');
 ok(s.cmp[a-1].mt.indexOf(t)<0&&s.cmp[a-1].mt.length===L.tk.length-1,id+' 正解の選択肢が目標を鳴らす');ok(!/\d{4}/.test(s.b+s.quiz.ex),id+' 年号');pos[a]=1}});
 ok(Object.keys(pos).length===3,id+' 正解位置が1〜3に出る')});
console.log(err?'FAIL '+err:'OK mf');process.exit(err?1:0)
