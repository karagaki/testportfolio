// pr_001.js

export const leftColor = "#B8AEF8"; 
export const rightColor = "#F3AB85"; 
export const customColor1 = "#a3a0e8";
export const customColor2 = "#ed9654";

document.addEventListener('DOMContentLoaded', () => {
  const video1Container = document.querySelector('.left-video');
  const video2Container = document.querySelector('.right-video');
  const video1 = video1Container.querySelector('video');
  const video2 = video2Container.querySelector('video');

  const icon1 = createIcon('assets/pr_1/webp/s1_a1.webp', 'icon1', 'icon');
  const icon2 = createIcon('assets/pr_1/webp/s1_a2.webp', 'icon2', 'icon');
  const popup1 = createIcon('assets/pr_1/webp/s1_c1.webp', 'popup1', 'popup');
  const popup2 = createIcon('assets/pr_1/webp/s1_c2.webp', 'popup2', 'popup');
  const popup3 = createIcon('assets/pr_1/webp/s1_c3.webp', 'popup3', 'popup');
  const popup4 = createIcon('assets/pr_1/webp/s1_c4.webp', 'popup4', 'popup');

  video1Container.appendChild(icon1);
  video2Container.appendChild(icon2);
  video1Container.appendChild(popup2);
  video1Container.appendChild(popup4);
  video2Container.appendChild(popup1);
  video2Container.appendChild(popup3);

  let popupTimeout;
  let iconsVisible = false;
  let activePopups = null;
  
  let timerSvgLeft = null;
  let timerSvgRight = null;

  function createIcon(src, id, className) {
    const icon = document.createElement('img');
    icon.src = src;
    icon.id = id;
    icon.className = `video-${className}`;
    icon.style.opacity = '0';
    icon.style.position = 'absolute';
    
    if (className === 'icon') {
      icon.style.width = '12px'; 
      icon.style.height = 'auto'; 
    } else {
      icon.style.height = '100%';
      icon.style.width = 'auto';
    }
    
    return icon;
  }

  function animateIcon(icon) {
    icon.animate([
      { transform: 'scale(1)', opacity: 0 },
      { transform: 'scale(2.1)', opacity: 1, offset: 0.5 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: 1300,
      easing: 'ease-in-out',
      iterations: Infinity,
      direction: 'alternate'
    });
  }

  function positionIcons() {
    icon1.style.left = '19px';
    icon1.style.bottom = '19px';
    icon1.style.top = 'auto';
    icon2.style.right = '19px';
    icon2.style.bottom = '19px';
    icon2.style.left = 'auto';
    icon2.style.top = 'auto';

    icon1.style.display = 'block';
    icon2.style.display = 'block';

    console.log('Icons positioned');
  }

  function adjustPopupSize() {
    if (!activePopups) return;

    const isCompressed = window.innerWidth < 1000;
    const [normalPopup, compressedPopup] = activePopups;
    
    adjustPopupStyle(normalPopup);
    adjustPopupStyle(compressedPopup);

    if (isCompressed) {
      if (normalPopup.style.opacity !== '0') {
        transitionPopups(normalPopup, compressedPopup);
      }
    } else {
      if (compressedPopup.style.opacity !== '0') {
        transitionPopups(compressedPopup, normalPopup);
      }
    }
  }

  function adjustPopupStyle(popup) {
    popup.style.height = '100%';
    popup.style.width = 'auto';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
  }

  function transitionPopups(fromPopup, toPopup) {
    fromPopup.style.transition = 'opacity 0.7s';
    toPopup.style.transition = 'opacity 0.7s';
    
    fromPopup.style.opacity = '0';
    toPopup.style.opacity = '1';

    fromPopup.style.display = 'block';
    toPopup.style.display = 'block';
  }

  function showIcons() {
    icon1.style.opacity = '1';
    icon2.style.opacity = '1';
    animateIcon(icon1);
    animateIcon(icon2);
    iconsVisible = true;
    console.log('Icons are now visible and animated');
  }

  function hideIcons() {
    icon1.style.opacity = '0';
    icon2.style.opacity = '0';
    icon1.getAnimations().forEach(anim => anim.cancel());
    icon2.getAnimations().forEach(anim => anim.cancel());
    iconsVisible = false;
    console.log('Icons are now hidden and animations stopped');
  }

  function onVideoPause() {
    console.log('Video paused');
    if (!activePopups) {
      showIcons();
    }
  }

  function onVideoPlay() {
    console.log('Video played');
    hideIcons();
  }

function createTimerIcon(container, duration, isLeftSide) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "timer-svg");
  svg.setAttribute("width", "31");
  svg.setAttribute("height", "31");
  svg.setAttribute("viewBox", "-6 -8 30 30");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("class", "timer-circle");
  circle.setAttribute("cx", "8");
  circle.setAttribute("cy", "8");
  circle.setAttribute("r", "9");
  circle.setAttribute("fill", "none");
  
  // ここを修正: isLeftSide が true の場合は rightColor を使用 (左側のビデオには右の色を使用)
  circle.setAttribute("stroke", isLeftSide ? rightColor : leftColor);
  circle.setAttribute("stroke-width", "12");


    svg.appendChild(circle);
    container.appendChild(svg);

    const circumference = 2 * Math.PI * 10;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = '0';

    function setProgress(percent) {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setProgress(progress);
      if (progress < 100) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
    return svg;
  }

  function showPopup(normalPopup, compressedPopup) {
    const isCompressed = window.innerWidth < 1000;
    
    activePopups = [normalPopup, compressedPopup];
    
    normalPopup.style.display = 'block';
    compressedPopup.style.display = 'block';
    
    normalPopup.style.opacity = '0';
    compressedPopup.style.opacity = '0';
    normalPopup.style.transition = 'opacity 0.7s';
    compressedPopup.style.transition = 'opacity 0.7s';
    
    setTimeout(() => {
      if (isCompressed) {
        compressedPopup.style.opacity = '1';
        console.log(`Showing compressed popup: ${compressedPopup.id}`);
      } else {
        normalPopup.style.opacity = '1';
        console.log(`Showing normal popup: ${normalPopup.id}`);
      }
    }, 50);

    const activePopup = isCompressed ? compressedPopup : normalPopup;
    const timerContainer = activePopup.parentElement;

    if (timerSvgLeft) timerSvgLeft.remove();
    if (timerSvgRight) timerSvgRight.remove();

  const isLeftVideo = normalPopup === popup1 || compressedPopup === popup3;

  if (isLeftVideo) {
    timerSvgRight = createTimerIcon(timerContainer, 6000, false);  // false for right timer
    timerSvgRight.style.position = 'absolute';
    timerSvgRight.style.right = '10px';
    timerSvgRight.style.bottom = '10px';
    timerSvgRight.style.zIndex = '30';
  } else {
    timerSvgLeft = createTimerIcon(timerContainer, 6000, true);  // true for left timer
    timerSvgLeft.style.position = 'absolute';
    timerSvgLeft.style.left = '10px';
    timerSvgLeft.style.bottom = '10px';
    timerSvgLeft.style.zIndex = '30';
  }
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => hidePopup(), 6000);
  }

  function hidePopup() {
    if (!activePopups) return;

    const [normalPopup, compressedPopup] = activePopups;
    
    normalPopup.style.opacity = '0';
    compressedPopup.style.opacity = '0';

    if (timerSvgLeft) {
      timerSvgLeft.remove();
      timerSvgLeft = null;
    }
    if (timerSvgRight) {
      timerSvgRight.remove();
      timerSvgRight = null;
    }

    showIcons();

    setTimeout(() => {
      normalPopup.style.display = 'none';
      compressedPopup.style.display = 'none';
      activePopups = null;
    }, 700);
  }

  video1Container.addEventListener('click', () => {
    if (iconsVisible && !activePopups) {
      console.log('Video1 container clicked');
      showPopup(popup1, popup3);
      video1.play();
      hideIcons();
    }
  });

  video2Container.addEventListener('click', () => {
    if (iconsVisible && !activePopups) {
      console.log('Video2 container clicked');
      showPopup(popup2, popup4);
      video2.play();
      hideIcons();
    }
  });

  video1.addEventListener('pause', onVideoPause);
  video2.addEventListener('pause', onVideoPause);
  video1.addEventListener('play', onVideoPlay);
  video2.addEventListener('play', onVideoPlay);

  window.addEventListener('resize', () => {
    positionIcons();
    adjustPopupSize();
  });

  positionIcons();
  adjustPopupSize();
  hideIcons();

  console.log('Initialization complete');
});