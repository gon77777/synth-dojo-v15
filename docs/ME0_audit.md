# ME-0 洗い出し(メロディの作り方 ME の基盤・v13.1)
仕様: `docs/SPEC_ME_melody_course.md`。レッスンは0本(枠・表・関数・テストのみ)。既存の再生結果・保存データ・既存レッスンは不変。

## 1. 追加したもの
- `www/js/meh.js`: `SD.MEG`(ジャンル8・id は `SD.BLG` と同じ)・`SD.MER`(リズム型12・12/8 は24ステップ)・`SD.MEM`(お手本3本=動作確認用)・`SD.MEH`(genre・rhythm・scaleNotes・place・rhythmOf・density・shift・seq・vary・check・track)。純粋関数・決定的・乱数なし。
- `www/js/me.js`・`me2.js`: コース枠(cat `me1`・`me2`・course `ME`・`soon:true`)。
- `test/me.js`(CI に追加)。登録: `www/index.html`(rh.js の後)・`www/sw.js`(キャッシュ名 `sd-v245v13.1`)・`test/validate.js`・`test/quality.js`・`.github/workflows/build-apk.yml`。
- 件数: レッスン737本・用語448語のまま(`validate` OK)。

## 2. 仕様 §9 の確認結果
| # | 結果 |
|---|---|
| 1 | **解決(ME-3)**。4小節は CH と同じく A面・B面の2トラック(各32ステップ・`o.face`)で作った。64ステップの1トラックは使っていない |
| 2 | **確認(コード・コメントから)**。TRK も swing は16分格子の通し番号の奇数だけ(`seq.js` の `seqStep` と `mt.js` のコメント)。8分の裏は swing で跳ねない。実機の聞こえは未確認 |
| 3 | **未確認**。12/8 でメロディを鳴らす手順(BL の blues と同じ `meter:{n:12,d:8}` を使う想定)。ME-4 の前に確認 |
| 4 | **未確認**。メロディでの `acc`(ME-6 の me21 の前に確認。無ければ長さで強弱を表す) |
| 5 | **確認**。`BLH.clash` はベースが必要。メロディ単体は `MEH.check` の `strong`(強拍で和音の音に半音でぶつかる)で代用した。ベースと合わせる課題では `BLH.clash` も併用できる |
| 6 | **確認**。既存の用語: `mu_sbeat`(強拍と弱拍)・`syncope`・`mu_tie`・`al_land`(着地音)・`bl_step`(順次進行)・`bl_leap`(跳躍進行)・`al_332`。**これらは新設せず `see` に me レッスンを足す**。新設候補は me_motif・me_peak・me_passing・me_rest・me_pickup・me_density・me_hemi |
| 7 | 未確認(ME-1 で目次の表示を確認) |
| 8 | **確認**。cat `me1`・`me2` は未使用だった |
| 9・10 | 変更なし(範囲外・お手本は ME-1 から増やす) |

## 3. 未確認(耳・実機)
お手本3本とリズム型12本の聞こえ、ジャンル表の数値(初期値案)。ME-1 で聴いて直す。

## 4. ME-1 で確認したこと(v13.2)
- 2小節トラックは `BLH.line`(`mel:true`・len 32・meter 8/4)で作れる。`validate` は cmp を2〜4個に制限しているため、聴き比べの無いステップにも2個を置く。`test/mu.js` は用語の see と lesson.terms の相互参照を要求する(reuse するときは lesson.terms にも入れる)。
- 未確認のまま: 実機での再生(聞こえ)・`test/quality.js`(音量の合計。mel が4本以上のとき tVol を下げる処理は BL と同じ)。

## 5. INT-5(v14.0)
- 統合。レッスン761本・用語457語・全テスト65本通過。耳・実機は未確認(§3 のとおり)。
