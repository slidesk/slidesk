import { describe, expect, it } from "bun:test";
import { fakeDeck } from "../../__testing__/deck";
import type { Page } from "../browser";
import walk from "./walk";

const fakePage = (steps: number[]) => {
  const deck = fakeDeck(steps);
  return { evaluate: async (e: string) => deck(e) } as unknown as Page;
};

const states = async (steps: number[]) => {
  const seen: string[] = [];
  await walk(fakePage(steps), steps.length, 0, (slide, step) => {
    seen.push(`${slide}.${step}`);
  });
  return seen;
};

describe("walk function", () => {
  it("should go to every slide", async () => {
    expect(await states([0, 0, 0])).toEqual(["0.0", "1.0", "2.0"]);
  });

  it("should report each revealed step as a state of its own", async () => {
    expect(await states([0, 2, 0, 1])).toEqual([
      "0.0",
      "1.0",
      "1.1",
      "1.2",
      "2.0",
      "3.0",
      "3.1",
    ]);
  });

  it("should reach the first slide with next, so step plugins hide their items", async () => {
    const calls: string[] = [];
    const deck = fakeDeck([0]);
    await walk(
      {
        evaluate: async (e: string) => {
          calls.push(e);
          return deck(e);
        },
      } as unknown as Page,
      1,
      0,
    );
    expect(calls[0]).toContain('window.slidesk.lastAction = "next"');
  });

  it("should stop unrolling a slide that keeps changing on its own", async () => {
    let n = 0;
    const page = {
      evaluate: async (e: string) =>
        e.includes("getComputedStyle(e)") ? `0:${n++}` : undefined,
    } as unknown as Page;
    let count = 0;
    await walk(page, 1, -100, () => {
      count += 1;
    });
    expect(count).toBe(50);
  });

  it("should await an asynchronous callback before the next state", async () => {
    const order: string[] = [];
    await walk(fakePage([0, 0]), 2, 0, async (slide) => {
      await Bun.sleep(1);
      order.push(`done ${slide}`);
    });
    expect(order).toEqual(["done 0", "done 1"]);
  });

  it("should do nothing without any slide", async () => {
    const calls: string[] = [];
    await walk(
      {
        evaluate: async (e: string) => {
          calls.push(e);
        },
      } as unknown as Page,
      0,
      0,
    );
    expect(calls).toEqual([]);
  });
});
