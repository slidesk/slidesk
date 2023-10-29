window.slidesk.oldNext = window.slidesk.next;

window.slidesk.prepareSteps = () => {
  if (
    [...window.slidesk.slides[window.slidesk.currentSlide].classList].includes(
      "steps"
    )
  ) {
    window.slidesk.step = 0;
    window.slidesk.$lis =
      window.slidesk.slides[window.slidesk.currentSlide].querySelectorAll(
        "ul li"
      );
    window.slidesk.maxSteps = window.slidesk.$lis.length;
    [...window.slidesk.$lis].forEach((li) => li.classList.add("step-hidden"));
  }
};

window.slidesk.next = () => {
  if (
    [...window.slidesk.slides[window.slidesk.currentSlide].classList].includes(
      "steps"
    )
  ) {
    if (window.slidesk.step === window.slidesk.maxSteps) {
      window.slidesk.oldNext();
    } else {
      window.slidesk.$lis[window.slidesk.step++].classList.remove(
        "step-hidden"
      );
    }
  } else window.slidesk.oldNext();
};
