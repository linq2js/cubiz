import * as React from "react";
import { CubizInit, Cubiz, Repository, createRepository } from "./core";

interface ProviderProps {
  /**
   * passing custom repository to Provider, if repository is not present, new once will be created
   */
  repository?: Repository;
  /**
   * this method will be called once when repository is binded to Provider first time
   */
  init?: (repository: Repository) => void;
}

interface UseCubizOptions {
  key?: any;
  /**
   * enable/disable cubiz tracking
   * track.change = true: the component will re-render when state of the cubiz changed
   * track.loading = true: the component will re-render when loading status of the cubiz changed
   * track = false: no tracking enabled
   */
  track?: boolean | { change?: boolean; loading?: boolean };
}

interface UseCubiz extends Function {
  /**
   * select a pie of cubiz's state, the component will be re-rendered only when selected value changed
   * the hook returns a tuple of [selectedValue, cubizObject]
   */
  <TState, TResult = TState>(
    initFn: CubizInit<TState>,
    selector: (state: TState) => TResult
  ): [TResult, Cubiz<TState>];

  <TState>(initFn: CubizInit<TState>, track: boolean): Cubiz<TState>;

  /**
   * return cubiz object that matches the initFn. when the cubiz's state changed, the component will re-render as well
   */
  <TState>(initFn: CubizInit<TState>, options?: UseCubizOptions): Cubiz<TState>;
}

const respositoryContext = React.createContext<Repository | null>(null);
const defaultRepository = createRepository();

/**
 * get current respository that provided by Provider component
 * @returns
 */
function useRepository() {
  const repo = React.useContext(respositoryContext);
  return repo ?? defaultRepository;
}

/**
 * a React hook to bind cubiz to current component.
 * when cubiz state is changed, the component will be rerendered
 * @param args
 * @returns
 */
const useCubiz: UseCubiz = (...args: any[]): any => {
  const initFn: CubizInit = args[0];
  const selector: Function | undefined =
    typeof args[1] === "function" ? args[1] : undefined;
  const options: UseCubizOptions | undefined =
    // useCubiz(cubiz, selector)
    typeof args[1] === "function"
      ? undefined
      : // useCubiz(cubiz, track)
      typeof args[1] === "boolean"
      ? { track: args[1] }
      : // useCubiz(cubiz, options)
        args[1];
  // extract main options
  const { key, track = {} } = options ?? {};
  // extract tracking options
  const { loading: trackLoading = true, change: trackChange = true } =
    typeof track === "boolean"
      ? { loading: false, change: false }
      : track ?? {};
  const binder = React.useRef({}).current;
  const unmountRef = React.useRef(false);
  const repository = useRepository();
  const rerender = React.useState<any>()[1];
  const cubiz = repository?.get(initFn, key);

  React.useEffect(() => {
    if (!cubiz) return;
    if (!trackChange && !trackLoading) return;

    function handleChange() {
      if (unmountRef.current) return;
      rerender({});
    }

    return cubiz.on({
      change: trackChange ? handleChange : undefined,
      loading: trackLoading ? handleChange : undefined,
    });
  }, [trackChange, trackLoading, rerender, cubiz]);

  React.useEffect(() => {
    if (unmountRef.current) return;
    cubiz.bind(binder);
    return () => cubiz.unbind(binder);
  }, [binder, cubiz]);

  React.useEffect(
    () => () => {
      unmountRef.current = true;
    },
    []
  );

  // return a typle that contains slice of state and cubiz
  if (selector) {
    return [selector(cubiz?.state), cubiz];
  }

  return cubiz;
};

const Provider: React.FC<ProviderProps> = (props) => {
  const initRef = React.useRef(props.init);
  const repository = React.useMemo(() => {
    const result = props.repository ?? createRepository();
    initRef.current?.call(null, result);
    return result;
  }, [props.repository]);
  return React.createElement(respositoryContext.Provider, {
    value: repository,
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
  useRepository,
  // components
  Provider,
};
