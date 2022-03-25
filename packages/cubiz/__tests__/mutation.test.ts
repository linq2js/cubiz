import { Context, createCubiz } from "../lib/core";
import {
  item,
  mutate,
  push,
  prop,
  set,
  unset,
  removeFirst,
  toggle,
} from "../lib/mutation";

type ObjectState = { name: string; value: number; data?: { id: number } };
type Todo = { title: string; done: boolean };

function ObjectCubiz(context: Context<ObjectState[]>) {
  context;
}

function TodoCubiz({ state }: Context<Todo[]>) {
  state([]);
}

test("obj", async () => {
  function update({ call }: Context<ObjectState[]>) {
    call(
      mutate,
      push({ name: "aa", value: 1 }, { name: "bb", value: 2 }),
      item(1, set("name", "cc"), set("value", 3), prop("data", set("id", 1))),
      item("all", unset("value"), prop("data", set("id", 2)))
    );
  }

  const cubiz = createCubiz(ObjectCubiz);
  cubiz.call(update);
  expect(cubiz.state).toEqual([
    { name: "aa", data: { id: 2 } },
    { name: "cc", data: { id: 2 } },
  ]);
});

test("todo", () => {
  const addTodo = (x: Context<Todo[]>, title: string) =>
    x.call(mutate, push({ title, done: false }));

  const removeTodo = (x: Context<Todo[]>, title: string) =>
    x.call(
      mutate,
      removeFirst((x) => x.title === title)
    );

  const toggleTodos = (x: Context<Todo[]>) =>
    x.call(mutate, item("all", prop("done", toggle())));

  const cubiz = createCubiz(TodoCubiz);

  cubiz.call(addTodo, "todo1");
  cubiz.call(addTodo, "todo2");
  expect(cubiz.state).toEqual([
    { title: "todo1", done: false },
    { title: "todo2", done: false },
  ]);

  cubiz.call(toggleTodos);
  expect(cubiz.state).toEqual([
    { title: "todo1", done: true },
    { title: "todo2", done: true },
  ]);

  cubiz.call(removeTodo, "todo2");
  expect(cubiz.state).toEqual([{ title: "todo1", done: true }]);
});
