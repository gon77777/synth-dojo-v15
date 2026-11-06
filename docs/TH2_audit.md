# TH2-0 洗い出し(音楽理論・応用 mu17〜mu35 の基盤)

## 1. 既存 MU の内容(mu01〜mu16・mf01〜03)
mu01 音名 / mu02 音程 / mu03 メジャー / mu04 マイナー3種 / mu05 調号・五度圏 / mu06 三和音 / mu07 7th・拡張 / mu08 ダイアトニック / mu09 機能 / mu10 終止 / mu11 声部進行・ボイシング / mu12 借用・セカンダリードミナント / mu13 モード / mu14 拍子とリズム / mu15 テンションとアボイド / mu16 確認テスト。mf01 音程・mf02 和音・mf03 リズムの耳トレ。
→ mu17 以降は、ここで扱った語(音程・度数・機能・借用・モード・ボイシング)を「◯◯で学んだ」と1文で触れて深める。

## 2. 追加したもの
- スケール18種(`seq.js`。既存13種のキー・並びは不変)。**画面のSCALEボタンには出さない**(`SD.SCALE_LESSON`。いま選んでいるスケールだけは一覧に残る)。レッスンの kit は使える。
  phrygian_dom lydian_dom altered whole_tone dim_wh dim_hw bebop_dom bebop_maj bebop_dor m7b5_pent dom_pent hirajoshi in_scale(都節) insen iwato kumoi ritsu ryukyu。民謡の5音は既存の `mpent`。
- 和音9種(すべて4音以内・5度省略): 7sus4 7b5 7b9 7s9 7s11 7b13 maj7s11 mM7 69。仕様の `m7sus4` は `7sus4` を別の根音から読めば同じ音なので作らない。ルートレス・オンコードは TRK を2トラックに分けて表す(和音の種類は増やさない)。
- `www/js/mu2.js`(枠): cat `mu2`・lv3・course MU。`SD.MU2={A,H,on,L}` を公開。登録: `test/validate.js`・`www/index.html`・`www/sw.js`。CI は `test/mu.js` を既に回しているので追加なし。
- `test/mu.js`: mu2 は lv3・ID mu17〜mu35・19本まで。既存の mu1(16本)・mf(3本)・AL(13本)の検査はそのまま。新スケール・和音の度数↔半音、モードの回転関係(オルタード=メロディックの7番目 等)、発音、並びを検査。

## 3. 仕様とのずれ・注意
1. スケールを「レッスン用だけ」にした(UI溢れ回避)。自由に試したい場合は後で SCALE ボタンに出す段階を別に設けられる。
2. `m7sus4` は作らない(上記)。`7b5` を追加(裏コード・オルタードの説明用)。
3. 8音スケール(ビバップ・ディミニッシュ)は `MUH.scl` の up で2ステップ刻み8音、updown は16音を超えるので up に落ちる(既存の仕様どおり)。
4. `test/ui.js` は元の v11.26 でも `SD.SCALES` 未定義で落ちる(読み込み順の既存問題)。未実施。
