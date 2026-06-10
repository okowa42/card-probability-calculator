import {
  ConditionGroup, Condition, DrawCheck, CardType, Comparison, HandScope, LogicOp, Lang,
} from '../types';
import { t } from '../i18n';
import {
  addToGroup, removeFromGroup, updateConditionInGroup,
  updateGroupOperator, updateDrawCheckInGroup,
  newCondition, newGroup, newDrawCheck,
} from '../utils/groupHelpers';

interface Props {
  group: ConditionGroup;
  cards: CardType[];
  openingHandMode: boolean;
  showHandScope: boolean;
  defaultDeckRemaining: number; // default remaining deck size for new DrawChecks
  depth: number;
  isRoot: boolean;
  canDelete: boolean;
  onChange: (updated: ConditionGroup) => void;
  onDelete?: () => void;
  lang: Lang;
}

export function ConditionGroupView({
  group, cards, openingHandMode, showHandScope, defaultDeckRemaining,
  depth, isRoot, canDelete, onChange, onDelete, lang,
}: Props) {
  const defaultCardId = cards.length > 0 ? cards[0].id : '';

  const handleAddCondition = () => {
    const condCount = group.children.filter(ch => ch.type === 'condition').length;
    const cardIdx = Math.min(condCount, cards.length - 1);
    const cardId = cards.length > 0 ? cards[cardIdx].id : '';
    onChange(addToGroup(group, group.id, {
      type: 'condition',
      data: newCondition(cardId, 'full'),
    }));
  };

  const handleAddGroup = () => {
    onChange(addToGroup(group, group.id, {
      type: 'group',
      data: newGroup('or', defaultCardId, 'full'),
    }));
  };

  const handleAddDrawCheck = () => {
    onChange(addToGroup(group, group.id, {
      type: 'drawCheck',
      data: newDrawCheck(defaultCardId, defaultDeckRemaining),
    }));
  };

  const handleCondChange = (condId: string, patch: Partial<Condition>) => {
    onChange(updateConditionInGroup(group, condId, patch));
  };

  const handleCondCount = (condId: string, raw: string) => {
    if (raw === '') {
      handleCondChange(condId, { targetCount: '' as unknown as number });
      return;
    }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) handleCondChange(condId, { targetCount: v });
  };

  const handleRemoveChild = (childId: string) => {
    onChange(removeFromGroup(group, childId));
  };

  const handleOperatorChange = (op: LogicOp) => {
    onChange(updateGroupOperator(group, group.id, op));
  };

  const handleNestedGroupChange = (nestedId: string, updated: ConditionGroup) => {
    const newChildren = group.children.map(ch =>
      ch.type === 'group' && ch.data.id === nestedId
        ? { type: 'group' as const, data: updated }
        : ch
    );
    onChange({ ...group, children: newChildren });
  };

  const handleDrawCheckGroupChange = (dcId: string, updated: ConditionGroup) => {
    onChange(updateDrawCheckInGroup(group, dcId, { rootGroup: updated }));
  };

  const handleDrawCheckNum = (dcId: string, field: 'deckSize' | 'lookCount') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(updateDrawCheckInGroup(group, dcId, { [field]: '' as unknown as number }));
      return;
    }
    const v = parseInt(raw, 10);
    if (!isNaN(v)) onChange(updateDrawCheckInGroup(group, dcId, { [field]: v }));
  };

  const opLabel = group.operator === 'and' ? 'AND' : 'OR';
  const drawCheckLabel = lang === 'ja' ? '山札判定' : 'Deck Check';
  const deckSizeLabel = lang === 'ja' ? '山札' : 'Deck';
  const lookCountLabel = lang === 'ja' ? '参照' : 'Look';
  const cardsLabel = lang === 'ja' ? '枚' : '';
  const addDrawCheckLabel = lang === 'ja' ? '+ 山札判定追加' : '+ Add Deck Check';

  return (
    <div className={`cond-group depth-${Math.min(depth, 3)}`}>
      <div className="cond-group-header">
        <select
          value={group.operator}
          onChange={e => handleOperatorChange(e.target.value as LogicOp)}
          className="op-select"
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
        </select>
        {!isRoot && canDelete && onDelete && (
          <button className="btn-delete" onClick={onDelete}>
            {t(lang, 'delete')}
          </button>
        )}
      </div>

      <div className="cond-group-body">
        {group.children.map((child, idx) => {
          const separator = idx < group.children.length - 1
            ? <div className="logic-label">{opLabel}</div>
            : null;

          if (child.type === 'condition') {
            const cond = child.data;
            return (
              <div key={cond.id}>
                <div className="condition-row">
                  <input
                    type="checkbox"
                    checked={cond.enabled}
                    onChange={e => handleCondChange(cond.id, { enabled: e.target.checked })}
                  />
                  <select
                    value={cond.cardId}
                    onChange={e => handleCondChange(cond.id, { cardId: e.target.value })}
                    className="cond-card-select"
                  >
                    <option value="">--</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={(cond.targetCount as unknown as string) === '' ? '' : cond.targetCount}
                    onChange={e => handleCondCount(cond.id, e.target.value)}
                    className="cond-count-input"
                  />
                  <span className="card-unit">{t(lang, 'cards')}</span>
                  <select
                    value={cond.comparison}
                    onChange={e => handleCondChange(cond.id, { comparison: e.target.value as Comparison })}
                    className="cond-comparison-select"
                  >
                    <option value="atLeast">{t(lang, 'atLeast')}</option>
                    <option value="exactly">{t(lang, 'exactly')}</option>
                    <option value="atMost">{t(lang, 'atMost')}</option>
                  </select>
                  {showHandScope && openingHandMode && (
                    <select
                      value={cond.handScope}
                      onChange={e => handleCondChange(cond.id, { handScope: e.target.value as HandScope })}
                      className="cond-scope-select"
                    >
                      <option value="initial">{t(lang, 'handScopeInitial')}</option>
                      <option value="full">{t(lang, 'handScopeFull')}</option>
                      <option value="side">{t(lang, 'handScopeSide')}</option>
                    </select>
                  )}
                  {group.children.length > 1 && (
                    <button className="btn-delete" onClick={() => handleRemoveChild(cond.id)}>
                      {t(lang, 'delete')}
                    </button>
                  )}
                </div>
                {separator}
              </div>
            );
          }

          if (child.type === 'group') {
            const nested = child.data;
            return (
              <div key={nested.id}>
                <ConditionGroupView
                  group={nested}
                  cards={cards}
                  openingHandMode={openingHandMode}
                  showHandScope={showHandScope}
                  defaultDeckRemaining={defaultDeckRemaining}
                  depth={depth + 1}
                  isRoot={false}
                  canDelete={true}
                  onChange={updated => handleNestedGroupChange(nested.id, updated)}
                  onDelete={() => handleRemoveChild(nested.id)}
                  lang={lang}
                />
                {separator}
              </div>
            );
          }

          if (child.type === 'drawCheck') {
            const dc = child.data;
            return (
              <div key={dc.id}>
                <div className="draw-check-block">
                  <div className="draw-check-header">
                    <span className="draw-check-badge">{drawCheckLabel}</span>
                    <label className="dc-look-label">
                      {deckSizeLabel}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(dc.deckSize as unknown as string) === '' ? '' : dc.deckSize}
                        onChange={handleDrawCheckNum(dc.id, 'deckSize')}
                        className="dc-look-input"
                      />
                      {cardsLabel}
                    </label>
                    <label className="dc-look-label">
                      {lookCountLabel}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(dc.lookCount as unknown as string) === '' ? '' : dc.lookCount}
                        onChange={handleDrawCheckNum(dc.id, 'lookCount')}
                        className="dc-look-input"
                      />
                      {cardsLabel}
                    </label>
                    <button className="btn-delete" onClick={() => handleRemoveChild(dc.id)}>
                      {t(lang, 'delete')}
                    </button>
                  </div>
                  <ConditionGroupView
                    group={dc.rootGroup}
                    cards={cards}
                    openingHandMode={false}
                    showHandScope={false}
                    defaultDeckRemaining={defaultDeckRemaining}
                    depth={depth + 1}
                    isRoot={true}
                    canDelete={false}
                    onChange={updated => handleDrawCheckGroupChange(dc.id, updated)}
                    lang={lang}
                  />
                </div>
                {separator}
              </div>
            );
          }

          return null;
        })}
      </div>

      <div className="cond-group-actions">
        <button className="btn-add-small" onClick={handleAddCondition} disabled={cards.length === 0}>
          + {t(lang, 'addCondition')}
        </button>
        <button className="btn-add-small" onClick={handleAddGroup} disabled={cards.length === 0}>
          + {t(lang, 'addGroup')}
        </button>
        <button className="btn-add-small btn-add-dc" onClick={handleAddDrawCheck} disabled={cards.length === 0}>
          {addDrawCheckLabel}
        </button>
      </div>
    </div>
  );
}
