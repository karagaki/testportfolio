// pr_011.js

(function() {
    // ウィンドウのリサイズ時に画像のサイズを調整する関数
    function updateImageSize() {
        const imageWrapper = document.getElementById('project11-image-wrapper');
        const image = document.getElementById('project11-image');
        if (!imageWrapper || !image) return;

        const wrapperWidth = imageWrapper.offsetWidth;
        const imageAspectRatio = 16 / 10; // 画像のアスペクト比を16:10と仮定

        let height = wrapperWidth / imageAspectRatio;
        image.style.height = `${height}px`;
    }

    // 初期化関数
    function init() {
        updateImageSize();
        window.addEventListener('resize', updateImageSize);
    }

    // DOMContentLoaded時に初期化関数を呼び出す
    document.addEventListener('DOMContentLoaded', init);
})();