# cubiz

## Features

- Simple API
- Easy to mainternant
- Async cancellation supported

## Usages

### Basic Usages

```js
import { useCubiz, Provider } from "cubiz";

// define init function of the cubiz
const CounterCubiz = ({ state }) => {
  // set initial state of CounterCubiz
  state(1);
};

// define cubiz effect, just increase state value by 1
const increment = ({ state }) => {
  // get current state
  const count = state();
  // update state
  state(count + 1);
  // can achieve above by using state reducer
  // state((prev) => prev + 1);
};

const Counter = () => {
  // get cubiz instance from the provider, the cubiz will be created by calling init function
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
