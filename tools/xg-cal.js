/* XGコースの cmp.g(音量補正)をオフライン描画で測って表で出す。出力を www/js/xg.js の GT に貼る。使い方: node tools/xg-cal.js
   要 node-web-audio-api。ミュート比較(cmp.mt)は「音を抜く」こと自体が目的、マスターのつまみ(cmp.s=WIDTH)はオフライン測定に入らないので、そのステップは出力しない(g なし)。VOL は反映するが PAN は反映しない(近似) */
const E=require('../test/cmest.js'),SD=E.loadSD(),out={};
(async()=>{
 for(const L of SD.LESSONS.filter(l=>l.course===(process.argv[2]||'XG'))){
  for(let si=0;si<L.steps.length;si++){const st=L.steps[si];if((st.cmp||[]).some(c=>c.mt||c.s))continue;const lv=await E.cmpLevels(SD,L,st,true);
   if(lv.length&&!lv.some(x=>x==null)){const m=Math.min(...lv);lv.forEach((x,i)=>{out[L.id+'s'+(si+1)+(i+1)]=Math.max(-24,+(m-x).toFixed(1))})}}}
 console.log('var GT='+JSON.stringify(out).replace(/"/g,"'")+';');
})();
