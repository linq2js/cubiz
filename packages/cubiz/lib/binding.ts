import * as React from "react";
import { CubizInit, Cubiz, Resolver, createResolver } from "./core";

interface ProviderProps {
  resolver?: Resolver;
  initDeps?: (resolver: Resolver) => void;
}

interface UseCubizOptions {
  key?: any;
  track?: boolean | { change?: boolean; loading?: boolean };
}

interface UseCubiz extends Function {
  <TState, TResult = TState>(
    initFn: CubizInit<TState>,
    selector: (state: TState) => TResult
  ): [TResult, Cubiz<TState>];

  <TState>(initFn: CubizInit<TState>, options?: UseCubizOptions): Cubiz<TState>;
}

const providerContext = React.createContext<Resolver | undefined>(undefined);

function useResolver() {
  return React.useContext(providerContext)!;
}

const useCubiz: UseCubiz = (...args: any[]): any => {
  const initFn: CubizInit = args[0];
  const selector: Function | undefined =
    typeof args[1] === "function" ? args[1] : undefined;
  const options: UseCubizOptions | undefined =
    typeof args[1] === "function" ? undefined : args[1];
  // extract main options
  const { key, track = {} } = options ?? {};
  // extract tracking options
  const { loading: trackLoading = true, change: trackChange = true } =
    typeof track === "boolean"
      ? { loading: false, change: false }
      : track ?? {};

  const resolver = useResolver();
  const rerender = React.useState<any>()[1];
  const cubiz = resolver?.get(initFn, key);

  React.useEffect(() => {
    if (!cubiz) return;
    if (!trackChange && !trackLoading) return;

    function handleChange() {
      rerender({});
    }

    return cubiz.on({
      change: trackChange ? handleChange : undefined,
      loading: trackLoading ? handleChange : undefined,
    });
  }, [trackChange, trackLoading, rerender, cubiz]);

  // return a typle that contains slice of state and cubiz
  if (selector) {
    return [selector(cubiz?.state), cubiz];
  }

  return cubiz;
};

const Provider: React.FC<ProviderProps> = (props) => {
  const initDepsRef = React.useRef(props.initDeps);
  const resolver = React.useMemo(() => {
    const result = props.resolver ?? createResolver();
    initDepsRef.current?.call(null, result);
    return result;
  }, [props.resolver]);
  return React.createElement(providerContext.Provider, {
    value: resolver,
    children: props.children,
  });
};

export {
  // types
  ProviderProps,
  UseCubizOptions,
  UseCubiz,
  // hooks
  useCubiz,
  useResolver,
  // components
  Provider,
};
