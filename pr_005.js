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
let isTransitioning = false;


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
    
    
  
    
function createBehindGlowMaterial(texture) {
    return new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: texture },
            glowColor: { value: new THREE.Color(0xf3f2ff) },
            glowStrength: { value: 3.5 },
            glowWidth: { value: 0.001 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec3 glowColor;
            uniform float glowStrength;
            uniform float glowWidth;
            varying vec2 vUv;

            float getAlpha(vec2 uv) {
                return texture2D(tDiffuse, uv).a;
            }

            void main() {
                float alpha = getAlpha(vUv);
                
                // ぼかし効果の計算
                float blur = 0.0;
                for (int i = -5; i <= 5; i++) {
                    for (int j = -5; j <= 5; j++) {
                        vec2 offset = vec2(float(i), float(j)) * glowWidth;
                        blur += getAlpha(vUv + offset);
                    }
                }
                blur /= 121.0; // 11x11のカーネルサイズ
                
                // 元の画像のアルファ値を反転させてグロー効果を作成
                float glowAlpha = (1.0 - alpha) * blur * glowStrength;
                
                // グロー効果のみを出力（元の画像は描画しない）
                gl_FragColor = vec4(glowColor, glowAlpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
}




function createSlides(textures) {
    calculateSlideDimensions();
    const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);

    textures.forEach((texture, index) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.premultiplyAlpha = true;

        // グロー効果用マテリアル（後ろに配置）
        const glowMaterial = createBehindGlowMaterial(texture);
        const glowMesh = new THREE.Mesh(geometry, glowMaterial);
        updateSlidePosition(glowMesh, index, textures.length);
        glowMesh.visible = false; // 初期状態では非表示に
        scene.add(glowMesh);

        // 元の画像用マテリアル（前面に配置）
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const mesh = new THREE.Mesh(geometry, material);
        updateSlidePosition(mesh, index, textures.length);
        mesh.position.z += 0.01; // 元の画像をグロー効果の前に配置
        scene.add(mesh);

        slides.push({ original: mesh, glow: glowMesh });
    });
    updateSlidesPosition(currentIndex);
    enableGlowEffect(); // 初期状態で中央の画像にのみオーラを表示
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

    if (!isSelected && !isAnimating && !isTransitioning && Math.abs(targetIndex - currentIndex) > 0.001) {
        currentIndex += (targetIndex - currentIndex) * 0.1;
        updateSlidesPosition(currentIndex).then(() => {
            enableGlowEffect();
        });
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
        if (slide.original && slide.original.geometry) {
            slide.original.geometry.dispose();
            slide.original.geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);
        }
        if (slide.glow && slide.glow.geometry) {
            slide.glow.geometry.dispose();
            slide.glow.geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);
        }
        updateSlidePosition(slide.original, index, slides.length);
        updateSlidePosition(slide.glow, index, slides.length);
    });

    updateSlidesPosition(currentIndex);
}



function onMouseMove(event) {
    if (!isSelected && !isTransitioning) {
        const rect = container.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const containerWidth = rect.width;

        const margin = containerWidth * 0.1;
        const effectiveWidth = containerWidth - 2 * margin;

        let normalizedX = (mouseX - margin) / effectiveWidth;
        normalizedX = Math.max(0, Math.min(1, normalizedX));

        targetIndex = (slides.length - 1) * normalizedX;

        updateSlidesPosition(targetIndex).then(() => {
            enableGlowEffect();
        });
    }
}
    
    
function updateSlidesPosition(centerIndex, animate = false) {
    return new Promise((resolve) => {
        const visibleSlides = 11;
        const halfVisible = Math.floor(visibleSlides / 2);

        const updatePromises = slides.map((slide, i) => {
            return new Promise((resolveSlide) => {
                const distance = i - centerIndex;
                const absDistance = Math.abs(distance);

                if (absDistance > halfVisible) {
                    slide.original.visible = false;
                    slide.glow.visible = false;
                    resolveSlide();
                    return;
                } else {
                    slide.original.visible = true;
                }

                const spacing = slideWidth * SLIDE_SPACING_FACTOR;
                const targetX = distance * spacing;
                const targetZ = -absDistance * DEPTH_STEP;
                const targetScale = Math.max(0.7, 1 - absDistance * 0.1);
                const targetOpacity = Math.max(0, 1 - absDistance * 0.2);

                const duration = animate ? 0.3 : 0;

                gsap.to(slide.original.position, {
                    duration: duration,
                    x: targetX,
                    z: targetZ + 0.01,
                    ease: "power2.out",
                });
                gsap.to(slide.glow.position, {
                    duration: duration,
                    x: targetX,
                    z: targetZ,
                    ease: "power2.out",
                });
                gsap.to(slide.original.scale, {
                    duration: duration,
                    x: targetScale,
                    y: targetScale,
                    ease: "power2.out",
                });
                gsap.to(slide.glow.scale, {
                    duration: duration,
                    x: targetScale,
                    y: targetScale,
                    ease: "power2.out",
                });
                gsap.to(slide.original.material, {
                    duration: duration,
                    opacity: targetOpacity,
                    ease: "power2.out",
                    onComplete: resolveSlide
                });
            });
        });

        Promise.all(updatePromises).then(() => {
            if (!isTransitioning) {
                enableGlowEffect();
            }
            resolve();
        });
    });
}


function selectSlide(index) {
    return new Promise((resolve) => {
        const selectedSlide = slides[index];
        const centerX = 0;
        const offset = centerX - selectedSlide.original.position.x;

        // すべてのスライドのグロー効果を即座に非表示にする
        slides.forEach((slide) => {
            slide.glow.visible = false;
        });

        slides.forEach((slide, i) => {
            gsap.to(slide.original.position, {
                duration: 0.5,
                x: slide.original.position.x + offset,
                ease: "power2.out",
            });
            gsap.to(slide.glow.position, {
                duration: 0.5,
                x: slide.glow.position.x + offset,
                ease: "power2.out",
            });
        });

        gsap.to(selectedSlide.original.position, {
            duration: 0.5,
            z: 2,
            ease: "power2.out",
        });
        gsap.to(selectedSlide.original.scale, {
            duration: 0.5,
            x: 1.12,
            y: 1.12,
            ease: "power2.out",
        });

        slides.forEach((slide, i) => {
            if (i !== index) {
                gsap.to(slide.original.position, {
                    duration: 0.5,
                    z: -2,
                    ease: "power2.out",
                });
                gsap.to(slide.original.scale, {
                    duration: 0.5,
                    x: 0.4,
                    y: 0.4,
                    ease: "power2.out",
                });
                gsap.to(slide.original.material, {
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
    const clickX = event.clientX - rect.left;
    const containerWidth = rect.width;

    // 有効なクリック範囲を制限（マウス移動と同じマージンを使用）
    const margin = containerWidth * 0.1;
    const effectiveWidth = containerWidth - 2 * margin;

    // クリック位置を0から1の範囲に正規化（マージンを考慮）
    let normalizedX = (clickX - margin) / effectiveWidth;
    normalizedX = Math.max(0, Math.min(1, normalizedX)); // 0から1の範囲に制限

    // 正規化された位置をスライドインデックスに変換
    const clickedIndex = Math.round((slides.length - 1) * normalizedX);

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
        isTransitioning = true;
        // すべてのスライドのグロー効果を非表示にする
        slides.forEach((slide) => {
            slide.glow.visible = false;
        });

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

        // まず並列に戻す
        const parallelPromises = slides.map((slide) => {
            return new Promise((resolveSlide) => {
                gsap.to(slide.original.position, {
                    duration: 0.5,
                    z: 0,
                    ease: "power2.out",
                });
                gsap.to(slide.original.scale, {
                    duration: 0.5,
                    x: 0.8,
                    y: 0.8,
                    ease: "power2.out",
                });
                gsap.to(slide.original.material, {
                    duration: 0.5,
                    opacity: 1,
                    ease: "power2.out",
                    onComplete: resolveSlide
                });
            });
        });

        // 並列に戻った後、前後の並びにする
        Promise.all(parallelPromises).then(() => {
            updateSlidesPosition(currentIndex, true).then(() => {
                isTransitioning = false;
                enableGlowEffect();
                resolve();
            });
        });
    });
}

function enableGlowEffect() {
    if (isTransitioning) return;

    const centerIndex = Math.round(currentIndex);
    slides.forEach((slide, i) => {
        const distance = i - centerIndex;
        const absDistance = Math.abs(distance);
        if (absDistance < 0.1) {
            slide.glow.visible = true;
            gsap.to(slide.glow.material.uniforms.glowStrength, {
                duration: 0.3,
                value: 4.5,
                ease: "power2.out",
            });
        } else {
            slide.glow.visible = false;
        }
    });
}


    // 公開するメソッド
    return {
        init: initProject5Slider
    };
})();

// ロード時にスライダーを初期化
window.addEventListener('load', Project5Slider.init);




