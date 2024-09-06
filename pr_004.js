// pr_004.js

(function() {
    const images = ['s4_a1.webp', 's4_a2.webp', 's4_a3.webp'];
    const verticalImages = ['s4_a1.webp', 's4_a2.webp', 's4_a3.webp'];
    let currentImageIndex = 0;
    let textures = [];
    let dispTexture;
    let isPlaying = true;
    let changeImageTimeout;
    let animationInProgress = false;
    let currentAnimation = null;
    let pausedTime = 0;

    
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
        uniform float scrollPosition;
        uniform float nextScrollPosition;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            if (uv.y > 0.9375) {  // 15/16 = 0.9375
                uv.y = 0.9375;
            }
            vec2 uv1 = vec2(uv.x, mod(uv.y + scrollPosition, 1.0));
            vec2 uv2 = vec2(uv.x, mod(uv.y + nextScrollPosition, 1.0));
            
            vec4 disp = texture2D(disp, uv);
            vec2 distortedPosition1 = vec2(uv1.x, uv1.y + dispFactor * (disp.r*effectFactor));
            vec2 distortedPosition2 = vec2(uv2.x, uv2.y - (1.0 - dispFactor) * (disp.r*effectFactor));
            vec4 _texture1 = texture2D(texture1, distortedPosition1);
            vec4 _texture2 = texture2D(texture2, distortedPosition2);
            gl_FragColor = mix(_texture1, _texture2, dispFactor);
        }
    `;



function centerPageElements() {
    const wrapper = document.getElementById('project4-image-wrapper');
    if (!wrapper) return;

    const counter = document.querySelector('#project-4 .page-counter');
    const navigation = document.querySelector('#project-4 .page-navigation');
    const nextButtons = document.querySelectorAll('#project-4 .next-button-left, #project-4 .next-button-right');

    const wrapperWidth = wrapper.offsetWidth;
    const wrapperHeight = wrapper.offsetHeight;

    if (counter) {
        const shouldShowCounter = wrapperWidth >= 400;
        counter.style.display = shouldShowCounter ? 'block' : 'none';
        if (shouldShowCounter) {
            const scale = Math.max(0.3, Math.min(0.7, wrapperWidth / 1000));
            counter.style.transform = `translateX(-50%) scale(${scale})`;
        }
    }

    if (navigation) {
        const shouldShowNavigation = wrapperWidth >= 500;
        navigation.style.display = shouldShowNavigation ? 'flex' : 'none';
    }

function centerPageElements() {
    const wrapper = document.getElementById('project4-image-wrapper');
    if (!wrapper) return;

    const counter = document.querySelector('#project4 .page-counter');
    const navigation = document.querySelector('#project4 .page-navigation');
    const nextButtons = document.querySelectorAll('#project-4 .next-button-left, #project-4 .next-button-right');

    const wrapperWidth = wrapper.offsetWidth;

    if (counter) {
        const shouldShowCounter = wrapperWidth >= 400;
        counter.style.display = shouldShowCounter ? 'block' : 'none';
        if (shouldShowCounter) {
            const scale = Math.max(0.4, Math.min(0.6, wrapperWidth / 1000));
            counter.style.transform = `translateX(-50%) scale(${scale})`;
        }
    }

    if (navigation) {
        const shouldShowNavigation = wrapperWidth >= 500;
        navigation.style.display = shouldShowNavigation ? 'flex' : 'none';
    }

    nextButtons.forEach(button => {
        const shouldShowButton = wrapperWidth >= 300;
        button.style.display = shouldShowButton ? 'block' : 'none';
        
        if (shouldShowButton) {
            const isLeftButton = button.classList.contains('next-button-left');
            const minOffset = 20;
            const maxOffset = 75;
            const dynamicOffset = Math.max(minOffset, Math.min(maxOffset, wrapperWidth * 0.075));
            
            if (isLeftButton) {
                button.style.left = `${dynamicOffset}px`;
            } else {
                button.style.right = `${dynamicOffset}px`;
            }
        }
    });

    if (navigation) {
        const navItems = navigation.querySelectorAll('.page-nav-item');
        navItems.forEach((item, index) => {
            if (index === currentImageIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

    if (navigation) {
        const navItems = navigation.querySelectorAll('.page-nav-item');
        navItems.forEach((item, index) => {
            if (index === currentImageIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}


    function updateRendererSize() {
        const imageWrapper = document.getElementById('project4-image-wrapper');
        if (!imageWrapper || !renderer) return;

        const wrapperWidth = imageWrapper.offsetWidth;
        const wrapperHeight = imageWrapper.offsetHeight;
        const currentImage = images[currentImageIndex];
        const isVertical = verticalImages.includes(currentImage);
        
        let width, height;
        if (isVertical) {
            const imageAspectRatio = 12 / 16;
            width = wrapperWidth;
            height = width / imageAspectRatio;
        } else {
            const imageAspectRatio = 16 / 10;
            width = wrapperWidth;
            height = width / imageAspectRatio;
        }
        
        renderer.setSize(width, wrapperHeight);
        renderer.domElement.style.left = '50%';
        renderer.domElement.style.transform = 'translateX(-50%)';

        const aspect = width / wrapperHeight;
        if (isVertical) {
            camera.left = -1;
            camera.right = 1;
            camera.top = 1 / aspect;
            camera.bottom = -1 / aspect;
        } else {
            camera.left = -aspect;
            camera.right = aspect;
            camera.top = 1;
            camera.bottom = -1;
        }
        camera.updateProjectionMatrix();

        if (mesh) {
            if (isVertical) {
                mesh.scale.set(1, height / wrapperHeight, 1);
            } else {
                mesh.scale.set(aspect, 1, 1);
            }
        }
        
        centerPageElements();
    }
    
function init() {
    const imageWrapper = document.getElementById('project4-image-wrapper');
    if (!imageWrapper) {
        return;
    }

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        
        updateRendererSize();
        imageWrapper.appendChild(renderer.domElement);

        geometry = new THREE.PlaneBufferGeometry(2, 2);

        loadTextures();
            animateUI(); // UIのアニメーションを即座に開始


        const playbackToggle = document.getElementById('playbackToggle');
        if (playbackToggle) {
            playbackToggle.addEventListener('click', function(event) {
                event.stopPropagation();
                togglePlayback();
            });
        }
        
        imageWrapper.addEventListener('click', togglePlayback);
        animateUI(); 

        centerPageElements();
    }
    
    function loadTextures() {
        const loader = new THREE.TextureLoader();
        Promise.all(images.map(img => new Promise(resolve => {
            const path = `assets/pr_4/webp/${img}`;
            loader.load(path, texture => {
                resolve(texture);
            }, undefined, error => {
                resolve(null);
            });
        }))).then(loadedTextures => {
            textures = loadedTextures.filter(t => t !== null);
            loader.load('assets/pr_4/1.webp',
                texture => {
                    dispTexture = texture;
                    createMaterial();
                },
                undefined,
                error => {}
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
                disp: { type: "t", value: dispTexture },
                scrollPosition: { type: "f", value: 0 },
                nextScrollPosition: { type: "f", value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            opacity: 1.0
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        updateRendererSize();

        animate();
        changeImage();
        animateUI();
            changeImage(); // 初期化時に即座にchangeImage()を呼び出す

    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    function changeImage() {
        if (!isPlaying || animationInProgress) return;

        const nextImageIndex = (currentImageIndex + 1) % textures.length;
        const currentImage = images[currentImageIndex];
        const nextImage = images[nextImageIndex];
        const isCurrentVertical = verticalImages.includes(currentImage);
        const isNextVertical = verticalImages.includes(nextImage);

        animationInProgress = true;

        if (isCurrentVertical) {
            currentAnimation = scrollCurrentImage(() => {
                prepareNextImage(nextImageIndex, isNextVertical, () => {
                    performTransition(nextImageIndex, isNextVertical);
                });
            });
        } else {
            prepareNextImage(nextImageIndex, isNextVertical, () => {
                performTransition(nextImageIndex, isNextVertical);
            });
        }
    }

   function scrollCurrentImage(callback) {
        return gsap.to(material.uniforms.scrollPosition, {
            value: 0.375,
            duration: 3.2,
            ease: "power2.inOut",
            onUpdate: updateRendererSize,
            onComplete: () => {
                animationInProgress = false;
                callback();
            }
        });
    }

    function prepareNextImage(nextImageIndex, isVertical, callback) {
        material.uniforms.texture2.value = textures[nextImageIndex];
        material.uniforms.dispFactor.value = 0;

        if (isVertical) {
            material.uniforms.nextScrollPosition.value = -0.375;
        } else {
            material.uniforms.nextScrollPosition.value = 0;
        }

        setTimeout(callback, 50);
    }

    function performTransition(nextImageIndex, isVertical) {
        currentAnimation = gsap.to(material.uniforms.dispFactor, {
            value: 1,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: updateRendererSize,
            onComplete: () => {
                currentImageIndex = nextImageIndex;
                material.uniforms.texture1.value = textures[currentImageIndex];
                material.uniforms.dispFactor.value = 0;
                material.uniforms.scrollPosition.value = material.uniforms.nextScrollPosition.value;

                updatePageNavigation(currentImageIndex + 1);

                if (isVertical) {
                    scrollNextImage();
                } else {
                    animationInProgress = false;
                    if (isPlaying) {
                        changeImageTimeout = setTimeout(changeImage, 1000);
                    }
                }
            }
        });
    }

    function updatePageNavigation(currentPage) {
        const navItems = document.querySelectorAll('#project-4 .page-nav-item');
        navItems.forEach(item => {
            if (parseInt(item.getAttribute('data-page')) === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        const counter = document.querySelector('#project-4 .page-counter');
        if (counter) {
            counter.setAttribute('data-page', currentPage.toString());
        }
    }
    
    


    function scrollNextImage() {
        currentAnimation = gsap.to(material.uniforms.scrollPosition, {
            value: 0,
            duration: 3.2,
            ease: "power2.inOut",
            onUpdate: updateRendererSize,
            onComplete: () => {
                animationInProgress = false;
                if (isPlaying) {
                    changeImageTimeout = setTimeout(changeImage, 10);
                }
            }
        });
    }

    function updatePageNavigation(currentPage) {
        const navItems = document.querySelectorAll('#project-4 .page-nav-item');
        navItems.forEach(item => {
            if (parseInt(item.getAttribute('data-page')) === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        const counter = document.querySelector('#project-4 .page-counter');
        if (counter) {
            counter.setAttribute('data-page', currentPage.toString());
        }
    }

    function togglePlayback() {
        isPlaying = !isPlaying;
        const playbackToggle = document.getElementById('playbackToggle');
        if (playbackToggle) {
            if (isPlaying) {
                playbackToggle.classList.remove('stop-button');
                playbackToggle.classList.add('play-button');
                if (currentAnimation) {
                    currentAnimation.resume();
                } else if (!animationInProgress) {
                    changeImage();
                }
            } else {
                playbackToggle.classList.remove('play-button');
                playbackToggle.classList.add('stop-button');
                clearTimeout(changeImageTimeout);
                if (currentAnimation) {
                    currentAnimation.pause();
                    pausedTime = currentAnimation.time();
                }
            }
        }
    }
    
    
        function resumeAnimation() {
        if (currentAnimation) {
            currentAnimation.resume();
        } else if (!animationInProgress) {
            changeImage();
        }
    }
    

    function animateUI() {
        const uiElements = document.querySelectorAll('#project-4 .ui-element');
        uiElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                element.style.opacity = '1';
            }, 500);
        });
    }

    init();

    window.addEventListener('resize', updateRendererSize);
    window.addEventListener('resize', centerPageElements);
    window.addEventListener('load', centerPageElements);
    
    window.togglePlayback = togglePlayback;
})();
                    
                    
                    
                    