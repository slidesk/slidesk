import terminalImage from "terminal-image";
import replaceAsync from "../../utils/replaceAsync";

export default async (
  talkdir: string,
  slides: string[],
  currentSlideIndex: number,
) => {
  const { clear, log } = console;
  clear();
  log(
    await replaceAsync(
      slides[currentSlideIndex],
      /::img::([^:]+)::/g,
      async (_, src) => {
        const file = atob(String(src));
        if (String(file).endsWith(".svg")) return "";
        return await terminalImage.file(`${talkdir}/${file}`, {
          height: "50%",
        });
      },
    ),
  );
};
