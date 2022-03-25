import { Context } from "./core";

type Mutation<TState> = (prev: TState) => TState;

/**
 * ArrayMutation: push multiple values to the array
 * @param values
 * @returns
 */
function push<TState>(...values: TState[]) {
  return (prev: TState[]) => {
    if (!values.length) return prev;
    return prev ? prev.concat(values) : values;
  };
}

/**
 * ArrayMutation: pop a the last value from the array
 * @returns
 */
function pop<TState>() {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    return prev.slice(0, prev.length - 1);
  };
}

/**
 * ArrayMutation: reverse array items order
 * @returns
 */
function reverse<TState>() {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    return prev.slice().reverse();
  };
}

/**
 * ArrayMutation: add multiple values to array at beginning
 * @param values
 * @returns
 */
function unshift<TState>(...values: TState[]) {
  return (prev: TState[]) => {
    if (!values.length) return prev;
    if (!prev?.length) return values;
    return values.concat(prev);
  };
}

/**
 * ArrayMutation: remove the first item in the array
 * @returns
 */
function shift<TState>() {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    return prev.slice(1);
  };
}

/**
 * ArrayMutation: remove 'deleteCount' items at 'start' position then insert 'items' to that position
 * @param start
 * @param deleteCount
 * @param items
 * @returns
 */
function splice<TState>(
  start: number,
  deleteCount?: number,
  ...items: TState[]
) {
  return (prev: TState[]) => {
    const next = prev?.slice() ?? [];
    next.splice(start, deleteCount as number, ...items);
    return next;
  };
}

/**
 * ArrayMutation: swap two item values of the array
 * @param from
 * @param to
 * @returns
 */
function swap<TState>(from: number, to: number) {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    if (from === to) return prev;
    if (from < 0 || from >= prev.length) return prev;
    if (to < 0 || to >= prev.length) return prev;
    if (prev[from] === prev[to]) return prev;
    const copy = prev.slice();
    copy[to] = prev[from];
    copy[from] = prev[to];
    return copy;
  };
}

/**
 * ArrayMutation: remove items in the array by its indices
 * @param indices
 * @returns
 */
function removeAt<TState>(...indices: number[]) {
  return (prev: TState[]) => {
    if (!prev?.length || !indices.length) return prev;
    const validIndices = indices.filter((x) => x >= 0 && x < prev.length);
    if (!validIndices.length) return prev;
    if (validIndices.length === 1) {
      const index = validIndices[0];
      // out of range
      if (index < 0 || index >= prev.length) return prev;
      return prev.slice(0, index).concat(prev.slice(index));
    }
    return prev.filter((_, i) => !validIndices.includes(i));
  };
}

/**
 * ArrayMutation: remove items that matches predicate
 * @param predicate
 * @returns
 */
function removeAll<TState>(
  predicate: (value: TState, index: number) => boolean
) {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    const next = prev.filter((x, i) => !predicate(x, i));
    if (next.length === prev.length) return prev;
    return next;
  };
}

/**
 * ArrayMutation: remove first item that matches predicate
 * @param predicate
 * @returns
 */
function removeFirst<TState>(
  predicate: (value: TState, index: number) => boolean
) {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    const index = prev.findIndex(predicate);
    if (index === -1) return prev;
    const next = prev.slice();
    next.splice(index, 1);
    return next;
  };
}

/**
 * ArrayMutation: exclude all specified values from the array
 * @param values
 * @returns
 */
function exlcude<TState>(...values: TState[]) {
  return (prev: TState[]) => {
    if (!prev?.length || !values.length) return prev;
    const next = prev.filter((x) => !values.includes(x));
    if (next.length === prev.length) return prev;
    return next;
  };
}

/**
 * ArrayMutation: sort the array
 * @param compareFn
 * @returns
 */
function sort<TState>(compareFn?: (a: TState, b: TState) => number) {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    return prev.slice().sort(compareFn);
  };
}

/**
 * ArrayMutation: sort the array by selected value
 * @param selector
 * @returns
 */
function orderBy<TState>(selector: (value: TState) => any) {
  return sort<TState>((a, b) => {
    const av = selector(a);
    const bv = selector(b);
    return av === bv ? 0 : av > bv ? 1 : -1;
  });
}

/**
 * ArrayMutation: mutate the array items
 * @param predicateOrIndex
 * @param mutations
 * @returns
 */
function item<TState>(
  predicateOrIndex:
    | ((value: TState, index: number) => boolean)
    | number
    | "all",
  ...mutations: Mutation<TState>[]
) {
  return (prev: TState[]) => {
    if (!prev?.length) return prev;
    let hasChange = false;
    const predicate =
      typeof predicateOrIndex === "function"
        ? predicateOrIndex
        : predicateOrIndex === "all"
        ? () => true
        : undefined;
    if (predicate) {
      const next = prev.map((value, index) => {
        if (predicate(value, index)) {
          const changed = mutations.reduce((v, mutation) => mutation(v), value);
          if (changed !== value) {
            hasChange = true;
            return changed;
          }
        }
        return value;
      });
      return hasChange ? next : prev;
    }
    const index = predicateOrIndex as number;
    if (index < 0 || index >= prev.length) {
      return prev;
    }
    const changed = mutations.reduce((v, reducer) => reducer(v), prev[index]);
    if (changed === prev[index]) {
      return prev;
    }
    const next = prev.slice();
    next[index] = changed;
    return next;
  };
}

/**
 * ObjectMutation: set object prop to new value
 * @param key
 * @param value
 * @returns
 */
function set<TState, TKey extends keyof TState>(
  key: TKey,
  value: TState[TKey]
) {
  return (prev: TState | undefined): TState => {
    const p = prev?.[key];
    if (value === p) return prev as TState;
    const next: any = { ...prev };
    next[key] = value;
    return next;
  };
}

/**
 * ObjectMutation: remove object props
 * @param keys
 * @returns
 */
function unset<TState, TKey extends keyof TState>(...keys: TKey[]) {
  return (prev: TState | undefined): TState => {
    if (!prev) return prev as TState;
    let next = prev;
    keys.forEach((key) => {
      if (key in next) {
        if (next === prev) {
          next = { ...next };
        }
        delete next[key];
      }
    });
    return next;
  };
}

/**
 * ObjectMutation: mutate prop of the object with specified mutations
 * @param key
 * @param mutations
 * @returns
 */
function prop<TState, TKey extends keyof TState>(
  key: TKey,
  ...mutations: Mutation<TState[TKey]>[]
) {
  return (prev: TState | undefined): TState => {
    const p = prev?.[key];
    const n: any = mutations.reduce((v, r) => r(v), p as any);
    if (n === p) return prev as TState;
    const next: any = { ...prev };
    next[key] = n;
    return next;
  };
}

/**
 * mutate state with specified mutations
 * @param context
 * @param mutations
 */
function mutate<TState>(
  context: Context<TState>,
  ...mutations: ((prev: TState) => TState)[]
) {
  context.state(mutations.reduce((v, r) => r(v), context.state.value));
}

/**
 * ValueMutation: toggle the boolean value
 * @returns
 */
function toggle() {
  return (prev: boolean) => !prev;
}

/**
 * ValueMutation: add durations to the date value
 * @param value
 * @returns
 */
function add(
  value: Record<"D" | "M" | "Y" | "W" | "h" | "m" | "s" | "ms" | "D", number>
) {
  return (prev: Date | undefined): Date => {
    let old = prev instanceof Date ? new Date(prev.getTime()) : new Date();
    let next = new Date(
      old.getFullYear() + value.Y ?? 0,
      old.getMonth() + value.M ?? 0,
      old.getDate() + value.D ?? 0 + (value.W ?? 0) * 7,
      old.getHours() + value.h ?? 0,
      old.getMinutes() + value.m ?? 0,
      old.getSeconds() + value.s ?? 0,
      old.getMilliseconds() + value.ms ?? 0
    );
    if (next.getTime() !== old.getTime()) return next;
    return prev as Date;
  };
}

export {
  push,
  pop,
  shift,
  unshift,
  splice,
  sort,
  orderBy,
  removeAt,
  removeAll,
  removeFirst,
  exlcude,
  reverse,
  swap,
  item,
  prop,
  set,
  unset,
  mutate,
  toggle,
  add,
};
