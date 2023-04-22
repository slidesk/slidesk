export const css = `
:root {
  font-family: SegoeUI, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;

  --tf-heading1-size: 3.75em;
  --tf-heading1-line-height: 1;
  --tf-heading2-size: 2.25em;
  --tf-heading2-line-height: 1;
  --tf-heading3-size: 1.75em;
  --tf-heading3-line-height: 1;
  --tf-text-size: 40px;
  --tf-text-line-height: 1.2;

  --tf-background-color: #242424;
  --tf-heading-color: rgba(255, 255, 255, 0.97);
  --tf-text-color: rgba(255, 255, 255, 0.87);
}

html, body, main {
  width: 100%;
  height: 100%;
  margin: 0;
}

main {
  position: relative;
  overflow: hidden;
  background-color: var(--tf-background-color);
  color: var(--tf-text-color);
  font-size: var(--tf-text-size);
  line-height: var(--tf-text-line-height);
}

section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateX(100%);
  transition: all var(--animationTimer) ease;
}

section h1, h2, h3 {
    margin: 0;
    text-align: center;
    color: var(--tf-heading-color);
}

section h1 {
    font-size: var(--tf-heading1-size);
    line-height: var(--tf-heading1-line-height);
}

section h2 {
    font-size: var(--tf-heading2-size);
    line-height: var(--tf-heading2-line-height);
}

section h3 {
    font-size: var(--tf-heading3-size);
    line-height: var(--tf-heading3-line-height);
}

section.no-transition {
  transition-duration: 0ms;
}

section.current {
  transform: translateX(0);
}

section.past {
  transform: translateX(-100%);
}
`;
