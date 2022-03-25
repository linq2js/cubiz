import {
  Context,
  Effect,
  CancellablePromise,
  createCancellable,
  createDefer,
  CubizCallEventArgs,
  Cancellable,
  createEmitter,
  Cubiz,
  CubizChangeEventArgs,
} from "./core";

type InferAwaitable<TAwaitable> = TAwaitable extends Promise<infer TResolved>
  ? TResolved
  : TAwaitable;

interface PromiseResult<T = any> {
  value: T;
  status: "fulfilled" | "rejected";
  reason: any;
}

interface WatchEffect extends Function {
  (
    context: Context<any>,
    targets: Cubiz | Cubiz[]
  ): CancellablePromise<CubizChangeEventArgs>;

  (
    context: Context<any>,
    targets: Cubiz | Cubiz[],
    callback: (e: CubizChangeEventArgs, cancellable: Cancellable) => void
  ): CancellablePromise<void>;
}

interface WhenEffect extends Function {
  /**
   * listen specified effect calls and return a promise. the promise will resolve after first effect call
   */
  (
    context: Context<any>,
    effects: Effect[],
    cubiz?: Cubiz
  ): CancellablePromise<CubizCallEventArgs>;

  /**
   * register effect call listener
   */
  (
    context: Context<any>,
    listener: (e: CubizCallEventArgs, cancellable: Cancellable) => void,
    cubiz?: Cubiz
  ): CancellablePromise<void>;
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

interface DroppableEffect extends Function {
  (context: Context<any>): Promise<void>;
}

interface SequentialEffect extends Function {
  (context: Context<any>): Promise<void>;
}

interface AllEffect extends Function {
  <TAwaitable>(
    context: Context<any>,
    awaitables: TAwaitable
  ): CancellablePromise<
    TAwaitable extends Array<infer TItem>
      ? InferAwaitable<TItem>[]
      : TAwaitable extends {}
      ? { [key in keyof TAwaitable]: InferAwaitable<TAwaitable[key]> }
      : never
  >;
}

interface AllSettledEffect extends Function {
  <TAwaitable>(
    context: Context<any>,
    awaitables: TAwaitable
  ): CancellablePromise<
    TAwaitable extends []
      ? PromiseResult[]
      : TAwaitable extends {}
      ? { [key in keyof TAwaitable]: PromiseResult }
      : never
  >;
}

interface RaceEffect extends Function {
  <TAwaitable>(
    context: Context<any>,
    awaitables: TAwaitable
  ): CancellablePromise<
    TAwaitable extends Array<infer TItem>
      ? InferAwaitable<TItem>
      : TAwaitable extends {}
      ? { [key in keyof TAwaitable]: InferAwaitable<TAwaitable[key]> }
      : never
  >;
}

function processAsync(
  promises: any,
  type: "all" | "race" | "allSettled",
  parent?: Cancellable
): any {
  const result: any = Array.isArray(promises) ? [] : {};
  const promiseArray: any[] = [];
  const cancellable = createCancellable(() => {
    for (const promise of promiseArray) {
      if (typeof promise?.cancel === "function") {
        promise.cancel();
      }
    }
  }, parent);
  const defer = createDefer(cancellable);
  let count = 0;

  function onDone(key: any, value: any, reason?: any, hasError?: boolean) {
    count--;
    if (cancellable.cancelled()) return;
    if (hasError) {
      if (type !== "allSettled") {
        cancellable.cancel();
        return defer.reject(reason);
      }
      result[key] = { status: "rejected", reason };
    } else {
      result[key] =
        type === "allSettled" ? { status: "fulfilled", value } : value;
      if (type === "race") {
        cancellable.cancel();
        return defer.resolve(result);
      }
    }
    if (!count) {
      defer.resolve(result);
    }
  }

  Object.keys(promises).forEach((key) => {
    const value = promises[key];
    // is promise like object
    if (typeof value?.then === "function") {
      promiseArray.push(value);
      count++;
      value.then(
        (resolved: any) => onDone(key, resolved),
        (rejected: any) => onDone(key, undefined, rejected, true)
      );
      return;
    }
    onDone(key, value);
  });

  if (!count) {
    defer.resolve(result);
  }

  return defer.promise;
}

const all: AllEffect = (context: any, awaitables: any) =>
  processAsync(awaitables, "all", context);

const race: RaceEffect = (context: any, awaitables: any) =>
  processAsync(awaitables, "race", context);

const allSettled: AllSettledEffect = (context: any, awaitables: any) =>
  processAsync(awaitables, "allSettled", context);

const delay: DelayEffect = ({ on }, ms) => {
  const onCleanup = createEmitter();
  const cancellable = createCancellable(onCleanup.emit);
  const defer = createDefer(cancellable);
  const timer = setTimeout(() => {
    cancellable.cancel();
    defer.resolve();
  }, ms);

  onCleanup.add(() => clearTimeout(timer));
  onCleanup.add(on({ dispose: cancellable.cancel }));

  return defer.promise;
};

const debounce: DebounceEffect = ({ effect, findContexts, call }, ms) => {
  const existing = findContexts((x) => x.effect === effect)[0];
  // cancel existing
  existing?.cancel();
  return call(delay, ms);
};

const throttle: ThrottleEffect = ({ data, cancel }, ms) => {
  const defer = createDefer<void>();
  const lastTime = data.throttleExecutionTime || 0;
  const now = Date.now();
  const nextTime = lastTime + ms;
  if (now >= nextTime) {
    data.throttleExecutionTime = now;
    defer.resolve();
  } else {
    cancel();
  }
  return defer.promise;
};

const when: WhenEffect = ({ on, cubiz }, callbackOrEffects, target?): any => {
  const onCleanup = createEmitter();
  const cancellable = createCancellable(onCleanup.emit);
  const defer = createDefer(cancellable);
  const effects = callbackOrEffects as Effect[];
  const cb =
    typeof callbackOrEffects === "function"
      ? callbackOrEffects
      : (e: CubizCallEventArgs) => {
          if (!effects.includes(e.effect)) return;
          defer.resolve(e);
          cancellable.cancel();
        };
  const listener = (e: CubizCallEventArgs) => {
    cb(e, cancellable);
  };
  if (!target) target = cubiz;
  onCleanup.add(target.on({ call: listener }));
  onCleanup.add(on({ dispose: cancellable.cancel }));

  return defer.promise;
};

const watch: WatchEffect = (
  { on }: Context,
  targets,
  callback?: Function
): any => {
  if (!Array.isArray(targets)) targets = [targets];
  const onCleanup = createEmitter();
  const cancellable = createCancellable(onCleanup.emit);
  const defer = createDefer(cancellable);
  const cb =
    callback ??
    ((e: any, cancellable: Cancellable) => {
      defer.resolve(e);
      cancellable.cancel();
    });
  const listener = (e: CubizChangeEventArgs) => {
    if (cancellable.cancelled()) return;
    cb(e, cancellable);
  };

  targets.forEach((target) => {
    onCleanup.add(target.on({ change: listener }));
  });

  on({ dispose: cancellable.cancel });

  return defer.promise;
};

const droppable: DroppableEffect = ({ effect, findContexts, cancel }) => {
  const existing = findContexts((x) => x.effect === effect)[0];
  const defer = createDefer();
  if (existing) {
    cancel();
  } else {
    defer.resolve();
  }
  return defer.promise;
};

const sequential: SequentialEffect = ({ effect, findContexts }) => {
  const existing = findContexts((x) => x.effect === effect)[0];
  const defer = createDefer();
  if (existing) {
    existing.on({ dispose: defer.resolve });
  } else {
    defer.resolve();
  }
  return defer.promise;
};

export {
  // types
  DelayEffect,
  DebounceEffect,
  ThrottleEffect,
  WhenEffect,
  WatchEffect,
  AllEffect,
  RaceEffect,
  AllSettledEffect,
  DroppableEffect,
  SequentialEffect,
  // methods
  delay,
  debounce,
  throttle,
  when,
  watch,
  all,
  race,
  allSettled,
  droppable,
  sequential,
};
