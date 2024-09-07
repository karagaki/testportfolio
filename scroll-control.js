document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    let isScrolling = false;
    let startY;
    let currentY;
    const maxScrollSpeed = 5;
    const scrollMultiplier = 0.1;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function smoothScroll(targetY, duration) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeOutCubic(progress);
            window.scrollTo(0, startY + distance * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    function handleStart(e) {
        isScrolling = true;
        startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        currentY = startY;
        console.log('Start:', startY);
    }

    function handleMove(e) {
        if (!isScrolling) return;

        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const diff = (currentY - y) * scrollMultiplier;
        currentY = y;

        const limitedDiff = Math.sign(diff) * Math.min(Math.abs(diff), maxScrollSpeed);
        const newScrollTop = window.pageYOffset + limitedDiff;

        console.log('Move:', y, 'Diff:', limitedDiff, 'New scroll top:', newScrollTop);
        smoothScroll(newScrollTop, 100);

        e.preventDefault();
    }

    function handleEnd() {
        isScrolling = false;
        console.log('End');
    }

    // タッチイベントとマウスイベントの両方をキャッチ
    document.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('mousedown', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('mouseup', handleEnd);

    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', (e) => {
        console.log('Scroll event:', window.pageYOffset);
    }, { passive: true });

    // デバッグ用のオーバーレイを追加
    const debugOverlay = document.createElement('div');
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.top = '10px';
    debugOverlay.style.left = '10px';
    debugOverlay.style.background = 'rgba(0,0,0,0.7)';
    debugOverlay.style.color = 'white';
    debugOverlay.style.padding = '10px';
    debugOverlay.style.zIndex = '9999';
    document.body.appendChild(debugOverlay);

    function updateDebugOverlay() {
        debugOverlay.textContent = `Scroll: ${window.pageYOffset.toFixed(2)}`;
        requestAnimationFrame(updateDebugOverlay);
    }
    updateDebugOverlay();

    console.log('Event listeners and debug overlay added');
});