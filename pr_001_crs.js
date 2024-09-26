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
        height: 48px;
        border-radius: 24px;
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        pointer-events: none;
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.4s ease-out;
        opacity: 0;
        transform: translate(-50%, -50%);
        left: 0;
        top: 0;
        padding: 0 20px;
      }
      #pr1-cursor-text {
        font-size: 18px; 
        font-weight: bold;
        color: rgba(255, 255, 255, 0.8);
        text-align: center;
        white-space: nowrap;
        transition: opacity 0.4s ease-in-out;
      }
    `;
    
    document.head.appendChild(pr1Style);
    console.log("PR1: Cursor style added to head");

    let lastKnownPosition = { x: 0, y: 0 };

    function updateCursorPosition(x, y) {
      lastKnownPosition = { x, y };
      pr1CustomCursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
    
    let isDetailImageChanging = false;
    let currentText = "";
    let isFading = false;
    let pendingUpdate = null;


     function pr1UpdateCursor(forceUpdate = false, withFade = false) {
      if (getActiveProject() === "pr1" && !isDetailImageChanging) {
        const rect = pr1Wrapper.getBoundingClientRect();
        const isLeft = lastKnownPosition.x - rect.left < rect.width / 2;

        const activePopup = document.querySelector('.video-popup[style*="opacity: 1"]');
        let cursorColor;
        let cursorText;
        let cursorWidth;

        if (activePopup) {
          const popupId = activePopup.id;
          if (['popup1', 'popup3'].includes(popupId)) {
            cursorColor = customColor1;
          } else if (['popup2', 'popup4'].includes(popupId)) {
            cursorColor = customColor2;
          }
          cursorText = "詳細資料";
          cursorWidth = "140px";
        } else {
          cursorColor = isLeft ? customColor1 : customColor2;
          cursorText = "クリックで詳細を表示します";
          cursorWidth = "320px";
        }

        pr1CustomCursor.style.borderColor = cursorColor;
        pr1CustomCursor.style.width = cursorWidth;
        pr1CursorText.style.color = cursorColor;

        if (cursorText !== currentText) {
          if (withFade) {
            if (isFading) {
              // フェード中の場合は、現在のフェードを継続し、新しい更新をペンディングとして保存
              pendingUpdate = { cursorText, cursorColor, cursorWidth };
            } else {
              isFading = true;
              pr1CursorText.style.opacity = '0';
              setTimeout(() => {
                pr1CursorText.textContent = cursorText;
                pr1CursorText.style.opacity = '1';
                currentText = cursorText;
                isFading = false;
                
                // ペンディング中の更新があれば適用
                if (pendingUpdate) {
                  pr1UpdateCursor(true, true);
                  pendingUpdate = null;
                }
              }, 350);
            }
          } else {
            pr1CursorText.textContent = cursorText;
            currentText = cursorText;
          }
        }

        if (forceUpdate) {
          updateCursorPosition(lastKnownPosition.x, lastKnownPosition.y);
        }
        pr1CustomCursor.style.opacity = "1";
        console.log("PR1: Cursor updated and shown", { cursorColor, cursorText, cursorWidth });
      } else {
        pr1CustomCursor.style.opacity = "0";
        console.log("PR1: Cursor hidden");
      }
    }
    
    

    function observeDetailImageChanges() {
      const config = { attributes: true, attributeFilter: ['src', 'style'] };
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'src') {
              const newSrc = mutation.target.src;
              if (newSrc.includes('s1_b') || newSrc.includes('s1_c')) {
                isDetailImageChanging = true;
                pr1CustomCursor.style.opacity = "0";
                setTimeout(() => {
                  isDetailImageChanging = false;
                  pr1UpdateCursor(true, true);
                }, 700);
              }
            } else if (mutation.attributeName === 'style') {
              setTimeout(() => pr1UpdateCursor(true, true), 0);
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
      updateCursorPosition(e.clientX, e.clientY);
      if (!isFading) {
        pr1UpdateCursor();
      }
    });


    pr1Wrapper.addEventListener("click", (e) => {
      updateCursorPosition(e.clientX, e.clientY);
      setTimeout(() => pr1UpdateCursor(true, true), 50);
    });

    const videoContainers = pr1Wrapper.querySelectorAll('.sticky-video');
    videoContainers.forEach(container => {
      container.addEventListener('click', () => {
        setTimeout(() => pr1UpdateCursor(true, true), 50);
      });
    });

    document.addEventListener('click', (e) => {
      if (!pr1Wrapper.contains(e.target)) {
        setTimeout(() => pr1UpdateCursor(true, true), 50);
      }
    });

    const videos = pr1Wrapper.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('play', () => setTimeout(() => pr1UpdateCursor(true, true), 50));
      video.addEventListener('pause', () => setTimeout(() => pr1UpdateCursor(true, true), 50));
    });

    document.addEventListener('pr1PopupHidden', () => {
      console.log("PR1: Popup hidden event received");
      pr1UpdateCursor(true, true);
    });

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