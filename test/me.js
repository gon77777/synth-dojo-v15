// ME(メロディの作り方)の検査: node test/me.js。ME-0=表・関数の単体テストとコース枠、ME-1=me01〜me04・ME-2=me13〜me16・ME-3=me05〜me08 の共通規則
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');
['blh.js','meh.js','me.js','me2.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD,H=SD.MEH;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const J=JSON.stringify,mod=x=>((x%12)+12)%12,NG=/(19|20)\d\d年|曲名|人名/;
// ジャンル表
ok(SD.MEG.length===8&&new Set(SD.MEG.map(g=>g.id)).size===8,'ジャンルは8つ・ID重複なし');
const blg=SD.BLG.map(g=>g.id);
SD.MEG.forEach(g=>{ok(blg.indexOf(g.id)>=0,g.id+' は BLG に無い');ok(SD.BLG.find(b=>b.id===g.id).tier===g.tier,g.id+' tier が BLG と違う');
 ok(SD.SCALES[g.sc]&&(!g.sc2||SD.SCALES[g.sc2]),g.id+' スケールが SD.SCALES に無い');ok(g.dens[0]<=g.dens[1]&&g.span>0,g.id+' dens/span');
 g.mer.forEach(r=>ok(H.rhythm(r),g.id+' リズム型 '+r+' が無い'));ok(!NG.test(g.mv+g.avoid+g.n),g.id+' 本文ルール')});
ok(H.genre('pop')&&!H.genre('xx'),'genre');
// リズム型
ok(SD.MER.length===12&&new Set(SD.MER.map(r=>r.id)).size===12,'リズム型は12・ID重複なし');
SD.MER.forEach(r=>{let end=-1;r.steps.forEach(s=>{ok(s[0]>=end&&s[1]>=1,r.id+' 重なり/長さ');end=s[0]+s[1]});
 ok(end<=r.bl*r.bars,r.id+' は '+r.bl*r.bars+' に収まらない');ok(r.bl===(r.meter.n===12?24:16),r.id+' bl と拍子');ok(r.tier>=1&&r.tier<=3,r.id+' tier')});
ok(H.rhythm('r_shuf').meter.d===8&&H.rhythm('r_shuf').steps.every(s=>s[0]+s[1]<=24),'r_shuf は12/8・24以内');
const dn=H.density(H.place('r_dens',[0]),16,4);ok(J(dn)===J([2,4,8,2]),'r_dens の密度 '+J(dn));
// 関数
ok(J(H.scaleNotes('penta',0,0,12))===J([0,2,4,7,9,12]),'scaleNotes penta');
ok(J(H.scaleNotes('penta',2,2,14))===J([2,4,6,9,11,14]),'scaleNotes key');
ok(J(H.place('r_q8',[0,2]).slice(0,3))===J([[0,4,0],[4,2,2],[6,2,0]]),'place 循環');
ok(J(H.place([[0,2]],[5],{off:4}))===J([[4,2,5]]),'place off');
ok(J(H.rhythmOf([[0,2,5],[4,1,7]]))===J([[0,2],[4,1]]),'rhythmOf');
ok(J(H.shift([[0,4,0],[60,8,2]],2))===J([[2,4,0],[62,2,2]]),'shift 切る');ok(H.shift([[0,4,0]],-1).length===0,'shift 負は捨てる');
ok(J(H.seq([[0,2,0],[2,2,4]],1,'penta'))===J([[0,2,2],[2,2,7]]),'seq +1度');ok(J(H.seq([[0,2,0]],-1,'penta'))===J([[0,2,-3]]),'seq -1度');
ok(J(H.vary([[0,2,2],[2,2,4],[4,2,9]],'end'))===J([[0,2,2],[2,2,4],[4,12,12]]),'vary end '+J(H.vary([[0,2,2],[2,2,4],[4,2,9]],'end')));
const vr=H.vary(H.place('r_even8',[0]),'rhythm');vr.forEach((n,i)=>{if(i+1<vr.length)ok(n[0]+n[1]<=vr[i+1][0],'vary rhythm 重なり')});
ok(J(H.vary([[0,2,0]],'pitch','penta'))===J([[0,2,2]]),'vary pitch');
const A=H.place('r_q8',[4,7,9,7,2,0]);ok(J(H.vary(A,'rhythm'))===J(H.vary(A,'rhythm')),'決定的');
// check
ok(H.check([[0,2,0],[2,2,3]],{sc:'penta'}).some(x=>x.kind==='out'),'check out');
ok(H.check([[0,2,0],[2,2,2]],{sc:'penta',extra:[]}).length===0,'check 正常');
ok(H.check([[0,2,0],[2,2,12]],{maxLeap:9}).some(x=>x.kind==='leap'),'check leap');
ok(H.check([[0,2,30]],{lo:-12,hi:24}).some(x=>x.kind==='range'),'check range');
ok(H.check([[0,2,5]],{chordAt:()=>[0,'maj']}).some(x=>x.kind==='strong'),'check strong(F が E にぶつかる)');
ok(H.check([[0,2,4]],{chordAt:()=>[0,'maj']}).length===0,'check strong なし');
// track
const t=H.track([[0,3,2],[4,1,4]],5,{sc:'penta'});ok(t.id==='bass'&&t.idx[0]===2&&t.idx[1]===2&&t.idx[2]===2&&t.idx[4]===4&&J(t.o.tie)===J([1,2])&&t.o.tr===29&&t.o.key===5&&!t.o.len,'track');
ok(H.track([[30,2,0]],0,{len:32}).o.len===32&&H.track([[30,4,0]],0,{len:32}).idx[31]===0,'track len32');
// お手本
SD.MEM.forEach(e=>{const g=H.genre(e.gid);ok(g&&SD.SCALES[e.sc],e.id+' ジャンル/スケール');ok(e.bars>=1&&e.notes.length>=1,e.id+' bars');
 ok(!NG.test(e.n+e.tip),e.id+' 本文ルール');const iss=H.check(e.notes,{sc:e.sc,lo:-12,hi:24,span:g.span});ok(iss.length===0,e.id+' 検査 '+J(iss));
 const d=H.density(e.notes,16,e.bars);d.forEach(c=>ok(c>=g.dens[0]&&c<=g.dens[1],e.id+' 音数 '+c));
 const l=e.notes[e.notes.length-1];ok(mod(l[2])===0,e.id+' 着地音はルート');ok(e.notes.every(n=>n[0]+n[1]<=16*e.bars),e.id+' 小節内');
 for(let k=0;k<12;k++){const tk=H.track(e.notes,k,{sc:e.sc,len:16*e.bars});e.notes.forEach(n=>{const mi=60+n[2]+k;ok(mi>=36&&mi<=96,e.id+' key'+k+' MIDI範囲外')});ok(tk.o.tr===24+k,e.id+' tr')}});
// コース枠
['me1','me2'].forEach(id=>{const c=SD.CATS.find(x=>x.id===id);ok(c&&c.course==='ME'&&c.chapter==='course'&&c.soon,id+' 枠')});
// レッスン(ME-1: me01〜me04)
const ME=SD.LESSONS.filter(l=>l.course==='ME'),ids=ME.map(l=>l.id);
ok(J(ids)===J(['me01','me02','me03','me04','me05','me06','me07','me08','me09','me10','me11','me12','me13','me14','me15','me16','me17','me18','me19','me20','me21','me22','me23','me24']),'ME-1・2 のレッスン '+J(ids));
const TERMS=new Set(SD.TERMS.map(t=>t.id)),DEG=/[♭♯]?[1-7]度|ローマ|[ⅠⅡⅢⅣⅤⅥⅦ]|\b[iIvV]{1,3}[7]?\b/;
ME.forEach(l=>{ok((l.cat==='me1'||l.cat==='me2')&&l.cat===(l.id<'me13'?'me1':'me2')&&l.course==='ME'&&l.tier===((['me09','me10','me11','me12','me21','me22','me23','me24'].indexOf(l.id)>=0?3:['me05','me06','me07','me08','me17','me18','me19','me20','me21','me22','me23','me24'].indexOf(l.id)>=0?2:1))&&l.lv===(l.tier===3?3:2)&&l.mode==='trk','基本 '+l.id);
 (l.terms||[]).forEach(t=>ok(TERMS.has(t),l.id+' 用語なし '+t));
 const txt=l.title+l.sub+l.steps.map(s=>s.h+s.b+(s.col?s.col.h+s.col.b:'')+(s.quiz?s.quiz.q+s.quiz.ex:'')).join('');
 ok(!NG.test(txt),l.id+' 本文ルール(年号など)');if(l.tier===1)ok(!DEG.test(txt),l.id+' tier1 に度数・ローマ数字 '+(txt.match(DEG)||[''])[0]);
 ok(l.steps.length>=4&&l.steps.length<=7,l.id+' ステップ数');
 l.tk.forEach((t,i)=>{if(t.o.role!=='mel'||t.o.bad)return;const S=SD.SCALES[t.o.scale],k=t.o.key;
  Object.keys(t.idx).forEach(st=>{const r=t.idx[st];ok(S.indexOf(mod(r))>=0,l.id+' トラック'+i+' スケール外 '+r);ok(r>=-12&&r<=24,l.id+' 音域 '+r);ok(60+r+k>=36&&60+r+k<=96,l.id+' MIDI')});
  if(l.cat!=='me1'||t.o.face==='A')return;const last=Math.max.apply(null,Object.keys(t.idx).map(Number));ok(mod(t.idx[last])===0,l.id+' トラック'+i+' 着地音がルートでない')})});
ok(SD.LESSONS.filter(l=>l.course==='ME'&&l.kind==='recipe').map(l=>l.id).join()==='me04,me08,me12,me16,me20,me24','recipe は me04・me08・me12・me16・me20・me24');
// me16 の完了条件: 最後の音が4マス以上・休符が1か所以上(悪い例は除く)
SD.LESSONS.find(l=>l.id==='me16').tk.forEach((t,i)=>{if(t.o.role!=='mel')return;const ks=Object.keys(t.idx).map(Number),last=Math.max.apply(null,ks.filter(k=>t.o.tie.indexOf(k)<0)),len=ks.filter(k=>k>=last).length;
 if(t.o.bad)ok(len<4,'me16 悪い例は短い');else{ok(len>=4,'me16 トラック'+i+' 最後が短い');ok(ks.length<t.o.len,'me16 トラック'+i+' 休符なし')}});
['me_melody','me_shape','me_genre','me_rest','me_pickup','me_motif','me_peak','me_density','me_hemi'].forEach(id=>ok(TERMS.has(id),'新設用語 '+id));
// ME-3: me05 強拍=コードの音(strong 0)・me07 特徴音と色・me08 4小節の完了条件
const by=id=>SD.LESSONS.find(l=>l.id===id),mel=t=>H.chordless?0:Object.keys(t.idx).map(Number).filter(k=>t.o.tie.indexOf(k)<0).sort((a,b)=>a-b).map(k=>[k,1,t.idx[k]]);
const cdAt=t=>st=>{const k=Math.max.apply(null,Object.keys(t.o.cd).map(Number).filter(x=>x<=st));return [t.idx[k],t.o.cd[k].t]};
const good=(lid,mi,ci)=>{const L=by(lid),t=L.tk[mi];ok(!t.o.bad,lid+' 良い例');const iss=H.check(mel(t),{sc:t.o.scale,lo:-12,hi:24,chordAt:cdAt(L.tk[ci])});ok(iss.length===0,lid+' トラック'+mi+' 検査 '+J(iss))};
good('me05',1,0);good('me07',3,0);good('me07',4,1);good('me07',5,2);
['me06'].forEach(()=>{[2,3,4].forEach(i=>ok(!by('me06').tk[i].o.bad,'me06 良い例'));[5,6,7].forEach(i=>ok(by('me06').tk[i].o.bad,'me06 悪い例'))});
const L8=by('me08'),A8=mel(L8.tk[2]),B8=mel(L8.tk[3]).map(n=>[n[0]+32,1,n[2]]),all8=A8.concat(B8),SH=SD.CHH.fit('shade',0);
const i8=H.check(all8,{sc:'major',lo:-12,hi:24,span:12,chordAt:st=>SH[Math.floor(st/16)].c[0]});ok(i8.length===0,'me08 4小節の検査 '+J(i8));
const lc=SH[3].c[0],ln=all8[all8.length-1];ok(SD.BLH.tones(lc).indexOf(mod(ln[2]-lc[0]))>=0,'me08 着地音がコードの音');
ok(mel(L8.tk[4]).length&&H.check(mel(L8.tk[4]),{sc:'major',chordAt:st=>SH[Math.floor(st/16)].c[0]}).some(x=>x.kind==='strong'),'me08 悪い例は strong');
ok(L8.tk[0].o.face==='A'&&L8.tk[1].o.face==='B'&&Object.keys(L8.tk[1].idx).every(k=>+k<32),'me08 A面B面');
// ME-6: me21 acc・me22 密度・me23 3つずつ・me24 完了条件
const four=(lid,fa,fb,ia,ib,sc,ca,cb)=>{const L=by(lid),A=mel(L.tk[ia]),B=mel(L.tk[ib]).map(n=>[n[0]+32,1,n[2]]),all=A.concat(B),ch=st=>st<32?cdAt(L.tk[ca])(st):cdAt(L.tk[cb])(st-32);
 const iss=H.check(all,{sc:sc,lo:-12,hi:24,chordAt:ch});ok(iss.length===0,lid+' 検査 '+J(iss));ok(L.tk[ia].o.face==='A'&&L.tk[ib].o.face==='B'&&Object.keys(L.tk[ib].idx).every(k=>+k<32),lid+' A面B面');
 const ln=all[all.length-1];ok(mod(ln[2])===0&&SD.BLH.tones(ch(60)).indexOf(0)>=0,lid+' 着地音');return {L:L,all:all,ch:ch}};
const L21=by('me21');good('me21',1,0);good('me21',2,0);ok(L21.tk[1].o.acc.length>=6&&L21.tk[2].o.acc.length===0,'me21 アクセントの有無');
ok(Object.keys(L21.tk[3].idx).length===32&&L21.tk[3].o.bad,'me21 悪い例は詰める');
const r22=four('me22',0,0,2,3,'major',0,1),d22=H.density(r22.all.map(n=>[n[0],1,n[2]]),16,4);
ok(d22[2]>d22[1]&&d22[1]>d22[0]&&d22[2]>d22[3]&&d22[0]===d22[3],'me22 疎→密→疎 '+J(d22));
const bd=mel(by('me22').tk[4]).concat(mel(by('me22').tk[5]).map(n=>[n[0]+32,1,n[2]]));ok(new Set(H.density(bd.map(n=>[n[0],1,n[2]]),16,4)).size===1,'me22 悪い例は一定');
const r23=four('me23',0,0,2,3,'major',0,1);ok(r23.all.filter(n=>n[0]<48).every(n=>n[0]%3===0)&&r23.all.some(n=>n[0]===48),'me23 3つずつ→48で戻る');
ok(by('me23').tk.every(t=>Object.keys(t.idx).every(k=>+k<32)),'me23 32以内');
const r24=four('me24',0,0,2,3,'major',0,1),a24=r24.all,gs=[];let e24=0;a24.forEach(n=>{if(n[0]>e24)gs.push(1);e24=n[0]+1});
const L24=by('me24'),full24=Object.keys(L24.tk[2].idx).map(Number).concat(Object.keys(L24.tk[3].idx).map(k=>+k+32)).sort((x,y)=>x-y),sil=[];let pr=-1;full24.forEach(k=>{if(k-pr>1)sil.push(1);pr=k});if(pr<63)sil.push(1);
ok(sil.length>=3,'me24 休符3か所以上 '+sil.length);
const d24=H.density(a24.map(n=>[n[0],1,n[2]]),16,4);ok(new Set(d24).size>1,'me24 音数が一定でない '+J(d24));
ok(Object.keys(L24.tk[3].idx).filter(k=>+k>=24).length>=4,'me24 終わりの音が長い');
// ME-5: me09・me10 の強拍ぶつかり0、me12 の完了条件(スケール内・着地音・最高音1か所・動機2回・strong 0)
good('me09',1,0);good('me09',2,0);good('me10',2,0);good('me10',3,0);good('me10',4,0);good('me10',5,1);
const L12=by('me12'),A12=mel(L12.tk[2]),B12=mel(L12.tk[3]).map(n=>[n[0]+32,1,n[2]]),all12=A12.concat(B12);
const c12=st=>st<32?cdAt(L12.tk[0])(st):cdAt(L12.tk[1])(st-32);
const i12=H.check(all12,{sc:'harmonic',lo:-12,hi:24,chordAt:c12});ok(i12.length===0,'me12 検査 '+J(i12));
const mx=Math.max.apply(null,all12.map(n=>n[2]));ok(all12.filter(n=>n[2]===mx).length===1,'me12 最高音は1か所');
const q1=A12.filter(n=>n[0]<16).map(n=>n[0]),q2=A12.filter(n=>n[0]>=16).map(n=>n[0]-16);ok(J(q1)===J(q2),'me12 動機が2回');
const ln12=all12[all12.length-1];ok(mod(ln12[2])===0&&SD.BLH.tones(c12(60)).indexOf(0)>=0,'me12 着地音');
ok(H.check(mel(L12.tk[4]),{sc:'harmonic',chordAt:c12}).some(x=>x.kind==='out')&&H.check(mel(L12.tk[4]),{sc:'harmonic',chordAt:c12}).some(x=>x.kind==='strong'),'me12 悪い例');
SD.LESSONS.filter(l=>['me09','me10','me11','me12'].indexOf(l.id)>=0).forEach(l=>l.tk.forEach(t=>{if(!SD.SCALES[t.o.scale])bad(l.id+' スケールが無い '+t.o.scale)}));
// ME-4: me18 は12/8・24マス、me20 は A・A'(同じリズム)・B(別)・終わり(長い)・strong 0
const L18=by('me18');ok(L18.meter.n===12&&L18.meter.d===8&&L18.tk.every(t=>t.o.len===24),'me18 12/8・24マス');
ok(J(L18.tk[1].idx&&Object.keys(L18.tk[1].idx).length)===J(24),'me18 跳ねる型は24マスを使う');
const L20=by('me20'),A20=mel(L20.tk[2]),B20=mel(L20.tk[3]).map(n=>[n[0]+32,1,n[2]]),all20=A20.concat(B20);
const r1=A20.filter(n=>n[0]<16).map(n=>n[0]),r2=A20.filter(n=>n[0]>=16).map(n=>n[0]-16);ok(J(r1)===J(r2),'me20 A と A′ は同じリズム');
const r3=B20.filter(n=>n[0]<48).map(n=>n[0]-32);ok(J(r3)!==J(r1),'me20 3小節目はリズムが違う');
const c20=st=>st<32?cdAt(L20.tk[0])(st):cdAt(L20.tk[1])(st-32);
const i20=H.check(all20,{sc:'major',lo:-12,hi:24,chordAt:c20});ok(i20.length===0,'me20 検査 '+J(i20));
ok(SD.BLH.tones(c20(60)).indexOf(mod(all20[all20.length-1][2]-c20(60)[0]))>=0,'me20 着地音がコードの音');
ok(Object.keys(L20.tk[3].idx).filter(k=>+k>=24).length>=8,'me20 最後の音は4マス以上');
ok(J(r1)===J(mel(L20.tk[4]).filter(n=>n[0]<16).map(n=>n[0]))&&J(mel(L20.tk[4]).filter(n=>n[0]>=16).map(n=>n[2]))===J(A20.filter(n=>n[0]<16).map(n=>n[2])),'me20 音固定の比較トラック');
ok(J(H.density(SD.MEM.find(e=>e.id==='mm8').notes,16,4))===J([6,6,5,4]),'me08 動機の音数');
if(err){console.error(err+' 件NG');process.exit(1)}console.log('ME OK');
