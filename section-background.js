document.addEventListener("DOMContentLoaded", () => {
  const TRANSITION_DURATION = 1.2; // 背景の移り変わる時間（秒）
  const SCROLL_THRESHOLD = 0.5; // スクロールのしきい値（0.5は画面の半分）

  const projects = document.querySelectorAll(".feature");
  const backgrounds = document.querySelectorAll(".section-background");
  const backgroundCanvas = document.getElementById("background-canvas");

  let currentBackgroundIndex = -1;

  // 背景色の定義
  const backgroundColors = [
    "rgba(240, 240, 240, 1)",
    "rgba(0, 0, 0, 1)",
    "rgba(103, 73, 67, 0.963)",
    "rgba(176, 42, 42, 1)",
    "rgba(70, 29, 73, 1)",
    "rgb(38, 57, 32)",
    "rgba(10, 156, 3, 1)",
    "rgba(186, 199, 255, 1)",
    "rgba(148, 148, 148, 1)",
    "rgba(234, 121, 46, 0.072)",
    "rgba(131, 131, 131, 0.562)",
  ];

  // 背景要素に初期色を設定
  backgrounds.forEach((bg, index) => {
    bg.style.backgroundColor = backgroundColors[index];
    bg.style.opacity = 0;
  });

  // TOP背景（backgroundCanvas）を初期状態で表示
  backgroundCanvas.style.opacity = 1;

  function changeProjectBackground() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;

    let activeProjectIndex = -1;

    if (scrollPosition < windowHeight * SCROLL_THRESHOLD) {
      // TOP領域
      updateBackground(-1);
      return;
    }

    projects.forEach((project, index) => {
      const rect = project.getBoundingClientRect();
      const projectTop = rect.top + scrollPosition;
      const projectBottom = rect.bottom + scrollPosition;

      if (
        scrollPosition >= projectTop - windowHeight * SCROLL_THRESHOLD &&
        scrollPosition < projectBottom - windowHeight * SCROLL_THRESHOLD
      ) {
        activeProjectIndex = index;
      }
    });

    if (activeProjectIndex !== -1) {
      updateBackground(activeProjectIndex);
    }
  }

  function updateBackground(newIndex) {
    if (newIndex === currentBackgroundIndex) return;

    const currentBg =
      currentBackgroundIndex >= 0 ? backgrounds[currentBackgroundIndex] : null;
    const newBg = newIndex >= 0 ? backgrounds[newIndex] : null;

    if (newIndex === -1) {
      // TOP背景に切り替え
      gsap.to(backgroundCanvas, {
        opacity: 1,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
      });
      if (currentBg) {
        gsap.to(currentBg, {
          opacity: 0,
          duration: TRANSITION_DURATION,
          ease: "power2.inOut",
        });
      }
    } else {
      // プロジェクト背景に切り替え
      gsap.to(backgroundCanvas, {
        opacity: 0,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
      });

      if (currentBg && currentBg !== newBg) {
        gsap.to(currentBg, {
          opacity: 0,
          duration: TRANSITION_DURATION,
          ease: "power2.inOut",
        });
      }

      gsap.to(newBg, {
        opacity: 1,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
      });
    }

    currentBackgroundIndex = newIndex;
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  const throttledChangeBackground = throttle(changeProjectBackground, 4); // 約60fps

  window.addEventListener("scroll", throttledChangeBackground);
  window.addEventListener("resize", changeProjectBackground);
  changeProjectBackground(); // Initial call
});
