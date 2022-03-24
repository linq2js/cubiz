declare type VoidCallback = () => void;
declare type Callback<T> = (payload: T) => void;
declare type Effect<TState = any, TPayload extends any[] = [], TResult = void> = (context: Context<TState>, ...args: TPayload) => TResult;
declare type CubizInit<TState = any> = Effect<TState, never, any>;
declare type InferEffectResult<TResult> = TResult extends Promise<infer TResolved> ? CancellablePromise<TResolved> : TResult;
interface Emitter {
    add(handler: Function): VoidCallback;
    emit(event?: any): void;
    each(callback: (handler: Function) => void): void;
    clear(): void;
}
interface CubizEventArgs<TState = any> {
    cubiz: Cubiz<TState>;
}
interface CubizCallEventArgs<TState = any> extends CubizEventArgs<TState> {
    effect: Function;
    payload: any[];
}
interface CubizEvents<TState = any> {
    change?: Callback<TState>;
    call?: Callback<CubizCallEventArgs<TState>>;
    dispose?: Callback<CubizEventArgs<TState>>;
    loading?: Callback<CubizEventArgs<TState>>;
}
interface ResolverEvents {
    change?: Callback<CubizEventArgs>;
    loading?: Callback<CubizEventArgs>;
    call?: Callback<CubizCallEventArgs>;
    dispose?: Callback<CubizEventArgs>;
}
interface ContextEvents {
    dispose?: VoidCallback;
    cancel?: VoidCallback;
}
interface Context<TState = any> extends Cancellable, Disposable {
    /**
     * Get effect info
     */
    readonly effect: Effect;
    /**
     * Get current cubiz
     */
    readonly cubiz: Cubiz<TState>;
    /**
     * Get data of the effect. The data is persisted between effect calls
     */
    readonly data: Record<string, any>;
    /**
     * Find all contents that mathes specified predicate.
     * This method is useful to implement the effect that impacts to other effect calls
     * @param predicate
     */
    findContexts(predicate?: (context: Context<TState>) => boolean): Context<TState>[];
    /**
     * get current state
     */
    state(): TState;
    /**
     * update state with new value
     * @param value
     */
    state(value: TState): void;
    /**
     * Update state by using reducer.
     * The reducer retrieves previous state and returns a new one
     * @param reducer
     */
    state(reducer: (prev: TState) => TState): void;
    /**
     * listen context events
     * @param events
     */
    on(events: ContextEvents): VoidCallback;
    /**
     * call effect
     * @param effect
     * @param args
     */
    call<TPayload extends any[], TResult>(effect: Effect<TState, TPayload, TResult>, ...args: TPayload): InferEffectResult<TResult>;
    /**
     * call effect with new context
     * @param effect
     * @param args
     */
    spawn<TPayload extends any[], TResult>(effect: Effect<TState, TPayload, TResult>, ...args: TPayload): InferEffectResult<TResult>;
    /**
     * resolve an object from specified factory
     * @param factory
     * @param key
     */
    use<T>(factory: Factory<T>, key?: any): T;
    /**
     * resolve an cubiz from specified type
     * @param cubizType
     * @param key
     */
    use<T>(type: CubizInit<T>, key?: any): Cubiz<T>;
}
interface CreateOptions {
    key?: any;
    resolver?: Resolver;
}
interface Cancellable {
    cancelled(): boolean;
    cancel(): void;
}
interface Disposable {
    disposed(): boolean;
    dispose(): void;
}
interface CancellablePromise<T> extends Promise<T>, Cancellable {
}
interface Factory<T = any> {
    create(resolver: Resolver, key?: any): T;
}
interface Cubiz<TState = any> extends Disposable {
    /**
     * get last error
     */
    readonly error: any;
    /**
     * loading = true if the cubiz has calling effects
     */
    readonly loading: boolean;
    /**
     * get current state of the cubiz
     */
    readonly state: TState;
    /**
     * get the resolver that creates the cubiz
     */
    readonly resolver: Resolver;
    /**
     * get the key of cubiz, by default, the key is undefined
     */
    readonly key: any;
    /**
     * get the cubiz type, it is init function
     */
    readonly type: Function;
    /**
     * listen cubiz events (loading, change, dipose, call)
     * @param events
     */
    on(events: CubizEvents<TState>): VoidCallback;
    /**
     * call specified effect with payload
     * @param effect
     * @param args
     */
    call<TPayload extends any[], TResult>(effect: Effect<TState, TPayload, TResult>, ...args: TPayload): InferEffectResult<TResult>;
}
interface Resolver {
    /**
     * add resolved value and using factory as key
     * @param dep
     * @param resolved
     * @param key
     */
    add<T>(dep: Factory<T>, resolved: T, key?: any): this;
    /**
     * add resolved cubiz and using initFn as key
     * @param dep
     * @param resolved
     * @param key
     */
    add<T>(dep: CubizInit<T>, resolved: T, key?: any): this;
    /**
     * get cubiz that associated with initFn, create new one if not any
     * @param dep
     * @param key
     */
    get<T>(dep: CubizInit<T>, key?: any): Cubiz<T>;
    /**
     * get value that associated with the factory, create new one if not any
     * @param dep
     * @param key
     */
    get<T>(dep: Factory<T>, key?: any): T;
    /**
     * remove the value that associated with the factory
     * @param dep
     * @param key
     */
    remove<T>(dep: Factory<T>, key?: any): boolean;
    /**
     * remove the cubiz that associated with the initFn
     * @param dep
     * @param key
     */
    remove<T>(dep: CubizInit<T>, key?: any): boolean;
    /**
     * walk through all dependency values
     * @param callback
     * @param filter
     */
    each(callback: (resolved: any) => void, filter?: (dep: any) => boolean): this;
    /**
     * call effects for all cubizes
     * @param effects
     */
    call(effects: Effect | Effect[]): this;
    /**
     * listen cubiz events
     * @param events
     */
    on(events: ResolverEvents): VoidCallback;
    /**
     * emit cubiz events
     * @param event
     * @param payload
     */
    emit(event: keyof ResolverEvents, payload?: any): this;
}
declare function createEmitter(): Emitter;
declare function createEmitterGroup<TKey extends string>(names: TKey[]): Record<TKey, Emitter> & {
    clear(): void;
};
declare function addHandlers<TEmitters extends {
    [key: string]: any;
}, TEvents extends {
    [key in keyof TEmitters]?: any;
}>(emitters: TEmitters, events: TEvents): (event?: any) => void;
declare function createDisposable(callback: Function): Disposable;
declare function createCancellable(callback?: (obj: Cancellable) => void, parent?: Cancellable): Cancellable;
declare function createResolver(): Resolver;
interface Defer<TResolved, TProps = {}> {
    promise: Promise<TResolved> & TProps;
    resolve(value?: TResolved): void;
    reject(reason?: any): void;
}
declare function createDefer<T = void, TProps extends {} = {}>(props?: TProps): Defer<T, TProps>;
declare function createContext<TState>(cubiz: Cubiz<TState>, effect: Effect, allContexts: Context<TState>[], setState: (next: TState) => void, getData: () => Record<string, any>): Context<TState>;
declare function createCubiz<TState>(type: CubizInit<TState>, { key, resolver }?: CreateOptions): Cubiz<TState>;
export { VoidCallback, Callback, Context, Cancellable, CancellablePromise, Cubiz, CubizInit, Effect, Resolver, Emitter, CubizEventArgs, CubizCallEventArgs, createCubiz, createContext, createDefer, createCancellable, createDisposable, createResolver, createEmitter, createEmitterGroup, addHandlers, };
