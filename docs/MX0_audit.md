# MX-0: 上級ミックス(XE・XC・XS・XB・XG・XD)のための洗い出し(v11.14 時点。コードは変えていない)
対象: `MIX2_MU2_AL2_spec.md` §2・§4.2・§8 MX-0 の確認事項。調べた場所: `www/js/mx.js` `cxl.js` `mixdefs.js` `app.js`(MIX画面)、`test/validate.js` `test/mx.js` `tools/mx-cal.js`、既存レッスン一覧(`SD.LESSONS`)。
テスト基準値(v11.14): `validate` OK(レッスン501本・2899ステップ)。

## A. 確認事項の答え
| # | 確認事項 | 答え(根拠) |
|---|---|---|
| 1 | ミックス教材の骨格 | `base({id,pre,terms,title,sub,save,init,tk:[…],steps:[…]})`(`mx.js` の `base`)。`kind:'recipe'`、`mode:'trk'`、`ts:1`、`cat` はコース、`lv:2`。トラックは `KIK/SNR/HAT/BAS/CHD/LED/VOX/DBL(mix,out)`。各トラックに `o.mx={eq:E(),cp:NO}` が**必須**(`test/mx.js`)。初期のつまみは `E({…})`(EQ)・`CP({…})`(COMP)・`RVm({…})`(リバーブ)。 |
| 2 | ステップの目標の型 | `mx:[{trk,ins:'eq'|'cp'|'mix'…,k,rng:[lo,hi]}]`(つまみの範囲)、`mt:[{trk|'M',m:'peak'|'rms'|'gr'|'ovl',rng,hold,vs}]`(メーター。`ovl`=ぶつかり度は `vs` が相手トラック)、`f`(マスターFX等のつまみ)。`ins` は `gt eq cp ds sa md` と `mix`(`tVol tPan tPitch tDly tRvb tOut dk*`)。検査は `SD.MixGoal.check`(`mixdefs.js:200`)。 |
| 3 | 聞き比べの型 | `cmp:[{l,tm:{トラック番号:{つまみ…}},bm:{A|B|C:{…}},s:{マスターつまみ},mt:[ミュート],g:音量補正dB,ln/au:オートメーション}]`。`cmp.g` は**2つ以上の聞き比べがあるときだけ**(validate)。 |
| 4 | 音量補正の作り方 | EQだけが違う聞き比べ → `tools/mx-cal.js` が `cmp.g` の表(`GT2`)を出し、`mx.js` に貼る。キーは `レッスンID+'s'+ステップ番号+案の番号`(例 `mx10s11`)。EQ以外(COMP・空間・歪み)の補正は `tools/cm-cal.js` `ef-cal.js` `se-cal.js` `vo-cal.js` `pn-cal.js` `sb-cal.js` `fq-cal.js` にコース別の流儀がある。**新コースごとに校正ツールを足すか、`cmp.g` を手で決めるかを段階の最初に決める**。 |
| 5 | 数値の書き方 | `SD.GUIDE`(`roles`=kick/bass/snare/hat/pad/lead/vocal/dbl/fx の keep・cut・hpf・pan・depth、`dyn`=grBass/grVocal/grDrumBus/grMaster/rvPre/eqStart)を本文では `{g:bass.hpf}` のように参照。`test/mx.js` が目標の範囲と目安表の一致を検査。**表に無い数値は本文に書かない**(つまみ値と同じ数字のみ)。 |
| 6 | 診断(`diag`) | `kind:'diag'`・`save`・`quiz`・直す目標(mx/mt/f)が必須(validate)。問題ミックスは `WE(トラック, 外すEQ)` で作り、聞き分けは `cm2('mx10s1',[['A',{tm:D10(…)}],…])`(`D10` は3つの問題の有無を切る関数)。**問題を1つだけ残した3つを聞く→直す、の繰り返し**。 |
| 7 | **アプリにある/無い機能** | **ある**: トラック8本・BUS A/B/C(EQ4帯域+HPF/LPF・COMP+SC HPF・並び `iOrd`)・インサート順入れ替えと2段目・マスターFX(GATE EQ AUTO FILT DJ FILTER SAT BITCRUSH RING MOD MOD PITCH REVERSE GLITCH VOCODER SPECTRAL TREMOLO COMP MULTIBAND WIDTH TAPE STOP DELAY REVERB)・サイドチェイン(COMP の SC)・MON(MONO・小SP)・メーター PEAK/RMS/GR/ぶつかり度・MIXマップ。WIDTH は M/S 処理(`fxworklets.js`)。<br>**無い**: **LUFS**(画面に「LUFS は測りません」)・**位相相関メーター**・**M/S 専用EQ**・**ディザ**(いずれも `www/js` に実装なし)。画面の「M/S」は Mute/Solo。 |
| 8 | `cat`/ID/用語IDの衝突 | `xe1 xc1 xs1 xb1 xg1 xd1` の cat、`xe01〜xd08` のレッスンID、course `XE XC XS XB XG XD`、用語ID `xe_ xc_ …` は**すべて未使用**(衝突なし)。 |
| 9 | GN の実在ID(XG の pre) | gn01 ハウス・gn02 テクノ・gn03 トランス・gn04 ダブステップ・gn05 ドラムンベース・gn06 フューチャーベース・gn07 エレクトロ・gn08 トラップ・gn09 ガラージ・gn10 シンセウェーブ・gn11 ローファイ・gn12 チップチューン・gn13 アンビエント・gn14 シネマティック・gn15 R&B/ポップ・gn16 シティポップ・gn17 アニソン・gn18 J-POP・gn19 ボカロ・gn20 和の音階・gn21 和太鼓・gn22 「〇〇風」の考え方。 |
| 10 | コース別の検査ファイル | 既存は `test/mx.js`(MX13本のトラック数・ステップ数・目標の初期状態・目安表との一致)のようにコースごとに1つ。同様に新コース用の検査(例 `test/xmix.js`)を MX-1 で作り、CI に足す。 |
| 11 | ステップ数 | validate は3〜8。`test/mx.js` は MX を5〜8、**各レッスンに `col`(コラム)が必須**。 |
| 12 | メーターの測定 | `mt` の達成は**実機のメーターでだけ確かめられる**(`mx.js` 冒頭「オフライン測定は未対応」)。オフラインで測れるのは `cmp.g` 用の音量(`test/cmest.js` `eqest.js`)と構造だけ。 |
| 13 | 既存のミックス教材の量 | `MX/CM/EQ/FQ/PN/VO/SE/MS/EF/CX` = recipe 106・種別なし23・read 2・diag 2。lv3 は CX の12本だけ。上級の素材は**ほぼ無い**ので、XE〜XD は既存の本文を書き直さず、**`pre` でつなぐ**。 |

## B. 仕様書とのずれ・新しく分かったこと(重要度順)
1. **LUFS・位相相関・M/S専用EQ・ディザは無い**(仕様 §2 の想定どおり)。影響するレッスン: xb05(ヘッドルーム・数値は RMS/PEAK の言い方に)、xb06(リファレンスは音量を耳と RMS で合わせる)、xs06(位相は「モノで確かめる」に限る。相関の数値は出せない)、xb07・ms07 型の「アプリの外の話」は読み物で可。**新機能は作らない**。
2. **`cmp.g` の作り方が EQ 以外はコース別に違う**(A-4)。新コースは「聞き比べの種類ごとに校正ツールを選ぶ」か、`cmp.g` を使わず**同じ音量になる操作だけで聞き比べる**設計を、各段階の冒頭で決める。XC(COMP)は `cm-cal.js`、XS(空間)は `ef-cal.js`/`pn-cal.js`、XB は `sb-cal.js`、XG は `se-cal.js` が近い。
3. **各レッスンに `col` が必須**・**各トラックに `mx.eq` と `mx.cp` が必須**(`test/mx.js` の規則)。XE〜XD の検査は、これを引き継ぐ新規ファイルで行う。
4. **診断は「問題を1つだけ残した3つ」の形が定着**(`D10`)。xd01〜xd07 も同じ形に揃えると、補正表(`GT2`)の流儀が使える。
5. **仕様 §3 の「ステップ数5〜8」は、既存 MX の検査と一致**(`test/mx.js`)。validate は3〜8なので、新コース検査で5〜8を見る。
6. **GN は gn01〜gn22**(仕様の例は gn01〜gn11 の想定だった)。XG の pre を A-9 に合わせて割り当て直す(下表)。
7. **`SD.GUIDE.roles` に無い役割**(サブベース・ミッドベース・ダブル以外のコーラスなど)の数値は書けない。XB04・XG09 は「つまみ値と同じ数字のみ」で書くか、`SD.GUIDE` に**表を足す**(足すときは `test/mx.js` の一致検査も足す。**表を足すのは MX-1 の仕事**として利用者に確認する)。

## C. XG の pre の割り当て(確定案)
| ID | 題 | pre |
|---|---|---|
| xg01 | ダンス(EDM風) | gn06, gn07 |
| xg02 | ハウス・テクノ | gn01, gn02 |
| xg03 | ヒップホップ・トラップ風 | gn08 |
| xg04 | ロック風のシンセ曲 | gn07(近いものが無い。mx07 も) |
| xg05 | ポップ(歌もの) | vo13, mx07, gn15 |
| xg06 | ローファイ | gn11, ef05 |
| xg07 | アンビエント | gn13, xs01 |
| xg08 | ドラムンベース | gn05 |
| xg09 | ベースミュージック(重低音系) | gn04, xb04 |
| xg10 | シティポップ風 | gn16 |
| xg11 | ゲーム音楽・チップチューン風 | gn12 |
| xg12 | 同じ素材を3つの流儀で | xg01〜xg11 の3つ以上 |
`xg04` はジャンルを GN が持たない。ロック風は「中域の密度・壁のような広がり」で書き、**特定のバンド・曲に寄せない**。

## D. MX-1 で決めること(利用者へ)
- コースは6つに分けるか、`xmix.js` 1ファイルにまとめるか(登録が楽なのは1ファイル。コースの目次は6つのまま)。
- `SD.GUIDE` に上級用の数値表(例: ステレオ幅・リターンのHPF・多段コンプのGR)を足すか。足さないなら本文は「つまみ値と同じ数字のみ」。
- `cmp.g` は校正ツールを新規(`tools/xmix-cal.js`)にするか、操作が同じ音量になる設計にするか。

## E. 申し送り
- 変更: `docs/MX0_audit.md` の追加、README の先頭、キャッシュ名のみ。コードは変えていない。
- 未確認: 実機・耳での確認は何もしていない(この段階は読むだけ)。`test/ui.js` は jsdom が入らず未実施。
- 次の段階: MX-1(基盤)。D の3点を決めてから進める。
