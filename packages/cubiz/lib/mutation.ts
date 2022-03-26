import { Context } from "./core";

type Mutation<T> = (prev: T) => T;

/**
 * ArrayMutation: push multiple values to the array
 * @param values
 * @returns
 */
const push =
  <T>(...values: T[]) =>
  (prev: T[]) => {
    if (!values.length) return prev;
    return prev ? prev.concat(values) : values;
  };

/**
 * ArrayMutation: pop a the last value from the array
 * @returns
 */
const pop =
  <T>() =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    return prev.slice(0, prev.length - 1);
  };

/**
 * ArrayMutation: reverse array items order
 * @returns
 */
const reverse =
  <T>() =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    return prev.slice().reverse();
  };

/**
 * ArrayMutation: add multiple values to array at beginning
 * @param values
 * @returns
 */
const unshift =
  <T>(...values: T[]) =>
  (prev: T[]) => {
    if (!values.length) return prev;
    if (!prev?.length) return values;
    return values.concat(prev);
  };

/**
 * ArrayMutation: remove the first item in the array
 * @returns
 */
const shift =
  <T>() =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    return prev.slice(1);
  };

/**
 * ArrayMutation: remove 'deleteCount' items at 'start' position then insert 'items' to that position
 * @param start
 * @param deleteCount
 * @param items
 * @returns
 */
const splice =
  <T>(start: number, deleteCount?: number, ...items: T[]) =>
  (prev: T[]) => {
    const next = prev?.slice() ?? [];
    next.splice(start, deleteCount as number, ...items);
    return next;
  };

/**
 * ArrayMutation: swap two item values of the array
 * @param from
 * @param to
 * @returns
 */
const swap =
  <T>(from: number, to: number) =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    if (from === to) return prev;
    if (from < 0 || to < 0) return prev;
    if (prev[from] === prev[to]) return prev;
    const copy = prev.slice();
    copy[to] = prev[from];
    copy[from] = prev[to];
    return copy;
  };

/**
 * ArrayMutation: remove items in the array by its indices
 * @param indices
 * @returns
 */
const removeAt =
  <T>(...indices: number[]) =>
  (prev: T[]) => {
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

/**
 * ArrayMutation: remove items that matches predicate
 * @param predicate
 * @returns
 */
const removeAll =
  <T>(predicate: (value: T, index: number) => boolean) =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    const next = prev.filter((x, i) => !predicate(x, i));
    if (next.length === prev.length) return prev;
    return next;
  };

/**
 * ArrayMutation: exclude all specified values from the array
 * @param values
 * @returns
 */
const exlcude =
  <T>(...values: T[]) =>
  (prev: T[]) => {
    if (!prev?.length || !values.length) return prev;
    const next = prev.filter((x) => !values.includes(x));
    if (next.length === prev.length) return prev;
    return next;
  };

/**
 * ArrayMutation: sort the array
 * @param compareFn
 * @returns
 */
const sort =
  <T>(compareFn?: (a: T, b: T) => number) =>
  (prev: T[]) => {
    if (!prev?.length) return prev;
    return prev.slice().sort(compareFn);
  };

/**
 * ArrayMutation: sort the array by selected value
 * @param selector
 * @returns
 */
const orderBy = <T>(selector: (value: T) => any) =>
  sort<T>((a, b) => {
    const av = selector(a);
    const bv = selector(b);
    return av === bv ? 0 : av > bv ? 1 : -1;
  });

/**
 * ArrayMutation: mutate the array items
 * @param predicateOrIndex
 * @param mutations
 * @returns
 */
const item =
  <T>(
    predicateOrIndex:
      | ((value: T, index: number) => boolean)
      | number
      | "all"
      | "last"
      | "first",
    ...mutations: Mutation<T>[]
  ) =>
  (prev: T[]) => {
    const isPredicate = typeof predicateOrIndex === "function";
    if (!prev?.length && (isPredicate || predicateOrIndex === "all")) {
      return prev;
    }
    let hasChange = false;
    const predicate = isPredicate
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
    const index =
      predicateOrIndex === "last"
        ? prev?.length - 1
        : predicateOrIndex === "first"
        ? prev.length
          ? 0
          : -1
        : (predicateOrIndex as number);

    if (index < 0) {
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

/**
 * ObjectMutation: set object prop to new value
 * @param key
 * @param value
 * @returns
 */
const set =
  <T, TKey extends keyof T>(key: TKey, value: T[TKey]) =>
  (prev: T | undefined): T => {
    const p = prev?.[key];
    if (value === p) return prev as T;
    const next: any = { ...prev };
    next[key] = value;
    return next;
  };

const setAll =
  <T>(values: { [key in keyof T]?: T[key] }) =>
  (prev: T | undefined): T => {
    let next: any = prev;

    Object.keys(values).forEach((key: any) => {
      const k = key as keyof T;
      const n = values[k];
      const p = prev?.[k];
      if (n !== p) {
        if (next === prev) {
          next = { ...next } as T;
        }
        next[k] = n;
      }
    });
    return next;
  };

/**
 * ObjectMutation: remove object props
 * @param keys
 * @returns
 */
const unset =
  <T, TKey extends keyof T>(...keys: TKey[]) =>
  (prev: T | undefined): T => {
    if (!prev) return prev as T;
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

/**
 * ObjectMutation: mutate prop of the object with specified mutations
 * @param key
 * @param mutations
 * @returns
 */
const prop =
  <T, TKey extends keyof T>(key: TKey, ...mutations: Mutation<T[TKey]>[]) =>
  (prev: T | undefined): T => {
    const p = prev?.[key];
    const n: any = mutations.reduce((v, r) => r(v), p as any);
    if (n === p) return prev as T;
    const next: any = { ...prev };
    next[key] = n;
    return next;
  };

const read =
  <T>(callback: (value: T) => any) =>
  (prev: T): T => {
    callback(prev);
    return prev;
  };

/**
 * mutate state with specified mutations
 * @param context
 * @param mutations
 */
function mutate<T>(context: Context<T>, ...mutations: ((prev: T) => T)[]) {
  context.state(mutations.reduce((v, r) => r(v), context.state.value));
}

/**
 * ValueMutation: toggle the boolean value
 * @returns
 */
const toggle =
  <T>() =>
  (prev: T | undefined) =>
    !prev;

/**
 * ValueMutation: add durations to the date value
 * @param value
 * @returns
 */
const add =
  (
    value: Partial<
      Record<"D" | "M" | "Y" | "W" | "h" | "m" | "s" | "ms", number>
    >
  ) =>
  (prev: Date | undefined): Date => {
    let old = prev instanceof Date ? new Date(prev.getTime()) : new Date();
    let next = new Date(
      old.getFullYear() + (value.Y ?? 0),
      old.getMonth() + (value.M ?? 0),
      old.getDate() + (value.D ?? 0) + (value.W ?? 0) * 7,
      old.getHours() + (value.h ?? 0),
      old.getMinutes() + (value.m ?? 0),
      old.getSeconds() + (value.s ?? 0),
      old.getMilliseconds() + (value.ms ?? 0)
    );
    if (next.getTime() !== old.getTime()) return next;
    return prev as Date;
  };

const insert = <T>(position: number, ...items: T[]) =>
  splice<T>(position, 0, ...items);

export {
  Mutation,
  push,
  pop,
  shift,
  unshift,
  splice,
  sort,
  orderBy,
  removeAt,
  removeAll,
  exlcude,
  reverse,
  swap,
  item,
  prop,
  set,
  setAll,
  unset,
  mutate,
  toggle,
  add,
  insert,
  read,
};
