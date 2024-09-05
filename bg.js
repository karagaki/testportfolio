// Combined Background Effects Script

// Importing necessary libraries (assuming they're available globally)
const THREE = window.THREE;
const gsap = window.gsap;

// Constants
const TOTAL_IMAGES = 28;
const IMAGE_DURATION = 1;
const MAX_BLUR = 160;
const MAX_SATURATION = 3.1;
const TRANSITION_DURATION = 1.1;
const SCROLL_THRESHOLD = 1.1;

// Variables
let scene, camera, renderer, geometry, material, mesh;
let imageTextures = [];
let currentSequence = [];
let currentIndex = 0;

// DOM Elements
let projects, backgrounds, backgroundCanvas, blurOverlay;
let currentBackgroundIndex = -1;

let blurStartThreshold, blurEndThreshold, transitionEnd;

// Uniforms for shader
let uniforms = {
    intensity: { type: 'f', value: 0.6 },
    dispFactor: { type: 'f', value: 0.0 },
    textureA: { type: 't', value: null },
    textureB: { type: 't', value: null },
    dispMap: { type: 't', value: null },
    chromaticAberration: { type: 'f', value: 0.0 },
    aberrationR: { type: 'v2', value: new THREE.Vector2(1, 0) },
    aberrationG: { type: 'v2', value: new THREE.Vector2(0, 0) },
    aberrationB: { type: 'v2', value: new THREE.Vector2(-1, 0) },
    colorR: { type: 'v3', value: new THREE.Vector3(1, 0, 0) },
    colorG: { type: 'v3', value: new THREE.Vector3(0, 1, 0) },
    colorB: { type: 'v3', value: new THREE.Vector3(0, 0, 1) }
};

// Background colors
const backgroundColors = [
    "rgba(240, 240, 240, 1)",
    "rgba(0, 0, 0, 1)",
    "rgba(103, 73, 67, 0.963)",
    "rgba(176, 42, 42, 1)",
    "rgba(70, 29, 73, 1)",
    "rgb(38, 57, 32)",
    "rgba(10, 156, 3, 1)",
    "rgba(186, 199, 255, 1)",
    "rgba(148, 148, 148, 1)",
    "rgba(234, 121, 46, 0.072)",
    "rgba(131, 131, 131, 0.562)",
];

// Shaders
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D textureA;
    uniform sampler2D textureB;
    uniform sampler2D dispMap;
    uniform float dispFactor;
    uniform float intensity;
    uniform float chromaticAberration;
    uniform vec2 aberrationR;
    uniform vec2 aberrationG;
    uniform vec2 aberrationB;
    uniform vec3 colorR;
    uniform vec3 colorG;
    uniform vec3 colorB;

    void main() {
        vec2 uv = vUv;
        
        vec4 dispVec = texture(dispMap, uv);
        vec2 distortedPosition1 = vec2(uv.x + dispFactor * (dispVec.r*intensity), uv.y);
        vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (dispVec.r*intensity), uv.y);

        vec4 _texture1R = texture(textureA, distortedPosition1 + chromaticAberration * aberrationR);
        vec4 _texture1G = texture(textureA, distortedPosition1 + chromaticAberration * aberrationG);
        vec4 _texture1B = texture(textureA, distortedPosition1 + chromaticAberration * aberrationB);
        
        vec4 _texture2R = texture(textureB, distortedPosition2 + chromaticAberration * aberrationR);
        vec4 _texture2G = texture(textureB, distortedPosition2 + chromaticAberration * aberrationG);
        vec4 _texture2B = texture(textureB, distortedPosition2 + chromaticAberration * aberrationB);
        
        vec4 _texture1 = vec4(
            dot(_texture1R.rgb, colorR),
            dot(_texture1G.rgb, colorG),
            dot(_texture1B.rgb, colorB),
            _texture1G.a
        );
        
        vec4 _texture2 = vec4(
            dot(_texture2R.rgb, colorR),
            dot(_texture2G.rgb, colorG),
            dot(_texture2B.rgb, colorB),
            _texture2G.a
        );

        gl_FragColor = mix(_texture1, _texture2, dispFactor);
    }
`;

function initTopBackground() {
    try {
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (!backgroundCanvas) {
            throw new Error("backgroundCanvas is not found");
        }
        backgroundCanvas.appendChild(renderer.domElement);

        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            opacity: 1.0
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        console.log("Three.js scene initialized successfully");
        return loadTextures(); // Promise を返す
    } catch (error) {
        console.error("Error in initTopBackground:", error);
        return Promise.reject(error);
    }
    console.log("Renderer size:", renderer.domElement.width, renderer.domElement.height);
console.log("Renderer position:", renderer.domElement.style.position);
}



function loadTextures() {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        const loadPromises = [];

        for (let i = 1; i <= TOTAL_IMAGES; i++) {
            const fileName = `bg${i.toString().padStart(2, '0')}.webp`;
            const filePath = `assets/top_background/webp/${fileName}`;
            
            const promise = new Promise((resolve) => {
                loader.load(
                    filePath,
                    (texture) => {
                        console.log(`Texture loaded: ${filePath}`);
                        imageTextures[i - 1] = texture;
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.error(`Failed to load texture: ${filePath}`, error);
                        resolve();
                    }
                );
            });
            loadPromises.push(promise);
        }

        Promise.all(loadPromises).then(() => {
            const loadedTextures = imageTextures.filter(texture => texture !== undefined);
            if (loadedTextures.length > 0) {
                console.log(`Successfully loaded ${loadedTextures.length} textures`);
                imageTextures = loadedTextures;
                initializeSequences();
                initMaterial();
                startImageTransition();
                resolve();
            } else {
                console.error('No textures were successfully loaded.');
                reject(new Error('No textures loaded'));
            }
        });
    });
}


function startImageTransition() {
    if (material && material.uniforms) {
        const nextIndex = (currentIndex + 1) % TOTAL_IMAGES;
        
        material.uniforms.dispMap.value = imageTextures[currentSequence[nextIndex]];
        material.uniforms.textureA.value = imageTextures[currentSequence[currentIndex]];
        material.uniforms.textureB.value = imageTextures[currentSequence[nextIndex]];

        material.uniforms.aberrationR.value.set(2.6, 0);
        material.uniforms.aberrationG.value.set(0, -2.3);
        material.uniforms.aberrationB.value.set(-2.6, 0);

        material.uniforms.colorR.value.set(1, 0, 0);
        material.uniforms.colorG.value.set(0, 1, 0);
        material.uniforms.colorB.value.set(0, 0, 1);
        
        gsap.to(material.uniforms.chromaticAberration, {
            value: 0.003,
            duration: 1.0,
            ease: "power2.inOut"
        });

        gsap.to(material.uniforms.dispFactor, {
            value: 1,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
                material.uniforms.textureA.value = material.uniforms.textureB.value;
                material.uniforms.dispFactor.value = 0;
                
                currentIndex = nextIndex;

                gsap.to(material.uniforms.chromaticAberration, {
                    value: 0,
                    duration: 1.0,
                    ease: "power2.inOut",
                    onComplete: () => {
                        setTimeout(() => {
                            startImageTransition();
                        }, IMAGE_DURATION * 1000 - 2000);
                    }
                });
            }
        });
    }
}

function animateTopBackground() {
    requestAnimationFrame(animateTopBackground);
    renderer.render(scene, camera);
}

function updateBlurThresholds() {
    blurStartThreshold = window.innerHeight * 0.2;
    blurEndThreshold = window.innerHeight * 0.8;
    transitionEnd = window.innerHeight * 1.2;
    console.log('Updated blur thresholds:', { blurStartThreshold, blurEndThreshold, transitionEnd });
}





function updateBlurEffect(scrollPosition) {
    console.log('Updating blur effect. Scroll position:', scrollPosition);
    
    let blurAmount = 0;
    let saturationAmount = 1;

    if (scrollPosition > blurStartThreshold && scrollPosition <= blurEndThreshold) {
        const progress = easeInOutQuad((scrollPosition - blurStartThreshold) / (blurEndThreshold - blurStartThreshold));
        blurAmount = progress * MAX_BLUR;
        saturationAmount = 1 + progress * (MAX_SATURATION - 1);
    } else if (scrollPosition > blurEndThreshold && scrollPosition <= transitionEnd) {
        const progress = easeInOutQuad((scrollPosition - blurEndThreshold) / (transitionEnd - blurEndThreshold));
        blurAmount = MAX_BLUR * (1 - progress);
        saturationAmount = MAX_SATURATION * (1 - progress) + 1 * progress;
    }

    console.log('Calculated blur amount:', blurAmount, 'Saturation amount:', saturationAmount);

    if (blurOverlay) {
        const filterValue = `blur(${blurAmount.toFixed(2)}px) saturate(${saturationAmount.toFixed(2)})`;
        console.log('Applying filter:', filterValue);
        blurOverlay.style.backdropFilter = filterValue;
        blurOverlay.style.webkitBackdropFilter = filterValue; // For Safari support
        
        // Force a repaint to ensure the filter is applied
        blurOverlay.style.transform = 'translateZ(0)';
        
        console.log('Applied filter style:', blurOverlay.style.backdropFilter);
    } else {
        console.error('blurOverlay element not found');
    }
}


function initProjectBackgrounds() {
    backgrounds.forEach((bg, index) => {
        bg.style.backgroundColor = backgroundColors[index];
        bg.style.opacity = 0;
    });
}


function updateProjectBackground(newIndex) {
    if (newIndex === currentBackgroundIndex) return;

    console.log('Updating project background to index:', newIndex);

    const currentBg = currentBackgroundIndex >= 0 ? backgrounds[currentBackgroundIndex] : null;
    const newBg = newIndex >= 0 ? backgrounds[newIndex] : null;

    if (newIndex === -1) {
        // Switch to TOP background
        gsap.to(backgroundCanvas, {
            opacity: 1,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
        });
        if (currentBg) {
            gsap.to(currentBg, {
                opacity: 0,
                duration: TRANSITION_DURATION,
                ease: "power2.inOut",
            });
        }
    } else {
        // Switch to project background
        gsap.to(backgroundCanvas, {
            opacity: 0,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
        });

        if (currentBg && currentBg !== newBg) {
            gsap.to(currentBg, {
                opacity: 0,
                duration: TRANSITION_DURATION,
                ease: "power2.inOut",
            });
        }

        gsap.to(newBg, {
            opacity: 1,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
            onComplete: () => {
                console.log('Background transition complete. New background opacity:', newBg.style.opacity);
            }
        });
    }

    currentBackgroundIndex = newIndex;
}





function logCurrentState() {
    console.log('Current state:');
    console.log('Scroll position:', window.scrollY);
    console.log('Current background index:', currentBackgroundIndex);
    console.log('Blur overlay filter:', blurOverlay.style.filter);
    if (currentBackgroundIndex >= 0) {
        console.log('Current background opacity:', backgrounds[currentBackgroundIndex].style.opacity);
    }
}


function changeProjectBackground(scrollPosition) {
    console.log('Changing project background. Scroll position:', scrollPosition);
    const windowHeight = window.innerHeight;

    let activeProjectIndex = -1;

    if (scrollPosition < windowHeight * 0.5) {
        updateProjectBackground(-1);
        return;
    }

    projects.forEach((project, index) => {
        const rect = project.getBoundingClientRect();
        const projectTop = rect.top + window.scrollY;
        const projectBottom = rect.bottom + window.scrollY;

        if (
            scrollPosition >= projectTop - windowHeight * 0.5 &&
            scrollPosition < projectBottom - windowHeight * 0.5
        ) {
            activeProjectIndex = index;
        }
    });

    console.log('Active project index:', activeProjectIndex);
    if (activeProjectIndex !== -1) {
        updateProjectBackground(activeProjectIndex);
    }
}



function onWindowResize() {
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateBlurThresholds();
        changeProjectBackground();
    }
}

let ticking = false;


function onScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrollPosition = window.scrollY;
            console.log('Current scroll position:', scrollPosition);
            updateBlurEffect(scrollPosition);
            changeProjectBackground(scrollPosition);
            ticking = false;
        });
        ticking = true;
    }
}


function checkElementPositions() {
    console.log('Checking element positions');
    projects.forEach((project, index) => {
        const rect = project.getBoundingClientRect();
        console.log(`Project ${index} position:`, rect.top, rect.bottom);
    });
    console.log('Blur overlay position:', blurOverlay.getBoundingClientRect());
    console.log('Background canvas position:', backgroundCanvas.getBoundingClientRect());
}



function initBackgroundEffect() {
    try {
        // Get DOM elements
        projects = document.querySelectorAll(".feature");
        backgrounds = document.querySelectorAll(".section-background");
        backgroundCanvas = document.getElementById("background-canvas");
        blurOverlay = document.getElementById('blur-overlay');

        console.log("DOM elements:", {
            projectsCount: projects.length,
            backgroundsCount: backgrounds.length,
            backgroundCanvas: backgroundCanvas,
            blurOverlay: blurOverlay
        });

        if (!backgroundCanvas || !blurOverlay) {
            throw new Error("Required DOM elements not found");
        }

        initTopBackground()
            .then(() => {
                animateTopBackground();
                initProjectBackgrounds();
                updateBlurThresholds();
                
                // Initial update of blur effect and background
                const initialScrollPosition = window.scrollY;
                console.log('Initial scroll position:', initialScrollPosition);
                updateBlurEffect(initialScrollPosition);
                changeProjectBackground(initialScrollPosition);

                // Set up event listeners
                window.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', () => {
                    onWindowResize();
                    updateBlurThresholds();
                    const currentScrollPosition = window.scrollY;
                    updateBlurEffect(currentScrollPosition);
                    changeProjectBackground(currentScrollPosition);
                    checkElementPositions();
                });

                console.log("Background effect initialized successfully");
                checkElementPositions(); // Add this line to check positions on init
            })
            .catch(error => {
                console.error("Failed to initialize top background:", error);
            });
    } catch (error) {
        console.error("Failed to initialize background effect:", error);
    }
}


function checkScrollPosition() {
    console.log('Checking scroll position');
    console.log('window.pageYOffset:', window.pageYOffset);
    console.log('window.scrollY:', window.scrollY);
    console.log('document.documentElement.scrollTop:', document.documentElement.scrollTop);
    console.log('document.body.scrollTop:', document.body.scrollTop);
    console.log('getScrollPosition():', getScrollPosition());
}






function initializeSequences() {
    currentSequence = generateSequence();
}



// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateSequence() {
    let sequence = Array.from({length: TOTAL_IMAGES}, (_, i) => i);
    shuffleArray(sequence);
    return sequence;
}


function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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

function initMaterial() {
    if (material && material.uniforms) {
        material.uniforms.textureA.value = imageTextures[currentSequence[currentIndex]];
        material.uniforms.textureB.value = imageTextures[currentSequence[(currentIndex + 1) % TOTAL_IMAGES]];
        material.uniforms.dispMap.value = new THREE.TextureLoader().load('assets/displacement/5.jpg');
    }
}

function logDebugInfo() {
    console.log('Debug Info:');
    console.log('Scroll position:', window.scrollY);
    console.log('Blur start threshold:', blurStartThreshold);
    console.log('Blur end threshold:', blurEndThreshold);
    console.log('Transition end:', transitionEnd);
    console.log('Blur overlay style:', blurOverlay.style.backdropFilter);
    console.log('Computed style:', window.getComputedStyle(blurOverlay).backdropFilter);
}



// Export the initialization function
window.initBackgroundEffect = initBackgroundEffect;

setInterval(logCurrentState, 5000);
setInterval(logDebugInfo, 5000);

// Set up event listeners
const throttledScroll = throttle(onScroll, 16); // Approximately 60fps
window.addEventListener('scroll', throttledScroll, { passive: true });
window.addEventListener('resize', onWindowResize);