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
    await page.evaluate(`window.slidesk.goto(${i})`);
    await Bun.sleep(transition + SETTLE);
    await onSlide?.(i + 1);
  }
};

export default walk;
