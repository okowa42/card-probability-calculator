import { useState, useCallback } from 'react';
import { DeckSettings, CardType, Combination, CombineMode, Lang } from './types';
import { t } from './i18n';
import { calculate } from './utils/math';
import { DeckSettingsPanel } from './components/DeckSettings';
import { CardList } from './components/CardList';
import { CombinationList } from './components/CombinationList';
import { ResultDisplay } from './components/ResultDisplay';
import { ReverseCalculator } from './components/ReverseCalculator';
import './App.css';

type Tab = 'calculator' | 'reverse';

/* Energy type images (user-provided assets in public/energy/) */
const ENERGY_IMGS = [
  'fire', 'water', 'grass', 'lightning',
  'psychic', 'fighting', 'darkness', 'metal',
];
const SCATTER = [
  { i:0, x:4,  y:10, r:-8,  s:38 },
  { i:1, x:16, y:46, r:10,  s:34 },
  { i:2, x:28, y:6,  r:-5,  s:36 },
  { i:3, x:40, y:44, r:12,  s:32 },
  { i:4, x:52, y:8,  r:-12, s:38 },
  { i:5, x:64, y:46, r:6,   s:34 },
  { i:6, x:76, y:6,  r:-10, s:36 },
  { i:7, x:88, y:42, r:15,  s:34 },
];

export default function App() {
  const [lang, setLang] = useState<Lang>('ja');
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [showGuide, setShowGuide] = useState(true);

  const [deckSettings, setDeckSettings] = useState<DeckSettings>({
    deckSize: 60,
    sideCount: 6,
    drawCount: 7,
    topDrawCount: 1,
    openingHandMode: true,
  });

  const [cards, setCards] = useState<CardType[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [combineMode, setCombineMode] = useState<CombineMode>('any');
  const [mcTrials, setMcTrials] = useState<number | ''>(300000);

  const [probability, setProbability] = useState<number | null>(null);
  const [usedMethod, setUsedMethod] = useState<'exact' | 'montecarlo' | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalCards = cards.reduce((s, c) => s + (typeof c.count === 'number' ? c.count : 0), 0);

  const handleCalculate = useCallback(() => {
    const enabledCombos = combinations.filter(c => c.enabled);
    if (enabledCombos.length === 0) return;
    setIsCalculating(true);
    setProbability(null);
    setTimeout(() => {
      const trials = typeof mcTrials === 'number' ? mcTrials : 300000;
      const result = calculate(deckSettings, cards, combinations, combineMode, trials);
      setProbability(result.probability);
      setUsedMethod(result.method);
      setIsCalculating(false);
    }, 50);
  }, [deckSettings, cards, combinations, combineMode, mcTrials]);

  const enabledComboCount = combinations.filter(c => c.enabled).length;

  const handleMcTrials = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') { setMcTrials(''); return; }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) setMcTrials(v);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="pokeball-icon" aria-hidden="true" />
          <div>
            <h1 className="app-title">{t(lang, 'title')}</h1>
            <div className="app-subtitle">{t(lang, 'subtitle')}</div>
          </div>
        </div>
        <button className="lang-toggle" onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')}>
          {lang === 'ja' ? 'EN' : 'JA'}
        </button>
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === 'calculator' ? 'active' : ''}
          onClick={() => setActiveTab('calculator')}
        >
          {t(lang, 'combinations')}
        </button>
        <button
          className={activeTab === 'reverse' ? 'active' : ''}
          onClick={() => setActiveTab('reverse')}
        >
          {t(lang, 'reverseCalc')}
        </button>
      </nav>

      {activeTab === 'calculator' ? (
        <main className="main-content">
          <section className="panel guide-panel">
            <button className="guide-toggle" onClick={() => setShowGuide(v => !v)}>
              <span className="guide-toggle-title">{t(lang, 'howToUse')}</span>
              <span className={`guide-chevron ${showGuide ? '' : 'collapsed'}`}>▼</span>
            </button>
            <div className={`guide-body ${showGuide ? '' : 'collapsed'}`}>
              <div className="guide-body-inner">
                <ol className="guide-steps">
                  <li>{t(lang, 'howToUseStep1')}</li>
                  <li>{t(lang, 'howToUseStep2')}</li>
                  <li>{t(lang, 'howToUseStep3')}</li>
                  <li>{t(lang, 'howToUseStep4')}</li>
                </ol>
                <div className="guide-note">
                  <div className="guide-note-title">{t(lang, 'howToOpeningTitle')}</div>
                  <p>{t(lang, 'howToOpeningDesc')}</p>
                </div>
              </div>
            </div>
          </section>

          <DeckSettingsPanel
            settings={deckSettings}
            onChange={setDeckSettings}
            totalCards={totalCards}
            lang={lang}
          />

          <CardList cards={cards} onChange={setCards} lang={lang} />

          <CombinationList
            combinations={combinations}
            cards={cards}
            combineMode={combineMode}
            openingHandMode={deckSettings.openingHandMode}
            defaultDeckRemaining={
              deckSettings.deckSize - deckSettings.drawCount
              - (deckSettings.openingHandMode ? deckSettings.sideCount + deckSettings.topDrawCount : 0)
            }
            onCombinationsChange={setCombinations}
            onCombineModeChange={setCombineMode}
            lang={lang}
          />

          <section className="panel calc-controls">
            <div className="mc-settings">
              <label>
                {t(lang, 'montecarloTrials')}:
                <input
                  type="text"
                  inputMode="numeric"
                  value={mcTrials}
                  onChange={handleMcTrials}
                />
              </label>
            </div>
            <button
              className="btn-calc main-calc"
              onClick={handleCalculate}
              disabled={enabledComboCount === 0 || isCalculating}
            >
              {t(lang, 'calculate')}
            </button>
          </section>

          <ResultDisplay
            probability={probability}
            method={usedMethod}
            isCalculating={isCalculating}
            lang={lang}
          />
        </main>
      ) : (
        <main className="main-content">
          <ReverseCalculator lang={lang} />
        </main>
      )}

      <footer className="app-footer">
        <div className="energy-scatter" aria-hidden="true">
          {SCATTER.map((s, idx) => (
            <img key={idx} className="energy-marble"
              src={`/energy/${ENERGY_IMGS[s.i]}.png`}
              alt="" draggable={false}
              style={{
                left: `${s.x}%`, top: `${s.y}%`,
                width: s.s, height: s.s,
                transform: `rotate(${s.r}deg)`,
              }} />
          ))}
        </div>
        <p className="footer-text">{t(lang, 'disclaimer')}</p>
      </footer>
    </div>
  );
}
