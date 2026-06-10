import {
  Comparison, CardType, Condition, ConditionGroup, ConditionNode,
  Combination, DeckSettings, CombineMode, DrawCheck,
} from '../types';

// ── Combinatorics ──

const logFactCache: number[] = [0, 0];
function logFact(n: number): number {
  if (n < 0) return -Infinity;
  if (n < logFactCache.length) return logFactCache[n];
  for (let i = logFactCache.length; i <= n; i++) {
    logFactCache[i] = logFactCache[i - 1] + Math.log(i);
  }
  return logFactCache[n];
}

function logComb(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return logFact(n) - logFact(k) - logFact(n - k);
}

function hypergeometricPMF(N: number, K: number, n: number, k: number): number {
  if (k < 0 || k > K || k > n || (n - k) > (N - K)) return 0;
  const logP = logComb(K, k) + logComb(N - K, n - k) - logComb(N, n);
  return Math.exp(logP);
}

export function calcSingleEventExact(
  N: number, K: number, n: number, x: number, comparison: Comparison,
): number {
  let prob = 0;
  const maxK = Math.min(K, n);
  switch (comparison) {
    case 'exactly':
      prob = hypergeometricPMF(N, K, n, x);
      break;
    case 'atLeast':
      for (let k = x; k <= maxK; k++) prob += hypergeometricPMF(N, K, n, k);
      break;
    case 'atMost':
      for (let k = 0; k <= Math.min(x, maxK); k++) prob += hypergeometricPMF(N, K, n, k);
      break;
  }
  return Math.min(1, Math.max(0, prob));
}

function checkComparison(count: number, target: number, comparison: Comparison): boolean {
  switch (comparison) {
    case 'atLeast': return count >= target;
    case 'exactly': return count === target;
    case 'atMost': return count <= target;
  }
}

function countCards(arr: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of arr) {
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

/** Context passed through recursive evaluation */
interface EvalContext {
  initialCounts: Map<string, number>;
  fullCounts: Map<string, number>;
  sideCounts: Map<string, number>;
  remaining: string[];  // remaining deck after initial+side+topdraw
  openingHandMode: boolean;
}

// ── Evaluate a ConditionGroup recursively ──
function evaluateGroup(group: ConditionGroup, ctx: EvalContext): boolean {
  const results: boolean[] = [];

  for (const child of group.children) {
    results.push(evaluateNode(child, ctx));
  }

  if (results.length === 0) return false;
  return group.operator === 'and'
    ? results.every(r => r)
    : results.some(r => r);
}

// ── Evaluate a single node ──
function evaluateNode(node: ConditionNode, ctx: EvalContext): boolean {
  switch (node.type) {
    case 'condition': {
      const cond = node.data;
      if (!cond.enabled) return true; // disabled conditions are ignored (pass through)
      let counts: Map<string, number>;
      if (ctx.openingHandMode && cond.handScope === 'initial') {
        counts = ctx.initialCounts;
      } else if (ctx.openingHandMode && cond.handScope === 'side') {
        counts = ctx.sideCounts;
      } else {
        counts = ctx.fullCounts;
      }
      const count = counts.get(cond.cardId) || 0;
      return checkComparison(count, cond.targetCount, cond.comparison);
    }
    case 'group': {
      return evaluateGroup(node.data, ctx);
    }
    case 'drawCheck': {
      const dc = node.data;
      if (!dc.enabled) return true;
      // Use user-specified deckSize to limit the pool (simulates deck thinning)
      // If deckSize < actual remaining, only use the first deckSize cards
      const pool = dc.deckSize < ctx.remaining.length
        ? ctx.remaining.slice(0, dc.deckSize)
        : ctx.remaining;
      const lookN = Math.min(dc.lookCount, pool.length);
      const looked = pool.slice(0, lookN);
      const lookedCounts = countCards(looked);
      const dcCtx: EvalContext = {
        initialCounts: lookedCounts,
        fullCounts: lookedCounts,
        sideCounts: new Map(),
        remaining: pool.slice(lookN),
        openingHandMode: false,
      };
      return evaluateGroup(dc.rootGroup, dcCtx);
    }
  }
}

// ── Monte Carlo simulation ──
export function calcMonteCarlo(
  deckSettings: DeckSettings,
  cards: CardType[],
  combinations: Combination[],
  combineMode: CombineMode,
  trials: number = 300000,
): number {
  const { deckSize, sideCount, drawCount, topDrawCount, openingHandMode } = deckSettings;
  let successCount = 0;

  const enabledCombos = combinations.filter(c => c.enabled);
  if (enabledCombos.length === 0) return 0;

  // Build deck
  const deck: string[] = [];
  let assigned = 0;
  for (const c of cards) {
    for (let i = 0; i < c.count; i++) deck.push(c.id);
    assigned += c.count;
  }
  for (let i = assigned; i < deckSize; i++) deck.push('__other__');

  const deckLen = deck.length;
  const deckArr = new Array(deckLen);

  for (let trial = 0; trial < trials; trial++) {
    // Copy and shuffle (Fisher-Yates)
    for (let i = 0; i < deckLen; i++) deckArr[i] = deck[i];
    for (let i = deckLen - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = deckArr[i];
      deckArr[i] = deckArr[j];
      deckArr[j] = tmp;
    }

    // Build hands
    let initialHand: string[];
    let fullHand: string[];
    let sideCards: string[];
    let remainStart: number;

    if (openingHandMode) {
      initialHand = deckArr.slice(0, drawCount);
      sideCards = deckArr.slice(drawCount, drawCount + sideCount);
      const topStart = drawCount + sideCount;
      const topCards: string[] = [];
      for (let i = 0; i < topDrawCount && topStart + i < deckLen; i++) {
        topCards.push(deckArr[topStart + i]);
      }
      fullHand = [...initialHand, ...topCards];
      remainStart = topStart + topDrawCount;
    } else {
      initialHand = deckArr.slice(0, drawCount);
      fullHand = initialHand;
      sideCards = [];
      remainStart = drawCount;
    }

    const ctx: EvalContext = {
      initialCounts: countCards(initialHand),
      fullCounts: countCards(fullHand),
      sideCounts: countCards(sideCards),
      remaining: deckArr.slice(remainStart),
      openingHandMode,
    };

    // Evaluate each combination
    const comboResults = enabledCombos.map(combo =>
      evaluateGroup(combo.rootGroup, ctx)
    );

    const success = combineMode === 'any'
      ? comboResults.some(r => r)
      : comboResults.every(r => r);

    if (success) successCount++;
  }

  return successCount / trials;
}

// ── Main dispatcher ──
export function calculate(
  deckSettings: DeckSettings,
  cards: CardType[],
  combinations: Combination[],
  combineMode: CombineMode,
  mcTrials: number = 300000,
): { probability: number; method: 'exact' | 'montecarlo' } {
  const enabledCombos = combinations.filter(c => c.enabled);
  if (enabledCombos.length === 0) return { probability: 0, method: 'exact' };

  const probability = calcMonteCarlo(deckSettings, cards, combinations, combineMode, mcTrials);
  return { probability, method: 'montecarlo' };
}

// ── Reverse calculation ──
export function reverseCalc(
  N: number, n: number, x: number, comparison: Comparison, targetProbPercent: number,
): number {
  const targetProb = targetProbPercent / 100;
  for (let K = 0; K <= N; K++) {
    const prob = calcSingleEventExact(N, K, n, x, comparison);
    if (prob >= targetProb) return K;
  }
  return N;
}
