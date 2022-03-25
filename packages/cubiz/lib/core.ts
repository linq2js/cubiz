import { ArrayKeyedMap } from "./arrayKeyedMap";

type VoidCallback = () => void;
type Callback<T> = (payload: T) => void;
type Effect<TState = any, TPayload extends any[] = [], TResult = void> = (
  context: Context<TState>,
  ...args: TPayload
) => TResult;

type CubizInit<TState = any> = Effect<TState, never, any>;

type InferEffectResult<TResult> = TResult extends Promise<infer TResolved>
  ? CancellablePromise<TResolved>
  : TResult;

interface Emitter {
  // add handler
  add(handler: Function): VoidCallback;
  // emit event
  emit(event?: any): void;
  // loop through all handlers
  each(callback: (handler: Function) => void): void;
  // clear all handlers
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

interface ContextEvents {
  dispose?: VoidCallback;
  cancel?: VoidCallback;
}

interface StateAccessor<TState> {
  /**
   * Update state by using reducer.
   * The reducer retrieves previous state and returns a new one
   * @param reducer
   */
  (reducer: (prev: TState) => TState): void;
  /**
   * get current state
   */
  (): TState;
  /**
   * update state with new value
   * @param value
   */
  (value: TState): void;
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
  findContexts(
    predicate?: (context: Context<TState>) => boolean
  ): Context<TState>[];
  state: StateAccessor<TState>;
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
  call<TPayload extends any[], TResult>(
    effect: Effect<TState, TPayload, TResult>,
    ...args: TPayload
  ): InferEffectResult<TResult>;
  /**
   * call effect with new context
   * @param effect
   * @param args
   */
  spawn<TPayload extends any[], TResult>(
    effect: Effect<TState, TPayload, TResult>,
    ...args: TPayload
  ): InferEffectResult<TResult>;
  /**
   * resolve an object from specified factory
   * @param factory
   * @param key
   */
  use<T>(factory: Factory<T>, key?: any): T;
  /**
   * resolve an cubiz from specified type
   * @param type
   * @param key
   */
  use<T>(type: CubizInit<T>, key?: any): Cubiz<T>;
}

interface CreateOptions {
  key?: any;
  repository?: Repository;
}

interface Cancellable {
  cancelled(): boolean;
  cancel(): void;
}

interface Disposable {
  disposed(): boolean;
  dispose(): void;
}

interface CancellablePromise<T> extends Promise<T>, Cancellable {}

interface Factory<T = any> {
  create(repository: Repository, key?: any): T;
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
   * get the repository that creates the cubiz
   */
  readonly repository: Repository;
  /**
   * get the key of cubiz, by default, the key is undefined
   */
  readonly key: any;
  /**
   * a shared data for effect level use
   */
  readonly data: Record<string, any>;
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
  call<TPayload extends any[], TResult>(
    effect: Effect<TState, TPayload, TResult>,
    ...args: TPayload
  ): InferEffectResult<TResult>;
}

interface Repository {
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
  on(events: CubizEvents): VoidCallback;
  /**
   * emit cubiz events
   * @param event
   * @param payload
   */
  emit(event: keyof CubizEvents, payload?: any): this;
}

function noop() {}

function createEmitter(): Emitter {
  const handlers: Function[] = [];
  return {
    each(callback) {
      handlers.forEach(callback);
    },
    add(handler) {
      handlers.push(handler);
      let active = true;
      return () => {
        if (!active) return;
        const index = handlers.indexOf(handler);
        if (index !== -1) handlers.splice(index, 1);
      };
    },
    emit(payload) {
      for (const handler of handlers.slice(0)) {
        handler(payload);
      }
    },
    clear() {
      handlers.length = 0;
    },
  };
}

function createEmitterGroup<TKey extends string>(
  names: TKey[]
): Record<TKey, Emitter> & { clear(): void } {
  const result: Record<TKey, Emitter> = {} as any;
  const emitters: Emitter[] = [];
  names.forEach((name) => {
    const emitter = createEmitter();
    emitters.push(emitter);
    result[name] = emitter;
  });
  return Object.assign(result, {
    clear() {
      emitters.forEach((e) => e.clear());
    },
  });
}

function addHandlers<
  TEmitters extends { [key: string]: any },
  TEvents extends { [key in keyof TEmitters]?: any }
>(emitters: TEmitters, events: TEvents) {
  const unsubscribeEmitter = createEmitter();
  let hasEvent = false;
  Object.keys(events).forEach((key) => {
    if (events[key] && emitters[key]) {
      emitters[key].add(events[key]!);
      hasEvent = true;
    }
  });
  return hasEvent ? unsubscribeEmitter.emit : noop;
}

function createDisposable(callback: Function): Disposable {
  let disposed = false;
  return {
    disposed() {
      return disposed;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      callback.call(this);
    },
  };
}

function createCancellable(
  callback?: (obj: Cancellable) => void,
  parent?: Cancellable
): Cancellable {
  let cancelled = false;
  return {
    cancelled() {
      return cancelled || !!parent?.cancelled();
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      callback?.call(null, this);
    },
  };
}

function createRepository(): Repository {
  const dependencies = new Map<any, ArrayKeyedMap<any>>();
  const emitters = createEmitterGroup(["change", "dispose", "loading", "call"]);

  const repo: Repository = {
    emit(event: keyof typeof emitters, payload?: any) {
      (emitters[event] as Emitter).emit(payload);
      return this;
    },
    on(events) {
      return addHandlers(emitters, events);
    },
    add(dependency, resolved, key) {
      let group = dependencies.get(dependency);
      if (!group) {
        group = new ArrayKeyedMap();
        dependencies.set(dependency, group);
      }
      group.set(key, resolved);
      return this;
    },
    remove(dependency, key) {
      const group = dependencies.get(dependency);
      return group?.delete(key) ?? false;
    },
    get(dependency, key): any {
      const group = dependencies.get(dependency);
      let resolved = group?.get(key);
      if (typeof resolved !== "undefined") {
        return resolved;
      }
      // is cubiz initFn
      if (typeof dependency === "function") {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        resolved = createCubiz(dependency, { repository: this, key });
        repo.add(dependency as CubizInit, resolved, key);
      } else {
        // is factory
        resolved = dependency.create(this, key);
        repo.add(dependency, resolved, key);
      }

      return resolved;
    },
    each(callback, filter) {
      dependencies.forEach(
        (group, key) => (!filter || filter(key)) && group.each(callback)
      );
      return this;
    },
    call(effects) {
      const e = Array.isArray(effects) ? effects : [effects];
      repo.each(
        (value) => {
          e.forEach((action) => {
            (value as Cubiz).call(action);
          });
        },
        (x: any) => typeof x === "function"
      );

      return this;
    },
  };

  return repo;
}

interface Defer<TResolved, TProps = {}> {
  promise: Promise<TResolved> & TProps;
  resolve(value?: TResolved): void;
  reject(reason?: any): void;
}

function createDefer<T = void, TProps extends {} = {}>(
  props?: TProps
): Defer<T, TProps> {
  let resolve: Function, reject: Function;
  const promise = Object.assign(
    new Promise<T>((...args) => ([resolve, reject] = args)),
    props
  );

  promise.catch(noop);

  return {
    promise,
    resolve<T>(value: T) {
      resolve?.call(null, value);
    },
    reject(reason: any) {
      reject?.call(null, reason);
    },
  };
}

function createContext<TState>(
  cubiz: Cubiz<TState>,
  effect: Effect,
  allContexts: Context<TState>[],
  setState: (next: TState) => void,
  getData: () => Record<string, any>
): Context<TState> {
  const emitters = createEmitterGroup(["dispose", "cancel"]);
  let data: Record<string, any> | undefined;

  const context: Context<TState> = {
    get effect() {
      return effect;
    },
    get cubiz() {
      return cubiz;
    },
    get data() {
      return data ?? (data = getData());
    },
    findContexts(predicate?: (context: Context<TState>) => boolean) {
      return allContexts.filter(
        (x) => x !== context && (!predicate || predicate(x))
      );
    },
    state(arg?: any): any {
      // getter
      if (!arguments.length) {
        return cubiz.state;
      }

      // do nothing if context is cancelled
      if (context.cancelled()) return;

      // reducer
      if (typeof arg === "function") {
        setState(arg(cubiz.state));
        return;
      }

      // setter
      setState(arg);
    },
    on(events) {
      return addHandlers(emitters, events);
    },
    call(effect, ...payload) {
      return callEffect(context, effect, payload);
    },
    spawn(effect, ...payload) {
      return cubiz.call(effect, ...payload);
    },
    ...createCancellable(() => {
      emitters.cancel.emit();
    }),
    ...createDisposable(() => {
      emitters.dispose.emit();
    }),
    use: cubiz.repository.get,
  };

  return context;
}

function callEffect<TState, TPayload extends any[], TResult>(
  context: Context<TState>,
  effect: Effect<TState, TPayload, TResult>,
  payload: TPayload,
  onDone: (error?: any) => void = noop,
  onCancel: VoidCallback = noop
): any {
  try {
    const result: any = effect(context, ...payload);
    // async result
    if (typeof result?.then === "function") {
      const defer = createDefer();

      result.then(
        (value: any) => {
          if (context.cancelled()) return;
          onDone();
          defer.resolve(value);
        },
        (reason: any) => {
          if (context.cancelled()) return;
          onDone(reason);
          defer.reject(reason);
        }
      );

      return Object.assign(defer.promise, {
        cancelled: context.cancelled,
        cancel() {
          result.cancel?.call();
          onCancel();
        },
      });
    }
    onDone();
    // sync result
    return result;
  } catch (e) {
    onDone(e);
    throw e;
  }
}

function createCubiz<TState>(
  type: CubizInit<TState>,
  { key, repository: repository = createRepository() }: CreateOptions = {}
): Cubiz<TState> {
  const emitters = createEmitterGroup(["change", "dispose", "loading", "call"]);
  const allContexts: Context<TState>[] = [];
  const effectData = new Map<Effect, Record<string, any>>();
  const data: Record<string, any> = {};
  let state: TState;
  let error: any;
  let loading = false;

  function emitChange() {
    const e: CubizEventArgs = { cubiz };
    emitters.change.emit(e);
    repository.emit("change", e);
  }

  function emitDispose() {
    emitters.dispose.emit();
  }

  function emitLoading() {
    const e: CubizEventArgs = { cubiz };
    emitters.loading.emit(e);
    repository.emit("loading", e);
  }

  function emitCall(effect: Effect, payload: any[]) {
    // skip no name function
    if (!effect.name) return;
    const e: CubizCallEventArgs = { cubiz, effect, payload };
    emitters.call.emit(e);
    repository.emit("call", e);
  }

  function setState(next: TState) {
    if (next === state) return;
    state = next;
    emitChange();
  }

  function uploadLoadingStatus() {
    const next = !!allContexts.length;
    if (next === loading) return;
    loading = next;
    emitLoading();
  }

  function getData(key: any): Record<string, any> {
    let result = effectData.get(key);
    if (!result) {
      result = {};
      effectData.set(key, result);
    }
    return result;
  }

  const cubiz: Cubiz<TState> = {
    get data() {
      return data;
    },
    get type() {
      return type;
    },
    get key() {
      return key;
    },
    get repository() {
      return repository;
    },
    get error() {
      return error;
    },
    get loading() {
      return loading;
    },
    get state() {
      return state;
    },
    on(events) {
      return addHandlers(emitters, events);
    },
    call(effect, ...payload) {
      const context: Context<TState> = createContext(
        cubiz,
        effect as any,
        allContexts,
        setState,
        () => getData(effect)
      );
      emitCall(effect as any, payload);
      // the top is the latest
      allContexts.unshift(context);
      uploadLoadingStatus();
      function onDone(e?: any) {
        if (e) error = e;
        // remove the context
        const index = allContexts.indexOf(context);
        if (index !== -1) allContexts.splice(index, 1);
        context.dispose();
        uploadLoadingStatus();
      }

      context.on({ cancel: onDone });

      return callEffect(context, effect, payload, onDone, context.cancel);
    },
    ...createDisposable(emitDispose),
  };

  // repository events

  cubiz.call(type);

  return cubiz;
}

export {
  // types
  VoidCallback,
  Callback,
  Context,
  Cancellable,
  CancellablePromise,
  Cubiz,
  CubizInit,
  Effect,
  Repository,
  Emitter,
  CubizEventArgs,
  CubizCallEventArgs,
  // methods
  createCubiz,
  createContext,
  createDefer,
  createCancellable,
  createDisposable,
  createRepository,
  createEmitter,
  createEmitterGroup,
  addHandlers,
};
