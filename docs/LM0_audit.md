# LM0 洗い出し(段階 M-0・v11.41)
仕様: `LOUD_SND3_spec.md`。**コードは変えていない**(sw のキャッシュ名・README・HISTORY・この表だけ)。根拠は `ファイル:行`(v11.40 時点)。

## A. 確認した事実(仕様 §2・§7 M-0 の ①〜⑨)
| # | 項目 | 確認した事実 | 結論・影響 |
|---|---|---|---|
| ① | マスター配線 | `bus.js:288-290` `out→comp→lim→an`。`lim→cmpG→monIn→destination`。マスターFXは `ins` の前段なので最終段に含まれる。`mpre`(コンプ前のピーク用)は `n.out` に付く | **測定点は `n.lim` の出力**。`cmpG`(聞き比べ補正)・モニター(MONO/小スピーカー)は**後ろ**なので測定に影響しない(仕様どおり) |
| ①' | リミッター差し替え | `useLimiter()`(`bus.js:312-315`)がワークレット読み込み後に `comp→lim` を切り、`sd-limiter` を `comp→w→cmpG`/`w→an` に付け替え `n.lim=w` にする(非同期) | **M-3 は `useLimiter` の後に測定ノードを付け直す**。`n.lim` を毎回見る |
| ② | AnalyserNode | `an.fftSize=2048`(`bus.js:294`)。解析ノードは入力をモノに混ぜる仕様。既存の PEAK/RMS は `SD.meterDb`(`mixdefs.js:132`)が1回分のバッファから出す値で、**L/R別でも K特性でもなく、隙間なく測ってもいない** | 仕様どおり。**LUFS・相関・バランスには AudioWorklet が要る** |
| ③ | ワークレット経路 | `loadWk()`(`bus.js:303-309`): `SD.FXWSRC` の**全エントリを1つの Blob モジュール**にして `addModule`。成功で `wkOK=true`、非対応/失敗で `fxUnsup=true`(UIは `unsup` クラスで灰色)。`wnode` は 2ch・explicit。Capacitor は `androidScheme: https`。既存18個が同じ経路で動作済み | メーターも同じ経路で足せる。**`tools/gen-fxworklets.js` の `names` は固定リスト**なので `'meter'` の追記が要る(M-2) |
| ③' | destination に届かないワークレット | **Node の `node-web-audio-api@2.2.0`** で、(A)出力0・入力だけ (B)出力あり・どこにも未接続 (C)出力→ゲイン0→destination の3通りとも、**処理された**(100ms相当のフレームを報告)。ただしこれは Node の実装で、**ブラウザ(Chromium・WebKit・Android WebView)の挙動ではない** | **未確認**。安全策として **(C) ゲイン0経由で destination** を採用(M-3)。実機での動作は M-3 の未確認に必ず書く |
| ④ | テスト基盤 | `node-web-audio-api@2.2.0` は `AudioWorklet`/`addModule` を持つ(本調査で確認)。ただし既存 `test/fxw*.js` は processor を**偽物の `AudioWorkletProcessor`** で直接動かす型。`test/fx.js`・`test/mix.js` は `AudioContext`/`AudioWorkletNode` のモックで `SD.Bus` を作る(`mix.js:258,494`)。描画は `OfflineAudioContext`(`mix.js:347`)で、ワークレットの実描画は使っていない | M-2 は「偽物で参照計算と一致」が本体。**任意で**実ワークレットを OfflineAudioContext で1回回すスモークを足せる。M-3 の接続検査はモックで足りる |
| ⑤ | MIX画面 | `renderMix`(`app.js:1586`): `.mxl > monRow・.mxst(ストリップ+マスター)・pager・.hint`。**マスターは幅70px**(`.ms.mst{flex-basis:70px}`)で、縦メーター1本・CLIP・テキスト1行 | **LUFS・VU・相関はマスターのストリップに入らない**。M-4 は ストリップの下・ヒントの上に**新しい行**(`.lmrow`)を足す。`test/ui.js:433,436` は `.mtr` が9個・`.clipb`・`.ms .mxb` が8個を検査しているので、**新UIは `.mtr`・`.mxb` クラスを使わない**。ヒント文「RMS は目安です(LUFS は測りません)」(`app.js:1586`)を変えても `ui.js` に文言検査は無い(`ui.js:504` は mt チップ「T1 RMS(目安)」のみ) |
| ⑤' | メーター更新 | `mxMeterTick`(`app.js:1530` 付近)が MIX画面の間だけ回る。`mxStop` は `!S.mtOn` のときだけ `meterOn(false)` | LM レッスン(mt 目標)中は `S.mtOn` が効くので、測定ノードも同じ条件で付ける |
| ⑥ | ゴール型 | **既に `s.mt` がある**: `{trk:'M'|1〜8, m:'peak'|'rms'|'gr'|'ovl', rng:[下,上], hold:秒}`(`mixdefs.js` の `SD.MixGoal.MT`/`check`)。判定は `app.js:629-638` の `setInterval`(100ms)で `SD.MixGoal.hold`(**0.3秒までの外れは許す**)。チップ表示は `app.js:621` で単位が **`dB` 固定**(`ovl` のみ除外)。`validate.js:250` が `MixGoal.check` を呼ぶ。`mt` を使うレッスンは47本 | **仕様 §4.4 の新ステップキー(`lu`・`tp`…)は不要**。**`mt` の `m` を拡張**する(下の「仕様との差」) |
| ⑦ | 既存の用語 | あり: `peak` `rms` `headroom` `clip` `comp` `phase`(位相)`xs_monocompat`(モノ互換)`xb_room`(ヘッドルームの余白)。**無い**: crest・LUFS・LU・VU・ラウドネス・相関・トゥルーピーク。`hs.js:52` に歴史コラム(ラウドネスの話。HSは年号可のコース) | lm の用語は新設(`lm_`)。`peak/rms/headroom/clip/comp/phase/xs_monocompat` は `see` を足して再利用(lm10 は `xs_monocompat`)。LUFS を書かない検査は `test/xg.js:14` の **XG だけ**で、LM に影響しない |
| ⑧ | 名前の衝突 | コース略称 LM SA ST SF SG SI SM SX SC SR・レッスンID(lm/sa/st/sf/sg/si/sm/sx/sc/sr + 00〜99)・cat(lm1 lm2 sa1 … sr1)・用語接頭辞(lm_ sa_ …)すべて**衝突なし**(実測) | そのまま使える |
| ⑨ | 登録・CI | 登録4か所=`test/validate.js` の読み込み一覧・`www/index.html`・`www/sw.js`・CI。CI は `node test/xx.js` を1行ずつ(`test/ui.js` は入っていない) | M-1 で `test/loud.js`、M-2 で `test/fxw-meter.js`、N-1 で `test/lm.js`、S-0 で `test/snd3.js` を CI に足す |

## B. 追加で分かったこと
- **サンプルレート**: `AudioContext` は既定のまま(48k か 44.1k)。K特性の係数はレートで変わるので、**44.1k と 48k の両方**を `test/loud.js` で検査する。
- **保存データ**: 計測の設定(VUの基準・ターゲット)は保存しない(仕様どおり)。`play`/`mix` の保存に触れない。
- **負荷**: 未計測。`bus.js` の `heavy()` はスロット数で数えており、測定ノードは数に入れない方針(MIX画面とLMレッスンの間だけつなぐ)。

## C. 仕様との差(`LOUD_SND3_spec.md` を同時に直した)
1. **ゴール型(§4.4・§5・§7 M-5)**: 新ステップキー `lu`/`tp`/`corr`/`plr`/`bal`/`mdiff` → **既存 `mt` の `m` を拡張**(`lufsM` `lufsS` `lufsI` `tp` `plr` `corr` `bal` `mdiff`。`trk` は `'M'` のみ)。`SD.MixGoal.MT` を「表示名+単位」の表にし、チップの単位を `m` ごとに出す。`hold`・`inRange`・判定ループ・`validate.js` の `MixGoal.check` を再利用。`SD.LOUD.goalOk` は作らず、値の取り出しだけ `SD.LOUD.pick(state,m)`。
2. **測定点(§4.2)**: 「`this.an` と同じ位置」→ **`n.lim` の出力**。`useLimiter` の差し替えのあとで付け直す。
3. **M-4 の画面**: マスターのストリップ内ではなく、**新しい行**(`.lmrow`)。`.mtr`・`.mxb` クラスは使わない。
4. **M-2**: `tools/gen-fxworklets.js` の `names` に `'meter'` を足す作業を含める。
5. **テスト**: `node-web-audio-api` は実ワークレットも動くので、M-2 に任意のスモークテストを足せる(無い環境は SKIP)。

## D. 未確認(M-0 時点)
- ブラウザ/WebView で、`destination` に届かないワークレットが処理されるか(Node では処理された)。
- 実機での負荷・MIX画面の幅(新しい行が収まるか)。
- 測定した LUFS が他の測定器と一致するか(M-1 以降は合成信号でのみ検査)。
