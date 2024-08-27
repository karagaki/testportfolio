document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const pageIndicator = document.querySelector('.page-indicator');
    let currentSectionIndex = 0;
    const scrollFactor = 0.3;

    // タブレット検出
    const isTablet = /iPad|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // ページインジケーターの初期化と更新（変更なし）
    function initializePageIndicator() { /* ... */ }
    function updatePageIndicator(scrollPosition) { /* ... */ }

    // PC用のスクロール処理（変更なし）
    function handlePCScroll(event) { /* ... */ }

    // タブレット用のスクロール処理
    let touchStartY = 0;
    let touchStartX = 0;
    let isSwiping = false;
    let startTime;

    function handleTouchStart(event) {
        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
        startTime = new Date().getTime();
        isSwiping = false;
    }

    function handleTouchMove(event) {
        if (isSwiping) return;

        const touchY = event.touches[0].clientY;
        const touchX = event.touches[0].clientX;
        const diffY = touchStartY - touchY;
        const diffX = touchStartX - touchX;

        // 縦方向のスワイプを検出
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
            isSwiping = true;
        }
    }

    function handleTouchEnd(event) {
        const endTime = new Date().getTime();
        const touchTime = endTime - startTime;

        if (isSwiping && touchTime < 300) {  // スワイプが短時間で行われた場合のみ処理
            const touchY = event.changedTouches[0].clientY;
            const diff = touchStartY - touchY;

            if (Math.abs(diff) > 50) { // スワイプの閾値
                const direction = diff > 0 ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(currentSectionIndex + direction, sections.length - 1));
                sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
                currentSectionIndex = nextIndex;
            }
        }

        isSwiping = false;
    }

    // イベントリスナーの設定
    if (isTablet) {
        window.addEventListener('scroll', () => {
            updatePageIndicator(window.pageYOffset);
        }, { passive: true });
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
    } else {
        window.addEventListener('wheel', handlePCScroll, { passive: false });
    }

    // 初期化
    initializePageIndicator();
    updatePageIndicator(window.pageYOffset);
});