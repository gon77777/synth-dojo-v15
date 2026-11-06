// MIX画面の計測行(M-4)のテスト: node test/lmui.js  jsdom なし。app.js から lmHtml/lmTick を取り出して偽の画面で動かす。実機の見え方は未確認
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'www','js','app.js'),'utf8'),css=fs.readFileSync(path.join(root,'www','css','style.css'),'utf8');
let err=0;const ok=(c,m)=>{if(!c){console.error('NG: '+m);err++}};
/* app.js 全体が構文として読める(v11.41 の cmpHtml の括弧ずれを直した再発防止) */
try{new vm.Script(app,{filename:'app.js'})}catch(e){ok(false,'app.js の構文エラー: '+e.message)}
const a=app.indexOf('function lmHtml(){'),b=app.indexOf('function mxMeterTick(){');ok(a>0&&b>a,'lmHtml/lmTick が見つからない');
const ctx={console};ctx.window=ctx;ctx.SD={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'www','js','loud.js'),'utf8'),ctx);
let bus={lmOk:()=>true,lmRead:()=>null};ctx.SD.bus=bus;
ctx.MX={el:null,lm:{v:'pr',ref:-18,tg:'stream'},pr:[-90,-90]};
vm.runInContext(app.slice(a,b),ctx);
function screen(html){const m={};const re=/id="([^"]+)"/g;let x;while((x=re.exec(html))){const id=x[1],child={textContent:''};m[id]={textContent:'',style:{},cls:{},child,classList:{toggle(c,on){m[id].cls[c]=!!on}},querySelector:()=>child}}
 return{querySelector:q=>m[q.slice(1)]||null,m}}
const run=(v,read,okFlag,extra)=>{ctx.MX.lm.v=v;if(extra)Object.assign(ctx.MX.lm,extra);bus.lmOk=()=>okFlag!==false;bus.lmRead=()=>read;const h=ctx.lmHtml();const el=screen(h);ctx.MX.el=el;ctx.lmTick();return{h,el}};
const R={lufsM:-14.2,lufsS:-14.5,lufsI:-15.3,lra:6.1,tp:-0.4,plr:14.9,vu:1.5,corr:-.2,bal:3.2,mdiff:2.4};
/* 画面の構造: 新しい行・既存クラスを使わない */
for(const v of['pr','vu','lufs']){const{h}=run(v,R);
 ok(/class="lmrow"/.test(h),v+': .lmrow がある');ok(!/class="[^"]*\b(mtr|mxb)\b/.test(h),v+': .mtr/.mxb を使っていない');
 ok(/data-act="lmv" data-v="pr"/.test(h)&&/data-act="lmv" data-v="vu"/.test(h)&&/data-act="lmv" data-v="lufs"/.test(h)&&/data-act="lmrs"/.test(h),v+': 切替3つと RESET');
 ok(/測定器ごとに少し違う/.test(h),v+': 測定器ごとに違うことの注意')}
/* PEAK/RMS */
{const{el}=run('pr',R);ctx.MX.pr=[-3,-18.5];ctx.lmTick();ok(el.m.lmpr.textContent==='PEAK -3.0 / RMS -18.5 / CREST 15.5 dB','PEAK/RMS/CREST: '+el.m.lmpr.textContent)}
/* VU: 基準の選択・針 */
{const{h,el}=run('vu',R);ok(ctx.SD.LOUD.VUREF.every(r=>h.includes('data-act="lmref" data-v="'+r+'"')),'VU 基準3つのボタン');
 ok(el.m.lmvu.textContent==='VU +1.5(近似)','VU の文字: '+el.m.lmvu.textContent);ok(Math.abs(parseFloat(el.m.lmvb.style.width)-(21.5/23*100))<.01,'VU の針の位置')
 let got;bus.lmRead=o=>{got=o;return R};ctx.MX.lm.ref=-14;ctx.lmTick();ok(got&&got.vuRef===-14,'VU 基準を lmRead に渡す')}
/* LUFS */
{const{h,el}=run('lufs',R);
 ok(['lufsM','lufsS','lufsI','lra','tp','plr'].every(k=>h.includes('id="lmc_'+k+'"')),'LUFS の6欄');
 ok(ctx.SD.LOUD.TARGETS.every(t=>h.includes('data-act="lmtg" data-v="'+t.id+'"')),'目標のボタン');
 const t=el.m.lmtg.textContent;ok(/目標 -14 LUFS\(目安・変わることがある\)。I との差 -1\.3 LU。TP 上限の目安 -1 dBTP/.test(t),'目標の文: '+t);
}
{const{el}=run('lufs',R);/* TP -0.4 > -1 */ok(el.m.lmc_tp.cls.hot===true,'TP が上限を超えると hot');
 const r2=Object.assign({},R,{tp:-2});const e2=run('lufs',r2).el;ok(e2.m.lmc_tp.cls.hot===false,'超えていなければ hot でない');
 const r3=Object.assign({},R,{lufsI:null});const e3=run('lufs',r3).el;ok(/S との差/.test(e3.m.lmtg.textContent),'I が無いときは S との差');
 const e4=run('lufs',R,true,{tg:'broadcast'}).el;ok(/目標 -23 LUFS/.test(e4.m.lmtg.textContent),'放送の目標')}
/* 相関・バランス・モノ差 */
{const{el}=run('pr',R);ok(el.m.lmcr.textContent==='相関 -0.20 / バランス L +3.2 dB / モノ差 −2.4 LU','相関行: '+el.m.lmcr.textContent);
 ok(Math.abs(parseFloat(el.m.lmcb.style.left)-40)<.01&&el.m.lmcb.cls.neg===true,'相関バーの位置と負の色');
 const e2=run('pr',Object.assign({},R,{corr:.8,bal:-2,mdiff:0})).el;ok(/相関 \+0\.80 \/ バランス R \+2\.0 dB \/ モノ差 −0\.0 LU/.test(e2.m.lmcr.textContent)&&e2.m.lmcb.cls.neg===false,'正の相関・R が大きい: '+e2.m.lmcr.textContent);
 const e3=run('pr',Object.assign({},R,{bal:0})).el;ok(/バランス 中央/.test(e3.m.lmcr.textContent),'バランス中央')}
/* 測れない環境・値なし: — と表示して落ちない */
for(const v of['pr','vu','lufs']){const{el}=run(v,null,false);ok(/相関 — \/ バランス — \/ モノ差 —/.test(el.m.lmcr.textContent),v+': 非対応は —');
}
{const{el}=run('lufs',null,false);ok(el.m.lmtg.textContent.includes('目標')&&!/との差/.test(el.m.lmtg.textContent),'値が無くても目標は出て差は出ない');['lufsM','lufsS','lufsI','lra','tp','plr'].forEach(k=>ok(el.m['lmc_'+k].child.textContent==='—','非対応の '+k+' は —'));
 const e2=run('lufs',R).el;ok(e2.m.lmc_lufsI.child.textContent==='-15.3'&&e2.m.lmc_lra.child.textContent==='6.1','値が欄に入る')}
/* 配線: ハンドラ・MX の状態・古いヒントが消えている・CSS */
ok(/case 'lmv':/.test(app)&&/case 'lmref':/.test(app)&&/case 'lmtg':/.test(app)&&/case 'lmrs':SD\.bus\.lmReset\(\)/.test(app),'ハンドラ4つ');
ok(/\$\{pager\}\$\{lmHtml\(\)\}<div class="hint">/.test(app),'新しい行は pager の後・ヒントの前');
ok(!/LUFS は測りません/.test(app)&&/PEAK\/RMS は目安です/.test(app),'ヒント文を更新');
ok(/lmTick\(\);\n if\(\(MX\.tc\+\+&1\)===0\)mxAnDraw/.test(app),'tick から lmTick を呼ぶ');
['\\.lmrow','\\.lmt','\\.lmg','\\.lmc','\\.lmbar'].forEach(c=>ok(new RegExp(c+'[{ .]').test(css),'CSS '+c));
/* 既存の ui.js が数えるクラスに影響しない: lmrow は .ms の外・.mtr/.mxb を新設していない */
ok(!/lmrow[^`]*class="[^"]*\bmtr\b/.test(app),'lmrow に mtr なし');
if(err){console.error(err+'件NG');process.exit(1)}console.log('lmui OK');
