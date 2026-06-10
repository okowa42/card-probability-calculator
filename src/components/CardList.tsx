import { CardType, Lang } from '../types';
import { t } from '../i18n';

interface Props {
  cards: CardType[];
  onChange: (cards: CardType[]) => void;
  lang: Lang;
}

let nextId = 1;

export function CardList({ cards, onChange, lang }: Props) {
  const addCard = () => {
    onChange([...cards, { id: `card_${nextId++}`, name: '', count: 4 }]);
  };

  const updateCard = (id: string, patch: Partial<CardType>) => {
    onChange(cards.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeCard = (id: string) => {
    onChange(cards.filter(c => c.id !== id));
  };

  const handleCount = (id: string, raw: string) => {
    if (raw === '') {
      updateCard(id, { count: '' as unknown as number });
      return;
    }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) updateCard(id, { count: v });
  };

  return (
    <section className="panel">
      <h2>{t(lang, 'cardTypes')}</h2>

      {cards.length === 0 && <p className="hint">{t(lang, 'noCards')}</p>}

      {cards.map(card => (
        <div key={card.id} className="card-item">
          <input
            type="text"
            placeholder={t(lang, 'cardName')}
            value={card.name}
            onChange={e => updateCard(card.id, { name: e.target.value })}
            className="card-name-input"
          />
          <input
            type="text"
            inputMode="numeric"
            value={(card.count as unknown as string) === '' ? '' : card.count}
            onChange={e => handleCount(card.id, e.target.value)}
            className="card-count-input"
          />
          <span className="card-unit">{t(lang, 'cards')}</span>
          <button className="btn-delete" onClick={() => removeCard(card.id)}>
            {t(lang, 'delete')}
          </button>
        </div>
      ))}

      <button className="btn-add" onClick={addCard}>
        + {t(lang, 'addCard')}
      </button>
    </section>
  );
}
