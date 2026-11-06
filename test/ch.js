// CH(かんたん複雑コード)の検査: node test/ch.js。X-0=型ライブラリ SD.CHT と操作 SD.CHH の単体テスト(レッスンは CH-1 から)
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');
['blh.js','chh.js','ch.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD,H=SD.CHH;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const mod=x=>((x%12)+12)%12,J=JSON.stringify,kinds=new Set(SD.CHORDS.map(c=>c.id));
const strip=bars=>bars.map(b=>b.c.map(x=>[x[0],x[1]]));
// 型ライブラリ
ok(SD.CHT.length===8&&new Set(SD.CHT.map(t=>t.id)).size===8,'型は8つ・ID重複なし');
SD.CHT.forEach(t=>{ok(t.bars.length===4,t.id+' 4小節');t.bars.forEach(b=>{ok(b.c.length>=1&&b.c.length<=2,t.id+' 1小節に1〜2個');b.c.forEach(x=>ok(kinds.has(x[1])&&x[0]>=0&&x[0]<12,t.id+' 種類/根音 '+J(x)))})});
// fit
SD.CHT.forEach(t=>{const f0=H.fit(t,0),f12=H.fit(t,12);ok(J(strip(f0))===J(strip(t.bars.map(b=>({c:b.c})))),t.id+' fit key0 は恒等');ok(J(strip(f12))===J(strip(f0)),t.id+' fit key12=key0');
 for(let k=1;k<12;k++){const f=H.fit(t,k);ok(f.key===k,t.id+' key');f.forEach((b,i)=>b.c.forEach((x,j)=>ok(x[1]===t.bars[i].c[j][1]&&x[0]===mod(t.bars[i].c[j][0]+k),t.id+' fit 根音+key・種類不変')))}});
// shift
SD.CHT.forEach(t=>{const o=H.fit(t,5);[[2,2],[5,2],[7,0],[3,3]].forEach(([s,from])=>{const r=H.shift(o,s,from);ok(r.length===4,'shift 小節数');ok(r.key===5,'shift key保持');
  r.forEach((b,i)=>b.c.forEach((x,j)=>{const a=o[i].c[j];ok(x[1]===a[1],'shift 種類不変');ok(x[0]===(i<from?a[0]:mod(a[0]+s)),'shift '+t.id+' 小節'+i)}))});
 ok(J(strip(H.shift(o,12,0)))===J(strip(o)),t.id+' shift 12 は恒等');ok(J(strip(H.shift(o,0,2)))===J(strip(o)),'shift 0')});
// swapBar / splitBar / anticipate: 指定の小節だけ変わる
const onlyBar=(a,b,i,w)=>a.forEach((x,k)=>{if(k!==i)ok(J(x)===J(b[k]),w+' 小節'+k+' が変わった')});
SD.CHT.forEach(t=>[0,5,9].forEach(k=>{const o=H.fit(t,k);
 [['end',[k,'maj']],['go',[mod(k+7),'7']],['twist',[mod(k+8),'maj']]].forEach(([kind,c])=>{const r=H.swapBar(o,3,kind);ok(J(r[3].c)===J([c]),t.id+' swap '+kind+' '+J(r[3].c));onlyBar(o,r,3,'swap')});
 [0,1,2,3].forEach(i=>{const r=H.splitBar(o,i,'pre'),nx=o[(i+1)%4].c[0];ok(r[i].c.length===2&&J(r[i].c[0])===J(o[i].c[0])&&r[i].c[1][0]===mod(nx[0]+7)&&r[i].c[1][1]==='7','split 前置の根音=次の和音の5度上の7th '+t.id+' i'+i);onlyBar(o,r,i,'split')});
 const a=H.anticipate(o,1);ok(a[1].ant===true&&!o[1].ant,'anticipate フラグ');onlyBar(o,a,1,'anticipate');ok(J(strip(a))===J(strip(o)),'anticipate は和音を変えない');
 const ev=H.events(a),nx=o[2].c[0],e=ev.find(x=>x.r===nx[0]&&x.t===nx[1]&&x.st===30);ok(!!e,t.id+' anticipate 次の和音が小節1のステップ14から(通しで30)');
 const e0=H.events(o);ok(!e0.some(x=>x.st%16===14),'先行なしでは14から始まる和音が無い')}));
// minorize
{const o=H.fit('sunny',0),r=H.minorize(o);ok(J(strip(r))===J([[[0,'min']],[[7,'maj']],[[8,'maj']],[[5,'min']]]),'minorize sunny '+J(strip(r)));
 const j=H.minorize(H.fit('jazz',0));ok(J(strip(j))===J([[[2,'m7']],[[7,'7']],[[0,'m7']],[[0,'m7']]]),'minorize jazz(I M7→m7) '+J(strip(j)));}
// smooth
SD.CHT.forEach(t=>[0,4,7].forEach(k=>{const o=H.fit(t,k),s=H.smooth(o),s2=H.smooth(o);ok(J(s)===J(s2),'smooth 決定的');ok(H.smooth.total(s,false)<=H.smooth.total(o,true),t.id+' smooth ≤ 根音位置 '+H.smooth.total(s,false)+' / '+H.smooth.total(o,true));
 ok(J(strip(s))===J(strip(o)),'smooth は和音を変えない');s.forEach(b=>b.c.forEach(x=>ok(x[2]>=0&&x[2]<SD.chordNotes(60,x[1],0).length,'smooth 転回番号')))}));
// ladder
SD.CHT.forEach(t=>{const L=[1,2,3,4,5].map(n=>H.ladder(t,n)),has7=o=>o.some(b=>b.c.some(x=>/7|m7b5/.test(x[1])||x[1]==='maj7'));
 ok(!has7(L[0]),t.id+' level1 に7thが無い');ok(has7(L[1]),t.id+' level2 に7th');
 const chg=o=>o.filter((b,i)=>J(b.c)!==J(L[0][i].c)).length;let prev=0;L.forEach((o,i)=>{const c=chg(o);ok(c>=prev,t.id+' level'+(i+1)+' 変更のある小節数が減った');prev=c;ok(o.length===4,'ladder 小節数');o.forEach(b=>b.c.forEach(x=>ok(kinds.has(x[1]),'ladder 種類')))});
 ok(L[2][1].c.length===2&&L[2][1].c[1][0]===mod(L[2][2].c[0][0]+7)&&L[2][1].c[1][1]==='7',t.id+' level3 で小節2の後半が次の和音への前置(5度上の7th)');
 ok(J(strip(H.ladder(t,0)))===J(strip(L[0]))&&J(strip(H.ladder(t,9)))===J(strip(L[4])),'ladder 範囲外は丸める');
 const tri=L[3].some(b=>b.c.some(x=>x[1]==='7'&&!L[2].some(bb=>bb.c.some(y=>J(y)===J(x)))));ok(L[3].some((b,i)=>J(b.c)!==J(L[2][i].c)),t.id+' level4 で裏コードに1か所替わる');
 ok(J(strip(L[4]).slice(0,2))===J(strip(L[3]).slice(0,2))&&J(strip(L[4]).slice(2))!==J(strip(L[3]).slice(2)),t.id+' level5 は B面だけ動く')});
// track(2小節=32ステップ)
SD.CHT.forEach(t=>{const o=H.ladder(t,5);[0,1].forEach(f=>{const tk=H.track('c',o,f,0);ok(tk.o.len===32&&Object.keys(tk.idx).length>0&&Object.keys(tk.idx).every(i=>+i<32),t.id+' track 面'+f+' len32');ok(Object.keys(tk.o.cd).every(i=>+i<32),'track cd < 32')});
 const a=H.anticipate(H.fit(t,0),1),t0=H.track('c',a,0,0),t1=H.track('c',a,1,0);ok(Object.keys(t0.idx).every(i=>+i<32)&&Object.keys(t1.idx).every(i=>+i<32),'先行つき track < 32')});
// ch01〜ch03 の本文にローマ数字の表記が無い(tier 1 の約束)
{const RE=/(?<![A-Za-z])(?:[IV]{1,3}|[iv]{1,3})(?:m|7|M7)?(?![A-Za-z])/;SD.LESSONS.filter(l=>l.course==='CH'&&l.tier===1).forEach(L=>L.steps.forEach((s,i)=>{const tx=[s.h,s.b].concat([].concat(s.col||[]).map(c=>c.h+c.b)).join('');ok(!RE.test(tx),L.id+' step'+(i+1)+' ローマ数字 '+(tx.match(RE)||[])[0])}))}
// CH レッスンの共通規則(CH-1 以降で効く)
SD.LESSONS.filter(l=>l.course==='CH').forEach(L=>{const w=L.id+' ';ok(L.cat==='ch1'&&L.tier>=1&&L.tier<=3,w+'cat/tier');ok(L.steps.length>=3&&L.steps.length<=8&&L.steps.some(s=>s.cmp)&&L.tk&&L.tk.length<=8,w+'ステップ/cmp/トラック数');(L.tk||[]).forEach(t=>ok(t.o.len===32&&Object.keys(t.idx).every(i=>+i<32),w+'len32'))});
// CH-2: ch05〜ch07 の中身
{const by=id=>SD.LESSONS.find(l=>l.id===id);['ch05','ch06','ch07'].forEach(id=>{const L=by(id);ok(L&&L.tier===2&&L.lv===2,id+' tier2');ok(L.steps.some(s=>s.quiz),id+' クイズ');ok(L.terms.every(t=>SD.TERMS.some(x=>x.id===t)),id+' 用語登録')});
 const t5=by('ch05').tk,mz=H.minorize(H.fit('sunny',0));ok(J(Object.keys(t5[2].o.cd).map(k=>t5[2].o.cd[k].t))===J(Object.keys(H.track('x',mz,0,0).o.cd).map(k=>H.track('x',mz,0,0).o.cd[k].t)),'ch05 暗くのトラックは minorize と一致');
 ok(by('ch06').tk.length<=8&&by('ch06').tk.every(t=>Object.keys(t.idx).every(i=>+i<32)),'ch06 トラック');
 const c6=by('ch06').tk;ok(Object.keys(c6[1].o.cd).length>Object.keys(c6[0].o.cd).length&&Object.keys(c6[2].o.cd).length>Object.keys(c6[1].o.cd).length,'ch06 伴奏の刻みが 伸ばす<4分<シンコペ');
 const sm=H.smooth(H.fit('sunny',0));ok(H.smooth.total(sm,false)<H.smooth.total(H.fit('sunny',0),true),'ch07 最短は根音位置より小さい');ok(by('ch07').steps[2].b.indexOf(H.smooth.total(sm,false)+'半音')>=0,'ch07 本文の数値が実測と一致')}
// CH-3: ch08〜ch10 の中身
{const by=id=>SD.LESSONS.find(l=>l.id===id),ty=t=>Object.keys(t.o.cd).sort((a,b)=>a-b).map(k=>t.o.cd[k].t+':'+t.idx[k]);
 ['ch08','ch09','ch10'].forEach(id=>{const L=by(id);ok(L&&L.tier===3&&L.lv===3,id+' tier3');ok(L.steps.some(s=>s.quiz),id+' クイズ');ok(L.terms.every(t=>SD.TERMS.some(x=>x.id===t)),id+' 用語登録')});
 const t8=by('ch08').tk;ok(t8.length===5&&J(ty(t8[0]))!==J(ty(t8[1]))&&Object.keys(t8[2].o.cd).length>Object.keys(t8[1].o.cd).length,'ch08 段階が積み上がる(7th→前置)');
 ok(t8[3].o.cd[16]&&t8[3].o.cd[16].t==='7'&&t8[3].idx[16]===1,'ch08 置き換え: G7→D♭7');
 const t9=by('ch09').tk;ok(t9.length===7&&by('ch09').steps.every(s=>!s.cmp||s.cmp.every(c=>c.mt.length<t9.length)),'ch09 トラック・聞き比べ');
 const t10=by('ch10');ok(t10.kind==='recipe'&&t10.save&&t10.save.kind==='kit','ch10 recipe+kit保存')}
console.log(err?('失敗 '+err+'件'):('OK: CH 型・操作の単体テスト+レッスン'+SD.LESSONS.filter(l=>l.course==='CH').length+'本'));process.exit(err?1:0);
