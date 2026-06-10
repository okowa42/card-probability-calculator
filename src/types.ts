export interface CardType {
  id: string;
  name: string;
  count: number;
}

export type Comparison = 'atLeast' | 'exactly' | 'atMost';
export type CombineMode = 'any' | 'all';
export type LogicOp = 'and' | 'or';

/** Which portion of the opening hand to check */
export type HandScope = 'initial' | 'full' | 'side';

/** A single leaf condition */
export interface Condition {
  id: string;
  cardId: string;
  targetCount: number;
  comparison: Comparison;
  enabled: boolean;
  handScope: HandScope;
}

/** Draw check: look at N cards from remaining deck and evaluate conditions */
export interface DrawCheck {
  id: string;
  enabled: boolean;
  deckSize: number;   // user-specified remaining deck size (accounts for thinning)
  lookCount: number;  // how many cards to look at from remaining deck top
  rootGroup: ConditionGroup;
}

/** A node in the condition tree */
export type ConditionNode =
  | { type: 'condition'; data: Condition }
  | { type: 'group'; data: ConditionGroup }
  | { type: 'drawCheck'; data: DrawCheck };

/** A group of conditions/groups joined by AND or OR */
export interface ConditionGroup {
  id: string;
  operator: LogicOp;
  children: ConditionNode[];
}

/** A combination = root condition group */
export interface Combination {
  id: string;
  name: string;
  enabled: boolean;
  rootGroup: ConditionGroup;
}

export interface DeckSettings {
  deckSize: number;
  sideCount: number;
  drawCount: number;
  topDrawCount: number;
  openingHandMode: boolean;
}

export type Lang = 'ja' | 'en';
