import { ConditionGroup, ConditionNode, Condition, DrawCheck, LogicOp, HandScope } from '../types';
import { uid } from './ids';

/** Create a new empty condition */
export function newCondition(cardId: string, handScope: HandScope = 'full'): Condition {
  return {
    id: uid('cond'),
    cardId,
    targetCount: 1,
    comparison: 'atLeast',
    enabled: true,
    handScope,
  };
}

/** Create a new group with one default condition */
export function newGroup(operator: LogicOp, cardId: string, handScope: HandScope = 'full'): ConditionGroup {
  return {
    id: uid('grp'),
    operator,
    children: [{ type: 'condition', data: newCondition(cardId, handScope) }],
  };
}

/** Create an empty group */
export function newEmptyGroup(operator: LogicOp): ConditionGroup {
  return { id: uid('grp'), operator, children: [] };
}

/** Create a new DrawCheck node */
export function newDrawCheck(cardId: string, defaultDeckSize: number = 46): DrawCheck {
  return {
    id: uid('dc'),
    enabled: true,
    deckSize: defaultDeckSize,
    lookCount: 7,
    rootGroup: newGroup('and', cardId, 'full'),
  };
}

/** Get the ID of a ConditionNode */
function nodeId(node: ConditionNode): string {
  return node.data.id;
}

/** Deep-clone a group */
function cloneGroup(g: ConditionGroup): ConditionGroup {
  return {
    ...g,
    children: g.children.map(cloneNode),
  };
}

function cloneDrawCheck(dc: DrawCheck): DrawCheck {
  return { ...dc, rootGroup: cloneGroup(dc.rootGroup) };
}

function cloneNode(ch: ConditionNode): ConditionNode {
  switch (ch.type) {
    case 'condition': return { type: 'condition', data: { ...ch.data } };
    case 'group': return { type: 'group', data: cloneGroup(ch.data) };
    case 'drawCheck': return { type: 'drawCheck', data: cloneDrawCheck(ch.data) };
  }
}

/** Update a node within a group tree by ID */
export function updateInGroup(
  group: ConditionGroup,
  targetId: string,
  updater: (node: ConditionNode) => ConditionNode | null,
): ConditionGroup {
  const g = cloneGroup(group);
  g.children = g.children
    .map(ch => {
      if (nodeId(ch) === targetId) return updater(ch);
      if (ch.type === 'group') {
        return { type: 'group' as const, data: updateInGroup(ch.data, targetId, updater) };
      }
      if (ch.type === 'drawCheck') {
        // Also search inside drawCheck's rootGroup
        const dc = cloneDrawCheck(ch.data);
        dc.rootGroup = updateInGroup(dc.rootGroup, targetId, updater);
        return { type: 'drawCheck' as const, data: dc };
      }
      return ch;
    })
    .filter((ch): ch is ConditionNode => ch !== null);
  return g;
}

/** Add a child to a specific group by group ID */
export function addToGroup(
  root: ConditionGroup,
  groupId: string,
  child: ConditionNode,
): ConditionGroup {
  const g = cloneGroup(root);
  if (g.id === groupId) {
    g.children.push(cloneNode(child));
    return g;
  }
  g.children = g.children.map(ch => {
    if (ch.type === 'group') {
      return { type: 'group' as const, data: addToGroup(ch.data, groupId, child) };
    }
    if (ch.type === 'drawCheck') {
      const dc = cloneDrawCheck(ch.data);
      dc.rootGroup = addToGroup(dc.rootGroup, groupId, child);
      return { type: 'drawCheck' as const, data: dc };
    }
    return ch;
  });
  return g;
}

/** Remove a child from any group by child ID */
export function removeFromGroup(
  root: ConditionGroup,
  childId: string,
): ConditionGroup {
  return updateInGroup(root, childId, () => null);
}

/** Update a condition's fields */
export function updateConditionInGroup(
  root: ConditionGroup,
  condId: string,
  patch: Partial<Condition>,
): ConditionGroup {
  return updateInGroup(root, condId, (node) => {
    if (node.type !== 'condition') return node;
    return { type: 'condition', data: { ...node.data, ...patch } };
  });
}

/** Update a DrawCheck's fields */
export function updateDrawCheckInGroup(
  root: ConditionGroup,
  dcId: string,
  patch: Partial<DrawCheck>,
): ConditionGroup {
  return updateInGroup(root, dcId, (node) => {
    if (node.type !== 'drawCheck') return node;
    return { type: 'drawCheck', data: { ...node.data, ...patch } };
  });
}

/** Update a nested group's operator */
export function updateGroupOperator(
  root: ConditionGroup,
  groupId: string,
  operator: LogicOp,
): ConditionGroup {
  if (root.id === groupId) {
    const g = cloneGroup(root);
    g.operator = operator;
    return g;
  }
  const g = cloneGroup(root);
  g.children = g.children.map(ch => {
    if (ch.type === 'group') {
      return { type: 'group' as const, data: updateGroupOperator(ch.data, groupId, operator) };
    }
    if (ch.type === 'drawCheck') {
      const dc = cloneDrawCheck(ch.data);
      dc.rootGroup = updateGroupOperator(dc.rootGroup, groupId, operator);
      return { type: 'drawCheck' as const, data: dc };
    }
    return ch;
  });
  return g;
}
