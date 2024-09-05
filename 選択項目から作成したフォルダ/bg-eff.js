const THREE = window.THREE;
const gsap = window.gsap;

let scene, camera, renderer, geometry, material, mesh;
let TOTAL_IMAGES = 28;
const IMAGE_DURATION = 1;

let imageTextures = [];
let currentSequence = [];
let nextSequence = [];
let currentIndex = 0;

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

function initializeSequences() {
    currentSequence = generateSequence();
    nextSequence = generateSequence();
    
    const lastFive = new Set(currentSequence.slice(-5));
    while (lastFive.has(nextSequence[0])) {
        shuffleArray(nextSequence);
    }
}

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
        
        // Displacement effect
        vec4 dispVec = texture(dispMap, uv);
        vec2 distortedPosition1 = vec2(uv.x + dispFactor * (dispVec.r*intensity), uv.y);
        vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (dispVec.r*intensity), uv.y);

        // Apply chromatic aberration to both textures
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

function loadTextures() {
    const loader = new THREE.TextureLoader();
    const loadPromises = [];

    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const fileName = `bg${i.toString().padStart(2, '0')}.webp`;
        const filePath = `assets/top_background/webp/${fileName}`;
        
        const promise = new Promise((resolve) => {
            loader.load(
                filePath,
                (texture) => {
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
            imageTextures = loadedTextures;
            TOTAL_IMAGES = loadedTextures.length;
            initializeSequences();
            initMaterial();
            startImageTransition();
        } else {
            console.error('No textures were successfully loaded.');
        }
    });
}

function initMaterial() {
    if (material && material.uniforms) {
        material.uniforms.textureA.value = imageTextures[currentSequence[currentIndex]];
        material.uniforms.textureB.value = imageTextures[currentSequence[(currentIndex + 1) % TOTAL_IMAGES]];
        material.uniforms.dispMap.value = new THREE.TextureLoader().load('assets/displacement/5.jpg');
    }
}

function startImageTransition() {
    if (material && material.uniforms) {
        const nextIndex = (currentIndex + 1) % TOTAL_IMAGES;
        
        material.uniforms.dispMap.value = new THREE.TextureLoader().load('assets/displacement/5.jpg');
        material.uniforms.textureA.value = imageTextures[currentSequence[currentIndex]];
        material.uniforms.textureB.value = imageTextures[currentSequence[nextIndex]];

        material.uniforms.aberrationR.value.set(1.3, 0);
        material.uniforms.aberrationG.value.set(0, -1.3);
        material.uniforms.aberrationB.value.set(-1.3, 0);

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

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.OrthographicCamera(
        -1, 1, 1, -1, 0, 1
    );
    
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('background-canvas').appendChild(renderer.domElement);

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

    loadTextures();
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
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

function initBackgroundEffect() {
    try {
        init();
        animate();
        window.addEventListener('resize', onWindowResize);
    } catch (error) {
        // Error handling
    }
}

window.initBackgroundEffect = initBackgroundEffect;