import { useState } from 'react';
import { Combination, CardType, CombineMode, ConditionGroup, Lang } from '../types';
import { t } from '../i18n';
import { uid } from '../utils/ids';
import { newGroup } from '../utils/groupHelpers';
import { ConditionGroupView } from './ConditionGroupView';

interface Props {
  combinations: Combination[];
  cards: CardType[];
  combineMode: CombineMode;
  openingHandMode: boolean;
  defaultDeckRemaining: number;
  onCombinationsChange: (combos: Combination[]) => void;
  onCombineModeChange: (mode: CombineMode) => void;
  lang: Lang;
}

export function CombinationList({
  combinations, cards, combineMode, openingHandMode, defaultDeckRemaining,
  onCombinationsChange, onCombineModeChange, lang,
}: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const defaultCardId = cards.length > 0 ? cards[0].id : '';

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCombination = () => {
    const newCombo: Combination = {
      id: uid('combo'),
      name: '',
      enabled: true,
      rootGroup: newGroup('and', defaultCardId, 'full'),
    };
    onCombinationsChange([...combinations, newCombo]);
  };

  const updateCombo = (id: string, patch: Partial<Combination>) => {
    onCombinationsChange(combinations.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeCombo = (id: string) => {
    onCombinationsChange(combinations.filter(c => c.id !== id));
  };

  const updateRootGroup = (comboId: string, group: ConditionGroup) => {
    updateCombo(comboId, { rootGroup: group });
  };

  return (
    <section className="panel">
      <h2>{t(lang, 'combinations')}</h2>
      <p className="hint">{t(lang, 'combinationAndDesc')}</p>

      {combinations.length === 0 && <p className="hint">{t(lang, 'noCombinations')}</p>}

      {combinations.map((combo, comboIdx) => {
        const isCollapsed = collapsedIds.has(combo.id);
        return (
          <div key={combo.id} className="combination-block">
            <div className="combination-header">
              <input
                type="checkbox"
                checked={combo.enabled}
                onChange={e => updateCombo(combo.id, { enabled: e.target.checked })}
              />
              <input
                type="text"
                placeholder={`${t(lang, 'combinationName')} ${comboIdx + 1}`}
                value={combo.name}
                onChange={e => updateCombo(combo.id, { name: e.target.value })}
                className="combo-name-input"
              />
              <button
                className="combo-collapse-btn"
                onClick={() => toggleCollapse(combo.id)}
                aria-label={isCollapsed ? t(lang, 'expand') : t(lang, 'collapse')}
              >
                <span className={`combo-chevron ${isCollapsed ? 'collapsed' : ''}`}>{'▼'}</span>
              </button>
              {combinations.length > 1 && (
                <button className="btn-delete" onClick={() => removeCombo(combo.id)}>
                  {t(lang, 'delete')}
                </button>
              )}
            </div>

            <div className={`combo-body ${isCollapsed ? 'collapsed' : ''}`}>
              <div className="combo-body-inner">
                <ConditionGroupView
                  group={combo.rootGroup}
                  cards={cards}
                  openingHandMode={openingHandMode}
                  showHandScope={true}
                  defaultDeckRemaining={defaultDeckRemaining}
                  depth={0}
                  isRoot={true}
                  canDelete={false}
                  onChange={g => updateRootGroup(combo.id, g)}
                  lang={lang}
                />
              </div>
            </div>

            {comboIdx < combinations.length - 1 && (
              <div className="combo-separator">
                {combineMode === 'any' ? 'OR' : 'AND'}
              </div>
            )}
          </div>
        );
      })}

      <button className="btn-add" onClick={addCombination} disabled={cards.length === 0}>
        + {t(lang, 'addCombination')}
      </button>

      {combinations.length >= 2 && (
        <div className="combine-mode">
          <label>{t(lang, 'combineMode')}:</label>
          <select
            value={combineMode}
            onChange={e => onCombineModeChange(e.target.value as CombineMode)}
          >
            <option value="any">{t(lang, 'any')}</option>
            <option value="all">{t(lang, 'all')}</option>
          </select>
        </div>
      )}
    </section>
  );
}
