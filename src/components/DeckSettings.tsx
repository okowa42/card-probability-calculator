import { DeckSettings as DeckSettingsType, Lang } from '../types';
import { t } from '../i18n';

interface Props {
  settings: DeckSettingsType;
  onChange: (s: DeckSettingsType) => void;
  totalCards: number;
  lang: Lang;
}

export function DeckSettingsPanel({ settings, onChange, totalCards, lang }: Props) {
  const remaining = settings.deckSize - totalCards;

  const handleNum = (field: keyof DeckSettingsType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange({ ...settings, [field]: '' as unknown as number });
      return;
    }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) onChange({ ...settings, [field]: v });
  };

  const numVal = (v: number) => (v as unknown as string) === '' ? '' : v;

  return (
    <section className="panel">
      <h2>{t(lang, 'deckSettings')}</h2>

      <div className="mode-toggle">
        <button
          className={settings.openingHandMode ? 'active' : ''}
          onClick={() => onChange({ ...settings, openingHandMode: true })}
        >
          {t(lang, 'openingHandMode')}
        </button>
        <button
          className={!settings.openingHandMode ? 'active' : ''}
          onClick={() => onChange({ ...settings, openingHandMode: false })}
        >
          {t(lang, 'genericMode')}
        </button>
      </div>

      <p className="mode-desc">
        {settings.openingHandMode ? t(lang, 'openingHandDesc') : t(lang, 'genericModeDesc')}
      </p>

      <div className="input-row">
        <label>
          {t(lang, 'deckSize')}
          <input
            type="text"
            inputMode="numeric"
            value={numVal(settings.deckSize)}
            onChange={handleNum('deckSize')}
          />
        </label>
        {settings.openingHandMode && (
          <>
            <label>
              {t(lang, 'sideCount')}
              <input
                type="text"
                inputMode="numeric"
                value={numVal(settings.sideCount)}
                onChange={handleNum('sideCount')}
              />
            </label>
            <label>
              {t(lang, 'topDrawCount')}
              <input
                type="text"
                inputMode="numeric"
                value={numVal(settings.topDrawCount)}
                onChange={handleNum('topDrawCount')}
              />
            </label>
          </>
        )}
        <label>
          {t(lang, 'drawCount')}
          <input
            type="text"
            inputMode="numeric"
            value={numVal(settings.drawCount)}
            onChange={handleNum('drawCount')}
          />
        </label>
      </div>

      <div className="deck-summary">
        <span>{t(lang, 'totalCards')}: {totalCards} / {settings.deckSize}</span>
        <span className={remaining < 0 ? 'error-text' : ''}>
          {t(lang, 'remaining')}: {remaining}
        </span>
      </div>
    </section>
  );
}
