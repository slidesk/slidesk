import { beforeEach, describe, expect, it, mock } from "bun:test";
import type Server from "../core/Server";

/**
 * A real readline interface would wait on stdin. Nothing else in the sources
 * uses node:readline, so the whole module is replaced.
 *
 * `question` answers from a queue, where `null` closes the prompt the way
 * Ctrl-C does; once the queue is empty the prompt never settles.
 */
let answers: (string | null)[] = [];
const prompts: string[] = [];
const cursor: unknown[][] = [];

const readlineMock = {
  createInterface: () => {
    let onClose = () => {};
    return {
      on: (_event: "close", listener: () => void) => {
        onClose = listener;
      },
      question: (query: string, callback: (answer: string) => void) => {
        prompts.push(query);
        if (!answers.length) return;
        const answer = answers.shift();
        if (answer === null) onClose();
        else callback(answer as string);
      },
      close: () => onClose(),
    };
  },
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

  it("rejects when the prompt is interrupted", async () => {
    answers = [null];
    await expect(question("Title?")).rejects.toThrow("Interrupted");
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
  it("stops on q", async () => {
    answers = ["q"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([]);
  });

  it("stops on an uppercase Q", async () => {
    answers = ["Q"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([]);
  });

  it("stops when the prompt is interrupted", async () => {
    answers = [null];
    await getAction(fakeServer, true);
    expect(sent).toEqual([]);
  });

  it("goes to the previous slide on p", async () => {
    answers = ["p", "q"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["previous"]]);
  });

  it("jumps to the slide typed, counting from one", async () => {
    answers = ["4", "q"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["goto", 3]]);
  });

  it("goes to the next slide on anything else", async () => {
    answers = ["", "q"];
    await getAction(fakeServer, true);
    expect(sent).toEqual([["next"]]);
  });

  it("erases the line the user typed on", async () => {
    answers = ["", "q"];
    await getAction(fakeServer, true);
    expect(cursor.map((c) => c[0])).toEqual([
      "moveCursor",
      "clearScreenDown",
      "moveCursor",
      "clearScreenDown",
    ]);
  });

  it("sends nothing outside of a presentation", async () => {
    answers = ["p", "q"];
    await getAction(fakeServer);
    expect(sent).toEqual([]);
  });

  it("keeps asking after an action", async () => {
    answers = ["p", "q"];
    await getAction(fakeServer, true);
    expect(prompts).toEqual(["", ""]);
  });
});
