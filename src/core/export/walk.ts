import type { Page } from "../browser";

const SETTLE = 100;

// go through every slide so plugin onSlideChange hooks run and reveal whatever
// they add to the DOM, exactly like a live presentation would
const walk = async (
  page: Page,
  total: number,
  transition: number,
  onSlide?: (num: number) => Promise<void> | void,
) => {
  for (let i = 0; i < total; i += 1) {
    // sequential on purpose: the page shows one slide at a time
    await page.evaluate(`window.slidesk.goto(${i})`); // NOSONAR
    await Bun.sleep(transition + SETTLE); // NOSONAR
    await onSlide?.(i + 1); // NOSONAR
  }
};

export default walk;
