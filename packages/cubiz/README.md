# cubiz

## Installation

**npm**

```bash
npm i cubiz --save
```

**yarn**

```bash
yarn add cubiz
```

---

## Features

- Simple API
- Easy to mainternant
- Async cancellation supported
- Fully Typescript supported

---

## Concepts

- **The Cubiz** is where to store the data of the application. One cubiz contains one kind of data and handle all business logic that relates to that data.
- **The effect** is where to describes how we can interact with the cubiz. When a effect called, if the effect contains async code, the cubiz loading status becomes true. After the effect is done, if no more running effect, the cubiz loading status becomes false, no matter the effect is sucess or fail.
- **The Provider** is where to handle cubiz repository, the repository stores all cubiz instances. When cubiz uses another cubiz instance, it calls the repository for resolving that

---

## Usages

### Basic Usages

```js
import { useCubiz, Provider } from "cubiz";

// define init function of the cubiz
const CounterCubiz = ({ state }) => {
  // set initial state of CounterCubiz
  state(1);
};

// define cubiz effect,the effect perform increasing state value by 1
const increment = ({ state }) => {
  // get current state
  const count = state();
  // update state
  state(count + 1);
  // can achieve above by using state reducer
  // state((prev) => prev + 1);
  // state.value++;
};

const Counter = () => {
  // get cubiz instance from the provider,
  // the cubiz will be created by calling init function
  const { state, call } = useCubiz(CounterCubiz);

  function handleClick() {
    // call cubiz effect
    call(increment);
  }

  return (
    <>
      {/* show state value */}
      <h1>Count: {state}</h1>
      <button onClick={handleClick}>Increment</button>
    </>
  );
};

const App = () => {
  return (
    // wrap a application inside provider
    <Provider>
      <Counter />
    </Provider>
  );
};
```

### Advanced Usages

#### Sharing effect with other cubiz

```js
function Counter1Cubiz({ state }) {
  state(1);
}

function Counter2Cubiz({ state }) {
  state(2);
}

function increment({ state }) {
  state.value++;
}

const counter1 = useCubiz(Counter1Cubiz);
const counter2 = useCubiz(Counter1Cubiz);

// both cubizes can call same effect
counter1.call(increment);
counter2.call(increment);
```

#### Using other cubiz instances

```js
function SettingsCubiz({ state }) {
  // load settings from somewhere
  const settings = JSON.parse(localStorage.getItem("settings"));
  state(settings);
}

function ThemeCubiz({ state, use }) {
  // use() function returns instance of the cubiz from its initFn
  const settings = use(SettingsCubiz);
  state(settings.state.theme);
}
```

#### Understanding cubiz key

The cubiz is created from the key and initFn, the key is null by default.
So we can have multiple cubizes that has same initFn but they have different keys.
This is useful when you want to sperate data of the cubiz but still want to keep its logic.

```js
async function ArticleCubiz({ key }) {
  // assume that the key is article id
  const articleId = key;
  const article = await call(loadArticleById, articleId);
  state(article);
}

const article1 = useCubiz(ArticleCubiz, { key: 1 });
const article2 = useCubiz(ArticleCubiz, { key: 2 });
console.log(article1 !== article2);
// dont need to create ArticleCache to cache all loaded articles
// mutating article1 does not impact article2 and its connected components
```

The cubiz repository uses strict comparison (===) to identify cubiz key,
but you can use array as the key and the repo is smart enough to do comparison for each array item

```js
// in javascript, two arrays are difference
console.log([1, 2, 3] === [1, 2, 3]);
// but you use array for cubiz key
// let say we have ProductionListCubiz that contains product list fetching logic
function ProductionListCubiz({ key }) {
  // the key contains category and orderBy
  const [category, orderBy] = key;
}
const list1 = useCubiz(ProductionListCubiz, { key: ["food", "name"] });
const list2 = useCubiz(ProductionListCubiz, { key: ["food", "name"] });
const list3 = useCubiz(ProductionListCubiz, { key: ["food", "date"] });
const list4 = useCubiz(ProductionListCubiz, { key: ["gadget", "date"] });
console.log(list1 === list2); // true
console.log(list2 === list3); // false
```

#### Mutating state

Probaly, we can use method state(prev => ...) to mutate state, cubiz provides a lot of mutations you can use for object, array, value etc.

```js
import { mutate, push } from "cubiz";

function addTodo({ state, call }, title) {
  // using state
  state((todos) => todos.concat([{ title }]));
  // using mutation
  call(mutate, push({ title }));
}
```

Mutating array

```js
import { mutate, removeAll } from "cubiz";

function removeTodo({ state, call }, id) {
  state((todos) => todos.filter((x) => x.id !== id)); // in case of no todo found, the state is still created
  call(
    mutate,
    removeAll((x) => x.id === id),
    // mutate item that matches predicate
    item((x) => x.id === id, prop("done", toggle())),
    // mutate item at specified position
    item(1, prop("title", "new title")),
    item("first", prop("title", "new title")),
    item("last", prop("title", "new title"))
    // mutate all items
    item('all', prop("title", "new title"))
  ); // the state will keep it as is if no todo found
}
```

Mutating nested props

```js
import { mutate } from "cubiz";

function UserCubiz({ state, call }) {
  // initial state
  state({
    id: 1,
    name: "admin",
    roles: [],
    articles: [],
    work: {
      company: {
        address: {
          street: "",
          city: "",
        },
      },
    },
  });
  const old = state.value;
  state({
    ...old,
    name: "myname",
    roles: [...old.roles, "admin", "user", "superadmin"],
    articles: [...old.articles, { title: "abc" }],
    work: {
      ...old.work,
      company: {
        ...old.company,
        address: {
          ...old.company.address,
          street: "abc",
        },
      },
    },
  });

  // using mutate effect
  call(
    mutate,
    set("name", "myname"),
    prop("roles", push("admin", "user", "superadmin")),
    prop("articles", push({ title: "abc" })),
    prop("work", prop("compary", prop("address", set("street", "abc"))))
  );
}
```

---

## API References

Please refer this link for futher information https://linq2js.github.io/cubiz/

## Live examples
