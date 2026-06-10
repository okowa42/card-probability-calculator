import { Lang } from '../types';
import { t } from '../i18n';

interface Props {
  probability: number | null;
  method: 'exact' | 'montecarlo' | null;
  isCalculating: boolean;
  lang: Lang;
}

export function ResultDisplay({ probability, method, isCalculating, lang }: Props) {
  if (isCalculating) {
    return (
      <section className="panel result-panel">
        <h2>{t(lang, 'result')}</h2>
        <div className="result-box calculating">
          <span className="spinner" />
          {t(lang, 'processing')}
        </div>
      </section>
    );
  }

  if (probability === null) return null;

  const pct = (probability * 100).toFixed(4);
  const methodLabel = method === 'exact' ? t(lang, 'exact') : t(lang, 'montecarlo');

  return (
    <section className="panel result-panel">
      <h2>{t(lang, 'result')}</h2>
      <div className="result-box">
        <div className="result-probability">{pct}%</div>
        <div className="result-method">
          {t(lang, 'method')}: {methodLabel}
        </div>
      </div>
    </section>
  );
}
