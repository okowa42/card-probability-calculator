import { useState } from 'react';
import { Comparison, Lang } from '../types';
import { t } from '../i18n';
import { reverseCalc } from '../utils/math';

interface Props {
  lang: Lang;
}

export function ReverseCalculator({ lang }: Props) {
  const [deckSize, setDeckSize] = useState<number | ''>(60);
  const [drawCount, setDrawCount] = useState<number | ''>(7);
  const [targetCount, setTargetCount] = useState<number | ''>(1);
  const [comparison, setComparison] = useState<Comparison>('atLeast');
  const [targetProb, setTargetProb] = useState<number | ''>(80);
  const [result, setResult] = useState<number | null>(null);

  const handleNum = (setter: (v: number | '') => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') { setter(''); return; }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) setter(v);
  };

  const handleCalc = () => {
    if (deckSize === '' || drawCount === '' || targetCount === '' || targetProb === '') return;
    const r = reverseCalc(deckSize, drawCount, targetCount, comparison, targetProb);
    setResult(r);
  };

  const compLabel = (c: Comparison) => {
    switch (c) {
      case 'atLeast': return t(lang, 'atLeast');
      case 'exactly': return t(lang, 'exactly');
      case 'atMost': return t(lang, 'atMost');
    }
  };

  return (
    <section className="panel">
      <h2>{t(lang, 'reverseCalc')}</h2>
      <p className="hint">{t(lang, 'reverseDesc')}</p>

      <div className="input-row">
        <label>
          {t(lang, 'deckSize')}
          <input type="text" inputMode="numeric" value={deckSize} onChange={handleNum(setDeckSize)} />
        </label>
        <label>
          {t(lang, 'drawCount')}
          <input type="text" inputMode="numeric" value={drawCount} onChange={handleNum(setDrawCount)} />
        </label>
      </div>

      <div className="input-row">
        <label>
          {t(lang, 'targetCount')}
          <input type="text" inputMode="numeric" value={targetCount} onChange={handleNum(setTargetCount)} />
        </label>
        <label>
          {t(lang, 'targetProbability')}
          <input type="text" inputMode="numeric" value={targetProb} onChange={handleNum(setTargetProb)} />
        </label>
        <label>
          &nbsp;
          <select
            value={comparison}
            onChange={e => setComparison(e.target.value as Comparison)}
          >
            <option value="atLeast">{t(lang, 'atLeast')}</option>
            <option value="exactly">{t(lang, 'exactly')}</option>
            <option value="atMost">{t(lang, 'atMost')}</option>
          </select>
        </label>
      </div>

      <button className="btn-calc" onClick={handleCalc}>
        {t(lang, 'calculate')}
      </button>

      {result !== null && (
        <div className="result-box reverse-result">
          <strong>{t(lang, 'requiredCount')}: {result}{t(lang, 'cards')}</strong>
          <p className="result-detail">
            {t(lang, 'reverseResult')
              .replace('{n}', String(deckSize))
              .replace('{d}', String(drawCount))
              .replace('{p}', String(targetProb))
              .replace('{x}', String(targetCount))
              .replace('{comp}', compLabel(comparison))
              .replace('{r}', String(result))
            }
          </p>
        </div>
      )}
    </section>
  );
}
