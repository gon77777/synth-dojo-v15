/* XSコースの cmp.g(音量補正)をオフライン描画で測って表で出す。出力を www/js/xs.js の GT に貼る。使い方: node tools/xs-cal.js
   要 node-web-audio-api(test/efest.js の levelsFx=マスターの DELAY・REVERB・WIDTH と各トラックの送りを通す。リターンDUCK・ピンポンは近似=省く) */
const E=require('../test/efest.js'),SD=E.loadSD(),out={};
(async()=>{
 for(const L of SD.LESSONS.filter(l=>l.course==='XS')){
  for(let si=0;si<L.steps.length;si++){const st=L.steps[si];if((st.cmp||[]).length<2)continue;
   const lv=await E.levelsFx(SD,L,st);
   if(lv.length&&!lv.some(x=>x==null)){const m=Math.min(...lv);lv.forEach((x,i)=>{out[L.id+'s'+(si+1)+(i+1)]=Math.max(-24,+(m-x).toFixed(1))});
    if(process.argv.includes('-v'))console.log(L.id,'step'+(si+1),lv.map(x=>x.toFixed(1)).join(' '))}}}
 if(!process.argv.includes('-v'))console.log('var GT='+JSON.stringify(out).replace(/"/g,"'")+';');
})();
