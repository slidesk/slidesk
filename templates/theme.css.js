export const css = `
:root {
  font-family: SegoeUI, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

html, body, main {
  width: 100%;
  height: 100%;
  margin: 0;
}

main {
  position: relative;
  overflow: hidden;
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
