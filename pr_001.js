document.addEventListener('DOMContentLoaded', () => {
  const video1Container = document.querySelector('.left-video');
  const video2Container = document.querySelector('.right-video');
  const video1 = video1Container.querySelector('video');
  const video2 = video2Container.querySelector('video');

  const icon1 = createIcon('assets/pr_1/ui/s1_a1.png', 'icon1', 'icon');
  const icon2 = createIcon('assets/pr_1/ui/s1_a2.png', 'icon2', 'icon');
  const popup1 = createIcon('assets/pr_1/s1_c1.png', 'popup1', 'popup');
  const popup2 = createIcon('assets/pr_1/s1_c2.png', 'popup2', 'popup');
  const popup3 = createIcon('assets/pr_1/s1_c3.png', 'popup3', 'popup');
  const popup4 = createIcon('assets/pr_1/s1_c4.png', 'popup4', 'popup');

  video1Container.appendChild(icon1);
  video2Container.appendChild(icon2);
  video1Container.appendChild(popup2);
  video1Container.appendChild(popup4);
  video2Container.appendChild(popup1);
  video2Container.appendChild(popup3);

  let popupTimeout;
  let iconsVisible = false;
  let activePopups = null;
  
    // 新しく追加するタイマー関連の変数
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
    icon.style.width = '12px';  // サイズを大きくしました
    icon.style.height = 'auto'; // サイズを大きくしました
  } else {
    icon.style.height = '100%';
    icon.style.width = 'auto';
  }
  
  return icon;
}


function animateIcon(icon) {
  icon.animate([
    { transform: 'scale(1)', opacity: 0 },
    { transform: 'scale(1.6)', opacity: 1, offset: 0.5 }, // アイコン大の時のサイズ
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration: 1300,  // アニメーション時間を1.5秒に延長
    easing: 'ease-in-out',
    iterations: Infinity,  // 無限に繰り返す
    direction: 'alternate'  // 往復アニメーション
  });
}

  function positionIcons() {
    icon1.style.left = '15px';
    icon1.style.bottom = '15px';
    icon1.style.top = 'auto';
    icon2.style.right = '15px';
    icon2.style.bottom = '15px';
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

  // タイマー機能を追加
  function createTimerIcon(container, duration, isLeftSide) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "timer-svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "-1 -1 22 22");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "timer-circle");
    circle.setAttribute("cx", "10");
    circle.setAttribute("cy", "10");
    circle.setAttribute("r", "9");
    circle.setAttribute("fill", "none");
    
    const leftColor = "#F2B282";
    const rightColor = "#CBC9F2";
    
    circle.setAttribute("stroke", isLeftSide ? leftColor : rightColor);
    circle.setAttribute("stroke-width", "6");

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
  
  // アニメーションのための初期設定
  normalPopup.style.opacity = '0';
  compressedPopup.style.opacity = '0';
  normalPopup.style.transition = 'opacity 0.7s';
  compressedPopup.style.transition = 'opacity 0.7s';
  
  // 表示アニメーションを開始
  setTimeout(() => {
    if (isCompressed) {
      compressedPopup.style.opacity = '1';
      console.log(`Showing compressed popup: ${compressedPopup.id}`);
    } else {
      normalPopup.style.opacity = '1';
      console.log(`Showing normal popup: ${normalPopup.id}`);
    }
  }, 50);  // 少し遅延させてアニメーションを確実に実行


    const activePopup = isCompressed ? compressedPopup : normalPopup;
    const timerContainer = activePopup.parentElement;

    if (timerSvgLeft) timerSvgLeft.remove();
    if (timerSvgRight) timerSvgRight.remove();

    const isLeftVideo = normalPopup === popup1 || compressedPopup === popup3;

    if (isLeftVideo) {
      timerSvgRight = createTimerIcon(timerContainer, 6000, false);
      timerSvgRight.style.position = 'absolute';
      timerSvgRight.style.right = '10px';
      timerSvgRight.style.bottom = '10px';
      timerSvgRight.style.zIndex = '30';
    } else {
      timerSvgLeft = createTimerIcon(timerContainer, 6000, true);
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
  
  // 非表示アニメーションを開始
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

  // UIアイコンの表示をポップアップのフェードアウト開始と同時に行う
  showIcons();

  setTimeout(() => {
    normalPopup.style.display = 'none';
    compressedPopup.style.display = 'none';
    activePopups = null;
  }, 700);  // アニメーション終了後に完全に非表示にする
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

  // 初期化
  positionIcons();
  adjustPopupSize();
  hideIcons();

  console.log('Initialization complete');
});