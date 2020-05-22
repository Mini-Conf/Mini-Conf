// credits: https://www.sitepoint.com/five-techniques-lazy-load-images-website-performance/

let lazy_active_observer = null;

const lazyLoader = () => {
  if (lazy_active_observer) {
    lazy_active_observer.disconnect();
    lazy_active_observer = null;
  }

  const config = {
    rootMargin: "0px 0px 50px 0px",
    threshold: 0,
  };

  lazy_active_observer = new IntersectionObserver(function (entries, self) {
    entries.forEach((entry) => {
      const { target } = entry;
      if (entry.isIntersecting) {
        target.setAttribute("src", target.dataset.src);
        // the image is now in place, stop watching
        self.unobserve(entry.target);
        target.classList.remove("lazy-load-img");
      }
    });
  }, config);

  const imgs = document.querySelectorAll(".lazy-load-img");
  // console.log(imgs,"--- imgs");
  imgs.forEach((img) => {
    // console.log(img,"--- img");
    lazy_active_observer.observe(img);
  });
};
