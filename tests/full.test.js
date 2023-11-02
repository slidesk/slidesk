// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import Interpreter from "../src/core/Interpreter";

const options = {
  save: false,
  notes: true,
  source: true,
};

const file = "example/main.sdf";

test("snap", async () => {
  expect(await Interpreter.convert(file, options)).toMatchSnapshot();
});
