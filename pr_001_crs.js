// pr_001_crs.js

import { setActiveProject, getActiveProject } from "./cursorManager.js";
import { leftColor, rightColor, customColor1, customColor2 } from './pr_001.js';

const PR1CursorGuide = {
  selector: ".pr_1-video-container",
  init: function () {

    const pr1Wrapper = document.querySelector(this.selector);
    if (!pr1Wrapper) {
      return;
    }

    const existingCursor = document.getElementById("pr1-custom-cursor");
    if (existingCursor) {
      existingCursor.remove();
    }

    const pr1CustomCursor = document.createElement("div");
    pr1CustomCursor.id = "pr1-custom-cursor";
    document.body.appendChild(pr1CustomCursor);

    const pr1CursorText = document.createElement("div");
    pr1CursorText.id = "pr1-cursor-text";
    pr1CustomCursor.appendChild(pr1CursorText);

    const pr1Style = document.createElement("style");
    pr1Style.textContent = `
      #pr1-custom-cursor {
        position: fixed;
        width: 320px;
        height: 48px;
        border-radius: 52px;
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        pointer-events: none;
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: opacity 0.3s ease-out, border-color 0.3s ease-out;
        opacity: 0;
        transition: all 0.4s ease-out;
        transform: translate(-50%, -50%);
        left: 0;
        top: 0;
      }
      #pr1-cursor-text {
        font-size: 18px; 
        font-weight: bold;
        color: rgba(255, 255, 255, 0.8);
        text-align: center;
        white-space: nowrap;
        transition: color 0.3s ease-out;
      }
    `;
    document.head.appendChild(pr1Style);

    let isDetailImageChanging = false;
    let isMouseInside = false;

    function updateCursorPosition(e) {
      const x = e.clientX;
      const y = e.clientY;
      pr1CustomCursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }

    function pr1UpdateCursor(e) {
      const activeProject = getActiveProject();
      
      if (activeProject === "pr1" && isMouseInside && !isDetailImageChanging) {
        const rect = pr1Wrapper.getBoundingClientRect();
        const isLeft = e.clientX - rect.left < rect.width / 2;

        const activePopup = pr1Wrapper.querySelector('.video-popup[style*="opacity: 1"]');
        let cursorColor;
        
        pr1CustomCursor.style.borderColor = cursorColor;
        pr1CursorText.style.color = cursorColor;
        pr1CursorText.textContent = "クリックで詳細表示";

        updateCursorPosition(e);
        pr1CustomCursor.style.opacity = "1";
      } else {
        pr1CustomCursor.style.opacity = "0";
      }
    }

    function observeDetailImageChanges() {
      const config = { attributes: true, attributeFilter: ['src'] };
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
            const newSrc = mutation.target.src;
            if (newSrc.includes('s1_b') || newSrc.includes('s1_c')) {
              isDetailImageChanging = true;
              pr1CustomCursor.style.opacity = "0";
              setTimeout(() => {
                isDetailImageChanging = false;
                pr1UpdateCursor({ clientX: 0, clientY: 0 });
              }, 500);
            }
          }
        });
      });

      const popups = pr1Wrapper.querySelectorAll('.video-popup');
      popups.forEach(popup => observer.observe(popup, config));
    }

    pr1Wrapper.addEventListener("mouseenter", () => {
      setActiveProject("pr1");
      isMouseInside = true;
    });

    pr1Wrapper.addEventListener("mouseleave", () => {
      setActiveProject(null);
      isMouseInside = false;
      pr1CustomCursor.style.opacity = "0";
    });

    // throttle function to limit the rate at which pr1UpdateCursor gets called
    function throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
    }

    document.addEventListener("mousemove", throttle(pr1UpdateCursor, 16)); // ~60fps

    // 初期化を遅延させる
    setTimeout(() => {
      observeDetailImageChanges();
    }, 1000);

  },
};

// 即時実行関数を使用して初期化
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", PR1CursorGuide.init.bind(PR1CursorGuide));
  } else {
    PR1CursorGuide.init();
  }
})();

export default PR1CursorGuide;