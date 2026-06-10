import { useState } from 'react';
import { CardType, Lang } from '../types';
import { t } from '../i18n';
import { uid } from '../utils/ids';

interface ApiCard {
  name: string;
  count: number;
}

interface Props {
  onImport: (cards: CardType[]) => void;
  lang: Lang;
}

export function DeckImport({ onImport, lang }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deck-import?code=${encodeURIComponent(trimmed)}`);
      const data: { cards?: ApiCard[]; error?: string } = await res.json();

      if (!res.ok || !data.cards) {
        setError(data.error ?? t(lang, 'deckImportError'));
        return;
      }

      const cards: CardType[] = data.cards.map((c) => ({
        id: uid('card'),
        name: c.name,
        count: c.count,
      }));

      onImport(cards);
      setCode('');
    } catch {
      setError(t(lang, 'deckImportError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deck-import">
      <p className="deck-import-hint">{t(lang, 'deckImportHint')}</p>
      <div className="deck-import-row">
        <input
          type="text"
          className="deck-code-input"
          placeholder={t(lang, 'deckCodePlaceholder')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="btn-deck-import"
          onClick={handleImport}
          disabled={loading || !code.trim()}
        >
          {loading ? t(lang, 'deckImportLoading') : t(lang, 'deckImportBtn')}
        </button>
      </div>
      {error && <p className="deck-import-error">{error}</p>}
    </div>
  );
}
