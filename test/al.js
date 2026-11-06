// AL-1 お手本リックの検査: node test/al.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const w=path.join(__dirname,'..','www','js'),ctx={console};ctx.window=ctx;vm.createContext(ctx);
const src=fs.readFileSync(path.join(__dirname,'validate.js'),'utf8'),m=src.match(/\[('params\.js'[^\]]*)\]\.forEach/);
const files=eval('['+m[1]+']');if(files.indexOf('allicks.js')<0)throw new Error('validate の読み込みに allicks.js が無い');
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(w,f),'utf8'),ctx,{filename:f}));
const SD=ctx.SD;let err=0;const bad=s=>{console.error('NG: '+s);err++};const ok=(c,s)=>{if(!c)bad(s)};
const LL=SD.LICKS.LIST;ok(LL.length>=18&&LL.length<=40,'リック数 '+LL.length);
const ids=new Set();
LL.forEach(l=>{const w=l.id+' ';ok(!ids.has(l.id),w+'ID重複');ids.add(l.id);ok(l.bars===1,w+'1小節のみ');ok(l.lv>=1&&l.lv<=3,w+'Lv1〜3');
 ok(SD.LICKS.SC[l.sc]&&SD.SCALES[SD.LICKS.SC[l.sc]],w+'スケール');ok(l.n&&l.tip&&l.tip.length<=60,w+'名前・ヒント');
 ok(!/(19|20)\d\d/.test(l.n+l.tip)&&!/ハンマ|プリング|ピッキング|フレット|弦|押さえ|風/.test(l.n+l.tip),w+'年号・ギター語・「風」');
 const set=SD.SCALES[SD.LICKS.SC[l.sc]];let prevEnd=0;
 l.notes.forEach(([st,len,r],i)=>{ok(Number.isInteger(st)&&Number.isInteger(len)&&Number.isInteger(r),w+'整数');ok(st>=0&&len>=1&&st+len<=16,w+'小節内 '+st+':'+len);ok(st>=prevEnd,w+'重なり/順序 '+st);prevEnd=st+len;
  ok(set.indexOf(((r%12)+12)%12)>=0,w+'スケール外の音 r='+r)});
 ok(l.notes.length>=3,w+'音が少ない');
 // 全キーで変換: 範囲内・小節数に収まる・音の数が一致
 for(let k=0;k<12;k++){const t=SD.alPlace(l,k);ok(t&&t.id==='bass'&&t.o.key===k&&t.o.scale===SD.LICKS.SC[l.sc],w+'変換 key'+k);
  const on=Object.keys(t.idx).filter(i=>!(t.o.tie||[]).includes(+i));ok(on.length===l.notes.length,w+'音数 key'+k);
  Object.keys(t.idx).forEach(i=>{ok(+i>=0&&+i<16,w+'ステップ範囲');const n=60+k+t.idx[i];ok(n>=SD.NMIN&&n<=SD.NMAX,w+'音域 '+n)});
  l.notes.forEach(([st,len,r])=>{ok(t.idx[st]===r,w+'音の高さ');for(let j=1;j<len;j++)ok((t.o.tie||[]).includes(st+j),w+'tie')})}});
ok(SD.alPlace('m1',0)&&SD.alPlace('nothing',0)===null,'id 指定・未知は null');
ok(SD.alPlace('m1',14).o.key===2,'key は12で丸める');
console.log(err?'失敗 '+err+'件':'OK: リック'+LL.length+'種・全12キーで変換');process.exit(err?1:0);
