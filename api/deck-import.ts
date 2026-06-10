/**
 * Vercel Serverless Function — デッキコードからカードリストを取得
 *
 * GET /api/deck-import?code=<deckCode>
 *
 * pokemon-card.com の result.html を取得して hidden form field + inline JS をパースし、
 * カード名・枚数の JSON を返す。CORS 制限を回避するためのサーバーサイドプロキシ。
 */

type Req = {
  query: Record<string, string | string[]>;
  method?: string;
};

type Res = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body: string): void;
};

interface CardResult {
  name: string;
  count: number;
}

// デッキのカテゴリを表す hidden field 名
const DECK_FIELDS = [
  'deck_pke',  // ポケモン
  'deck_gds',  // グッズ
  'deck_sup',  // サポーター
  'deck_sta',  // スタジアム
  'deck_ene',  // エネルギー
  'deck_tool', // ポケモンのどうぐ
  'deck_tech',
  'deck_ajs',
] as const;

/** input タグから name に対応する value 属性を取り出す */
function extractFieldValue(html: string, fieldName: string): string | null {
  // name="fieldName" を含む <input ... /> タグ全体を取得（属性の順序不定に対応）
  const tagPattern = new RegExp(
    `<input[^>]*name=["']${fieldName}["'][^>]*/?>`,
    'is'
  );
  const tagMatch = tagPattern.exec(html);
  if (!tagMatch) return null;

  const valueMatch = /value=["']([^"']*)["']/.exec(tagMatch[0]);
  return valueMatch ? valueMatch[1] : null;
}

/**
 * HTML から { name, count }[] を構築する
 *
 * ① PCGDECK.searchItemNameAlt  → カード名（セット情報なし）
 * ② PCGDECK.searchItemName     → カード名（セット情報付き）
 * ③ hidden form fields         → cardId → 枚数マップ
 */
function parseCards(html: string): CardResult[] {
  // ── カード名を抽出 ──────────────────────────────
  const nameAltMap: Record<string, string> = {};
  const nameMap: Record<string, string> = {};

  // PCGDECK.searchItemNameAlt[12345]='リザードン';
  const altRe = /PCGDECK\.searchItemNameAlt\[(\d+)\]='([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = altRe.exec(html)) !== null) {
    nameAltMap[m[1]] = m[2];
  }

  // PCGDECK.searchItemName[12345]='リザードン(SV 001)';
  const nameRe = /PCGDECK\.searchItemName\[(\d+)\]='([^']+)'/g;
  while ((m = nameRe.exec(html)) !== null) {
    // セットコード "(xxx yyy)" をトリム
    nameMap[m[1]] = m[2].replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  // Alt を優先、なければ Name
  const mergedNames: Record<string, string> = { ...nameMap, ...nameAltMap };

  // ── 枚数を抽出（HTML 上の出現順を維持）──────────
  // フォーマット: "{cardId}_{count}_{mainFlag}" を "-" で連結
  // DECK_FIELDS の定義順ではなく、HTML 内で input が現れる順に読む
  const cardCounts: Record<string, number> = {};
  const insertionOrder: string[] = [];

  const knownFields = new Set<string>(DECK_FIELDS);
  // HTML 中の <input name="deck_xxx" value="..."> を出現順に探す
  const inputRe = /<input[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = inputRe.exec(html)) !== null) {
    const tag = tagMatch[0];
    const nameMatch = /name=["'](deck_[a-z]+)["']/i.exec(tag);
    if (!nameMatch || !knownFields.has(nameMatch[1])) continue;
    const valueMatch = /value=["']([^"']*)["']/i.exec(tag);
    if (!valueMatch || !valueMatch[1]) continue;

    for (const entry of valueMatch[1].split('-')) {
      if (!entry) continue;
      const parts = entry.split('_');
      if (parts.length < 2) continue;
      const cardId = parts[0];
      const count = parseInt(parts[1], 10);
      if (cardId && !isNaN(count) && count > 0) {
        if (!(cardId in cardCounts)) insertionOrder.push(cardId);
        cardCounts[cardId] = (cardCounts[cardId] ?? 0) + count;
      }
    }
  }

  // ── 結合（出現順を維持）────────────────────────
  return insertionOrder
    .filter((id) => mergedNames[id] && cardCounts[id])
    .map((id) => ({ name: mergedNames[id], count: cardCounts[id] }));
}

// ── Vercel Serverless Function Entry Point ──────

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');

  // クエリパラメータからデッキコードを取得
  const rawCode = req.query['code'];
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  if (!code || code.trim().length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'deck code is required' }));
    return;
  }

  const deckCode = code.trim();
  const url = `https://www.pokemon-card.com/deck/result.html/deckID/${encodeURIComponent(deckCode)}/`;

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });

    if (!response.ok) {
      res.statusCode = response.status === 404 ? 404 : 502;
      res.end(
        JSON.stringify({
          error:
            response.status === 404
              ? 'デッキが見つかりませんでした。デッキコードを確認してください。'
              : '外部サービスへの接続に失敗しました。',
        })
      );
      return;
    }

    html = await response.text();
  } catch (_err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'デッキデータの取得に失敗しました。' }));
    return;
  }

  const cards = parseCards(html);

  if (cards.length === 0) {
    res.statusCode = 404;
    res.end(
      JSON.stringify({
        error:
          'カードが見つかりませんでした。デッキコードが正しいか、デッキが公開されているか確認してください。',
      })
    );
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ cards }));
}
