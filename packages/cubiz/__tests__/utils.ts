import { Context, createCubiz, Cubiz, Effect } from "../lib/core";

function delay(ms: number) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const genericCubiz = <T>(initial: T) => {
  const initFn = ({ state }: Context<T>) => state(initial);
  return createCubiz(initFn);
};

function cubizTester<T>(initial: T) {
  const tests: ((cubiz: Cubiz<T>) => any)[] = [];
  return {
    test<TPayload extends any[], TResult>(
      effect: Effect<T, TPayload, TResult>,
      verify: (cubiz: Cubiz<T>, result: TResult) => any,
      payload?: TPayload
    ) {
      tests.push((cubiz) => {
        const result = cubiz.call(effect, ...((payload as any) ?? []));
        return verify(cubiz, result as TResult);
      });
      return this;
    },
    async run(): Promise<Cubiz<T>> {
      const cubiz = genericCubiz<T>(initial);
      for (const test of tests) {
        await test(cubiz);
      }
      return cubiz;
    },
  };
}

export { delay, genericCubiz, cubizTester };
