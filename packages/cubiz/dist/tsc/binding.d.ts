import * as React from "react";
import { CubizInit, Cubiz, Resolver } from "./core";
interface ProviderProps {
    resolver?: Resolver;
    initDeps?: (resolver: Resolver) => void;
}
interface UseCubizOptions {
    key?: any;
    track?: boolean | {
        change?: boolean;
        loading?: boolean;
    };
}
interface UseCubiz extends Function {
    <TState, TResult = TState>(initFn: CubizInit<TState>, selector: (state: TState) => TResult): [TResult, Cubiz<TState>];
    <TState>(initFn: CubizInit<TState>, options?: UseCubizOptions): Cubiz<TState>;
}
declare function useResolver(): Resolver;
declare const useCubiz: UseCubiz;
declare const Provider: React.FC<ProviderProps>;
export { ProviderProps, UseCubizOptions, UseCubiz, useCubiz, useResolver, Provider, };
