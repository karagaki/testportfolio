// pr_005_touch.js

(function (window) {
  window.initProject5Touch = function (container, callbacks) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let touchStartTime;
    let touchMoveThreshold = 10; // ピクセル単位の閾値
    const TAP_THRESHOLD = 200;
    const SWIPE_THRESHOLD = 50;
    const GLOW_THRESHOLD = 0.1;

    function onTouchStart(event) {
      isTouching = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartTime = Date.now();
    }

function onTouchMove(event) {
  if (!isTouching) return;
  event.preventDefault();
  const currentX = event.touches[0].clientX;
  const currentY = event.touches[0].clientY;
  const touchDeltaX = touchStartX - currentX;
  const touchDeltaY = touchStartY - currentY;

  if (Math.abs(touchDeltaX) > touchMoveThreshold) {
    updateSlidePositionByTouch(currentX);
  }
}

    function onTouchEnd(event) {
      if (!isTouching) return;
      isTouching = false;
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      handleInteraction(touchStartX, touchEndX, touchStartY, touchEndY, touchDuration);
    }

function handleInteraction(startX, endX, startY, endY, duration) {
  const touchDeltaX = startX - endX;
  const touchDeltaY = startY - endY;
  const containerWidth = container.clientWidth;
  const tapThreshold = containerWidth * 0.1;
  const swipeVelocity = Math.abs(touchDeltaX) / duration;

  if (Math.abs(touchDeltaX) < tapThreshold && Math.abs(touchDeltaY) < tapThreshold && duration < TAP_THRESHOLD) {
    handleTap(endX);
  } else if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD && swipeVelocity > 0.2 && !callbacks.isSelected()) {
    const newIndex = Math.round(callbacks.currentIndex() + (touchDeltaX > 0 ? 1 : -1));
    callbacks.targetIndex = Math.max(0, Math.min(callbacks.slides.length - 1, newIndex));
    callbacks.updateSlidesPosition(callbacks.targetIndex, true).then(() => {
      callbacks.enableGlowEffect();
    });
  }
}
    function handleTap(tapX) {
      const containerWidth = container.clientWidth;
      const margin = containerWidth * 0.1;
      const effectiveWidth = containerWidth - 2 * margin;
      let normalizedX = (tapX - margin) / effectiveWidth;
      normalizedX = Math.max(0, Math.min(1, normalizedX));
      const tappedIndex = Math.round((callbacks.slides.length - 1) * normalizedX);

      if (!callbacks.isSelected() && Math.abs(tappedIndex - callbacks.currentIndex()) < GLOW_THRESHOLD) {
        callbacks.selectSlide(tappedIndex);
      } else if (callbacks.isSelected()) {
        callbacks.resetSlides();
      }
    }

function updateSlidePositionByTouch(currentX) {
  const touchDelta = touchStartX - currentX;
  const sensitivity = 0.0005; // 0.002から0.0005に変更
  if (!callbacks.isSelected() && !callbacks.isTransitioning()) {
    callbacks.targetIndex = Math.max(0, Math.min(callbacks.slides.length - 1, callbacks.currentIndex() + touchDelta * sensitivity));
    callbacks.updateSlidesPosition(callbacks.targetIndex).then(() => {
      callbacks.enableGlowEffect();
    });
  }
}

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });
  };

  console.log("pr_005_touch.js loaded and initialized");
})(window);