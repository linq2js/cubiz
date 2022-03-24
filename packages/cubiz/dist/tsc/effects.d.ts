import { Context, Effect, CancellablePromise } from "./core";
declare type InferAwaitable<TAwaitable> = TAwaitable extends Promise<infer TResolved> ? TResolved : TAwaitable;
interface EffectInfo {
    type: Function;
    payload: any[];
}
interface PromiseResult<T = any> {
    value: T;
    status: "fulfilled" | "rejected";
    reason: any;
}
interface WhenEffect extends Function {
    (context: Context<any>, predicate: (effect: EffectInfo) => boolean): CancellablePromise<EffectInfo>;
    (context: Context<any>, effects: Effect[]): CancellablePromise<EffectInfo>;
}
interface ThrottleEffect extends Function {
    (context: Context<any>, ms: number): Promise<void>;
}
interface DebounceEffect extends Function {
    (context: Context<any>, ms: number): CancellablePromise<void>;
}
interface DelayEffect extends Function {
    (context: Context<any>, ms: number): CancellablePromise<void>;
}
interface AllEffect extends Function {
    <TAwaitable>(context: Context<any>, awaitables: TAwaitable): CancellablePromise<TAwaitable extends Array<infer TItem> ? InferAwaitable<TItem>[] : TAwaitable extends {} ? {
        [key in keyof TAwaitable]: InferAwaitable<TAwaitable[key]>;
    } : never>;
}
interface AllSettledEffect extends Function {
    <TAwaitable>(context: Context<any>, awaitables: TAwaitable): CancellablePromise<TAwaitable extends [] ? PromiseResult[] : TAwaitable extends {} ? {
        [key in keyof TAwaitable]: PromiseResult;
    } : never>;
}
interface RaceEffect extends Function {
    <TAwaitable>(context: Context<any>, awaitables: TAwaitable): CancellablePromise<TAwaitable extends Array<infer TItem> ? InferAwaitable<TItem> : TAwaitable extends {} ? {
        [key in keyof TAwaitable]: InferAwaitable<TAwaitable[key]>;
    } : never>;
}
declare const all: AllEffect;
declare const race: RaceEffect;
declare const allSettled: AllSettledEffect;
declare const delay: DelayEffect;
declare const debounce: DebounceEffect;
declare const throttle: ThrottleEffect;
declare const when: WhenEffect;
export { delay, debounce, throttle, when, all, race, allSettled };
