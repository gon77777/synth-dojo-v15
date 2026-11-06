# S-0 洗い出し: 上級の音作り(SA〜SR)  v11.51
仕様: `LOUD_SND3_spec.md` §6・§7。コード変更は枠(`www/js/snd3.js`)と検査(`test/snd3.js`)のみ。既存の再生結果・保存データ・既存レッスンは不変。

## ① エンジン別の実在パラメータ(題材の確定)
パラメータ数(`SD.defs[*].P`): analog 194・wt 208・fm 203・add 201・gr 188・mod 162(仕様書の数は共通FX追加前の古い数)。
| コース | 題材(仕様の候補) | 実在 | 仕様との差・注意 |
|---|---|---|---|
| SA analog | ピッチEG | `pAmt`(-24..48)・`pDec`(.005..1) | 実在 |
| | ノイズ | `noiseLvl`・`nHP`(20..12000) | 実在 |
| | OSC2デチューン | `o2Semi`・`o2Fine`(±50)・`o2Lvl`・`o2Wave` | 実在 |
| | キートラック | `keyTrack`(0..1) | 実在 |
| | ポルタメント | `glide`(0..1) | 実在 |
| | クリック | `aBurst`(1..5)・`aA` | 実在 |
| | サブ+歪み | `subLvl`・`drive`・`saType`(0..5)・`saMix`・`saTone` | 実在 |
| | フィルターEG | `envAmt`(±4)・`fA/fD/fS/fR` | 実在 |
| | 揺れ | `lfoRate/lfoPitch/lfoFilter/lfoAmp/lfoShape`(LFOは1基) | 実在 |
| ST wt | ワープ | `wWarpT`(none/bend/sync)・`wWarp`(0..1) | **種類は別つまみ** |
| | ユニゾン | `uVoices`(**1..5**)・`uDetune`(0..100)・`uSpread`・`uBlend` | 声数は最大5 |
| | 位置LFO | `lfoPos`・`lfoRate`・`wPos` | 実在 |
| | ポジションEG(ピッチではない・S-3で訂正) | `peA/peD/peS/peR`・`peAmt`(**-1..1**) | analog の `pAmt` とは別形 |
| | サブ・ノイズ | `wSub`・`wNoise` | 実在 |
| | 自作テーブル | `wsMat`(8素材)・`wsCycle`・`wsMode`・`wsPhase`・`wsStart/End`・`wsSmooth`(`wTable:'sample'` が前提) | ws1〜3 で既習 |
| SF fm | 比率 | `f1〜f4Coarse`(.5..16)・`Fine`・`Det` | 実在 |
| | 演算子EG | `fnA/D/S/R`・`fnLvl` | 実在 |
| | ベロシティ感度 | **`f1Vel`〜`f4Vel`**(0..1) | **仕様の `fNVel` は無い** |
| | フィードバック | `fFb`(0..7) | 演算子ごとでなく全体で1つ |
| | アルゴリズム | `fAlg`(1..8) | 実在 |
| | FM+フィルター | `fType/cutoff/res` | 実在 |
| SG gr | 位置・スキャン | `gPos`・`gSpray`・`gScan`・`gLfoPos` | 実在 |
| | フリーズ | `gFreeze`(off/on) | 実在 |
| | 窓 | `gWin`(hann/tri/gauss/rect)・`gSize`・`gJit` | 実在 |
| | ピッチばらつき | `gPitch`・`gPRand`・`gLfoPitch` | 実在 |
| | 密度 | `gDens`(1..60) | 実在 |
| | 素材 | `gMat`(8種)・`gRoot`・`gKey` | 実在 |
| SI add | 傾き・奇偶 | `adTilt`・`adOddEven` | 実在 |
| | 倍音の伸ばし | `adLayout`(harm/stretch/bell/metal/drawbar)+`adStretch` | **配置の種類が要る** |
| | 母音 | `adFmt`・`adVowel`・`adFmtShift` | 実在 |
| | モーフ | `adAB`・`adMorph`・`adMotTarget`・`adLfoRate/Depth`・`adMot*` | 実在 |
| | パーカッシブ | `adPerc`(off/2/3)・`adClick`・`adDSlope` | 実在 |
| | ドローバー | `db1`〜`db9`(0..8) | 実在 |
| | 倍音ごとの目標 | `sp`:[[番号,値,tol]](**`synth==='add'` のみ**) | a1・a6 が前例 |
| SM mod | 部品 | `kbd vco lfo noise vcf vca adsr mixer atten sh delay clk slew ring shaper cmp div quant rev seqm out`(`SD.MODS`) | **VCA・フィルター・LFO・ランダム(`sh`)・クロック・シーケンサー(`seqm`)は全部ある** |
| | 形式 | `init:{mods:[{id,t,v}],cab:[[出,入]]}`・目標は `m:[[id,v]]`・`app.js` の `modPatch` | analog 系の `init`/`f` と**違う**。`test/snd3.js` は mod の `f` 検査を免除 |
| SX 各 | リング変調 | `rmOn/rmFreq/rmMix/rmShape` | 実在 |
| | ビットクラッシュ | `bcOn/bcBits/bcRate/bcMix` | 実在 |
| | ピッチ・リバース・グリッチ・ボコーダー・スペクトル | `psOn` `rbOn` `glOn` `vcOn` `spOn`(+各つまみ。`SD.FXP` 155件) | **vc はキー入力が要る可能性。S-12 で動作を確認** |
| | その他 | `mdOn`(モジュレーション)・`afOn`(オートフィルター)・`tsOn`(テープストップ) | 実在 |
| SC 各 | カテゴリ別 | レッスンごとに `synth` を指定 | **聞き比べ `cmp` は同じエンジン内のつまみ切替だけ**。別エンジンで同じ目標音を作る回は「エンジンを変えて作り直す」手順+ `demo` で聞き比べ(S-14 以降で確定) |
| SR 各 | 目標スペクトル | analog は `claim`(帯域の下限)が `quality.js` で検査される。`sp` は add のみ | **帯域の山を目標にできるのは add の `sp` だけ**。他は `f` 目標+耳のクイズ |

## ② 既存レッスンとの題材割当(重複を避ける)
既存: AD 12本(lv3・**analog 以外も含む**: ad01=fm 多段変調・ad02=wt ウェーブシェイプ+フィルター・ad04=add 倍音の外科手術・ad05=wt フォルマント)・BS 13・LD 9・PD 7・PL 6・エンジン別の基礎(w1〜7・ws1〜3・f1〜7・a1〜6・g1〜9・m1〜12・ma01〜06)・vo15(add)。
| コース | 重ならない切り口(深める点) | 既存との境目 |
|---|---|---|
| SA | キック/スネア/ハットを作る(`pAmt`・`pDec`・`noiseLvl`・`nHP`)・デチューンの厚み・キートラックで音域をそろえる・クリック(`aBurst`)・低域と高域の分担 | bs12(808風ベース)・bs11(歪ませるベース)・ad06/ad07/ad08(グロウル・変調・質感)・ld06(ポルタメント)・pd01〜07(パッド)・bs13(フィルターEG)と**題材を変える**。ポルタメントのリード・フィルターEGのブラス・揺れのパッドは「◯◯で学んだ」を添えて別の目的で |
| ST | ワープ3種の使い分け・ユニゾンの広がり設計・位置LFO・ピッチEGプラック・サブ/ノイズの足し方・位置×フィルター・自作テーブルの続き | ad02(ワープ+フィルター)・ld02(スーパーソウ)・pd02・w3〜w7・ws1〜3 の続きとして |
| SF | 比率表(整数/非整数)・演算子EG・`f?Vel`・`fFb` のノコギリ化・アルゴリズムの選び方・ベル/エレピ/ベース | f1〜f7・ad01・bs08・ld04・ld09・pl02・pl04 と同じ完成形は避け、「選び方」に寄せる |
| SG | 位置スキャン・フリーズ・窓の形・ピッチばらつき・密度とリズム・声/打楽器素材 | g1〜g9・pd05 の応用 |
| SI | 傾き・奇偶・`adLayout`・フォルマント・モーフ・パーカッシブ・ドローバー設計 | a1〜a6・ad04・vo15 の続き |
| SM | 一から組む音色・FM・金属・ゲート割り・音階・自動演奏の設計 | m1〜m12 の続き(同じ配線の写しにしない) |
| SX | 音色づくりの道具としてのエフェクト(ミックスでなく音を作る側) | fx/rv/gl/sp/vc/ps/mb/cx 各コース・ad09 の「破綻させて使う」と区別 |
| SC / SR | カテゴリ別・分解して再現 | 他コースの完成音を目標にして「どのエンジンが向くか」を聞く |
※ 割当は S-1 以降で各レッスンの `pre` を実IDに確定する(pre は上の既存IDから選ぶ)。

## ③ 衝突確認(すべて問題なし)
- course 略称 SA ST SF SG SI SM SX SC SR は既存(TH LY LD PD BS MI PL SQ FX MB PS RV GL SP VC CX MT AD GN HS MU AL XE XC XS XB XG XD EQ CM EF PN FQ VO MX SE MS LM MA)と重ならない。
- レッスンID `sa01`〜`sr12` に既存なし。cat `sa1 st1 sf1 sg1 si1 sm1 sx1 sc1 sr1` に既存なし(既存の `sq1 sp1 se1` は別物)。テストファイル名 `test/sc.js` は既存(キー検査)なので新テストは `test/snd3.js`。
- 用語 id は `sa_` 等の2字接頭辞で S-1 から足す(既存 `sc`・`sp` 系の語 id と衝突しないよう `sa_`〜`sr_` を使い、足す前に重複検査)。

## ④ 聞き比べ(cmp)と音量
- synth レッスンの cmp は `{l,s:{パラメータ:値}}`(2〜4個)。`g`(音量補正 dB)は任意で、既存 recipe の聞き比べ 241件のうち 44件が持つ。
- **`node-web-audio-api` がこの環境で入った**ので(`npm i --no-save node-web-audio-api@2.2.0`)、S-1 で `quality.js` の `render` を流用して**聞き比べの RMS を測り `g` で揃える**(耳の確認は未)。体験させたい回(音量を揃えない)は `g` なしにして、本文に書く。
- `test/validate.js` が cmp の個数(2〜4)と `s` の値の範囲を検査済み。

## ⑤ `quality.js` の対象
- 対象は `course` あり・`synth==='analog'`・`tk` なし・`kind!=='read'` の recipe(`test/quality.js` 53行)。**SA・SX・SC/SR の analog 回が対象**(基音・クリップ・無音・`claim`)。wt/fm/add/gr/mod は対象外。
- 読み込み一覧に `snd3.js` を追加。**現状 280本 NG 0**(S-0 時点・この環境で実行)。S-1 以降は各段階の終わりに実行して NG 0 を保つ。

## ⑥ 枠・検査・登録
- `www/js/snd3.js`: cat 9個(`chapter:'course'`・ST=wt/SF=fm/SG=gr/SI=add/SM=mod/他=analog)・`SD.S3`(`COURSES`・`PLAN`・`base()`)。レッスンは0本(目次に出ない)。
- `test/snd3.js`: 枠・衝突・lv3・5〜8ステップ・cmp・目標・pre 実在・`init`/`f` の実在と範囲・**初期で未達成/直すと達成(`isMet` と同じ正規化)**・年号/機種名なし・quiz の ans 偏り・計画本数。
- 登録4か所: `test/validate.js`・`www/index.html`・`www/sw.js`(`sd-v210snd0`)・`.github/workflows/build-apk.yml`。加えて `test/quality.js`。

## ⑦ 仕様との差(まとめ)
1. `fNVel` は無い→ `f1Vel`〜`f4Vel`。2. ワープは `wWarpT`+`wWarp`、`uVoices` は最大5、wt のピッチEG は `peAmt`(±1)。3. `adStretch` は `adLayout:'stretch'` が前提。4. SM は `init.mods/cab`・`m` 目標の別形式。5. SC の「別エンジンで聞き比べ」は cmp では切り替えられない。6. 帯域の山を目標にできるのは add の `sp` だけ。7. 仕様のパラメータ数は古い(上記の現数)。
