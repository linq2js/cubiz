import { add, item, mutate, prop, set, swap, unset } from "../lib/mutation";
import * as utils from "./utils";

type User = {
  id: number;
  name: string;
  date?: Date;
  authenticated?: boolean;
  address: { street: string; city?: string };
  roles?: string[];
  level1: { level2: { level3: { value: number } } };
};

test("item(all)", () => {
  const initial = [1, 2, 3, 4];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item("all", (i) => i * 2)
    )
  );
  expect(cubiz.state).toEqual([2, 4, 6, 8]);
});

test("item(last)", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item("last", (i) => i * 2)
    )
  );
  expect(cubiz.state).toBe(initial);
});

test("item(first) #1", () => {
  const initial = [1, 2, 3, 4];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item("first", (i) => i * 2)
    )
  );
  expect(cubiz.state).toEqual([2, 2, 3, 4]);
});

test("item(first) #2", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item("first", (i) => i * 2)
    )
  );
  // nothing to add because there is no item
  expect(cubiz.state).toBe(initial);
});

test("item(0)", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz<number[]>(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item(0, () => 2)
    )
  );
  expect(cubiz.state).toEqual([2]);
});

test("item(x) not exist", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item(1, () => 2)
    )
  );
  expect(cubiz.state).toEqual([undefined, 2]);
});

test("item(-1)", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item(-1, () => 2)
    )
  );
  expect(cubiz.state).toBe(initial);
});

test("item(x) not exist", () => {
  const initial = [] as number[];
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      item(1, () => 2)
    )
  );
  expect(cubiz.state).toEqual([undefined, 2]);
});

test("set() #1", () => {
  const initial = { name: "abc" } as User;
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) => x.call(mutate, set("name", "def")));
  expect(cubiz.state).toEqual({ name: "def" });
});

test("set() #2", () => {
  const initial = { name: "abc" } as User;
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) => x.call(mutate, set("name", "abc")));
  // no change
  expect(cubiz.state).toBe(initial);
});

test("unset()", () => {
  const initial = { name: "abc", address: {}, id: 1 } as User;
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) => x.call(mutate, unset("address", "id")));
  // no change
  expect(cubiz.state).toEqual({ name: "abc" });
});

test("prop()", () => {
  const initial = {} as User;
  const cubiz = utils.genericCubiz(initial);
  cubiz.call((x) =>
    x.call(
      mutate,
      prop("address", set("city", "abc")),
      prop("level1", prop("level2", prop("level3", set("value", 1))))
    )
  );

  expect(cubiz.state).toEqual({
    address: { city: "abc" },
    level1: { level2: { level3: { value: 1 } } },
  });
});

test("add() #1", () => {
  const initial = { date: new Date(2000, 0, 1) } as User;
  const cubiz = utils.genericCubiz(initial);

  cubiz.call((x) => x.call(mutate, prop("date", add({ D: 1 }))));

  expect(cubiz.state.date).toEqual(new Date(2000, 0, 2));
});

test("add() #2", () => {
  const initial = { date: new Date(2000, 0, 1) } as User;
  const cubiz = utils.genericCubiz(initial);

  cubiz.call((x) => x.call(mutate, prop("date", add({}))));

  expect(cubiz.state.date).toBe(initial.date);
});

test("swap() #1", () => {
  const initial = [1, 2, 3, 4];
  const cubiz = utils.genericCubiz(initial);

  cubiz.call((x) => x.call(mutate, swap(1, 2)));

  expect(cubiz.state).toEqual([1, 3, 2, 4]);
});

test("swap() #2", () => {
  const initial = [1, 2, 2, 4];
  const cubiz = utils.genericCubiz(initial);

  cubiz.call((x) => x.call(mutate, swap(1, 2)));

  expect(cubiz.state).toBe(initial);
});
