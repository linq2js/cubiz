import { Context, createCubiz } from "../lib/core";
import { delay, droppable } from "../lib/effects";
import * as utils from "./utils";

function Cubiz({ state }: Context<any>) {
  state(1);
}

test("droppable", async () => {
  async function increment({ state, call }: Context<number>) {
    await call(droppable);
    await call(delay, 10);
    state((prev) => prev + 1);
  }

  const cubiz = createCubiz(Cubiz);
  cubiz.call(increment);
  cubiz.call(increment);
  cubiz.call(increment);
  expect(cubiz.state).toBe(1);

  await utils.delay(15);
  expect(cubiz.state).toBe(2);
  expect(cubiz.loading).toBeFalsy();

  await utils.delay(10);
  expect(cubiz.state).toBe(2);
  expect(cubiz.loading).toBeFalsy();
});
