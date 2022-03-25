"use strict";
// function push<TState>(...values: TState[]) {
//   return (prev: TState[]) => {
//     if (!values.length) return prev;
//     return prev ? prev.concat(values) : values;
//   };
// }
// function pop<TState>() {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     return prev.slice(0, prev.length - 1);
//   };
// }
// function reverse<TState>() {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     return prev.slice().reverse();
//   };
// }
// function unshift<TState>(...values: TState[]) {
//   return (prev: TState[]) => {
//     if (!values.length) return prev;
//     if (!prev?.length) return values;
//     return values.concat(prev);
//   };
// }
// function shift<TState>() {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     return prev.slice(1);
//   };
// }
// function splice<TState>(
//   start: number,
//   deleteCount?: number,
//   ...items: TState[]
// ) {
//   return (prev: TState[]) => {
//     const next = prev?.slice() ?? [];
//     next.splice(start, deleteCount as number, ...items);
//     return next;
//   };
// }
// function swap<TState>(from: number, to: number) {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     if (from === to) return prev;
//     if (from < 0 || from >= prev.length) return prev;
//     if (to < 0 || to >= prev.length) return prev;
//     if (prev[from] === prev[to]) return prev;
//     const copy = prev.slice();
//     copy[to] = prev[from];
//     copy[from] = prev[to];
//     return copy;
//   };
// }
// function remove<TState>(...indices: number[]) {
//   return (prev: TState[]) => {
//     if (!prev?.length || !indices.length) return prev;
//     const validIndices = indices.filter((x) => x >= 0 && x < prev.length);
//     if (!validIndices.length) return prev;
//     if (validIndices.length === 1) {
//       const index = validIndices[0];
//       // out of range
//       if (index < 0 || index >= prev.length) return prev;
//       return prev.slice(0, index).concat(prev.slice(index));
//     }
//     return prev.filter((_, i) => !validIndices.includes(i));
//   };
// }
// function exlcude<TState>(...values: TState[]) {
//   return (prev: TState[]) => {
//     if (!prev?.length || !values.length) return prev;
//     const next = prev.filter((x) => !values.includes(x));
//     if (next.length === prev.length) return prev;
//     return next;
//   };
// }
// function sort<TState>(compareFn?: (a: TState, b: TState) => number) {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     return prev.slice().sort(compareFn);
//   };
// }
// function orderBy<TState>(selector: (value: TState) => any) {
//   return sort<TState>((a, b) => {
//     const av = selector(a);
//     const bv = selector(b);
//     return av === bv ? 0 : av > bv ? 1 : -1;
//   });
// }
// function item<TState>(
//   predicateOrIndex: ((value: TState, index: number) => boolean) | number,
//   ...reducers: ((prev: TState) => TState)[]
// ) {
//   return (prev: TState[]) => {
//     if (!prev?.length) return prev;
//     let hasChange = false;
//     if (typeof predicateOrIndex === "function") {
//       const next = prev.map((value, index) => {
//         if (predicateOrIndex(value, index)) {
//           const changed = reducers.reduce((v, reducer) => reducer(v), value);
//           if (changed !== value) {
//             hasChange = true;
//             return changed;
//           }
//         }
//         return value;
//       });
//       return hasChange ? next : prev;
//     }
//     if (predicateOrIndex < 0 || predicateOrIndex >= prev.length) {
//       return prev;
//     }
//     const changed = reducers.reduce(
//       (v, reducer) => reducer(v),
//       prev[predicateOrIndex]
//     );
//     if (changed === prev[predicateOrIndex]) {
//       return prev;
//     }
//     const next = prev.slice();
//     next[predicateOrIndex] = changed;
//     return next;
//   };
// }
// function set<TState extends Record<any, any>, TKey extends keyof TState>(
//   key: TKey,
//   value: TState[TKey]
// ) {
//   return (prev: TState) => {
//     if (!prev) return prev;
//     if (prev[key] === value) return prev;
//     const next = { ...prev };
//     next[key] = value;
//     return next;
//   };
// }
// type Spec<TState> = {
//   [key in keyof TState]?:
//     | Spec<TState[key]>
//     | ((value: TState[key], key: number | string | symbol) => TState[key]);
// };
// function mutate<TState>(spec: Spec<TState>) {
//   return (prev: TState) => {
//     return prev;
//   };
// }
// function prop<TState extends Record<any, any>>(changes: {
//   [key in keyof TState]?:
//     | ((prev: TState[key]) => TState[key])
//     | ((prev: TState[key]) => TState[key])[];
// }) {
//   return (prev: TState) => {
//     if (!prev) return prev;
//     let hasChange = false;
//     const next = { ...prev };
//     Object.keys(changes).forEach((k) => {
//       const key = k as keyof TState;
//       const reducers: any = Array.isArray(changes[key])
//         ? changes[key]
//         : [changes[key]];
//       const changed = reducers.reduce(
//         (v: any, reducer: any) => reducer(v),
//         prev[key]
//       );
//       if (changed === prev[key]) return;
//       hasChange = true;
//       next[key] = changed;
//     });
//     return hasChange ? next : prev;
//   };
// }
// export {
//   push,
//   pop,
//   shift,
//   unshift,
//   splice,
//   sort,
//   orderBy,
//   remove,
//   exlcude,
//   reverse,
//   swap,
//   item,
//   set,
//   prop,
//   mutate,
// };
//# sourceMappingURL=mutations.js.map