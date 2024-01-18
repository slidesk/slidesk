// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import BabelFish from "../src/core/BabelFish";

const options = {
  save: false,
  notes: true,
  timers: true,
  conf: "test",
};

const file = `${process.cwd()}/example/main.sdf`;

test("not found", async () => {
  const b = new BabelFish("", options);
  expect(await b.convert()).toBeNull();
});

test("minimal", async () => {
  const b = new BabelFish(`${process.cwd()}/tests/main.sdf`, options);
  expect(await b.convert()).not.toBeNull();
});

test("snap full", async () => {
  const b = new BabelFish(file, options);
  expect(await b.convert()).not.toBeNull();
});
