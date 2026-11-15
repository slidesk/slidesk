/**
 * Answers the expressions the export sends to the page as a deck would: `steps`
 * gives, for each slide, the number of items a step plugin reveals one at a time.
 */
export const fakeDeck = (steps: number[]) => {
  let current = 0;
  let shown = 0;
  return (expression: string): unknown => {
    const goto = /slidesk\.goto\((\d+)\)/.exec(expression);
    if (goto) {
      current = Number(goto[1]);
      shown = 0;
    } else if (expression === "window.slidesk.next()") {
      if (shown < (steps[current] ?? 0)) shown += 1;
      else if (current < steps.length - 1) {
        current += 1;
        shown = 0;
      }
    } else if (expression.includes("getComputedStyle(e)"))
      return `${current}:${shown}`;
    return undefined;
  };
};
