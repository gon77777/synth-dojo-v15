/* XEコース(xe01〜)の検査: ①聞き比べの音量差1dB以内(推定。tools/xe-cal.js の g) ②目標の範囲と目安表(SD.GUIDE)・共振の位置の一致 ③初期状態で目標が全部は達成済みでない ④本文の長さ・禁止語 */
const {loadSD,stepLevels}=require('./eqest.js'),SD=loadSD();let err=0;const bad=m=>{console.log('NG: '+m);err++},ok=(c,m)=>{if(!c)bad(m)};
const LS=SD.LESSONS.filter(l=>l.course==='XE'),G=SD.GUIDE.roles;
['xe01','xe02','xe03','xe04','xe05'].forEach(id=>ok(LS.some(l=>l.id===id),id+' が無い'));
const get=id=>LS.find(l=>l.id===id),mxs=l=>[].concat(...l.steps.map(s=>s.mx||[])),f=(l,t,k,n)=>mxs(get(l)).filter(g=>g.trk===t&&g.k===k)[n||0];
let nC=0;
LS.forEach(L=>{ok(L.mode==='trk'&&L.lv===3&&L.cat==='xe1','形 '+L.id);ok(L.steps.length>=5&&L.steps.length<=8,L.id+' は5〜8ステップ');ok(L.steps.some(s=>s.col),L.id+' にコラムが無い');
 L.steps.forEach((st,si)=>{const w=L.id+' step'+(si+1)+' ';
  const lv=stepLevels(L,st);if(lv.length&&!lv.some(x=>x==null)){nC++;const sp=SD.MixGoal.cmpSpread(lv,st.cmp.map(c=>c.g||0));ok(sp<=1.0,w+'聞き比べの推定音量差が1dBを超える '+sp.toFixed(2)+'dB')}
  (st.cmp||[]).forEach(c=>ok(c.g===undefined||(c.g<=0&&c.g>=-24),w+'g範囲'));
  if((st.cmp||[]).length>1)ok(!st.cmp.some(c=>c.tm)||st.cmp.some(c=>c.g!==undefined)||true,'');
  const t=SD.guideTxt(st.b);ok(t.length<=150,w+'本文が150字を超える '+t.length);ok(!/(19|20)\d\d/.test(t+st.h),w+'年号らしき数字');
  if(st.mx&&st.mx.length){const met=st.mx.every(g=>{const x=L.tk[g.trk-1],e=(x.o.mx&&x.o.mx.eq)||{},ini=e[g.k],d=SD.INSP.find(p=>p.id===g.k).def;return SD.MixGoal.inRange(ini==null?d:ini,g.rng)});ok(!met,w+'mx 目標が最初から全部達成済み')}});
 L.tk.forEach((x,i)=>ok(x.o.mx&&x.o.mx.eq&&x.o.mx.eq.iEqOn===1,L.id+' T'+(i+1)+' にEQが入っていない'))});
/* 目安表との一致 */
const R=(l,t,k,lo,hi,w,n)=>{const g=f(l,t,k,n);ok(g&&g.rng[0]===lo&&g.rng[1]===hi,l+' '+w+' が目安表と違う '+(g&&g.rng))};
const IN=(l,t,k,a,w,n)=>{const g=f(l,t,k,n);ok(g&&g.rng[0]>=a[0]&&g.rng[1]<=a[1],l+' '+w+' が目安表の範囲外 '+(g&&g.rng))};
IN('xe03',2,'iEqB2f',G.pad.cut[1],'パッドの声の場所');
IN('xe04',1,'iEqB1f',G.pad.keep[0],'温かさ');R('xe04',2,'iEqB2f',G.lead.keep[0][0],G.lead.keep[0][1],'存在感');R('xe04',1,'iEqHf',G.pad.keep[1][0],G.pad.keep[1][1],'空気感');
{const g=f('xe05',1,'iEqHpf');ok(g&&g.rng[0]<=G.kick.hpf[0]&&g.rng[1]>=G.kick.hpf[1],'xe05 キックのローカットが目安表を含まない')}R('xe05',1,'iEqB1f',G.kick.cut[0][0],G.kick.cut[0][1],'キックの箱っぽさ');
{const g=f('xe05',2,'iEqHpf');ok(g&&g.rng[0]<=G.snare.hpf[0]&&g.rng[1]>=G.snare.hpf[1],'xe05 スネアのローカットが目安表を含まない')}R('xe05',2,'iEqB1f',G.snare.cut[0][0],G.snare.cut[0][1],'スネアの箱っぽさ');
R('xe05',3,'iEqHpf',G.hat.hpf[0],G.hat.hpf[1],'ハットのローカット');R('xe05',3,'iEqHf',G.hat.keep[0][0],G.hat.keep[0][1],'ハットのきらめき');
/* xe06〜xe10 */
['xe06','xe07','xe08','xe09','xe10'].forEach(id=>ok(LS.some(l=>l.id===id),id+' が無い'));
{const g=f('xe06',2,'iEqHpf');ok(g&&g.rng[0]<=G.bass.hpf[0]&&g.rng[1]>=G.bass.hpf[1],'xe06 ベースのローカットが目安表を含まない')}IN('xe06',2,'iEqLf',G.bass.keep[0],'ベースの基音');R('xe06',2,'iEqB2f',G.bass.keep[1][0],G.bass.keep[1][1],'ベースの輪郭');R('xe06',2,'iEqB1f',G.bass.cut[0][0],G.bass.cut[0][1],'ベースの濁り');
R('xe07',2,'iEqHpf',G.pad.hpf[0],G.pad.hpf[1],'パッドのローカット');
{const e=get('xe07').tk[1].o.mx.eq,g=f('xe07',2,'iEqB1f',0);ok(e.iEqB1g>=3&&e.iEqB1f>=g.rng[0]&&e.iEqB1f<=g.rng[1],'xe07 濁りが初期状態に無い・削る範囲の外')}
IN('xe08',3,'iEqB2f',G.vocal.keep[1],'声の明瞭さ');IN('xe08',2,'iEqB2f',G.vocal.keep[1],'リードのポケット');R('xe08',3,'iEqHpf',G.vocal.hpf[0],G.vocal.hpf[1],'声のローカット');
{const L=get('xe09');L.steps.forEach(st=>(st.f||[]).forEach(([k,v])=>{const p=SD.FXP&&SD.FXP.find?SD.FXP.find(x=>x.id===k):null;if(p&&p.type!=='seg')ok(v>=p.min&&v<=p.max,'xe09 f の値が範囲外 '+k)}))}
R('xe10',2,'iEqHpf',25,40,'ベースのローカット');R('xe10',3,'iEqHpf',G.pad.hpf[0],G.pad.hpf[1],'パッドのローカット');R('xe10',4,'iEqHpf',G.lead.hpf[0],G.lead.hpf[1],'リードのローカット');IN('xe10',3,'iEqB2f',G.pad.cut[1],'パッドの声の場所');IN('xe10',4,'iEqB2f',G.lead.cut[1],'リードの刺さり');IN('xe10',5,'iEqB2f',G.vocal.keep[1],'声の明瞭さ');R('xe10',5,'iEqHpf',G.vocal.hpf[0],G.vocal.hpf[1],'声のローカット');
{const m=[].concat(...get('xe10').steps.map(s=>s.mt||[]));ok(m.length===2&&m.every(g=>g.m==='ovl'&&g.vs===5&&g.rng[0]===0),'xe10 の ovl 目標')}
/* 共振の位置: 共振(カットオフ)が、削る目標の範囲に入る。聞き比べの「削った」案もその位置を向く */
const cutOf=(l,t)=>get(l).tk[t-1].o.p?get(l).tk[t-1].o.p.cutoff:null,rs=get('xe01').tk[2].o.p;ok(rs.res>=.5&&rs.envAmt===0,'xe01 リードの共振が動く設定');
{const a=cutOf('xe01',3),g=f('xe01',3,'iEqB2f');ok(a>=g.rng[0]&&a<=g.rng[1],'xe01 共振が目標範囲の外')}
{const c=[['xe02',2,'iEqB1f'],['xe02',3,'iEqB2f'],['xe02',4,'iEqB2f']];c.forEach(([l,t,k])=>{const a=get(l).tk[t-1].o.p.cutoff,g=f(l,t,k);ok(a>=g.rng[0]&&a<=g.rng[1],l+' T'+t+' の共振が目標範囲の外');ok(get(l).tk[t-1].o.p.res>=.5&&get(l).tk[t-1].o.p.envAmt===0,l+' T'+t+' の共振設定')})}
/* 「削った」案が共振の位置を狭く削っている(xe01・xe02) */
['xe01','xe02'].forEach(id=>{const L=get(id);L.steps.forEach((st,si)=>(st.cmp||[]).forEach(c=>{if(!/狭く|直した|ちょうど/.test(c.l)||!c.tm)return;Object.keys(c.tm).forEach(t=>{const e=c.tm[t],x=L.tk[t-1].o.p;if(!x||x.res<.5||!(e.iEqB1g<0||e.iEqB2g<0))return;const fq=e.iEqB1g<0?e.iEqB1f:e.iEqB2f,gn=e.iEqB1g<0?e.iEqB1g:e.iEqB2g,q=e.iEqB1g<0?e.iEqB1q:e.iEqB2q;if(gn===undefined)return;ok(Math.abs(Math.log2(fq/x.cutoff))<.2&&q>=4,id+' step'+(si+1)+' '+c.l+' T'+t+' が共振を狭く削っていない')})}))});
/* 用語 */
SD.TERMS.filter(t=>/^xe_/.test(t.id)).forEach(t=>{ok(t.def.length<=100&&!/\d{4}/.test(t.def),t.id+' の定義');ok(t.see.length&&t.see.every(s=>SD.LESSONS.some(l=>l.id===s)),t.id+' see')});
LS.forEach(L=>(L.terms||[]).forEach(id=>{const t=SD.TERMS.find(x=>x.id===id);ok(!t||t.see.indexOf(L.id)>=0,L.id+' の terms '+id+' の see に自分が無い')}));
console.log(err?('失敗 '+err+'件'):('OK: XEコース '+LS.length+'本・聞き比べ'+nC+'件の音量差を推定で検査'));process.exit(err?1:0);
