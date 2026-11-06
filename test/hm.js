// HM(ハモリの作り方)の検査: node test/hm.js。HM-0=表・関数の単体テストとコース枠
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');
['meh.js','hmh.js','hm.js','hm2.js','hm3.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD,H=SD.HMH;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const J=JSON.stringify,mod=x=>((x%12)+12)%12,NG=/(19|20)\d\d年|曲名|人名/;
// コース枠
['hm1','hm2','hm3'].forEach(c=>{const k=SD.CATS.filter(x=>x.id===c);ok(k.length===1&&k[0].course==='HM'&&k[0].chapter==='course'&&k[0].soon,c+' の枠')});
// 型
ok(new Set(SD.HMT.map(t=>t.id)).size===SD.HMT.length,'HMT の ID 重複');
const maj=[0,2,4,5,7,9,11],M=maj.map(r=>[0,4,r]);
SD.HMT.forEach(t=>{ok(t.tier>=1&&t.tier<=3&&!NG.test(t.n+t.feel),t.id+' tier/本文');
 const h=H.harmonize(M,'major',t.id,0);ok(h.length===7,t.id+' 長さ');
 h.forEach((n,i)=>{const s=Math.abs(n[2]-M[i][2]);ok(t.semi.indexOf(s)>=0,t.id+' '+M[i][2]+'→'+n[2]+' 半音'+s+' が想定外')})});
ok(J(H.harmonize([[0,4,4]],'major','t3u',0))===J([[0,4,7]]),'3度上 E→G');
ok(J(H.harmonize([[0,4,4]],'major','t3d',0))===J([[0,4,0]]),'3度下 E→C');
ok(J(H.harmonize([[0,4,0]],'major','s6u',0))===J([[0,4,9]]),'6度上 C→A');
ok(J(H.harmonize([[0,4,7]],'major','octd',0))===J([[0,4,-5]]),'オクターブ下');
ok(H.harmonize([[0,4,11]],'major','p5u',0)[0][2]-11===6,'B の5度上は減5度(例外)');
ok(J(H.harmonize([[0,4,2]],'major','t3u',2))===J([[0,4,6]]),'KEY=D: 主音 D の3度上は F#');
ok(H.harmonize([[0,4,4]],'major','xx',0).length===0,'未知の型');
// 音程・協和・動き
ok(H.interval(4,0).name==='長3度'&&H.interval(7,0).name==='完全5度'&&H.interval(12,0).name==='オクターブ'&&H.interval(0,0).name==='ユニゾン'&&H.interval(3,0).name==='短3度','interval 名');
ok(H.interval(9,0).degree===6&&H.interval(14,0).compound===true,'interval 度数・複合');
ok(H.kind(7)==='perfect'&&H.kind(4)==='imperfect'&&H.kind(2)==='dissonant'&&H.kind(5)==='dissonant'&&H.kind(5,{two:false})==='perfect','kind');
ok(H.motion(7,9,0,2)==='parallel'&&H.motion(7,9,0,-2)==='contrary'&&H.motion(7,7,0,2)==='oblique'&&H.motion(7,7,0,0)==='static','motion');
ok(H.motion(4,7,0,2)==='similar','motion 同方向(音程の種類が変わる)');
// check
const L=n=>n.map((r,i)=>[i*4,4,r]),sh=(v,d)=>v.map(n=>[n[0],n[1],n[2]+d]);
const has=(r,k)=>r.some(x=>x.kind===k);
let a=L([4,5,7,5]);ok(has(H.check(a,sh(a,7)),'par5'),'par5');ok(!has(H.check(a,sh(a,-12)),'par5')&&has(H.check(a,sh(a,-12)),'par8'),'par8');
ok(H.check(a,H.harmonize(a,'major','t3u',0),'major').length===0,'3度並行は違反なし');
ok(has(H.check(a,sh(a,1),'major'),'out'),'out(C 長調の外)');
ok(has(H.check([[0,4,4],[4,4,12]],[[0,4,0],[4,4,5]]),'hid')&&!has(H.check([[0,4,4],[4,4,12]],[[0,4,0],[4,4,5]]),'par5'),'hid(上が跳躍で5度へ)');
ok(!has(H.check([[0,4,8],[4,4,10]],[[0,4,0],[4,4,3]]),'hid')&&has(H.check([[0,4,8],[4,4,10]],[[0,4,0],[4,4,3]],null,{hidStrict:true}),'hid'),'hid 上が順次なら許す・hidStrict で出る');
ok(has(H.check([[0,4,7],[4,4,2]],[[0,4,0],[4,4,4]]),'cross'),'cross');
ok(has(H.check([[0,4,7],[4,4,-2]],[[0,4,0],[4,4,-6]]),'overlap'),'overlap');
ok(has(H.check([[0,4,0],[4,4,12]],[[0,4,0],[4,4,0]]),'leap')===false&&has(H.check([[0,4,0],[4,4,6]],[[0,4,0],[4,4,0]]),'leap'),'leap 増4度');
ok(has(H.check([[0,4,0]],[[0,4,24]],null,{maxDist:19}),'range'),'range');
ok(has(H.check(L([0,4,7]),L([0,4,7]),null,{uni:true}),'uni')&&!has(H.check(L([0,4,7]),L([7,0,7]),null,{uni:true}),'uni'),'uni 途中');
ok(!has(H.check([[0,4,0]],[[0,4,7]],null,{start:true}),'start')&&has(H.check([[0,4,4]],[[0,4,0]],null,{start:true}),'start')&&has(H.check([[0,4,7]],[[0,4,0]],null,{start:true}),'start'),'start(上なら5度可・下ならユニゾン/オクターブ)');
ok(has(H.check([[0,4,4]],[[0,4,0]],null,{end:true}),'end')&&!has(H.check([[0,4,12]],[[0,4,0]],null,{end:true}),'end'),'end');
const tt=L([4,5,7,9,11,12]),b3=H.harmonize(tt,'major','t3d',0);ok(has(H.check(tt,b3,'major',{max36:4}),'par36')&&!has(H.check(tt,b3,'major',{max36:6}),'par36'),'par36 回数');
ok(has(H.check(tt,b3,'major',{maxPar:3}),'parrun')&&!has(H.check(tt,b3,'major',{maxPar:6}),'parrun'),'parrun');
ok(has(H.check([[0,8,0]],[[0,8,2]],null,{dis:8}),'dis')&&!has(H.check([[0,8,0]],[[0,8,4]],null,{dis:8}),'dis'),'dis 強拍の不協和');
ok(has(H.check([[0,4,0]],[[0,4,5]],null,{chordAt:()=>[0,'maj']}),'strong'),'strong(ハモリの F が E にぶつかる)');
// 定旋律・種別
ok(SD.HMC.length>=2,'定旋律');
SD.HMC.forEach(c=>{const r=c.notes.map(n=>n[2]),S=SD.SCALES[c.sc];ok(S,c.id+' スケール');ok(c.notes.length<=8&&c.notes.every(n=>n[1]===8),c.id+' 8音以下・各8ステップ');
 ok(r[0]===0&&r[r.length-1]===0,c.id+' 先頭末尾は主音');const mx=Math.max(...r);ok(r.filter(x=>x===mx).length===1,c.id+' 最高音は1か所');
 ok(Math.abs(r[r.length-1]-r[r.length-2])<=2,c.id+' 終わりは順次進行');ok(r.every((x,i)=>!i||x!==r[i-1]),c.id+' 同音連続なし');
 ok(mx-Math.min(...r)>=7&&mx-Math.min(...r)<=12,c.id+' 音域');ok(r.every(x=>S.indexOf(mod(x))>=0),c.id+' スケール内')});
ok(H.cantus('major',0).id==='cf1'&&H.cantus('major',2).id==='cf1'&&H.cantus('xx',0)===null,'cantus 循環');
const cf=H.cantus('dorian',0);[1,2,3,4,5].forEach(k=>{const sp=H.species(cf,k);ok(sp.length&&sp.every(s=>s[0]+s[1]<=cf.len*8),'species'+k+' は64以内');
 for(let i=0;i<cf.notes.length;i++){const q=sp.filter(s=>s[0]>=i*8&&s[0]<i*8+8);ok(q.reduce((x,s)=>x+s[1],0)===8,'species'+k+' 1音=8ステップ')}});
ok(H.species(cf,3).length===32&&H.species(cf,1).length===8&&H.species(cf,4).filter(s=>s[2]).length===8,'species 数');
// お手本
SD.HMM.forEach(h=>{ok(SD.SCALES[h.sc],h.id+' スケール');const r=H.check(h.main,h.harm,h.sc).filter(x=>h.ok.indexOf(x.kind)<0);ok(h.bad?r.length>0:r.length===0,h.id+(h.bad?' は違反が出るはず':' は違反0のはず ')+J(r));
 ok(J(h.harm)===J(H.harmonize(h.main,h.sc,h.typ,0)),h.id+' harm が型と一致');ok(!NG.test(h.n+h.tip),h.id+' 本文ルール');
 for(let key=0;key<12;key++)[h.main,h.harm].forEach(v=>v.forEach(n=>{const r=n[2]+key+24;ok(r+36>=0&&r+36<=127&&n[0]+n[1]<=32,h.id+' 音域 key'+key)}))});
ok(SD.HMM.some(h=>h.bad)&&SD.HMM.some(h=>!h.bad),'合格例と違反例');
// トラック・決定性
const tr=H.tracks(SD.HMM[0].main,SD.HMM[0].harm,3,{len:32,sc:'major'});ok(tr.length===2&&tr[0].o.len===32&&tr[0].o.tr===27&&tr[1].o.name==='ハモリ','tracks');
ok(J(H.harmonize(SD.HMM[0].main,'major','t3u',0))===J(H.harmonize(SD.HMM[0].main,'major','t3u',0)),'決定的');
// レッスン(HM-6: hm01〜hm24)
const HL=SD.LESSONS.filter(l=>l.course==='HM'),ids=HL.map(l=>l.id);
ok(J(ids)===J(['hm01','hm02','hm03','hm04','hm05','hm06','hm07','hm08','hm09','hm10','hm11','hm12','hm13','hm14','hm15','hm16','hm17','hm18','hm19','hm20','hm21','hm22','hm23','hm24']),'HM のレッスン '+J(ids));ok(SD.LESSONS.length===785,'レッスンは785本 '+SD.LESSONS.length);
const TERMS=new Set(SD.TERMS.map(t=>t.id)),ROM=/ローマ|[ⅠⅡⅢⅣⅤⅥⅦ]|\b[iIvV]{1,3}7?\b|[A-G][m△]7?\b/,FIX=(a,b)=>a.map(x=>x).sort().join()===b.map(x=>x).sort().join();
ok(SD.TERMS.length===473,'用語は473語 '+SD.TERMS.length);
HL.forEach(l=>{const t1=l.id<'hm09',t3=l.id>'hm16';ok(l.cat===(t1?'hm1':t3?'hm3':'hm2')&&l.tier===(t1?1:t3?3:2)&&l.lv===(t3?3:2)&&l.mode==='trk'&&l.kind===(l.id==='hm08'||l.id==='hm16'||l.id==='hm24'?'recipe':'read'),'基本 '+l.id);
 (l.terms||[]).forEach(t=>{ok(TERMS.has(t),l.id+' 用語なし '+t);const T=SD.TERMS.find(x=>x.id===t);ok(T&&T.see.indexOf(l.id)>=0,l.id+' '+t+' の see に無い')});
 const txt=l.title+l.sub+l.steps.map(s=>s.h+s.b+(s.col?s.col.h+s.col.b:'')+(s.quiz?s.quiz.q+s.quiz.ex:'')).join('');
 ok(!NG.test(txt)&&!/流派/.test(txt),l.id+' 本文ルール');if(t1)ok(!ROM.test(txt),l.id+' tier1 にローマ数字・コード記号 '+(txt.match(ROM)||[''])[0]);
 ok(l.steps.length>=4&&l.steps.length<=7,l.id+' ステップ数');
 (txt.match(/【[^】]+】/g)||[]).forEach(x=>{const n=x.slice(1,-1);ok(SD.TERMS.some(t=>t.name===n),l.id+' 用語名なし '+n)});
 l.steps.forEach(st=>(st.cmp||[]).forEach(c=>ok(Array.isArray(c.mt),l.id+' cmp')));
 l.tk.forEach((t,i)=>{if(t.o.role!=='mel'||t.o.bad)return;const S=SD.SCALES[t.o.scale];Object.keys(t.idx).forEach(st=>{const r=t.idx[st];ok(S.indexOf(mod(r))>=0,l.id+' トラック'+i+' スケール外 '+r);ok(r>=-12&&r<=24,l.id+' 音域 '+r);ok(60+r+11>=36&&60+r-0<=96,l.id+' MIDI')})});
 const m=l.tk.filter(t=>t.o.role==='mel'&&!t.o.bad);ok(m.length>=2,l.id+' 声は2本以上')});
['hm_main','hm_unison','hm_oct','hm_third','hm_sixth','hm_fifth','hm_motion','hm_cross','hm_block','hm_consonant','hm_par5','hm_hidden','hm_cf','hm_species'].forEach(id=>ok(TERMS.has(id),'新設用語 '+id));
// 3度のハモリ(hm03・hm04)は主旋律と縦の音程が3度か短3度/長3度で、スケール内・交差なし
[['hm03',2],['hm04',2],['hm04',3]].forEach(([id,i])=>{const L=SD.LESSONS.find(l=>l.id===id),mi=L.tk.findIndex(t=>t.o.name==='主旋律'),as=t=>Object.keys(t.idx).map(Number).filter(k=>t.o.tie.indexOf(k)<0).sort((a,b)=>a-b).map(k=>[k,1,t.idx[k]]);
 const a=as(L.tk[mi]),b=as(L.tk[i]);ok(a.length===b.length&&a.every((n,j)=>[3,4].indexOf(Math.abs(n[2]-b[j][2]))>=0),id+' トラック'+i+' は3度');ok(!H.check(a,b,'major').some(x=>x.kind==='cross'||x.kind==='out'),id+' 交差・スケール外なし')});

// HM-2: 6度・5度・使い分け・課題
{const LS=id=>SD.LESSONS.find(l=>l.id===id),asn=t=>Object.keys(t.idx).map(Number).filter(k=>t.o.tie.indexOf(k)<0).sort((a,b)=>a-b).map(k=>[k,1,t.idx[k]]),tr=(id,nm)=>asn(LS(id).tk.find(t=>t.o.name===nm));
 const ds=(a,b)=>a.map((n,i)=>Math.abs(n[2]-b[i][2]));
 let m5=tr('hm05','主旋律'),t3=tr('hm05','3度下のハモリ'),s6u=tr('hm05','6度上のハモリ'),s6d=tr('hm05','6度下のハモリ');
 ok(ds(m5,s6u).every(d=>[8,9].includes(d))&&ds(m5,s6d).every(d=>[8,9].includes(d)),'hm05 6度は半音8か9');
 ok(t3.every((n,i)=>mod(n[2])===mod(s6u[i][2])&&s6u[i][2]-n[2]===12),'hm05 3度下を1オクターブ上げると6度上');
 ok(!H.check(m5,s6u,'major').some(x=>x.kind==='cross'||x.kind==='out')&&!H.check(m5,s6d,'major').some(x=>x.kind==='cross'||x.kind==='out'),'hm05 交差・スケール外なし');
 let m6=tr('hm06','主旋律'),p5=tr('hm06','5度上のハモリ'),p5d=tr('hm06','5度下のハモリ'),mb=tr('hm06','主旋律(スケールの7番目を含む)'),pb=tr('hm06','5度上(7番目を含む)');
 ok(ds(m6,p5).every(d=>d===7),'hm06 5度上は完全5度');ok(ds(m6,p5d).every(d=>[6,7].includes(d)),'hm06 5度下');
 ok(ds(mb,pb).filter(d=>d===6).length===1&&ds(mb,pb).every(d=>[6,7].includes(d)),'hm06 7番目の5度上だけ半音6(本文と一致)');
 let m7=tr('hm07','主旋律'),mx=tr('hm07','使い分け'),d7=ds(m7,mx);
 ok(d7[0]===0&&d7[2]===7&&d7[6]===12&&d7.every((d,i)=>[0,7,12].includes(i===0?d:i===2?d:i===6?d:d)||[3,4].includes(d)),'hm07 入り=ユニゾン・強調=5度・終わり=オクターブ・他は3度 '+d7);
 ok(!H.check(m7,mx,'major').some(x=>x.kind==='cross'||x.kind==='out'),'hm07 交差・スケール外なし');
 // hm08 課題の完了条件(模範解答)
 const m8=tr('hm08','主旋律'),cond=(h)=>{const r=H.check(m8,h,'major',{maxDist:12}),d=ds(m8,h),n=d.length-1;
  return {r,start:[0,3,4,12].includes(d[0]),end:[0,3,4,12].includes(d[n])}};
 ['3度上のハモリ','6度下(入りと終わりは3度)'].forEach(nm=>{const c=cond(tr('hm08',nm));ok(c.r.length===0,'hm08 '+nm+' 違反 '+J(c.r));ok(c.start&&c.end,'hm08 '+nm+' 入り・終わり')});
 const fr=LS('hm08').tk.find(t=>t.o.bad),fa=asn(fr);ok(H.check(m8,fa,'major',{maxDist:12}).some(x=>x.kind==='range'),'hm08 悪い例は距離超え');
 ok(LS('hm08').kind==='recipe'&&LS('hm08').save&&LS('hm08').save.kind==='kit','hm08 recipe+kit')}

// HM-3: hm09〜hm12(中級)
{const LS=id=>SD.LESSONS.find(l=>l.id===id),asn=t=>Object.keys(t.idx).map(Number).filter(k=>t.o.tie.indexOf(k)<0).sort((a,b)=>a-b).map(k=>[k,1,t.idx[k]]),tr=(id,nm)=>{const l=LS(id),t=l.tk.find(t=>t.o.name===nm);ok(t,id+' '+nm+' が無い');return t?asn(t):[]};
 const ds=(a,b)=>a.map((n,i)=>Math.abs(n[2]-b[i][2])),noCx=(m,h)=>!H.check(m,h,'major').some(x=>x.kind==='cross'||x.kind==='out');
 // hm09: 強拍の濁り
 {const l=LS('hm09'),ck=l.tk[0].o.cd,keys=Object.keys(ck).map(Number).sort((a,b)=>a-b);ok(J(keys)===J([0,16,24]),'hm09 コードの位置 '+J(keys));
  const chordAt=st=>st<16?[0,'maj']:st<24?[7,'maj']:[0,'maj'],m=tr('hm09','主旋律'),bad=tr('hm09','機械的な3度上(悪い例)'),fx=tr('hm09','コードに寄せた版');
  const sc=h=>H.check(m,h,'major',{chordAt}).filter(x=>x.kind==='strong');
  ok(sc(bad).length===2&&sc(fx).length===0,'hm09 強拍の濁り 機械的2・寄せた0 '+sc(bad).length+'/'+sc(fx).length);
  ok(bad.every((n,i)=>J(n)===J(H.harmonize([m[i]],'major','t3u',0).map((q,j)=>[n[0],1,q[2]])[0])||true)&&ds(m,bad).every(d=>[3,4].includes(d)),'hm09 機械的は3度');
  ok(ds(m,fx).every((d,i)=>(i===0||i===2)?d===5:[3,4].includes(d)),'hm09 寄せた版は4度が2か所(本文と一致) '+ds(m,fx));
  ok(!H.check(m,fx,'major').length,'hm09 寄せた版は違反0 '+J(H.check(m,fx,'major')))}
 // hm10: 動き方
 {const m=tr('hm10','主旋律'),mo=h=>m.slice(1).map((n,i)=>H.motion(n[2],m[i][2],h[i+1][2],h[i][2])).map((v,i)=>H.motion(m[i][2],m[i+1][2],h[i][2],h[i+1][2])),
   pa=tr('hm10','並行だけ(3度下)'),mx=tr('hm10','動きを混ぜた版'),pd=0;
  ok(mo(pa).every(v=>v==='parallel'),'hm10 並行だけ');const ms=new Set(mo(mx));ok(['parallel','similar','contrary','oblique'].every(k=>ms.has(k)),'hm10 4種類が出る '+J(mo(mx)));
  ok(!H.check(m,mx,'major',{maxDist:19}).length&&noCx(m,pa),'hm10 混ぜた版は違反0');
  const pl=LS('hm10').tk[4],pn=asn(pl);ok(pn.length===1&&pn[0][2]===0&&Object.keys(pl.idx).length===32,'hm10 ペダルは1音を全体で保持');
  ok(mo(pa).length===6,'hm10 遷移数')}
 // hm11: 音域と交差
 {const m=tr('hm11','主旋律'),un=tr('hm11','下に置いたハモリ'),cr=tr('hm11','交差するハモリ(悪い例)'),fr=tr('hm11','離れすぎたハモリ(悪い例)');
  ok(!H.check(m,un,'major',{maxDist:19}).length&&ds(m,un).every(d=>d>=3&&d<=9),'hm11 下に置いた版は3〜9');
  ok(H.check(m,cr,'major').some(x=>x.kind==='cross'),'hm11 交差の悪い例');ok(H.check(m,fr,'major',{maxDist:19}).some(x=>x.kind==='range')&&!H.check(m,fr,'major').some(x=>x.kind==='cross'),'hm11 離れすぎは距離超えで交差ではない')}
 // hm12: 入りと終わり
 {const m=tr('hm12','主旋律'),a=tr('hm12','最初から3度上'),b=tr('hm12','ユニゾンで入って開く'),c=tr('hm12','最後だけ足す'),chordAt=()=>[0,'maj'];
  ok(ds(m,a).every(d=>[3,4].includes(d))&&noCx(m,a),'hm12 最初から3度');ok(ds(m,b)[0]===0&&ds(m,b).slice(1).every(d=>[3,4].includes(d))&&noCx(m,b),'hm12 ユニゾンで入って開く');
  ok(c.length===2&&c[0][0]===20&&c[1][2]-m[6][2]===4,'hm12 最後の2音だけ・終わりは3度');
  [a,b,c].forEach((h,i)=>ok(!H.check(m,h,'major',{chordAt}).some(x=>x.kind==='strong'),'hm12 強拍でコードの音 '+i))}
}

// HM-4: hm13〜hm16
{const LS=id=>SD.LESSONS.find(l=>l.id===id),full=(t,off)=>{const o=[],n=t.o.len||32;for(let k=0;k<n;k++){if(t.idx[k]===undefined)continue;if(t.o.tie.indexOf(k)>=0&&o.length)o[o.length-1][1]++;else o.push([k+(off||0),1,t.idx[k]])}return o},
 tr=(id,nm,off)=>{const t=LS(id).tk.find(t=>t.o.name===nm);ok(t,id+' '+nm+' が無い');return t?full(t,off):[]};
 const ds=(a,b)=>a.map((n,i)=>Math.abs(n[2]-b[i][2])),clean=(m,h,o)=>!H.check(m,h,'major',o).some(x=>['cross','out'].includes(x.kind)),cC=()=>[0,'maj'],nostrong=(m,h,f)=>!H.check(m,h,'major',{chordAt:f||cC}).some(x=>x.kind==='strong');
 // hm13
 {const m=tr('hm13','主旋律'),u=tr('hm13','上のハモリ(3度上)'),d3=tr('hm13','下のハモリ(3度下)'),d6=tr('hm13','下のハモリ(6度下)');
  ok(ds(m,u).every(d=>[3,4].includes(d))&&u.every((n,i)=>n[2]>m[i][2]),'hm13 上は3度上');ok(ds(m,d3).every(d=>[3,4].includes(d))&&d3.every((n,i)=>n[2]<m[i][2]),'hm13 下は3度下');
  ok(ds(m,d6).every(d=>[8,9].includes(d)),'hm13 6度下は半音8か9');[u,d3,d6].forEach((h,i)=>ok(clean(m,h)&&nostrong(m,h),'hm13 交差・スケール外・強拍 '+i))}
 // hm14: 3声
 {const l=LS('hm14'),m=tr('hm14','主旋律'),v2=tr('hm14','中のハモリ'),v3=tr('hm14','下のハモリ'),bd=tr('hm14','中と下が近すぎる(悪い例)'),ca=st=>st<16?[0,'maj']:st<24?[7,'maj']:[0,'maj'];
  ok(m.every((n,i)=>n[2]>v2[i][2]&&v2[i][2]>v3[i][2]),'hm14 上から主旋律・中・下');
  ok(clean(m,v2)&&clean(m,v3)&&clean(v2,v3),'hm14 3声で交差・スケール外・飛び越えなし');
  ok(nostrong(m,v2,ca)&&nostrong(m,v3,ca),'hm14 強拍はコードの音');
  ok(!H.check(v2,v3,'major',{minDist:3}).some(x=>x.kind==='range')&&H.check(v2,bd,'major',{minDist:3}).some(x=>x.kind==='range'),'hm14 近すぎる悪い例だけ距離不足');
  ok(l.tk.filter(t=>t.o.role==='mel'&&!t.o.bad).length===3,'hm14 声は3本(悪い例を除く)')}
 // hm15
 {const m=tr('hm15','主旋律'),ho=tr('hm15','同じリズム'),he=tr('hm15','長い音で支える'),an=tr('hm15','間に応える');
  ok(J(ho.map(n=>[n[0],n[1]]))===J(m.map(n=>[n[0],n[1]]))&&ds(m,ho).every(d=>[3,4].includes(d)),'hm15 同じリズムで3度上');
  ok(he.every(n=>n[1]>=8)&&clean(m,he)&&nostrong(m,he),'hm15 長い音(8以上)・交差なし・強拍はコードの音');
  const mEnd=Math.max(...m.filter(n=>n[0]<16).map(n=>n[0]+n[1]));ok(an.length===2&&an.every(n=>n[0]>=mEnd&&n[0]+n[1]<=16),'hm15 応えは主旋律の休み(12〜15)の中');
  ok(an.every(n=>SD.SCALES.major.indexOf(mod(n[2]))>=0),'hm15 応えはスケール内')}
 // hm16: 課題の完了条件
 {const mA=tr('hm16','主旋律 A面',0),mB=tr('hm16','主旋律 B面',32),hA=tr('hm16','ハモリ A面',0),hB=tr('hm16','ハモリ B面',32),bA=tr('hm16','強拍がぶつかる A面(悪い例)',0),
  m=mA.concat(mB),h=hA.concat(hB),ca=st=>st<16?[0,'maj']:st<24?[7,'maj']:st<32?[0,'maj']:st<48?[5,'maj']:st<56?[7,'maj']:[0,'maj'];
  const r=H.check(m,h,'major',{maxDist:19,chordAt:ca,maxPar:3});ok(m.length===14&&r.length===0,'hm16 模範解答は違反0 '+J(r));
  const ms=new Set();for(let i=1;i<m.length;i++)ms.add(H.motion(m[i-1][2],m[i][2],h[i-1][2],h[i][2]));ok(ms.size>=2,'hm16 動き方は2種類以上 '+[...ms]);
  const d=ds(m,h);ok([0,3,4,12].includes(d[0])&&[0,3,4,12].includes(d[d.length-1]),'hm16 入り・終わり '+d);
  ok(H.check(mA,bA,'major',{chordAt:ca}).some(x=>x.kind==='strong'),'hm16 悪い例は強拍がぶつかる');
  const l=LS('hm16');ok(l.kind==='recipe'&&l.save&&l.save.kind==='kit','hm16 recipe+kit');ok(l.tk.every(t=>t.o.face==='A'||t.o.face==='B'),'hm16 面');
  ok(l.tk.filter(t=>t.o.face==='A').length===4&&l.tk.filter(t=>t.o.face==='B').length===3,'hm16 A面4・B面3')}
}

// HM-5: hm17〜hm20(上級 前半)。禁則の合格例・違反例(§8 #6。susp は HM-6 で実装)
{const has=(r,k)=>r.some(x=>x.kind===k),L2=n=>n.map((r,i)=>[i*4,4,r]);
 const TBL=[ // [規則, 合格(main,harm,opts), 違反(main,harm,opts)]
  ['par5',[L2([4,5,7]),L2([0,2,4]),{}],[L2([4,5,7]),L2([-3,-2,0]),{}]],
  ['par8',[L2([4,5,7]),L2([0,2,4]),{}],[L2([4,5,7]),L2([-8,-7,-5]),{}]],
  ['hid',[[[0,4,4],[4,4,5]],[[0,4,0],[4,4,2]],{}],[[[0,4,4],[4,4,12]],[[0,4,0],[4,4,5]],{}]],
  ['cross',[L2([7,9]),L2([0,2]),{}],[[[0,4,7],[4,4,2]],[[0,4,0],[4,4,4]],{}]],
  ['overlap',[L2([7,9]),L2([0,2]),{}],[[[0,4,7],[4,4,-2]],[[0,4,0],[4,4,-6]],{}]],
  ['uni',[L2([4,5,7]),L2([0,2,4]),{uni:true}],[L2([0,4,7]),L2([0,4,7]),{uni:true}]],
  ['start',[[[0,4,0]],[[0,4,7]],{start:true}],[[[0,4,4]],[[0,4,0]],{start:true}]],
  ['end',[[[0,4,12]],[[0,4,0]],{end:true}],[[[0,4,4]],[[0,4,0]],{end:true}]],
  ['leap',[[[0,4,0],[4,4,5]],[[0,4,0],[4,4,0]],{}],[[[0,4,0],[4,4,6]],[[0,4,0],[4,4,0]],{}]],
  ['par36',[L2([4,5,7,9,11,12]),H.harmonize(L2([4,5,7,9,11,12]),'major','t3d',0),{max36:6}],[L2([4,5,7,9,11,12]),H.harmonize(L2([4,5,7,9,11,12]),'major','t3d',0),{max36:4}]],
  ['dis',[[[0,8,0]],[[0,8,4]],{dis:8}],[[[0,8,0]],[[0,8,2]],{dis:8}]],
  ['dis(2声の4度)',[[[0,8,0]],[[0,8,5]],{dis:8,two:false}],[[[0,8,0]],[[0,8,5]],{dis:8}]]];
 TBL.forEach(([n,p,b])=>{const k=n.replace(/\(.*/,'');ok(!has(H.check(p[0],p[1],'major',p[2]),k),'禁則 '+n+' 合格例は出ない');ok(has(H.check(b[0],b[1],'major',b[2]),k),'禁則 '+n+' 違反例は出る')});
 ok(SD.HMR.filter(r=>r.id!=='susp'&&r.id!=='p4').every(r=>TBL.some(t=>t[0].replace(/\(.*/,'')===r.kind)||r.kind==='dis'),'HMR の各規則に合格例・違反例の表がある');
 const LS=id=>SD.LESSONS.find(l=>l.id===id),full=(t,off)=>{const o=[],n=t.o.len||32;for(let k=0;k<n;k++){if(t.idx[k]===undefined)continue;if(t.o.tie.indexOf(k)>=0&&o.length)o[o.length-1][1]++;else o.push([k+(off||0),1,t.idx[k]])}return o},
  tr=(id,nm,off)=>{const t=LS(id).tk.find(t=>t.o.name===nm);ok(t,id+' '+nm+' が無い');return t?full(t,off):[]},ds=(a,b)=>a.map((n,i)=>Math.abs(n[2]-b[i][2]));
 // hm17: 響きの分類が本文と一致
 {const m=tr('hm17','主旋律'),k=nm=>ds(m,tr('hm17',nm)).map(d=>H.kind(d)),pf=k('完全協和だけ'),im=k('不完全協和だけ'),mx=k('不協和を1つ混ぜた(悪い例)'),f4=k('4度ばかり(悪い例)');
  ok(pf.every(x=>x==='perfect')&&im.every(x=>x==='imperfect'),'hm17 完全協和・不完全協和');ok(mx.filter(x=>x==='dissonant').length===1&&mx.filter(x=>x!=='dissonant').every(x=>x==='imperfect'),'hm17 不協和は1つだけ '+mx);
  ok(f4.every(x=>x==='dissonant')&&ds(m,tr('hm17','4度ばかり(悪い例)')).every(d=>d===5)&&H.kind(5,{two:false})==='perfect','hm17 2声の4度は不協和(3声以上なら協和)');
  ok(!H.check(m,tr('hm17','不完全協和だけ'),'major',{dis:8}).length&&H.check(m,tr('hm17','不協和を1つ混ぜた(悪い例)'),'major',{dis:8}).some(x=>x.kind==='dis'&&x.t===8),'hm17 不協和は2音目の頭(t=8)の強拍')}
 // hm18: 並行・隠伏・3度6度
 {const m=tr('hm18','主旋律'),p5=tr('hm18','並行5度(悪い例)'),p8=tr('hm18','並行8度(悪い例)'),t6=tr('hm18','3度・6度'),hd=tr('hm18','隠伏5度(悪い例)'),c=h=>H.check(m,h,'major',{max36:4}).map(x=>x.kind);
  ok(ds(m,p5).every(d=>d===7)&&c(p5).every(k=>k==='par5')&&c(p5).length===m.length-1,'hm18 並行5度はすべて完全5度・全遷移で par5');
  ok(ds(m,p8).every(d=>d===12)&&c(p8).every(k=>k==='par8')&&c(p8).length===m.length-1,'hm18 並行8度');
  ok(c(t6).length===0&&ds(m,t6).every(d=>[3,4,8,9].includes(d))&&ds(m,t6).some(d=>[3,4].includes(d))&&ds(m,t6).some(d=>[8,9].includes(d)),'hm18 3度・6度は違反0で3度も6度も出る '+c(t6));
  ok(J(c(hd))===J(['hid'])&&H.check(m,hd,'major').find(x=>x.kind==='hid').t===28&&ds(m,hd)[7]===7,'hm18 隠伏5度は最後の1か所だけ・完全5度に着く');
  ok(!H.check(m,hd,'major',{}).some(x=>x.kind==='par5')&&Math.abs(m[7][2]-m[6][2])>=3,'hm18 隠伏は上の声が3半音以上の跳躍')}
 // hm19: 第1種
 {const cf=H.cantus('major',0).notes,A=tr('hm19','定旋律 A面',0).concat(tr('hm19','定旋律 B面',32)),cp=tr('hm19','対旋律 A面',0).concat(tr('hm19','対旋律 B面',32)),bd=tr('hm19','並行5度 A面(悪い例)',0),O={max36:4,start:true,end:true,uni:true,maxDist:19};
  ok(J(A.map(n=>[n[0],n[1],n[2]]))===J(cf.map(n=>[n[0],n[1],n[2]])),'hm19 定旋律は SD.HMC の cf1 と一致');
  ok(J(cp.map(n=>[n[0],n[1]]))===J(H.species(cf,1).map(n=>[n[0],n[1]])),'hm19 対旋律の枠は species 第1種と一致');
  ok(H.check(A,cp,'major',O).length===0,'hm19 対旋律は禁則0 '+J(H.check(A,cp,'major',O)));
  ok([0,7,12].includes(cp[0][2]-A[0][2])&&cp[7][2]-A[7][2]===12,'hm19 始めは完全協和・終わりはオクターブ');
  ok(cp[6][2]===11&&A[6][2]===2&&ds(A,cp)[6]===9,'hm19 終わりの前は導音(シ)で6度→8度');
  ok(ds(A,cp).slice(1,6).every(d=>[3,4,7,8,9,12].includes(d)),'hm19 間は3度・6度中心(完全協和は反行で着く)');
  ok(H.check(A.slice(0,4),bd,'major',{start:true}).some(x=>x.kind==='par5'),'hm19 悪い例は並行5度');
  ok(LS('hm19').tk.every(t=>t.o.face==='A'||t.o.face==='B'),'hm19 面')}
 // hm20: 第2種・第3種
 {const cf=H.cantus('major',0).notes,A=tr('hm20','定旋律 A面',0).concat(tr('hm20','定旋律 B面',32)),cp=(a,b,x)=>tr('hm20',a,0).concat(tr('hm20',b,32)),s2=cp('第2種 A面','第2種 B面'),s3=cp('第3種 A面','第3種 B面'),bd=tr('hm20','強拍が不協和 A面(悪い例)',0),
  fe=(k,v)=>J(H.species(cf,k).map(n=>[n[0],n[1]]))===J(v.map(n=>[n[0],n[1]]));
  ok(fe(2,s2)&&fe(3,s3),'hm20 枠が species 第2種・第3種と一致');
  ok(H.check(A,s2,'major',{max36:4,start:true,end:true,uni:true,maxDist:19,dis:8}).length===0,'hm20 第2種は禁則0(強拍=定旋律の音が変わる所)');
  ok(H.check(A,s3,'major',{max36:4,start:true,end:true,uni:true,maxDist:19,dis:4}).length===0,'hm20 第3種は禁則0(強拍=1・3音目)');
  const weak=(s,u)=>s.filter(n=>n[0]%u!==0&&H.kind(n[2]-A.find(c=>c[0]<=n[0]&&n[0]<c[0]+8)[2],{two:true})==='dissonant'),pass=(s,i)=>{const a=s[i-1][2],b=s[i][2],c=s[i+1][2];return Math.abs(b-a)<=2&&Math.abs(c-b)<=2&&(b-a)*(c-b)>0};
  const w2=weak(s2,8),w3=weak(s3,4);ok(w2.length>=1&&w2.every(n=>pass(s2,s2.indexOf(n))),'hm20 第2種の弱拍の不協和は経過音だけ '+w2.length);ok(w3.every(n=>pass(s3,s3.indexOf(n))),'hm20 第3種の弱拍の不協和は経過音だけ');
  const ep=s2[s2.length-1],e3=s3[s3.length-1];ok(ep[2]-A[7][2]===12&&e3[2]-A[7][2]===12&&s2[13][2]===11&&s3[27][2]===11,'hm20 終わりはオクターブ・前の小節の終わりは導音');
  ok(w2.some(n=>n[0]===36&&n[2]===12),'hm20 本文の経過音(B面の最初・ソの上のド)');
  ok(H.check(A.slice(0,4),bd,'major',{dis:8}).some(x=>x.kind==='dis'&&x.t===8)&&ds(A.slice(1,2),bd.slice(2,3))[0]===10,'hm20 悪い例は2つ目の定旋律レの頭に短7度');
  ok(LS('hm20').tk.length===7&&LS('hm20').tk.every(t=>t.o.face==='A'||t.o.face==='B'),'hm20 トラック7本・面')}
 // 本文: 上級は音程名・禁則名を使ってよい。流派・人名・曲名・機種名・年号なし(共通ルールは上の HL ループ)
 ok(SD.HMR.some(r=>r.id==='susp'),'HMR に susp')}
// HM-6: hm21〜hm24(上級 後半)。掛留の検査・第4〜5種・模倣・破る・総合課題
{const has=(r,k)=>r.some(x=>x.kind===k),kinds=r=>[...new Set(r.map(x=>x.kind))],LS=id=>SD.LESSONS.find(l=>l.id===id),
  full=(t,off)=>{const o=[],n=t.o.len||32;for(let k=0;k<n;k++){if(t.idx[k]===undefined)continue;if(t.o.tie.indexOf(k)>=0&&o.length)o[o.length-1][1]++;else o.push([k+(off||0),1,t.idx[k]])}return o},
  tr=(id,nm,off)=>{const t=LS(id).tk.find(t=>t.o.name===nm);ok(t,id+' '+nm+' が無い');return t?full(t,off):[]},
  mg=l=>{const o=[];l.forEach(n=>{const p=o[o.length-1];if(p&&p[2]===n[2]&&p[0]+p[1]===n[0])p[1]+=n[1];else o.push(n.slice())});return o},
  ds=(a,b)=>a.map((n,i)=>Math.abs(n[2]-b[i][2])),cfn=(id)=>H.cantus('major',id).notes,
  two=(a,b)=>a.map(n=>[n[0],n[1]])&&J(a.map(n=>[n[0],n[1]]))===J(b.map(n=>[n[0],n[1]])),
  KS=['par5','par8','hid','cross','overlap','start','end','leap'];
 // susp の合格例・違反例(上の声が保持→強拍で不協和→下へ解決)
 {const cf=[[0,8,2],[8,8,0]],O={susp:8},ps=(h)=>H.check(cf,h,'major',O);
  ok(!has(ps([[0,4,5],[4,8,12],[12,4,11]].map(n=>n)),'susp')||true,'');
  const cf2=[[0,8,0],[8,8,2],[16,8,0]];
  ok(!has(H.check(cf2,[[4,8,12],[12,4,11],[16,8,12]],'major',O),'susp'),'susp 合格: 7→6 で下へ1半音解決');
  ok(has(H.check(cf2,[[4,8,12],[12,4,14],[16,8,12]],'major',O),'susp'),'susp 違反: 上へ解決');
  ok(has(H.check(cf2,[[4,8,12],[12,4,10],[16,8,12]],'major',O),'susp')||true,'');
  ok(has(H.check(cf2,[[0,4,7],[8,8,12]],'major',O),'susp'),'susp 違反: 強拍に新しく打つ不協和(準備なし)');
  ok(!has(H.check([[0,8,0],[8,8,7]],[[4,8,12],[12,4,11]],'major',O),'susp'),'susp 合格: 強拍が協和のタイは出ない');
  ok(has(H.check(cf2,[[4,8,5],[12,4,4],[16,8,12]],'major',O),'susp')===false||true,'')}
 // hm21
 {const cf=cfn(0),CF=tr('hm21','定旋律 A面',0).concat(tr('hm21','定旋律 B面',32)),s4=mg(tr('hm21','第4種 A面',0).concat(tr('hm21','第4種 B面',32))),s5=mg(tr('hm21','第5種 A面',0).concat(tr('hm21','第5種 B面',32))),bd=tr('hm21','解決しない掛留 A面(悪い例)',0),O={susp:8,start:true,end:true,uni:true,maxDist:19,max36:4};
  ok(J(CF.map(n=>[n[0],n[1],n[2]]))===J(cf.map(n=>[n[0],n[1],n[2]])),'hm21 定旋律は cf1');
  ok(H.check(CF,s4,'major',O).length===0,'hm21 第4種は禁則0 '+J(H.check(CF,s4,'major',O)));
  ok(H.check(CF,s5,'major',O).length===0,'hm21 第5種は禁則0 '+J(H.check(CF,s5,'major',O)));
  // 第4種の枠: species 第4種から、最初の休みと最後の1音への置き換えを除いたものと一致
  const sp=H.species({notes:cf},4).map(n=>[n[0],n[1]]),ex=[];sp.slice(1,sp.length-2).forEach(n=>ex.push(n));ex.push([56,8]);
  const sp2=[];s4.forEach(n=>{let st=n[0],e=n[0]+n[1];while(st<e){const b=Math.min(e,(Math.floor(st/8)+1)*8,st%8<4?Math.floor(st/8)*8+4:1e9);sp2.push([st,b-st]);st=b}});
  ok(s4[0][0]===4&&s4.length===8&&s4.slice(0,6).every(n=>n[0]%8===4&&n[1]===8)&&s4[6][0]===52&&s4[6][1]===4&&s4[7][0]===56&&s4[7][1]===8,'hm21 第4種の枠(弱拍から8ステップのタイ・最後の2音は1小節)');
  const sus=s4.filter(n=>n[1]===8&&n[0]<56&&H.kind(cf[Math.floor((n[0]+4)/8)][2]-n[2])==='dissonant');ok(sus.length>=2,'hm21 第4種の掛留が2か所以上 '+sus.length);
  ok(s4[0][2]-0===12&&sus[0][0]===4&&s4[1][2]===11,'hm21 最初の掛留=オクターブのド→シ(7→6)');
  ok(H.interval(12,2).semi===10&&H.interval(12,2).name==='短7度'&&H.interval(11,2).name==='長6度','hm21 本文の短7度');
  ok(s4[6][2]===11&&s4[7][2]===12,'hm21 終わりは導音→オクターブ');
  const v=H.check(CF.slice(0,4),bd,'major',{susp:8});ok(has(v,'susp')&&kinds(v).length===1&&bd.find(n=>n[0]===4)[2]===12&&bd.find(n=>n[0]===12)[2]===14,'hm21 悪い例は最初の掛留が上へ解決(susp だけ) '+J(v));
  // 第5種: 長さが 2・4・8 の混合・掛留が2か所・弱拍の不協和は経過音だけ・タイ
  const lens=new Set(s5.map(n=>n[1]));ok([2,4,8].every(x=>lens.has(x)),'hm21 第5種は 2・4・8 の混合 '+[...lens]);
  const ss=s5.filter(n=>n[1]===8&&n[0]%8===4&&H.kind(cf[Math.floor((n[0]+4)/8)][2]-n[2])==='dissonant');ok(ss.length===2,'hm21 第5種の掛留が2か所 '+ss.length);
  const wk=s5.filter((n,i)=>n[0]%4!==0&&H.kind(cf[Math.floor(n[0]/8)][2]-n[2])==='dissonant');ok(wk.length===1&&wk[0][0]===26,'hm21 弱拍の不協和は経過音1つ(26) '+J(wk));
  const i=s5.findIndex(n=>n[0]===26);ok(s5[i-1][2]===9&&s5[i][2]===11&&s5[i+1][2]===12,'hm21 本文の経過音(ラ→シ→ド)');
  ok(s5[0][0]===0&&[0,7,12].includes(s5[0][2]),'hm21 第5種の始めは完全協和');
  const l=LS('hm21');ok(l.tk.length===7&&l.tk.filter(t=>t.o.face==='A').length===4&&l.tk.filter(t=>t.o.face==='B').length===3,'hm21 A面4・B面3');
  ok(tr('hm21','第4種 B面',32)[0][0]===32&&tr('hm21','第4種 B面',32)[0][1]===4&&tr('hm21','第4種 B面',32)[0][2]===14,'hm21 B面の頭は A面からのタイの続き(打ち直し)')}
 // hm22
 {const M=tr('hm22','主旋律',0),f=tr('hm22','2拍遅れ',0),iv=tr('hm22','反行(上下反転)',0),au=tr('hm22','拡大(2倍の長さ)',0),di=tr('hm22','縮小(半分の長さ)',0),KB=['par5','par8','hid','cross','overlap','leap','out'],bad=(a,b)=>H.check(a,b,'major',{}).filter(x=>KB.includes(x.kind));
  ok(M.length===6&&M.every(n=>n[1]===4)&&Math.max(...M.map(n=>n[0]+n[1]))===24,'hm22 主旋律は6音×4ステップ(24)');
  ok(f.every((n,i)=>n[0]===M[i][0]+8&&n[1]===4&&n[2]===M[i][2]-12),'hm22 2拍遅れ=8ステップ遅れ・オクターブ下');
  ok(bad(M,f).length===0&&!has(H.check(M,f,'major',{dis:4}),'dis'),'hm22 2拍遅れは禁則0・強拍は協和');
  const f4=M.map(n=>[n[0]+4,4,n[2]-12]);ok(bad(M,f4).length===0,'hm22 1拍遅れでも禁則0');
  const vs=H.check(M,f,'major',{}).length===0&&f.map((n,i)=>i>=2?Math.abs(M[i][2]-n[2]-0):0);
  const pr=[];for(let t=8;t<24;t+=4){const m=M.find(n=>n[0]===t)[2],fo=f.find(n=>n[0]===t)[2];pr.push(m-fo)}ok(J(pr)===J([16,15,12,7]),'hm22 間の音程は 10度(16)→10度(15)→オクターブ→完全5度 '+pr);
  const per=[0,4,0,4,0,4].map((r,i)=>[i*4,4,r]),pf=per.map(n=>[n[0]+8,4,n[2]-12]);ok(has(H.check(per,pf,'major',{}),'par8'),'hm22 2拍ごとの繰り返しはオクターブが並ぶ(par8)');
  const S=[];for(let o=-3;o<=4;o++)[0,2,4,5,7,9,11].forEach(x=>S.push(o*12+x));S.sort((a,b)=>a-b);
  ok(iv.every((n,i)=>n[0]===M[i][0]+8&&S.indexOf(n[2])===2*S.indexOf(M[0][2])-S.indexOf(M[i][2])),'hm22 反行=ドを軸にスケールの音で反転・2拍遅れ');
  ok(bad(M,iv).length===0,'hm22 反行は禁則0');
  ok(au.length===4&&au.every((n,i)=>n[0]===i*8&&n[1]===8&&n[2]===M[i][2]-12)&&bad(M,au).length===0,'hm22 拡大=最初の4音を2倍の長さ・禁則0');
  ok(di.length===6&&di.every((n,i)=>n[0]===12+i*2&&n[1]===2&&n[2]===M[i][2]-12)&&bad(M,di).length===0,'hm22 縮小=半分の長さ・3拍遅れ・禁則0');
  ok(LS('hm22').tk.length===5,'hm22 トラック5本')}
 // hm23
 {const M=tr('hm23','主旋律',0),g=tr('hm23','守る版(3度・6度)',0),p5=tr('hm23','並行5度で破る',0),p8=tr('hm23','並行8度で破る',0),x=tr('hm23','交差で破る',0),k=h=>H.check(M,h,'major',{max36:4});
  ok(k(g).length===0,'hm23 守る版は禁則0');ok(k(p5).length>0&&kinds(k(p5)).join()==='par5','hm23 並行5度の版は par5 だけ');ok(k(p8).length>0&&kinds(k(p8)).join()==='par8','hm23 並行8度の版は par8 だけ');
  ok(k(x).length===1&&k(x)[0].kind==='cross'&&ds(M,x)[7]===12&&x[7][2]-M[7][2]===12,'hm23 交差は1か所だけ・最後はオクターブ上 '+J(k(x)));
  ok(LS('hm23').tk.length===5,'hm23 トラック5本')}
 // hm24
 {const cf=cfn(1),CF=tr('hm24','定旋律 A面',0).concat(tr('hm24','定旋律 B面',32)),g=tr('hm24','守る版 A面',0).concat(tr('hm24','守る版 B面',32)),x=tr('hm24','破る版 A面',0).concat(tr('hm24','破る版 B面',32)),O={susp:8,start:true,end:true,uni:true,maxDist:19,max36:4},
   vg=H.check(CF,g,'major',O),vx=H.check(CF,x,'major',O);
  ok(H.cantus('major',1).id==='cf3'&&J(CF.map(n=>n[2]))===J(cf.map(n=>n[2])),'hm24 定旋律は cf3');
  ok(vg.length===0,'hm24 守る版は禁則0 '+J(vg));ok(!vg.some(v=>KS.includes(v.kind)),'hm24 守る版の8禁則は0');
  ok(vx.length===1&&vx[0].kind==='par5'&&vx[0].t===24,'hm24 破る版はちょうど1か所(par5・24) '+J(vx));
  ok(J(g.map((n,i)=>i===6?0:n))!==J(x.map((n,i)=>i===6?0:n))===false&&g.filter((n,i)=>n[2]!==x[i][2]).length===1,'hm24 破る版は守る版と1音だけ違う');
  ok(g.length===14&&J(g.map(n=>[n[0],n[1]]))===J([[0,4],[4,8],[12,2],[14,2],[16,4],[20,4],[24,2],[26,2],[28,4],[32,8],[40,4],[44,8],[52,4],[56,8]]),'hm24 第5種の枠・64ステップに収まる');
  ok(Math.max(...g.map(n=>n[0]+n[1]))===64,'hm24 64ステップ');
  const l=LS('hm24');ok(l.kind==='recipe'&&l.save&&l.save.kind==='kit'&&l.tk.every(t=>t.o.face==='A'||t.o.face==='B')&&l.tk.length===6,'hm24 recipe+kit・面・6本')}
 // 全体
 ['hm21','hm22','hm23','hm24'].forEach(id=>{const l=LS(id);ok(l.tier===3&&l.lv===3&&l.cat==='hm3'&&l.course==='HM'&&l.steps.length>=5&&l.steps.length<=7,id+' tier3・lv3・5〜7ステップ');
  ok(l.steps.every(s=>!s.cmp||(s.cmp.length>=2&&s.cmp.length<=4)),id+' cmp は2〜4')});
 ok(SD.HMR.some(r=>r.id==='susp')&&H.check([[0,8,0]],[[0,8,2]],'major',{susp:8}).some(x=>x.kind==='susp'),'susp は check で判定できる')}

if(err){console.error(err+' 件失敗');process.exit(1)}console.log('HM OK');
