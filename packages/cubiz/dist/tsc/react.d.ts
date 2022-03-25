import * as React from "react";
import { CubizInit, Cubiz, Repository } from "./core";
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
    track?: boolean | {
        change?: boolean;
        loading?: boolean;
    };
}
interface UseCubiz extends Function {
    /**
     * select a pie of cubiz's state, the component will be re-rendered only when selected value changed
     * the hook returns a tuple of [selectedValue, cubizObject]
     */
    <TState, TResult = TState>(initFn: CubizInit<TState>, selector: (state: TState) => TResult): [TResult, Cubiz<TState>];
    /**
     * return cubiz object that matches the initFn. when the cubiz's state changed, the component will re-render as well
     */
    <TState>(initFn: CubizInit<TState>, options?: UseCubizOptions): Cubiz<TState>;
}
/**
 * get current respository that provided by Provider component
 * @returns
 */
declare function useRepository(): Repository;
/**
 * a React hook to bind cubiz to current component.
 * when cubiz state is changed, the component will be rerendered
 * @param args
 * @returns
 */
declare const useCubiz: UseCubiz;
declare const Provider: React.FC<ProviderProps>;
export { ProviderProps, UseCubizOptions, UseCubiz, useCubiz, useRepository, Provider, };
