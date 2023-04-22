export const js = `
  window.talkflow.cleanOldSlide = (id) => {
    window.talkflow.slides[id].classList.remove('current', 'no-transition');
    setTimeout(() => {
      window.talkflow.slides[id].querySelectorAll('img').forEach((img) => {
        img.setAttribute('data-src', img.getAttribute('src'));
        img.removeAttribute('src');
      })
    }, window.talkflow.animationTimer);
  }

  window.talkflow.changeSlide = () => {
    window.talkflow.slides[window.talkflow.currentSlide].classList.remove('past');
    window.talkflow.slides[window.talkflow.currentSlide].classList.add('current');
    const h = window.talkflow.slides[window.talkflow.currentSlide].querySelector('h2');
    window.location.hash = "/" + (h ? h.getAttribute('data-slug') : '' + (window.talkflow.currentSlide ? window.talkflow.currentSlide : ''));
    window.talkflow.slides[window.talkflow.currentSlide].querySelectorAll('img').forEach((img) => {
      img.setAttribute('src', img.getAttribute('data-src'));
      img.removeAttribute('data-src');
    });
  }

  window.onload = () => {
    window.talkflow.slides = document.querySelectorAll('.slide');
    const loadingHash = window.location.hash.replace("#/", "");
    const slugs = [];
    window.talkflow.slides.forEach((slide, i) => {
        const h = slide.querySelector('h2');
        slugs.push(h ? h.getAttribute('data-slug') : '' + (i ? i : ''));
    });
    window.talkflow.currentSlide = slugs.indexOf(loadingHash);
    if (window.talkflow.currentSlide < 0) window.talkflow.currentSlide = 0;
    if (window.talkflow.currentSlide) {
        for (let i = 0 ; i < window.talkflow.currentSlide; i++) {
            window.talkflow.slides[i].classList.add('past', 'no-transition');
        }
    }
    window.talkflow.slides[window.talkflow.currentSlide].classList.add('current', 'no-transition');
    window.talkflow.changeSlide();
    document.addEventListener("keydown", (e) => {
      if (e.key == "ArrowLeft") {
        if (window.talkflow.currentSlide != 0) {
          window.talkflow.cleanOldSlide(window.talkflow.currentSlide);
          window.talkflow.currentSlide--;
          window.talkflow.changeSlide();
        }
      }
      else if (e.key == "ArrowRight" || e.key == " ") {
        if (window.talkflow.currentSlide != window.talkflow.slides.length - 1) {
            window.talkflow.cleanOldSlide(window.talkflow.currentSlide)
            window.talkflow.slides[window.talkflow.currentSlide].classList.add('past');
            window.talkflow.currentSlide++;
            window.talkflow.changeSlide();
        }
      }
    })
  };
`;
