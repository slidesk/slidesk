import { $workbench } from "./script.js";
import { saveCurrentSlide } from "./slides.js";

export const addVariableItem = async () => {
  const $modal = document.getElementById("var-modal");
  const $select = $modal.querySelector("#var-select");
  const $input = $modal.querySelector("#var-input");
  const $cancel = $modal.querySelector("#var-cancel");
  const $insert = $modal.querySelector("#var-insert");
  const { variables } = await (await fetch("/api/variables")).json();
  $select.innerHTML = `<option value="">-- Select existing --</option>${
    variables.map((v) => `<option value="${v}">${v}</option>`).join("")
  }`;
  $input.value = "";
  const close = () => { $modal.classList.add("hidden"); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  $select.onchange = () => { if ($select.value) $input.value = $select.value; };
  $cancel.onclick = close;
  $modal.onclick = (e) => { if (e.target === $modal) close(); };
  $insert.onclick = async () => {
    const name = $input.value.trim();
    if (!name) return;
    await fetch("/api/variables/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const p = document.createElement("p");
    p.textContent = `++${name}++`;
    $workbench.querySelector("article.sd-slide").appendChild(p);
    await saveCurrentSlide();
    close();
  };
  document.addEventListener("keydown", onKey);
  $modal.classList.remove("hidden");
  $input.focus();
};
