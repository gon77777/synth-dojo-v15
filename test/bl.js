// BL(ベースライン)の検査: node test/bl.js。X-0=ヘルパー(SD.BLH)の単体テストと、BL レッスンの共通規則(レッスンは BL-1 から)
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');
['blh.js','bl.js'].forEach(f=>{if(files.indexOf(f)<0)throw new Error('validate の読み込みに無い '+f)});
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD,H=SD.BLH;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const mod=x=>((x%12)+12)%12,J=JSON.stringify;
// 基本
ok(J(H.tones([0,'maj7']))===J([0,4,7,11])&&J(H.tones([0,'7']))===J([0,4,7,10])&&H.tones([0,'maj']).length===3&&J(H.tones([9,'m7']))===J([0,3,7,10]),'tones');
ok(H.role(0,[0,'maj'])==='root'&&H.role(7,[0,'maj'])==='5th'&&H.role(4,[0,'maj'])==='3rd'&&H.role(11,[0,'maj7'])==='7th'&&H.role(2,[0,'maj'])==='scale'&&H.role(1,[0,'maj'])==='chrom'&&H.role(48+7,[0,'maj'])==='5th','role');
ok(H.approach(0,'semi',-1)===-1&&H.approach(0,'semi',1)===1&&H.approach(0,'whole',-1)===-2&&H.approach(0,'whole',1)===2,'approach');
for(let r=0;r<12;r++){const p=H.rootLow(r);ok(mod(p)===r&&p>=-8&&p<=3,'rootLow '+r)}
// range
ok(H.range([[0,4,0],[4,4,12]]).ok&&!H.range([[0,4,-9]]).ok&&!H.range([[0,4,17]]).ok&&H.range([[0,4,-8],[4,4,16]]).ok,'range(MIDI28〜52)');
// clash
{const cc=()=>[0,'maj'];
 ok(H.clash([[0,4,0]],[[0,4,11]],cc).some(x=>x.kind==='strong'),'clash: 長7度は強');
 ok(H.clash([[0,4,0]],[[0,4,13]],cc).some(x=>x.kind==='strong'),'clash: 短9度(オクターブ違い)は強');
 ok(H.clash([[0,4,0]],[[0,4,1]],cc).some(x=>x.kind==='strong'),'clash: 短2度は強');
 ok(!H.clash([[0,4,0]],[[0,4,4]],cc).some(x=>x.kind==='strong'),'clash: 3度は強でない');
 ok(H.clash([[0,4,0]],[[4,4,4]],cc).length===0,'clash: 重ならない音は無視');
 ok(H.clash([[0,4,0]],[[0,4,6]],cc).some(x=>x.kind==='tritone'),'clash: 三全音は注意');
 ok(!H.clash([[0,4,4]],[[0,4,10]],()=>[0,'7']).some(x=>x.kind==='tritone'),'clash: 3度と7度の三全音は注意にしない');
 ok(H.clash([[0,4,0]],[[0,4,-24]],cc).some(x=>x.kind==='above'),'clash: 低音がメロディ以上は注意');
 ok(H.clash([[0,4,-8],[0,4,-5]],[],cc).some(x=>x.kind==='low'),'clash: R4(低い音域の3度)は注意');
 ok(!H.clash([[0,4,-8],[0,4,-1]],[],cc).some(x=>x.kind==='low'),'clash: R4 5度は注意でない');}
// walk
const T=(r,t)=>[r,t],tr=(p,k)=>p.map(b=>b.map(c=>[mod(c[0]+k),c[1]])),
 PROGS={'ii-V-I':[[T(2,'m7')],[T(7,'7')],[T(0,'maj7')],[T(0,'maj7')]],blues:[[T(0,'7')],[T(5,'7')],[T(0,'7')],[T(0,'7')]],'2コード':[[T(2,'m7'),T(7,'7')],[T(0,'maj7'),T(9,'m7')],[T(2,'m7'),T(7,'7')],[T(0,'maj7')]],'ii-V-I 2小節':[[T(2,'m7')],[T(7,'7')]]};
Object.keys(PROGS).forEach(nm=>{for(let k=0;k<12;k++){const pg=tr(PROGS[nm],k),a=H.walk(pg),b=H.walk(pg),id=nm+' key'+k;
 ok(J(a)===J(b),'walk 決定的 '+id);ok(a.length===pg.length*4,'walk 音数 '+id);
 ok(H.range(a).ok,'walk 音域 '+id+' '+J(H.range(a)));
 pg.forEach((bar,i)=>{const n=a.slice(i*4,i*4+4),nx=a[((i+1)%pg.length)*4],two=bar.length===2;
  ok(n.map(x=>x[0]).join()===[0,4,8,12].map(s=>i*16+s).join(),'walk 拍の位置 '+id+' bar'+i);
  ok(mod(n[0][2])===bar[0][0],'walk 1拍目=根音 '+id+' bar'+i);
  const t3=two?bar[1]:bar[0];
  if(two)ok(mod(n[2][2])===t3[0],'walk 2コードの3拍目=根音 '+id+' bar'+i);
  else{ok(H.tones(bar[0]).map(x=>mod(bar[0][0]+x)).indexOf(mod(n[2][2]))>=0,'walk 3拍目=コードトーン '+id+' bar'+i);ok(n[2][2]!==n[0][2],'walk 3拍目≠1拍目 '+id+' bar'+i)}
  const last=bar[bar.length-1],nxr=((i+1)%pg.length),nb=pg[nxr][0];
  if(mod(nb[0]-last[0])!==0){const d=Math.abs(n[3][2]-nx[2]),pc=Math.min(mod(n[3][2]-nx[2]),12-mod(n[3][2]-nx[2]));
   if(i<pg.length-1)ok(d>=1&&d<=2,'walk 4拍目が次の1拍目へ1〜2半音 '+id+' bar'+i+' d='+d);
   else ok(pc>=1&&pc<=2,'walk 最終小節の4拍目が先頭の根音へ1〜2半音(音名で。ループの継ぎ目) '+id+' d='+d)}
  for(let j=0;j<3;j++)ok(n[j][2]!==n[j+1][2],'walk 同音連続 '+id+' bar'+i);
  ok(n[3][2]!==nx[2],'walk 小節またぎの同音 '+id+' bar'+i);
  for(let j=0;j<3;j++)ok(Math.abs(n[j][2]-n[j+1][2])<=5,'walk 小節内の跳躍5半音以内 '+id+' bar'+i+' '+j)})}});
// pattern
{const P1=[[T(0,'maj')],[T(9,'min')],[T(5,'maj')],[T(7,'maj')]],P2=[[T(0,'maj'),T(7,'maj')],[T(9,'min'),T(4,'min')],[T(5,'maj'),T(0,'maj')],[T(5,'maj'),T(7,'maj')]],PB=[[T(0,'7')],[T(5,'7')],[T(0,'7')],[T(0,'7')]];
 H.BLG=SD.BLG;ok(SD.BLG.length===8&&SD.BLG.map(g=>g.id).join()==='pop,house,reggae,blues,funk,bossa,walk,dance'&&SD.BLG.map(g=>g.tier).join()==='1,1,1,2,2,2,3,3','BLG 8ジャンル・tier');
 SD.BLG.forEach(g=>{const progs=g.id==='blues'?[PB]:[P1,P2];progs.forEach((pg,pi)=>[0,3,6,9].forEach(k=>{const p=tr(pg,k),id=g.id+' P'+pi+' key'+k;
  [{},{fixed:true}].forEach(o=>{if(o.fixed&&g.id!=='dance')return;const a=H.pattern(g.id,p,o),b=H.pattern(g.id,p,o);
   ok(J(a)===J(b),'pattern 決定的 '+id);ok(a.length>0,'pattern 空 '+id);ok(H.range(a).ok,'pattern 音域 '+id+' '+J(H.range(a)));
   const fl=H.flat(p,g.bl),at=st=>{for(let i=fl.length-1;i>=0;i--)if(st>=fl[i].st)return fl[i];return fl[0]},bl=g.bl,strong=g.id==='blues'?[0,12]:[0,8];
   a.forEach(n=>{ok(n[0]>=0&&n[0]<bl*p.length&&n[1]>=1,'pattern 範囲 '+id);if(strong.indexOf(n[0]%bl)<0||g.id==='walk')return;const c=at(n[0]),root=o.fixed?fl[0].r:c.r;
    const tn=H.tones([c.r,c.t]).map(x=>mod(c.r+x));ok(tn.indexOf(mod(n[2]))>=0||mod(n[2])===mod(root),'pattern R1 強拍が構成音 '+id+' st'+n[0]+' r'+n[2])})})}))});}
// line / chords の形
{const a=H.line('t',[[0,16,0],[16,8,-5]],0),c=H.chords('c',[[0,'maj'],[9,'min']],[0,16],[16,16],0);
 ok(a.o.len===32&&Object.keys(a.idx).every(i=>+i<32)&&a.idx[15]===0&&a.o.tie.indexOf(15)>=0&&a.o.tie.indexOf(0)<0&&a.o.role==='bass','line の形(len32・タイ)');
 ok(c.o.len===32&&Object.keys(c.idx).every(i=>+i<32)&&c.o.cd[16].t==='min'&&c.o.role==='chord','chords の形');
 const s=H.slice([[3,2,1],[35,4,2],[62,4,3]],32);ok(s.length===2&&s[0][0]===3&&s[1][0]===30&&s[1][1]===2,'slice');
 ok(J(H.only(4,[1,2]))===J([0,3]),'only');}
// BL レッスンの共通規則(BL-1 以降で効く。bl00 は仮レッスン)
const notesOf=t=>{const o=[],ks=Object.keys(t.idx).map(Number).sort((a,b)=>a-b),tie=new Set(t.o.tie||[]);ks.forEach(st=>{if(tie.has(st)&&o.length&&o[o.length-1][0]+o[o.length-1][1]===st&&o[o.length-1][2]===t.idx[st])o[o.length-1][1]++;else o.push([st,1,t.idx[st]])});return o};
['bl17','bl18','bl19','bl20','bl21','bl22','bl23','bl24'].forEach(id=>{const l=SD.LESSONS.find(x=>x.id===id);if(!l||l.tier!==3||l.lv!==3)bad(id+' tier3・lv3')});
const bls=SD.LESSONS.filter(l=>l.course==='BL');ok(bls.length>=1&&!bls.some(l=>l.id==='bl00'),'BL レッスンがある(仮の bl00 は残さない)');['bl01','bl02','bl03','bl04','bl05','bl06','bl07','bl08'].forEach(id=>ok(bls.some(l=>l.id===id&&l.tier===1),id+' がある(tier1)'));['bl09','bl10','bl11','bl12','bl13','bl14','bl15','bl16'].forEach(id=>ok(bls.some(l=>l.id===id&&l.tier===2),id+' がある(tier2)'));
bls.forEach(L=>{const w=L.id+' ';ok(L.cat==='bl1'&&L.kind&&L.tier>=1&&L.tier<=3,w+'cat/tier');ok(L.steps.length>=3&&L.steps.length<=8,w+'ステップ数');ok(L.steps.some(s=>s.cmp),w+'cmp');ok(L.tk&&L.tk.length<=8,w+'トラック8本以内');
 if(L.meter){const n=SD.METER.stepsPerBar(L.meter);(L.tk||[]).forEach(t=>ok(t.o.len<=SD.STEPMAX&&t.o.len===n,w+'len'))}
 const ms0=(L.tk||[]).filter(t=>t.o.role==='mel'&&!t.o.bad),bs=(L.tk||[]).filter(t=>t.o.role==='bass'&&!t.o.bad);
 bs.forEach(b=>{const bn=notesOf(b);ok(H.range(bn).ok,w+b.o.name+' 音域');
  if(L.tier===1){const ct=(L.tk||[]).find(t=>t.o.role==='chord'&&(t.o.face||'A')===(b.o.face||'A')&&(t.o.set||'')===(b.o.set||''));bn.forEach(n=>{if(n[0]%8!==0)return;const r=ct?ct.idx[n[0]]:0;if(ct&&r===undefined)return;if([mod(r),mod(r+7)].indexOf(mod(n[2]))<0)bad(w+b.o.name+' tier1 の強拍がルート・5度でない st'+n[0])})}
  if(L.tier>=2){const cts=(L.tk||[]).filter(t=>t.o.role==='chord'&&(t.o.face||'A')===(b.o.face||'A')&&(t.o.set||'')===(b.o.set||'')),ct=cts[0],stg=L.meter&&L.meter.n===12?[0,12]:[0,8,16,24];
   if(ct)bn.forEach(n=>{if(stg.indexOf(n[0])<0)return;const ks=Object.keys(ct.o.cd).map(Number).filter(k=>k<=n[0]).sort((a,c)=>c-a),k=ks[0];if(k===undefined)return;const r=ct.idx[k],tn=H.tones([r,ct.o.cd[k].t]).map(x=>mod(r+x));if(tn.indexOf(mod(n[2]))<0)bad(w+b.o.name+' tier2 の強拍がコードの音でない st'+n[0])})}
  const ms=ms0.filter(m=>(m.o.face||'A')===(b.o.face||'A')&&(m.o.set||'')===(b.o.set||''));
  ms.forEach(m=>{const c=H.clash(bn,notesOf(m),null).filter(x=>x.kind==='strong');ok(!c.length,w+b.o.name+' × '+m.o.name+' に強いぶつかり '+J(c))})});
 (L.tk||[]).forEach(t=>{if(t.o.bad)return;ok(Object.keys(t.idx).every(i=>+i<t.o.len),w+'範囲外のステップ')})});
console.log(err?('失敗 '+err+'件'):('OK: BL ヘルパー+レッスン'+bls.length+'本'));process.exit(err?1:0);
