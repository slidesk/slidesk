import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import walk from "./walk";

const fakePage = (calls: string[]) =>
  ({
    evaluate: async (expression: string) => {
      calls.push(expression);
      return undefined as never;
    },
  }) as unknown as Page;

describe("walk function", () => {
  it("should go to every slide", async () => {
    const calls: string[] = [];
    await walk(fakePage(calls), 3, 0);
    expect(calls).toEqual([
      "window.slidesk.goto(0)",
      "window.slidesk.goto(1)",
      "window.slidesk.goto(2)",
    ]);
  });

  it("should report each slide after landing on it", async () => {
    const calls: string[] = [];
    const seen: number[] = [];
    await walk(fakePage(calls), 2, 0, (num) => {
      seen.push(num);
    });
    expect(seen).toEqual([1, 2]);
  });

  it("should await an asynchronous callback before the next slide", async () => {
    const calls: string[] = [];
    const order: string[] = [];
    await walk(fakePage(calls), 2, 0, async (num) => {
      await Bun.sleep(1);
      order.push(`done ${num}`);
    });
    expect(order).toEqual(["done 1", "done 2"]);
  });

  it("should do nothing without any slide", async () => {
    const calls: string[] = [];
    await walk(fakePage(calls), 0, 0);
    expect(calls).toEqual([]);
  });
});
