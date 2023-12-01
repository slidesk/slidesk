let mapping = {};

const fetchMapping = async () => {
  try {
    const response = await fetch("./keyboard.json");
    const json = await response.json();
    mapping = json;
  } catch (erreur) {
    mapping = {
      f: "fullscreen",
    };
  }
  document.addEventListener("keydown", (e) => {
    if (typeof window.slidesk[mapping[e.key]] !== "undefined") {
      window.slidesk[mapping[e.key]]();
    } else {
      window.slidesk.io.send(JSON.stringify({ action: mapping[e.key] }));
    }
  });
};

fetchMapping();
