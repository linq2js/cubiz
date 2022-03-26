import { Context, createRepository } from "../lib/core";
import { mapping } from "../lib/effects";

test("mapping", () => {
  const FirstNameCubiz = (x: Context<string>) => (x.state.value = "abc");
  const LastNameCubiz = (x: Context<string>) => (x.state.value = "def");
  const FullNameCubiz = ({ call }: Context<string>) => {
    call(
      mapping()
        .add("firstName", FirstNameCubiz)
        .add("lastName", LastNameCubiz)
        .map((result) => `${result.firstName} ${result.lastName}`)
    );
  };
  const repo = createRepository();
  const firstName = repo.get(FirstNameCubiz);
  const lastName = repo.get(LastNameCubiz);
  const fullName = repo.get(FullNameCubiz);
  expect(fullName.state).toBe("abc def");
  firstName.call((x) => (x.state.value = "123"));
  expect(fullName.state).toBe("123 def");
  lastName.call((x) => (x.state.value = "456"));
  expect(fullName.state).toBe("123 456");
});
