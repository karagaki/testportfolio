// pr_005.js

const Project5Slider = (function() {
    let scene, camera, renderer, container;
    let slides = [];
    let currentIndex = 0;
    let targetIndex = 0;
    let isSelected = false;
    let lastTime = 0;
    const frameTime = 1000 / 60;
    let isAnimating = false;
    let whiteCircle;
    let textElement;
    let animationQueue = Promise.resolve();
    let slideWidth, slideHeight;
    const SLIDE_ASPECT_RATIO = 16 / 9;
    const MAX_SLIDE_WIDTH_PERCENTAGE = 0.01; // コンテナの幅の1%
    const MAX_SLIDE_HEIGHT_PERCENTAGE = 0.04; // コンテナの高さの4%
    const SLIDE_SPACING_FACTOR = 0.2; // スライド間の間隔を調整
    const DEPTH_STEP = 3; // 各スライド間の奥行きステップ


const images = [
    's5_a1.webp', 's5_a2.webp', 's5_a3.webp', 's5_a4.webp', 's5_a5.webp', 
    's5_a6.webp', 's5_a7.webp', 's5_a8.webp', 's5_a9.webp', 's5_a10.webp', 
    's5_a11.webp', 's5_a12.webp', 's5_a13.webp', 's5_a14.webp', 's5_a15.webp', 
    's5_a16.webp', 's5_a17.webp', 's5_a18.webp', 's5_a19.webp', 's5_a20.webp', 's5_a21.webp'
];

const textData = [
    {name1: 'Trojan Horse', alias1: '',                nickname1: '',
     name2: 'トロイの木馬', alias2: '',                  nickname2: '' },
    {name1: 'Stealth Virus', alias1: 'Alias:',         nickname1: 'Ghost Virus', 
     name2: 'ステルス型ウイルス', alias2: '通称',          nickname2: 'ゴースト・ウイルス' },
    {name1: 'Stealth Virus', alias1: 'Alias:',         nickname1: 'Dark Virus', 
     name2: 'ステルス型ウイルス', alias2: '通称',          nickname2: 'ダーク・ウイルス' },
    {name1: 'Mutation Virus', alias1: 'Alias:',        nickname1: 'Alien Virus', 
     name2: 'ミューテーション型ウイルス', alias2: '通称',   nickname2: 'エイリアン・ウイルス' },
    {name1: 'Browser Hijacking', alias1: 'Alias:',     nickname1: 'Porn Wear', 
     name2: 'ブラウザハイジャック', alias2: '通称',        nickname2: 'ポルノ・ウェア' },
    {name1: 'RansomWare', alias1: 'Alias:',            nickname1: 'Mafia Wear', 
     name2: 'ランサムウエア', alias2: '通称',             nickname2: 'マフィア・ウェア' },
    {name1: 'Logic Bomb', alias1: 'Alias:', nickname1: 'SmileMark Bomb', 
     name2: 'ロジックボム', alias2: '通称', nickname2: 'スマイルマーク・ボム' },
    {name1: 'SpyWare', alias1: '', nickname1: '', 
     name2: 'スパイウェア', alias2: '', nickname2: '' },
    {name1: 'Cracking', alias1: '', nickname1: '', 
     name2: 'クラッキング', alias2: '', nickname2: '' },
    {name1: 'Cyberterrorism', alias1: '', nickname1: '', 
     name2: 'サイバーテロ', alias2: '', nickname2: '' },
    {name1: 'Attacking', alias1: '', nickname1: '', 
     name2: 'アタッキング', alias2: '', nickname2: '' },
    {name1: 'Bots (spambots)', alias1: '', nickname1: '', 
     name2: 'ボット（スパムボット）', alias2: '', nickname2: '' },
    {name1: 'Mass Mailing Type Worm', alias1: 'Alias:', nickname1: 'Love Letter Worm', 
     name2: 'マスメーリング型ワーム', alias2: '通称', nickname2: 'ラブレター・ワーム' },
    {name1: 'Networked Worms', alias1: 'Alias:', nickname1: 'Hydra Worm', 
     name2: 'ネットワーク型ワーム', alias2: '通称', nickname2: 'ヒュドラ・ワーム' },
    {name1: 'Keylogger', alias1: '', nickname1: '', 
     name2: 'キーロガー', alias2: '', nickname2: '' },
    {name1: 'Scareware', alias1: 'Alias:', nickname1: 'Error Vaccine', 
     name2: 'スケアウェア', alias2: '通称', nickname2: 'エラー・ワクチン' },
    {name1: 'Christmas Card virus', alias1: 'Alias:', nickname1: 'Christmas Card virus', 
     name2: 'パスワードスティーラ', alias2: '通称', nickname2: 'クリスマスカード・ウイルス' },
    {name1: '〈Spear Phishing〉 Phishing', alias1: '', nickname1: '', 
     name2: '〈スピアフィッシング〉フィッシング', alias2: '', nickname2: '' },
    {name1: 'Backdoors', alias1: '', nickname1: '', 
     name2: 'バックドア', alias2: '', nickname2: '' },
    {name1: 'Hacking', alias1: '', nickname1: '', 
     name2: 'ハッキング', alias2: '', nickname2: '' },
    {name1: 'Net Police (Cybercrime Investigation Department)', alias1: '', nickname1: '', 
     name2: 'ネットポリス（サイバー犯罪捜査部）', alias2: '', nickname2: '' }
];


    function getTextInfo(index) {
        if (index >= 0 && index < textData.length) {
            return textData[index];
        } else {
            return {
                name1: "Error: Invalid Index",
                name2: "Error: Invalid Index",
                alias1: "",
                nickname1: "",
                alias2: "",
                nickname2: ""
            };
        }
    }

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

    function initProject5Slider() {
        if (typeof THREE === 'undefined') {
            console.error('THREE is not defined. Make sure Three.js is loaded before this script.');
            return;
        }
        if (typeof gsap === 'undefined') {
            console.error('GSAP is not defined. Make sure GSAP is loaded before this script.');
            return;
        }

        container = document.getElementById('project5-image-wrapper');
        if (!container) {
            console.error('Container element not found');
            return;
        }

        init();
        loadTextures().then(createSlides);

        window.addEventListener('resize', onWindowResize);
        container.addEventListener('mousemove', throttle(onMouseMove, 50));
        container.addEventListener('click', onSlideClick);
    }
    
    

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);

        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(25, aspect, 0.1, 1000); 
        camera.position.z = 17; // カメラの位置をさらに後ろに下げる

        renderer = new THREE.WebGLRenderer({ 
            alpha: true,
            antialias: true 
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.gammaFactor = 2.2;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        container.appendChild(renderer.domElement);

        const geometry = new THREE.CircleGeometry(0.1, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xdfdfbd, 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide
        });
        whiteCircle = new THREE.Mesh(geometry, material);
        whiteCircle.position.z = 1.3;
        whiteCircle.scale.set(0, 0, 1);
        scene.add(whiteCircle);

        calculateSlideDimensions();
    }
    
    function calculateSlideDimensions() {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerAspect = containerWidth / containerHeight;

        if (containerAspect > SLIDE_ASPECT_RATIO) {
            // コンテナが横長の場合
            slideHeight = containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE;
            slideWidth = slideHeight * SLIDE_ASPECT_RATIO;
            
            // 幅が最大許容幅を超える場合は調整
            if (slideWidth > containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE) {
                slideWidth = containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE;
                slideHeight = slideWidth / SLIDE_ASPECT_RATIO;
            }
        } else {
            // コンテナが縦長の場合
            slideWidth = containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE;
            slideHeight = slideWidth / SLIDE_ASPECT_RATIO;
            
            // 高さが最大許容高さを超える場合は調整
            if (slideHeight > containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE) {
                slideHeight = containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE;
                slideWidth = slideHeight * SLIDE_ASPECT_RATIO;
            }
        }
    }
    
    
    function loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        return Promise.all(images.map(img => 
            new Promise((resolve, reject) => {
                const fullPath = `assets/pr_5/webp/${img}`;
                console.log(`Attempting to load texture: ${fullPath}`);
                textureLoader.load(
                    fullPath,
                    texture => {
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        texture.encoding = THREE.sRGBEncoding;
                        console.log(`Texture loaded successfully: ${img}`);
                        resolve(texture);
                    },
                    undefined,
                    error => {
                        console.error(`Error loading texture ${img}:`, error);
                        console.error(`Full path: ${fullPath}`);
                        resolve(null);
                    }
                );
            })
        )).then(textures => textures.filter(texture => texture !== null));
    }
    
    

    function createSlides(textures) {
        calculateSlideDimensions();
        const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);

        textures.forEach((texture, index) => {
            texture.encoding = THREE.sRGBEncoding;
            texture.premultiplyAlpha = true;
            const material = new THREE.MeshBasicMaterial({ 
                map: texture, 
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.0
            });
            const mesh = new THREE.Mesh(geometry, material);
            updateSlidePosition(mesh, index, textures.length);
            scene.add(mesh);
            slides.push(mesh);
        });
        updateSlidesPosition(currentIndex);
        animate();
    }
    
        function updateSlidePosition(slide, index, totalSlides) {
        const spacing = slideWidth * 0.55;
        slide.position.x = (index - (totalSlides - 1) / 2) * spacing;
        slide.scale.set(0.8, 0.8, 1);
    }
    
    
    
    

let animationFrameId;

    function animate(currentTime) {
        animationFrameId = requestAnimationFrame(animate);

        if (!lastTime) {
            lastTime = currentTime;
            return;
        }

        const deltaTime = currentTime - lastTime;

        if (deltaTime < frameTime) {
            return;
        }

        if (!isSelected && !isAnimating && Math.abs(targetIndex - currentIndex) > 0.001) {
            currentIndex += (targetIndex - currentIndex) * 0.1;
            updateSlidesPosition(currentIndex);
        }

        renderer.render(scene, camera);
        lastTime = currentTime;
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        calculateSlideDimensions();

        slides.forEach((slide, index) => {
            slide.geometry.dispose();
            slide.geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);
            updateSlidePosition(slide, index, slides.length);
        });

        updateSlidesPosition(currentIndex);
    }

    function onMouseMove(event) {
        if (!isSelected) {
            const rect = container.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            targetIndex = Math.round((slides.length - 1) * (x + 1) / 2);
        }
    }
    
    
    function updateSlidesPosition(centerIndex) {
        const visibleSlides = 11;
        const halfVisible = Math.floor(visibleSlides / 2);

        slides.forEach((slide, i) => {
            const distance = i - centerIndex;
            const absDistance = Math.abs(distance);

            if (absDistance > halfVisible) {
                slide.visible = false;
                return;
            } else {
                slide.visible = true;
            }

            const spacing = slideWidth * SLIDE_SPACING_FACTOR;
            const targetX = distance * spacing;
            const targetZ = -absDistance * DEPTH_STEP; // 一段ずつ奥行きを変更
            const targetScale = Math.max(0.7, 1 - absDistance * 0.1);
            const targetOpacity = Math.max(0.5, 1 - absDistance * 0.15);

            gsap.to(slide.position, {
                duration: 0.3,
                x: targetX,
                z: targetZ,
                ease: "power2.out",
            });
            gsap.to(slide.scale, {
                duration: 0.3,
                x: targetScale,
                y: targetScale,
                ease: "power2.out",
            });
            gsap.to(slide.material, {
                duration: 0.3,
                opacity: targetOpacity,
                ease: "power2.out",
            });
        });
    }

    function selectSlide(index) {
        return new Promise((resolve) => {
            const selectedSlide = slides[index];
            const centerX = 0;
            const offset = centerX - selectedSlide.position.x;

            slides.forEach((slide, i) => {
                gsap.to(slide.position, {
                    duration: 0.5,
                    x: slide.position.x + offset,
                    ease: "power2.out",
                });
            });

            gsap.to(selectedSlide.position, {
                duration: 0.5,
                z: 2,
                ease: "power2.out",
            });
            gsap.to(selectedSlide.scale, {
                duration: 0.5,
                x: 1.12,
                y: 1.12,
                ease: "power2.out",
            });

            slides.forEach((slide, i) => {
                if (i !== index) {
                    gsap.to(slide.position, {
                        duration: 0.5,
                        z: -2,
                        ease: "power2.out",
                    });
                    gsap.to(slide.scale, {
                        duration: 0.5,
                        x: 0.4,
                        y: 0.4,
                        ease: "power2.out",
                    });
                    gsap.to(slide.material, {
                        duration: 0.8,
                        opacity: 0.1,
                        ease: "power2.out",
                    });
                }
            });

            setTimeout(() => {
                animateWhiteCircle(index).then(() => {
                    displayTextInfo(index);
                    resolve();
                });
            }, 1000);
        });
    }

   function animateWhiteCircle(index) {
        return new Promise((resolve) => {
            const maskSize = Math.max(container.clientWidth, container.clientHeight) * 2;

            gsap.to(whiteCircle.scale, {
                duration: 1,
                x: maskSize,
                y: maskSize,
                ease: "power2.out",
                onUpdate: () => {
                },
                onComplete: () => {
                    displayTextInfo(index);
                    resolve();
                }
            });
            gsap.to(whiteCircle.material, {
                duration: 1,
                opacity: 0.9,
                ease: "power2.out",
                onUpdate: () => {
                }
            });
        });
    }

    function displayTextInfo(index) {
        const textInfo = getTextInfo(index);

        if (textElement) {
            textElement.remove();
        }

        function adjustKatakana1(text) {
            return text.replace(/(ア|の|木|バ)/g, '<span style="letter-spacing: -0.05em;">$1</span>');
        }

        function adjustKatakana2(text) {
            return text.replace(/(ク|シ|ュ|ィ|ト|ド|ロ|サ|ウ)/g, '<span style="letter-spacing: -0.2em;">$1</span>');
        }

        function adjustKatakana3(text) {
            return text.replace(/(ミ|テ|ム|タ|イ|ョ|フ|ワ|ェ|ラ)/g, '<span style="letter-spacing: -0.25em;">$1</span>');
        }

        function adjustKatakana4(text) {
            return text.replace(/(〈|〉|ジ|ッ|ャ)/g, '<span style="letter-spacing: -0.3em;">$1</span>');
        }

        function adjustKatakana5(text) {
            return text.replace(/(・)/g, '<span style="letter-spacing: -0.35em;">$1</span>');
        }

        function applyAllAdjustments(text) {
            return adjustKatakana5(
                adjustKatakana4(
                    adjustKatakana3(
                        adjustKatakana2(
                            adjustKatakana1(text)
                        )
                    )
                )
            );
        }

        const outlineStyle = `
            text-shadow: 
                -0.5px -0.5px 0 #fff,
                0.5px -0.5px 0 #fff,
                -0.5px 0.5px 0 #fff,
                0.5px 0.5px 0 #fff;
        `;

        textElement = document.createElement('div');
        textElement.className = 'slide-info';
        textElement.innerHTML = `
            <div class="slide-info-top">
                <h2 style="color: #000000; margin-bottom: -8px; ${outlineStyle}">${textInfo.name1}</h2>
                <p class="alias" style="color: #808080; margin-bottom: -2px; ${outlineStyle}">${textInfo.alias1}</p>
                <p style="color: #808080; ${outlineStyle}">${textInfo.nickname1}</p>
            </div>
            <div class="slide-info-bottom">
                <h2 style="color: #000000; margin-bottom: -8px; ${outlineStyle}">${applyAllAdjustments(textInfo.name2)}</h2>
                <p class="alias" style="color: #808080; margin-bottom: -2px; ${outlineStyle}">${applyAllAdjustments(textInfo.alias2)}</p>
                <p style="color: #808080; ${outlineStyle}">${applyAllAdjustments(textInfo.nickname2)}</p>
            </div>
        `;

        container.appendChild(textElement);

        gsap.from(textElement, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => console.log('Text animation completed')
        });
    }
    
    
    
function onSlideClick(event) {
        if (isAnimating) return;

        const rect = container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const clickedIndex = Math.round((slides.length - 1) * (x + 1) / 2);

        animationQueue = animationQueue.then(() => {
            isAnimating = true;
            if (!isSelected && clickedIndex === Math.round(currentIndex)) {
                isSelected = true;
                return selectSlide(clickedIndex);
            } else if (isSelected) {
                isSelected = false;
                return resetSlides();
            }
        }).then(() => {
            isAnimating = false;
        });
    }

    function resetSlides() {
        return new Promise((resolve) => {
            if (textElement) {
                gsap.to(textElement, {
                    duration: 0.5,
                    opacity: 0,
                    y: -50,
                    ease: "power2.in",
                    onComplete: () => {
                        textElement.remove();
                        textElement = null;
                    }
                });
            }

            gsap.to(whiteCircle.scale, {
                duration: 0.5,
                x: 0,
                y: 0,
                ease: "power2.in",
            });
            gsap.to(whiteCircle.material, {
                duration: 0.5,
                opacity: 0,
                ease: "power2.in",
            });

            slides.forEach((slide) => {
                gsap.to(slide.position, {
                    duration: 0.5,
                    z: 0,
                    ease: "power2.out",
                });
                gsap.to(slide.scale, {
                    duration: 0.5,
                    x: 0.8,
                    y: 0.8,
                    ease: "power2.out",
                });
                gsap.to(slide.material, {
                    duration: 0.5,
                    opacity: 1,
                    ease: "power2.out",
                });
            });

            setTimeout(() => {
                updateSlidesPosition(currentIndex);
                resolve();
            }, 500);
        });
    }

    // 公開するメソッド
    return {
        init: initProject5Slider
    };
})();

// ロード時にスライダーを初期化
window.addEventListener('load', Project5Slider.init);