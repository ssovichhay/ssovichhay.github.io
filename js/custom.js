
let intro = document.querySelector('.intro');
let introHeader = document.querySelector('.intro-header');
let introSpan = document.querySelectorAll('.intro-text');

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    introSpan.forEach((span, idx) => {
      setTimeout(() => {
        span.classList.add('active');
      }, (idx + 1) * 400)
    });

    setTimeout(() => {
      introSpan.forEach((span, idx) => {
        span.classList.remove('active');
        span.classList.add('fade');
      }, (idx + 1) * 50);
    }, 2000);

    setTimeout(() => {
      intro.style.top = '-100vh';
    }, 2300);
  });
});

// Preloader fade out
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.preloader').style.opacity = '0';
    setTimeout(() => {
      document.querySelector('.preloader').style.display = 'none';
    }, 1000);
  }, 1000);
});

// Home section slideshow
let currentHomeSlide = 0;
const homeSlides = document.querySelectorAll('.vegas-slide');

function showHomeSlide(n) {
  homeSlides.forEach(slide => slide.classList.remove('active'));
  currentHomeSlide = (n + homeSlides.length) % homeSlides.length;
  homeSlides[currentHomeSlide].classList.add('active');
}

function nextHomeSlide() {
  showHomeSlide(currentHomeSlide + 1);
}

setInterval(nextHomeSlide, 5000);

// Portfolio slideshow
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('active'));
  slides[index].classList.add('active');
  currentSlide = index;
}

function nextRandomSlide() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * slides.length);
  } while (randomIndex === currentSlide && slides.length > 1);
  showSlide(randomIndex);
}

setInterval(nextRandomSlide, 5000);

// Back to top button
const backToTop = document.querySelector('.go-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    backToTop.style.display = 'block';
  } else {
    backToTop.style.display = 'none';
  }
});

backToTop.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Section animation on scroll
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});

$(document).ready(function () {
  new WOW({ mobile: false }).init();

});