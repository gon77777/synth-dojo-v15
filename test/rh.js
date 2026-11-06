// RH(リハーモナイズ)の検査: node test/rh.js。X-0=素材メロディ SD.RHM と関数 SD.RHH の単体テスト(レッスンは RH-1 から)
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');
['blh.js','rhh.js','rh.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD,R=SD.RHH;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const mod=x=>((x%12)+12)%12,J=JSON.stringify,C=(r,t)=>[r,t];
// 素材メロディ
ok(SD.RHM.length===6&&new Set(SD.RHM.map(m=>m.id)).size===6&&SD.RHM.filter(m=>m.key==='maj').length===5&&SD.RHM.filter(m=>m.key==='min').length===1,'素材は6本(長調5・短調1)');
SD.RHM.forEach(M=>{const w=M.id+' ',fl=R.flat(M.mel),cm=Object.assign([],M.orig);
 ok(M.mel.length===2&&M.orig.length===4&&M.alts.length===3,w+'2面・4小節・3案');
 ok(fl.every(n=>n[0]>=0&&n[0]+n[1]<=64&&n[1]>=1),w+'メロディが4小節内');
 for(let b=0;b<4;b++)ok(fl.some(n=>Math.floor(n[0]/16)===b&&n[1]>=8),w+' 小節'+(b+1)+' に2拍以上の長い音');
 ok(M.mel[0].every(n=>n[0]+n[1]<=32)&&M.mel[1].every(n=>n[0]+n[1]<=32),w+'A面・B面は各32ステップ以内');
 ok(R.check(M.mel,M.orig).ok,w+'orig にぶつかり '+J(R.check(M.mel,M.orig).strong));
 const mj=J(M.mel);
 M.alts.forEach(a=>{const r=R.check(M.mel,a.bars);ok(r.ok,w+a.id+' ('+a.label+') にぶつかり '+J(r.strong));ok(['sub','pre','bor','tri'].indexOf(a.method)>=0&&a.label&&a.bars.length===4,w+a.id+' 項目');
  const ch=a.bars.filter((b,i)=>J(b)!==J(M.orig[i])).length;ok(ch>=1&&ch<=2,w+a.id+' 変更のある小節 '+ch);ok(J(M.mel)===mj,w+'メロディが案で変わった')});
 ok(new Set(M.alts.map(a=>a.method)).size>=2,w+'案の方法が2種類以上');
 ok(M.alts.some(a=>a.method==='sub'),w+'同機能の代理の案');
 if(M.key==='maj')ok(M.alts.some(a=>a.method==='pre'||a.method==='bor'||a.method==='tri'),w+'前置・借用・裏のどれか')});
// keynotes
{const M=SD.RHM[0],k=R.keynotes(M.mel);ok(k.length>=4&&k.every(x=>x.st>=0&&typeof x.beat==='boolean'&&x.why.length>=1),'keynotes 形');
 for(let b=0;b<4;b++){const ns=R.flat(M.mel).filter(n=>Math.floor(n[0]/16)===b),lo=ns.reduce((a,n)=>n[1]>a[1]?n:a,ns[0]);ok(k.some(x=>x.st===lo[0]&&x.why.indexOf('long')>=0),'keynotes 小節'+b+' の最も長い音')}
 ok(k.find(x=>x.st===0).beat&&k.find(x=>x.st===8).beat&&!R.keynotes([[4,8,4],[12,4,2]]).some(x=>x.beat),'keynotes 拍頭(小節内 st が 0・8)に印');
 const e=R.keynotes([[0,8,2],[8,4,4]]);ok(e.length===2&&e[0].beat&&e[1].beat&&e[0].why[0]==='long'&&e[1].why[0]==='top','keynotes 例');
 const same=R.keynotes([[0,16,7]]);ok(same.length===1&&same[0].why.length===2,'keynotes 重なればまとめる');
 ok(J(R.keynotes(M.mel))===J(R.keynotes(M.mel)),'keynotes 決定的')}
// cands
for(let key=0;key<12;key++)[0,2,4,5,7,9,11].forEach(d=>{const pc=mod(key+d);const c7=R.cands(pc,key),c3=R.cands(pc,key,{triad:true});
 ok(c7.length===4,'cands 7th '+key+' '+pc+' = '+c7.length);ok(c3.length===3,'cands 三和音 '+key+' '+pc+' = '+c3.length);
 c7.forEach(c=>ok(R.tones([c.root,c.type]).indexOf(pc)>=0&&['root','3rd','5th','7th'].indexOf(c.role)>=0&&['T','S','D'].indexOf(c.func)>=0&&c.deg>=1&&c.deg<=7,'cands 項目'))});
{const c=R.cands(4,0).map(x=>x.root+x.type).sort();ok(J(c)===J(['0maj7','4m7','5maj7','9m7'].sort()),'cands E(C): CM7・Em7・FM7・Am7 '+J(c));
 const d=R.cands(2,0).map(x=>x.root+x.type).sort();ok(J(d)===J(['11m7b5','2m7','4m7','77'].sort()),'cands D(C): Dm7・Em7・G7・Bm7♭5 '+J(d));
 const k=R.cands(0,0).map(x=>x.root+x.type).sort();ok(J(k)===J(['0maj7','2m7','5maj7','9m7'].sort()),'cands C(C)')}
// subs
{const s=(c,k)=>R.subs(c,k).map(x=>x[0]+x[1]).sort();
 ok(J(s(C(0,'maj7'),0))===J(['4m7','9m7']),'subs I→iii・vi '+J(s(C(0,'maj7'),0)));ok(J(s(C(9,'min'),0))===J(['0maj','4min']),'subs vi(三和音)→I・iii');
 ok(J(s(C(5,'maj7'),0))===J(['2m7']),'subs IV→ii');ok(J(s(C(2,'m7'),0))===J(['5maj7']),'subs ii→IV');ok(J(s(C(7,'7'),0))===J(['11m7b5']),'subs V→vii°');
 ok(R.subs(C(1,'maj'),0).length===0,'subs 調外は空');
 ok(J(R.subs(C(7,'7'),0).map(x=>x[0]))===J([11])&&J(R.subs(C(9,'7'),2).map(x=>x[0]))===J([mod(2+11)]),'subs key移調 V→vii')}
// tritone
ok(J(R.tritone(C(7,'7')))===J([1,'7'])&&J(R.tritone(C(0,'maj7')))===J([0,'maj7'])&&J(R.tritone(C(2,'m7')))===J([2,'m7'])&&J(R.tritone(C(11,'7')))===J([5,'7']),'tritone');
// pre
{const o=SD.RHM[1].orig,r=R.pre(o,1),t=o[1][0];ok(J(r[0])===J([C(mod(t[0]+2),'m7'),C(mod(t[0]+7),'7')]),'pre 小節i の前の小節=ii-V '+J(r[0]));ok(J(r[1])===J(o[1])&&J(r[2])===J(o[2])&&J(r[3])===J(o[3]),'pre 他の小節は不変');
 const r0=R.pre(o,0);ok(J(r0[3])===J([C(2,'m7'),C(7,'7')])&&J(r0[1])===J(o[1]),'pre i=0 は最後の小節 '+J(r0[3]));
 const m=R.pre(SD.RHM[5].orig,3);ok(J(m[2][0])===J(C(mod(9+2),'m7b5')),'pre 短調の和音へは m7♭5 '+J(m[2]));ok(J(SD.RHM[1].orig)===J(SD.RHM[1].orig.map(b=>b)),'pre は元を壊さない');
 ok(J(o)===J([[C(0,'maj')],[C(5,'maj')],[C(7,'7')],[C(0,'maj')]]),'pre 元の配列を変更していない')}
// borrow
{const o=[[C(0,'maj')],[C(5,'maj7')],[C(9,'m7')],[C(7,'7')]];
 ok(J(R.borrow(o,0,0)[0])===J([C(0,'min')])&&J(R.borrow(o,1,0)[1])===J([C(5,'m7')])&&J(R.borrow(o,2,0)[2])===J([C(8,'maj7')])&&J(R.borrow(o,3,0)[3])===J([C(7,'7')]),'borrow I→i・IV→iv・vi→♭VI・V は不変');
 ok(J(R.borrow(o,0,0)[1])===J(o[1]),'borrow 他の小節は不変');ok(J(R.borrow([[C(2,'maj')]],0,2)[0])===J([C(2,'min')]),'borrow 移調');ok(R.BORROW.length===3,'BORROW 対応表');
 ok(R.check(SD.RHM[0].mel,R.borrow(SD.RHM[0].orig,3,0)).ok,'borrow I→i でぶつからない(rm1 小節4)')}
// check
{const M=SD.RHM[0],bad1=M.orig.map(b=>b.map(c=>c.slice()));bad1[1]=[C(2,'7')];const r=R.check(M.mel,bad1);
 ok(!r.ok&&r.strong.some(x=>x.bar===1&&x.note===5),'check: G7→D7 で F が F♯ と半音(strong)');
 const ok1=M.orig.map(b=>b.map(c=>c.slice()));ok1[0]=[C(9,'m7')];ok(R.check(M.mel,ok1).ok,'check: C→Am7 は合格');
 ok(R.check([[0,4,0]],[[C(0,'maj7')]]).ok,'check: 長7thの根音(メロディ=根音)は例外');
 ok(!R.check([[0,4,11]],[[C(0,'maj')]]).ok&&!R.check([[0,4,1]],[[C(0,'maj')]]).ok,'check: 長三和音の根音と長7度・短2度は strong');
 ok(R.check([[1,2,5]],[[C(2,'7')]]).ok,'check: 長さ2の拍頭でない音は対象外');ok(!R.check([[0,2,5]],[[C(2,'7')]]).ok,'check: 拍頭の音は対象');ok(!R.check([[2,4,5]],[[C(2,'7')]]).ok,'check: 長さ4以上は対象');
 ok(R.check([[0,8,7]],[[C(0,'maj'),C(2,'7')]]).ok===true&&!R.check([[0,16,7]],[[C(0,'maj'),C(2,'7')]]).ok,'check: 前半だけ鳴る音は後半の和音と比べない');}
// RH レッスンの共通規則(RH-1 以降で効く)
SD.LESSONS.filter(l=>l.course==='RH').forEach(L=>{const w=L.id+' ';ok(L.cat==='rh1'&&L.tier>=2&&L.tier<=3&&L.title.indexOf('リハーモナイズ')>=0,w+'cat/tier/題名');ok(L.steps.length>=3&&L.steps.length<=8&&L.steps.some(s=>s.cmp)&&L.tk&&L.tk.length<=8,w+'ステップ/cmp/トラック数')});
// RH-1: rh01〜rh04 の中身
{const by=id=>SD.LESSONS.find(l=>l.id===id),R=SD.RHH,m1=SD.RHM.find(m=>m.id==='rm1');
 ['rh01','rh02','rh03','rh04'].forEach(id=>{const L=by(id);ok(L&&L.tier===2&&L.lv===2&&L.title.indexOf('リハーモナイズ')>=0,id+' tier2・題名');ok(L.steps.some(s=>s.quiz),id+' クイズ');ok(L.terms.every(t=>SD.TERMS.some(x=>x.id===t)),id+' 用語登録');
  ok(L.tk.length<=8,id+' トラック数');L.steps.forEach((s,i)=>(s.cmp||[]).forEach(c=>c.mt.forEach(k=>ok(k>=0&&k<L.tk.length,id+' step'+(i+1)+' mt範囲'))));
  L.steps.forEach((s,i)=>{if(s.quiz){const kept=s.cmp.map(c=>L.tk.map((_,k)=>k).filter(k=>c.mt.indexOf(k)<0));ok(kept.every(k=>k.length>=1),id+' クイズ選択肢')}})});
 // rh04 の入れ替えはぶつからない(悪い例を除く)
 const oA=m1.orig,P=(o,c)=>{const r=o.map(b=>b.map(x=>x.slice()));Object.keys(c).forEach(i=>r[i]=c[i]);return r};
 [P(oA,{0:[[9,'m7']]}),P(oA,{0:[[9,'m7']],1:[[11,'m7b5']]}),P(oA,{0:[[4,'m7']]})].forEach((b,i)=>ok(R.check(m1.mel,b).ok,'rh04 入れ替え案'+i+' ぶつかり'));
 // rh03 の候補は 7th で4件
 ok(R.cands(4,0).length===4&&R.cands(4,0,{triad:true}).length===3,'rh03 Eの候補数');
 // rh02 要の音の本文
 ok(by('rh02').steps.some(s=>s.b.indexOf(R.keynotes(m1.mel).map(k=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][k.r%12]).join('・'))>=0),'rh02 要の音の一覧が実測と一致')}
// RH-2: rh05〜rh07 の中身
{const by=id=>SD.LESSONS.find(l=>l.id===id),R=SD.RHH,M=id=>SD.RHM.find(m=>m.id===id),m1=M('rm1'),m2=M('rm2'),m3=M('rm3');
 const P=(o,c)=>{const r=o.map(b=>b.map(x=>x.slice()));Object.keys(c).forEach(i=>r[i]=c[i]);return r};
 [['rh05',2],['rh06',3],['rh07',3]].forEach(([id,tier])=>{const L=by(id);ok(L&&L.tier===tier&&L.lv===(tier===3?3:2)&&L.title.indexOf('リハーモナイズ')>=0,id+' tier・題名');ok(L.steps.some(s=>s.quiz),id+' クイズ');ok(L.terms.every(t=>SD.TERMS.some(x=>x.id===t)),id+' 用語登録');ok(L.tk.length<=8,id+' トラック数');
  L.steps.forEach((s,i)=>(s.cmp||[]).forEach(c=>c.mt.forEach(k=>ok(k>=0&&k<L.tk.length,id+' step'+(i+1)+' mt範囲'))))});
 // rh05: 悪い例はぶつかる・直した案と CM7 の例外は合格・悪い例に bad:true
 ok(!R.check(m1.mel,P(m1.orig,{1:[[2,'7']]})).ok,'rh05 D7 はぶつかる');ok(R.check(m1.mel,P(m1.orig,{1:[[2,'m7']]})).ok,'rh05 Dm7 は合格');ok(R.check(m1.mel,P(m1.orig,{3:[[0,'maj7']]})).ok,'rh05 CM7+C は例外で合格');
 ok(by('rh05').tk.some(t=>t.o.bad),'rh05 悪い例に bad:true');
 // rh06: 前置は RHH.pre と一致・ぶつからない
 const pre=R.pre(m2.orig,1);ok(JSON.stringify(pre[0])===JSON.stringify(m2.alts[1].bars[0]),'rh06 前置は RHH.pre と一致(Gm7→C7)');ok(R.check(m2.mel,pre).ok&&R.check(m2.mel,P(m2.orig,{0:[[0,'7']]})).ok,'rh06 ぶつからない');
 // rh07: 裏コードは根音+6・メロディが収まる・低音がDから半音で降りる
 const ii=P(m3.orig,{2:[[2,'m7']]}),ur=P(ii,{3:[R.tritone([7,'7'])]});ok(JSON.stringify(R.tritone([7,'7']))==='[1,"7"]','rh07 裏=D♭7');ok(R.check(m3.mel,ii).ok&&R.check(m3.mel,ur).ok,'rh07 ぶつからない');
 const bs=by('rh07').tk;ok(bs[4].idx[31]===-11&&bs[4].idx[0]===-10&&bs[3].idx[31]===-5,'rh07 低音 D→D♭ / D→G')}
// RH-3: rh08〜rh10 の中身
{const by=id=>SD.LESSONS.find(l=>l.id===id),R=SD.RHH,M=id=>SD.RHM.find(m=>m.id===id),m2=M('rm2'),m3=M('rm3'),m4=M('rm4');
 const P=(o,c)=>{const r=o.map(b=>b.map(x=>x.slice()));Object.keys(c).forEach(i=>r[i]=c[i]);return r},J=JSON.stringify;
 ['rh08','rh09','rh10'].forEach(id=>{const L=by(id);ok(L&&L.tier===3&&L.lv===3&&L.title.indexOf('リハーモナイズ')>=0,id+' tier3・題名');ok(L.steps.some(s=>s.quiz),id+' クイズ');ok(L.terms.every(t=>SD.TERMS.some(x=>x.id===t)),id+' 用語登録');ok(L.tk.length<=8,id+' トラック数');
  L.steps.forEach((s,i)=>(s.cmp||[]).forEach(c=>c.mt.forEach(k=>ok(k>=0&&k<L.tk.length,id+' step'+(i+1)+' mt範囲'))))});
 // rh08: 借用は RHH.borrow と一致・Cm は合格・Fm は悪い例(ぶつかる・bad:true)
 ok(J(R.borrow(m2.orig,3,0)[3])==='[[0,"min"]]','rh08 I→i');ok(R.check(m2.mel,R.borrow(m2.orig,3,0)).ok,'rh08 Cm は合格');
 ok(J(R.borrow(m2.orig,1,0)[1])==='[[5,"min"]]'&&!R.check(m2.mel,R.borrow(m2.orig,1,0)).ok,'rh08 Fm はぶつかる');ok(by('rh08').tk.some(t=>t.o.bad),'rh08 悪い例に bad:true');
 // rh09: 1か所・2か所・全部は合格。変更小節数 1・2・4
 const o9=m3.orig,v1=P(o9,{0:[[9,'m7']]}),v2=P(v1,{1:[[7,'maj']]}),va=P(v2,{2:[[2,'m7']],3:[[1,'7']]}),chg=b=>b.filter((x,i)=>J(x)!==J(o9[i])).length;
 [v1,v2,va].forEach((b,i)=>ok(R.check(m3.mel,b).ok,'rh09 案'+i+' ぶつかり'));ok(chg(v1)===1&&chg(v2)===2&&chg(va)===4,'rh09 変更小節数 1・2・4');
 // rh10: 入れ替え・前置・裏はそれぞれ合格し、組み合わせても合格
 const al=m4.alts;[al[0].bars,al[1].bars,al[2].bars,P(al[0].bars,{3:al[2].bars[3]})].forEach((b,i)=>ok(R.check(m4.mel,b).ok,'rh10 案'+i+' ぶつかり'));
 ok(by('rh10').kind==='recipe'&&by('rh10').save&&by('rh10').save.kind==='kit','rh10 recipe+kit保存')}
console.log(err?('失敗 '+err+'件'):('OK: RH 素材・関数の単体テスト+レッスン'+SD.LESSONS.filter(l=>l.course==='RH').length+'本'));process.exit(err?1:0);
