// script.js


document.addEventListener('DOMContentLoaded', function() {
    // GSAPプラグインの登録
    gsap.registerPlugin(ScrollTrigger);
    
    setupProjectVisibilityObserver();
});

// DOMコンテンツ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // GSAPプラグインの登録
    gsap.registerPlugin(ScrollTrigger);

    // タイトルアニメーションの読み込みと初期化
    const titleScript = document.createElement('script');
    titleScript.src = 'title_anime.js';
    titleScript.onload = () => {
        console.log('Title animation script loaded');
        if (typeof initializeTitleAnimation === 'function') {
            initializeTitleAnimation();
        }
    };
    document.body.appendChild(titleScript);

    // 各種セットアップ関数の呼び出し
    setupP2Animation();
    setupTextAnimation();
    setupProjectVisibilityObserver();


    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();　
    });

    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);




    // ビデオ再生の処理設定
    const videoContainer = document.querySelector('.video-container');
    const videos = document.querySelectorAll('#project1 video');

    // ビデオ再生関数
    function playVideos() {
        videos.forEach((video, index) => {
            video.currentTime = 0; // 動画を最初に巻き戻す
            video.play().then(() => {
                console.log(`Video ${index + 1} started playing`);
            }).catch(error => {
                console.log(`Error playing video ${index + 1}:`, error);
            });
        });
    }

    // Intersection Observer用のコールバック関数
    function handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                playVideos();
            } else {
                videos.forEach(video => {
                    video.pause();
                    video.currentTime = 0;
                });
            }
        });
    }

    // Intersection Observerの設定
    const observer = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    // ビデオコンテナの監視開始
    if (videoContainer) {
        observer.observe(videoContainer);
    }

    // ビデオ要素のイベントリスナー設定
    videos.forEach((video, index) => {
        video.addEventListener('loadedmetadata', () => {
            console.log(`Video ${index + 1} metadata loaded`);
        });
        video.addEventListener('ended', () => {
            video.pause();
            video.currentTime = 0;
        });
    });

    // 画像のフェードインアニメーション設定
    const animateImages = document.querySelectorAll('.animation-img');
    
    // 画像用Intersection Observerの設定
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                imageObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    // 画像要素の監視開始
    animateImages.forEach(image => {
        imageObserver.observe(image);
    });

    // マスクアニメーション設定
    const maskAnimations = document.querySelectorAll('.mask-animation');
    
    // マスクアニメーション用Intersection Observerの設定
    const maskObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const imageWrapper = entry.target.querySelector('.image-wrapper');
            if (entry.isIntersecting) {
                // 要素が表示されたらアニメーションを実行
                imageWrapper.classList.add('animated');
            } else {
                // 要素が非表示になったらアニメーションをリセット
                imageWrapper.classList.remove('animated');
            }
        });
    }, {
        threshold: 0.1
    });
    
    


    // マスクアニメーション要素の監視開始
    maskAnimations.forEach(animation => {
        maskObserver.observe(animation);
    });

    // テキストアニメーションのセットアップ
    setupTextAnimation();

    // プロジェクト8 After Effectsアニメーションの初期化
    if (typeof window.initAfterEffectsAnimation === 'function') {
        window.initAfterEffectsAnimation();
    }
    
        if (typeof window.initProject2 === 'function') window.initProject2();
    if (typeof window.initProject3 === 'function') window.initProject3();
    if (typeof window.initProject4 === 'function') window.initProject4();
    if (typeof window.initProject5 === 'function') window.initProject5();
    if (typeof window.initProject6 === 'function') window.initProject6();



// プロジェクト5
if (document.getElementById('project5-image-wrapper')) {
    console.log('Attempting to load pr_005.js');
    const script = document.createElement('script');
    script.src = 'pr_005.js';
    script.onload = function() {
        console.log('pr_005.js loaded successfully');
        if (typeof window.initProject5Slider === 'function') {
            // DOMContentLoadedイベントが発火した後に初期化
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                window.initProject5Slider();
            } else {
                document.addEventListener('DOMContentLoaded', window.initProject5Slider);
                console.error("initProject5Slider function not found in pr_005.js");
            }
        } else {
            console.error('initProject5Slider function not found in pr_005.js');
        }
    };
    script.onerror = function() {
        console.error('Failed to load pr_005.js');
    };
    document.body.appendChild(script);
} else {
    console.error('project5-image-wrapper not found');
}
});

// テキストアニメーションのセットアップ関数
function setupTextAnimation() {
    const charElements = document.querySelectorAll('.animation-text-char');
    const lineElements = document.querySelectorAll('.animation-text-line');

    function setupElement(element) {
        if (element.classList.contains('animation-text-char')) {
            const text = element.textContent;
            element.innerHTML = '';
            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.textContent = text[i];
                span.style.animationDelay = `${i * 40}ms`;
                element.appendChild(span);
            }

            // tx_color属性を確認し、白色の場合はクラスを追加
            const section = element.closest('.section');
            if (section && section.dataset.textColor === 'white') {
                element.classList.add('white');
            }
        } else if (element.classList.contains('animation-text-line')) {
            const span = document.createElement('span');
            span.innerHTML = element.innerHTML;
            element.innerHTML = '';
            element.appendChild(span);
        }
    }

    [...charElements, ...lineElements].forEach(setupElement);

    // 以下は変更なし
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const spans = entry.target.querySelectorAll('span');
                spans.forEach((span, index) => {
                    span.style.transitionDelay = `${index * 50}ms`;
                    span.classList.add('visible');
                });
            } else {
                const spans = entry.target.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transitionDelay = '0ms';
                    span.classList.remove('visible');
                });
            }
        });
    }, {
        threshold: 0.1
    });

    [...charElements, ...lineElements].forEach(element => {
        textObserver.observe(element);
    });
}


// 背景効果の初期化
if (typeof window.initBackgroundEffect === 'function') {
    window.initBackgroundEffect();
}

// ビデオ再生の処理
const videoContainer = document.querySelector('.video-container');
const videos = videoContainer.querySelectorAll('video');


// pr5
function playVideos() {
    videos.forEach((video, index) => {
        video.currentTime = 0; // 動画を最初に巻き戻す
        var playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log(`Video ${index + 1} started playing`);
            })
            .catch(error => {
                console.log(`Error playing video ${index + 1}:`, error);
            });
        }
    });
}

// pr5
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) { // 75%以上表示されたら再生
            playVideos();
        } else {
            videos.forEach(video => {
                video.pause();
            });
        }
    });
}, {
    threshold: 0.75 // 75%見えたら再生開始
});

// ビデオコンテナの監視開始
if (videoContainer) {
    videoObserver.observe(videoContainer);
}

// ビデオ要素のイベントリスナー設定
videos.forEach((video, index) => {
    video.addEventListener('loadedmetadata', () => {
        console.log(`Video ${index + 1} metadata loaded`);
    });
    video.addEventListener('ended', () => {
        video.pause();
        video.currentTime = -1;
    });
});



//　p2アニメーション
function setupP2Animation() {
    const p2Elements = document.querySelectorAll('p2');
    
    p2Elements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.classList.add('animation-text-p2');
        
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            element.appendChild(span);
        }
    });

    const p2Observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateP2(entry.target);
            } else {
                resetP2Animation(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    p2Elements.forEach(element => {
        p2Observer.observe(element);
    });
}

function animateP2(element) {
    element.classList.add('visible');
    const spans = element.querySelectorAll('span');
    spans.forEach((span, index) => {
        span.style.transitionDelay = `${index * 190}ms`;
    });
}

function resetP2Animation(element) {
    element.classList.remove('visible');
    const spans = element.querySelectorAll('span');
    spans.forEach(span => {
        span.style.transitionDelay = '0s';
    });
}


function toggleProjectVisibility(projectId, isVisible) {
    const project = document.getElementById(projectId);
    if (project) {
        if (isVisible) {
            project.classList.add('visible');
        } else {
            project.classList.remove('visible');
        }
    }
}


function setupProjectVisibilityObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const projectId = entry.target.id;
            toggleProjectVisibility(projectId, entry.isIntersecting);
        });
    }, {
        threshold: 0.1 // 10%見えたら可視とみなす
    });

    // プロジェクト2と8を監視対象に追加
    const projects = document.querySelectorAll('#project2, #project8');
    projects.forEach(project => {
        observer.observe(project);
    });
}
