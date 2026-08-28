import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { ExitError } from "../__testing__/addons";
import type Server from "../core/Server";

/**
 * interactCLI opens a readline interface on stdin at import time, which would
 * hold the test process open. Nothing else in the sources uses node:readline,
 * so the whole module is replaced.
 *
 * `question` answers from a queue; once it is empty it returns a promise that
 * never settles, which stops getAction's endless recursion without leaving a
 * rejection behind.
 */
let answers: string[] = [];
const prompts: string[] = [];
const cursor: unknown[][] = [];

const readlineMock = {
  createInterface: () => ({
    question: (query: string, callback: (answer: string) => void) => {
      prompts.push(query);
      if (answers.length) callback(answers.shift() as string);
    },
  }),
  moveCursor: (...args: unknown[]) => {
    cursor.push(["moveCursor", ...args]);
  },
  clearScreenDown: (...args: unknown[]) => {
    cursor.push(["clearScreenDown", ...args]);
  },
};
mock.module("node:readline", () => ({
  ...readlineMock,
  default: readlineMock,
}));

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { getAction, question, removeCurrentLine } = await import(
  "./interactCLI"
);

const sent: unknown[][] = [];
const fakeServer = {
  send: (action: string, data?: unknown) => {
    sent.push(data === undefined ? [action] : [action, data]);
  },
} as unknown as Server;

beforeEach(() => {
  answers = [];
  prompts.length = 0;
  cursor.length = 0;
  sent.length = 0;
  exitSpy.mockClear();
});

describe("question", () => {
  it("asks with an empty prompt when there is no query", async () => {
    answers = ["  hello  "];
    expect(await question("")).toBe("hello");
    expect(prompts).toEqual([""]);
  });

  it("highlights the query and trims the answer", async () => {
    answers = [" Fight Club \n"];
    expect(await question("What is the title?")).toBe("Fight Club");
    expect(prompts[0]).toBe("\x1b[1m> What is the title?\x1b[0m\n");
  });
});

describe("removeCurrentLine", () => {
  it("moves one line up and clears what follows", () => {
    removeCurrentLine();
    expect(cursor).toEqual([
      ["moveCursor", process.stdout, 0, -1],
      ["clearScreenDown", process.stdout],
    ]);
  });
});

describe("getAction", () => {
  it("quits on q", async () => {
    answers = ["q"];
    expect(getAction(fakeServer, true)).rejects.toThrow(
      "process.exit(undefined)",
    );
  });

  it("quits on an uppercase Q", async () => {
    answers = ["Q"];
    expect(getAction(fakeServer, true)).rejects.toThrow(
      "process.exit(undefined)",
    );
  });

  it("goes to the previous slide on p", async () => {
    answers = ["p"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["previous"]]);
  });

  it("jumps to the slide typed, counting from one", async () => {
    answers = ["4"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["goto", 3]]);
  });

  it("goes to the next slide on anything else", async () => {
    answers = [""];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["next"]]);
  });

  it("erases the line the user typed on", async () => {
    answers = [""];
    await getAction(fakeServer, true);
    expect(cursor.map((c) => c[0])).toEqual(["moveCursor", "clearScreenDown"]);
  });

  it("sends nothing outside of a presentation", async () => {
    answers = ["p"];
    await getAction(fakeServer);
    expect(sent).toEqual([]);
  });

  it("keeps asking after an action", async () => {
    answers = ["p"];
    await getAction(fakeServer, true);
    // the queued answer, then the recursive call that finds it empty
    expect(prompts).toEqual(["", ""]);
  });
});
