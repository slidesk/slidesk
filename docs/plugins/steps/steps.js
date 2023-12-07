window.slidesk.oldNext = window.slidesk.next;

const checkStepConditions = () =>
  [...window.slidesk.slides[window.slidesk.currentSlide].classList].includes(
    "steps",
  ) && window.slidesk.lastAction === "next";

window.slidesk.prepareSteps = () => {
  if (checkStepConditions()) {
    window.slidesk.step = 0;
    window.slidesk.$lis =
      window.slidesk.slides[window.slidesk.currentSlide].querySelectorAll("li");
    window.slidesk.maxSteps = window.slidesk.$lis.length;
    [...window.slidesk.$lis].forEach((li) => li.classList.remove("step-shown"));
  }
};

window.slidesk.next = () => {
  if (checkStepConditions()) {
    if (window.slidesk.step === window.slidesk.maxSteps) {
      window.slidesk.oldNext();
    } else {
      window.slidesk.$lis[window.slidesk.step++].classList.add("step-shown");
    }
  } else window.slidesk.oldNext();
};
