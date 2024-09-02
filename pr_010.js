(function () {
  const videos = document.querySelectorAll(
    "#project10-image-wrapper .feature-video"
  );

  function init() {
    console.log("Initializing...");
    const imageWrapper = document.getElementById("project10-image-wrapper");
    if (!imageWrapper) {
      return;
    }

    videos.forEach((video) => {
      video.play().catch((error) => {
        console.error("Auto-play was prevented:", error);
      });
    });
  }

  function updateVideoSize() {
    const wrapper = document.getElementById("project10-image-wrapper");
    const wrapperWidth = wrapper.offsetWidth;
    const wrapperHeight = wrapper.offsetHeight;

    videos.forEach((video) => {
      const videoAspect = video.videoWidth / video.videoHeight;
      const wrapperAspect = wrapperWidth / wrapperHeight;

      if (videoAspect > wrapperAspect) {
        video.style.width = "100%";
        video.style.height = "auto";
      } else {
        video.style.width = "auto";
        video.style.height = "100%";
      }
    });
  }

  init();

  window.addEventListener("resize", updateVideoSize);
  updateVideoSize();
})();
