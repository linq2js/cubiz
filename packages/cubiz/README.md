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

## Features

- Simple API
- Easy to mainternant
- Async cancellation supported

## Concepts

- **The Cubiz** is where to store the data of the application. One cubiz contains one kind of data and handle all business logic that relates to that data.
- **The effect** is where to describes how we can interact with the cubiz. When a effect called, if the effect contains async code, the cubiz loading status becomes true. After the effect is done, if no more running effect, the cubiz loading status becomes false, no matter the effect is sucess or fail.
- **The Provider** is where to handle cubiz repository, the repository stores all cubiz instances. When cubiz uses another cubiz instance, it calls the repository for resolving that

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

## API References

### Hook: useCubiz()

A React hook to bind cubiz to the current component. When the cubiz state is changed, the component will be rerendered.
useCubiz() retrieves cubiz will use cubiz 's init function as a key to look up all cubiz instances in the Provider's repository.
If not cubiz found, the Provider will create a new cubiz and apply the init function on that cubiz

### Component: \<Provider/>

The \<Provider> component makes the object repository available to any nested components that need to access the object repository.

### Method: createRepository()

### Effect: delay()

### Effect: debounce()

### Effect: throttle()

### Effect: sequential()

### Effect: droppable()

### Effect: race()

### Effect: all()

### Context<T>

## Live examples
