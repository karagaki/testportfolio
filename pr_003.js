// pr_003.js

(function() {
    const images = [
        { src: 's3_a1.webp', maskPosition: 'left' },
        { src: 's3_a2.webp', maskPosition: 'left' },
        { src: 's3_a3.webp', maskPosition: 'center' }
    ];

    let currentImageIndex = 0;
    let textures = [];
    let dispTexture;

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
            vec4 disp = texture2D(disp, uv);
            vec2 distortedPosition1 = vec2(uv.x, uv.y + dispFactor * (disp.r*effectFactor));
            vec2 distortedPosition2 = vec2(uv.x, uv.y - (1.0 - dispFactor) * (disp.r*effectFactor));
            vec4 _texture1 = texture2D(texture1, distortedPosition1);
            vec4 _texture2 = texture2D(texture2, distortedPosition2);
            gl_FragColor = mix(_texture1, _texture2, dispFactor);
        }
    `;

    function updateRendererSize() {
        const imageWrapper = document.getElementById('project3-image-wrapper');
        if (!imageWrapper || !renderer) return;

        const wrapperHeight = imageWrapper.offsetHeight;
        const imageAspectRatio = 16 / 10; 

        let width = wrapperHeight * imageAspectRatio;
        let height = wrapperHeight;

        renderer.setSize(width, height);

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
        
        if (currentMaskPosition === 'left') {
            renderer.domElement.style.left = '0';
            renderer.domElement.style.transform = 'none';
        } else {
            renderer.domElement.style.left = '50%';
            renderer.domElement.style.transform = 'translateX(-50%)';
        }
    }

    function init() {
        console.log('Initializing...');
        const imageWrapper = document.getElementById('project3-image-wrapper');
        if (!imageWrapper) {
            console.error('Image wrapper not found');
            return;
        }

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        
        updateRendererSize();
        updateRendererPosition();
        imageWrapper.appendChild(renderer.domElement);

        geometry = new THREE.PlaneBufferGeometry(2, 2);

        loadTextures();
    }

    function loadTextures() {
        console.log('Loading textures...');
        const loader = new THREE.TextureLoader();

        Promise.all(images.map(img => new Promise(resolve => {
            loader.load(`assets/pr_3/webp/${img.src}`, texture => {
                resolve(texture);
            }, undefined, error => {
                console.error(`Error loading texture ${img.src}:`, error);
                resolve(null);
            });
        }))).then(loadedTextures => {
            textures = loadedTextures.filter(t => t !== null);
            console.log(`Loaded ${textures.length} textures`);
            loader.load('assets/pr_3/webp/1.webp',
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
                effectFactor: { type: "f", value: 0.5 },
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
        setTimeout(changeImage, 3000);
    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    function changeImage() {
        const nextImageIndex = (currentImageIndex + 1) % textures.length;
        const currentPosition = images[currentImageIndex].maskPosition;
        const nextPosition = images[nextImageIndex].maskPosition;

        // トランジション開始前にレンダラーの位置を更新
        updateRendererPosition();

        gsap.to(material.uniforms.dispFactor, {
            value: 1,
            duration: 2.5, // トランジション時間を延長
            ease: "power2.inOut",
            onComplete: () => {
                currentImageIndex = nextImageIndex;
                material.uniforms.texture1.value = textures[currentImageIndex];
                material.uniforms.texture2.value = textures[(currentImageIndex + 1) % textures.length];
                material.uniforms.dispFactor.value = 0;

                // トランジション完了後にレンダラーの位置を更新
                updateRendererPosition();

                setTimeout(changeImage, 2000); // 次の画像切り替えまでの待機時間
            }
        });

        // マスク位置が変更される場合、レンダラーの位置をアニメーション
        if (currentPosition !== nextPosition) {
            const startLeft = currentPosition === 'left' ? '0' : '50%';
            const endLeft = nextPosition === 'left' ? '0' : '50%';
            const startTransform = currentPosition === 'left' ? 'none' : 'translateX(-50%)';
            const endTransform = nextPosition === 'left' ? 'none' : 'translateX(-50%)';

            gsap.fromTo(renderer.domElement, 
                { left: startLeft, transform: startTransform },
                { 
                    left: endLeft, 
                    transform: endTransform,
                    duration: 2.5, // トランジション時間をmaterial.uniforms.dispFactorと合わせる
                    ease: "power2.inOut"
                }
            );
        }
    }
    
    init();

    window.addEventListener('resize', () => {
        updateRendererSize();
        updateRendererPosition();
    });
})();