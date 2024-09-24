// pr_001_crs.js

import { setActiveProject, getActiveProject } from "./cursorManager.js";
import { leftColor, rightColor, customColor1, customColor2 } from './pr_001.js';

const PR1CursorGuide = {
  selector: ".pr_1-video-container",
  init: function () {
  	
    const pr1Wrapper = document.querySelector(this.selector);
    if (!pr1Wrapper) {
      console.error("PR1: Video container not found. Initialization aborted.");
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
        transition: opacity 1.3s ease-out, border-color 1.3s ease-out;
        transition: all 0.4s ease-out;
        opacity: 0;
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
    console.log("PR1: Cursor style added to head");

    function updateCursorPosition(e) {
      const x = e.clientX;
      const y = e.clientY;
      pr1CustomCursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      console.log("PR1: Cursor position updated", { x, y });
    }
    
    let isDetailImageChanging = false;


    function pr1UpdateCursor(e) {
      if (getActiveProject() === "pr1" && !isDetailImageChanging) {
        const rect = pr1Wrapper.getBoundingClientRect();
        const isLeft = e.clientX - rect.left < rect.width / 2;

        const activePopup = document.querySelector('.video-popup[style*="opacity: 1"]');
        let cursorColor;

        if (activePopup) {
          const popupId = activePopup.id;
          if (['popup1', 'popup3'].includes(popupId)) {
            cursorColor = customColor1;
          } else if (['popup2', 'popup4'].includes(popupId)) {
            cursorColor = customColor2;
          }
        } else {
          cursorColor = isLeft ? customColor1 : customColor2;
        }

        pr1CustomCursor.style.borderColor = cursorColor;
        pr1CursorText.style.color = cursorColor;
        pr1CursorText.textContent = "クリックで詳細を表示します";

        updateCursorPosition(e);
        pr1CustomCursor.style.opacity = "1";
        console.log("PR1: Cursor updated and shown", { cursorColor });
      } else {
        pr1CustomCursor.style.opacity = "0";
        console.log("PR1: Cursor hidden");
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
                pr1UpdateCursor({ clientX: 0, clientY: 0 }); // ダミーのイベントオブジェクト
              }, 500); // 500ミリ秒後にカーソルを再表示
            }
          }
        });
      });

      const popups = document.querySelectorAll('.video-popup');
      popups.forEach(popup => observer.observe(popup, config));
    }

    observeDetailImageChanges();
    
    

    pr1Wrapper.addEventListener("mouseenter", () => {
      setActiveProject("pr1");
      console.log("PR1: Mouse entered PR1 area");
    });

    pr1Wrapper.addEventListener("mouseleave", () => {
      setActiveProject(null);
      pr1CustomCursor.style.opacity = "0";
      console.log("PR1: Mouse left PR1 area");
    });

    document.addEventListener("mousemove", (e) => {
      pr1UpdateCursor(e);
    });

    // Force initial visibility check
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(pr1CustomCursor);
      console.log("PR1: Initial cursor visibility", {
        opacity: computedStyle.opacity,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
      });
    }, 1000);

    console.log("PR1CursorGuide: Initialization complete");
  },
};

// 即時実行関数を使用して初期化
(function () {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      PR1CursorGuide.init.bind(PR1CursorGuide)
    );
  } else {
    PR1CursorGuide.init();
  }
})();

export default PR1CursorGuide;