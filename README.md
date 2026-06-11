# ポケカ確率計算ツール（非公式）

ポケモンカードゲームの60枚デッキにおける初手・ドロー時の確率を、モンテカルロ法でシミュレーションするWebツールです。

> 本ツールは個人が開発した非公式のファンメイド・ツールです。株式会社ポケモン・任天堂・株式会社クリーチャーズ・株式会社ゲームフリークとは一切関係ありません。

## 機能

- **デッキ設定**: デッキ枚数・サイド枚数・ドロー枚数・トップドロー枚数・対戦開始モードを設定
- **カード管理**: カードの種類と採用枚数を登録
- **デッキインポート**: デッキコードからカードリストを読み込み
- **条件定義**: 組み合わせベースの事象定義（AND/ORの再帰的なネストに対応）
- **山札判定（DrawCheck）**: デッキ圧縮（メタルシグナル等）を考慮した山札からのカード参照判定
- **HandScope**: 初期手札・手札全体・サイドのいずれを判定対象にするか選択可能
- **モンテカルロシミュレーション**: 試行回数を指定して確率を算出（デフォルト30万回）
- **逆算機能**: 目標確率から必要な採用枚数を逆算
- **日英切替**: UIの言語を日本語/英語で切り替え可能

## 使い方

1. デッキ設定（デッキ枚数・ドロー枚数など）を入力
2. カードリストにデッキ内のカード種類と枚数を登録（デッキインポートも利用可）
3. 確認したい条件（例: AカードとBカードが両方手札にある）を組み合わせとして定義
4. 「計算」を実行し、モンテカルロ法による確率を確認
5. 必要に応じて「逆算」タブで目標確率から必要枚数を確認

## セットアップ（開発者向け）

```bash
npm install
npm run dev
```

ビルド:

```bash
npm run build
```

### 必要環境

- Node.js
- npm

## 技術スタック

- React 18 + TypeScript
- Vite
- モンテカルロ法による確率計算（`src/utils/math.ts`）

## ライセンス

このプロジェクトのソースコードは [MIT License](./LICENSE) の下で公開されています。

## 免責事項（商標・著作権について）

本ツールで使用・参照される「ポケモン」「ポケモンカードゲーム」等の名称、カード名等の著作権・商標権は、株式会社ポケモン、任天堂株式会社、株式会社クリーチャーズ、株式会社ゲームフリークに帰属します。本リポジトリのMITライセンスは独自に作成したソースコードにのみ適用され、これら第三者の権利物には一切及びません。

なお、本ツール内のエネルギーシンボル画像（`public/energy/`）は開発者が独自に作成（AI生成）したオリジナル素材であり、公式アートワークの複製ではありません。ただし、エネルギータイプの名称・概念自体はポケモンカードゲームに由来するものです。

---

# Pokémon TCG Probability Calculator (Unofficial)

A web tool that uses Monte Carlo simulation to calculate the probability of drawing specific cards in your opening hand (or later draws) from a 60-card Pokémon Trading Card Game deck.

> This is an unofficial, fan-made tool created by an individual developer. It is not affiliated with, endorsed by, or connected to The Pokémon Company, Nintendo, Creatures Inc., or Game Freak inc.

## Features

- **Deck settings**: configure deck size, prize count, draw count, top-draw count, and "match start" mode
- **Card list**: register card types and copy counts
- **Deck import**: load a card list from a deck code
- **Condition builder**: define combination-based events with recursive AND/OR nesting
- **Draw check**: check for cards drawn from the remaining deck, accounting for deck thinning (e.g. Metal Signal)
- **Hand scope**: evaluate against the opening hand, full hand, or prizes
- **Monte Carlo simulation**: configurable trial count (default 300,000)
- **Reverse calculator**: work backwards from a target probability to the required number of copies
- **Japanese / English UI**

## Usage

1. Configure deck settings (deck size, draw count, etc.)
2. Register the card types and counts in your deck (or import via deck code)
3. Define the condition(s) you want to evaluate (e.g. "both Card A and Card B in opening hand")
4. Run the calculation to get the Monte Carlo probability
5. Use the "Reverse" tab to find how many copies you'd need for a target probability

## Setup (for developers)

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

### Requirements

- Node.js
- npm

## Tech Stack

- React 18 + TypeScript
- Vite
- Monte Carlo probability engine (`src/utils/math.ts`)

## License

The source code of this project is licensed under the [MIT License](./LICENSE).

## Disclaimer (Trademarks & Copyright)

"Pokémon", "Pokémon Trading Card Game", card names, and related names referenced or used by this tool are trademarks and/or copyrighted property of The Pokémon Company, Nintendo, Creatures Inc., and Game Freak inc. The MIT license for this repository applies only to the original source code and does not extend to any such third-party intellectual property.

The energy symbol icons included in this tool (`public/energy/`) are original assets independently created (AI-generated) by the developer and are not reproductions of official artwork. However, the underlying energy type names/concepts originate from the Pokémon Trading Card Game.
