// pr_002.js

(function() {
    // グローバル変数の使用を避けるため、すべての変数をこの関数のスコープ内に置きます
    const images = ['s2_a1.webp', 's2_a2.webp', 's2_a3.webp', 's2_a4.webp'];
    let currentImageIndex = 0;
    let textures = [];
    let dispTexture;
    const FIXED_HEIGHT = 615; 


    let scene, camera, renderer, geometry, material, mesh;

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform sampler2D disp;
        uniform float dispFactor;
        uniform float effectFactor;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            // ここを変更: x座標の代わりにy座標を使用
            vec4 disp = texture2D(disp, uv);
            vec2 distortedPosition1 = vec2(uv.x, uv.y + dispFactor * (disp.r*effectFactor));
            vec2 distortedPosition2 = vec2(uv.x, uv.y - (1.0 - dispFactor) * (disp.r*effectFactor));
            vec4 _texture1 = texture2D(texture1, distortedPosition1);
            vec4 _texture2 = texture2D(texture2, distortedPosition2);
            gl_FragColor = mix(_texture1, _texture2, dispFactor);
        }
    `;



    function updateRendererSize() {
        const imageWrapper = document.getElementById('project2-image-wrapper');
        if (!imageWrapper || !renderer) return;

        const wrapperWidth = imageWrapper.offsetWidth;
        const imageAspectRatio = 864 / 540; // 元の画像のアスペクト比

        let width = FIXED_HEIGHT * imageAspectRatio;
        let height = FIXED_HEIGHT;

        renderer.setSize(width, height);
        renderer.domElement.style.left = '50%';
        renderer.domElement.style.transform = 'translateX(-50%)';

        // カメラのアスペクト比も更新
        const aspect = width / height;
        camera.left = -aspect;
        camera.right = aspect;
        camera.top = 1;
        camera.bottom = -1;
        camera.updateProjectionMatrix();

        // メッシュのスケールも更新
        if (mesh) {
            mesh.scale.set(aspect, 1, 1);
        }
    }

function updateRendererPosition() {
    if (!renderer) return;

    const currentMaskPosition = images[currentImageIndex].maskPosition;
    const wrapperWidth = document.getElementById('project2-image-wrapper').offsetWidth;
    const rendererWidth = renderer.domElement.width;
    
    if (currentMaskPosition === 'left') {
        renderer.domElement.style.left = '0';
        renderer.domElement.style.transform = 'none';
    } else {
        const leftPosition = Math.max(0, (wrapperWidth - rendererWidth) / 2);
        renderer.domElement.style.left = `${leftPosition}px`;
        renderer.domElement.style.transform = 'none';
    }
}


    function init() {
        console.log('Initializing...');
        const imageWrapper = document.getElementById('project2-image-wrapper');
        if (!imageWrapper) {
            console.error('Image wrapper not found');
            return;
        }

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        
        updateRendererSize();
        imageWrapper.appendChild(renderer.domElement);

        geometry = new THREE.PlaneBufferGeometry(2, 2);

        loadTextures();
    }
    
    function loadTextures() {
        console.log('Loading textures...');
        const loader = new THREE.TextureLoader();
        Promise.all(images.map(img => new Promise(resolve => {
            loader.load(`assets/pr_2/webp/${img}`, texture => {
                console.log(`Loaded texture: ${img}`);
                resolve(texture);
            }, undefined, error => {
                console.error(`Error loading texture ${img}:`, error);
                resolve(null);
            });
        }))).then(loadedTextures => {
            textures = loadedTextures.filter(t => t !== null);
            console.log(`Loaded ${textures.length} textures`);
            loader.load('assets/pr_2/webp/1.webp', 　　　　　　　　//調整1
                texture => {
                    console.log('Loaded distortion texture');
                    dispTexture = texture;
                    createMaterial();
                },
                undefined,
                error => console.error('Error loading distortion texture:', error)
            );
        });
    }

    function createMaterial() {
        material = new THREE.ShaderMaterial({
            uniforms: {
                effectFactor: { type: "f", value: 0.1 },
                dispFactor: { type: "f", value: 0 },
                texture1: { type: "t", value: textures[0] },
                texture2: { type: "t", value: textures[1] },
                disp: { type: "t", value: dispTexture }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            opacity: 1.0
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // メッシュの初期スケールを設定
        const aspect = renderer.domElement.width / renderer.domElement.height;
        mesh.scale.set(aspect, 1, 1);

        animate();
        changeImage(); // 初期化時に即座にchangeImage()を呼び出す

    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    function changeImage() {
        const nextImageIndex = (currentImageIndex + 1) % textures.length;
        
        gsap.to(material.uniforms.dispFactor, {
            value: 1,
            duration: 3.0, 　　　　　　　　　　　　　　　　　　　　　//時間調整3
            ease: "power2.inOut",
            onUpdate: () => {
            },
            onComplete: () => {
                currentImageIndex = nextImageIndex;
                material.uniforms.texture1.value = textures[currentImageIndex];
                material.uniforms.texture2.value = textures[(currentImageIndex + 1) % textures.length];
                material.uniforms.dispFactor.value = 0;
                setTimeout(changeImage, 300);
            }
        });
    }
    
    init();

    window.addEventListener('resize', updateRendererSize);

})();