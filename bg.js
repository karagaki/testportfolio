const THREE = window.THREE;
const gsap = window.gsap;

const TOTAL_IMAGES = 28;
const IMAGE_DURATION = 1000;
const MAX_BLUR = 160;
const MAX_SATURATION = 5.1;
const MAX_BRIGHTNESS = 1.5;
const TRANSITION_DURATION = 1.1;

// Variables
let scene, camera, renderer, geometry, material, mesh;
let imageTextures = [];
let currentSequence = [];
let currentIndex = 0;
let projects, backgrounds, backgroundCanvas, blurOverlay;
let currentBackgroundIndex = -1;
let blurStartThreshold, blurEndThreshold, transitionEnd;
let isTransitioning = false;
let renderRequested = false;

const uniforms = {
  intensity: { type: "f", value: 0.6 },
  dispFactor: { type: "f", value: 0.0 },
  textureA: { type: "t", value: null },
  textureB: { type: "t", value: null },
  dispMap: { type: "t", value: null },
  chromaticAberration: { type: "f", value: 0.0 },
  aberrationR: { type: "v2", value: new THREE.Vector2(1, 0) },
  aberrationG: { type: "v2", value: new THREE.Vector2(0, 0) },
  aberrationB: { type: "v2", value: new THREE.Vector2(-1, 0) },
  colorR: { type: "v3", value: new THREE.Vector3(1, 0, 0) },
  colorG: { type: "v3", value: new THREE.Vector3(0, 1, 0) },
  colorB: { type: "v3", value: new THREE.Vector3(0, 0, 1) },
};

// Background colors
const backgroundColors = [
  "rgba(240, 240, 240, 1)",
  "rgba(0, 0, 0, 1)",
  "rgba(103, 73, 67, 0.963)",
  "rgba(174, 36, 31, 1)",
  "rgba(70, 29, 73, 1)",
  "rgb(38, 57, 32)",
  "rgba(10, 156, 3, 1)",
  "rgba(186, 199, 255, 1)",
  "rgba(148, 148, 148, 1)",
  "rgba(234, 121, 46, 0.072)",
  "rgba(131, 131, 131, 0.562)",
  "rgba(202, 167, 134, 1)",
];

// Shaders
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  backgroundCanvas.appendChild(renderer.domElement);

  geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    opacity: 1.0,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return loadTextures();
}

function loadTextures() {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    const loadPromises = [];

    for (let i = 1; i <= TOTAL_IMAGES; i++) {
      const fileName = `bg${i.toString().padStart(2, "0")}.webp`;
      const filePath = `assets/top_background/webp/${fileName}`;

      loadPromises.push(
        new Promise((resolve) => {
          loader.load(
            filePath,
            (texture) => {
              imageTextures[i - 1] = texture;
              resolve();
            },
            undefined,
            () => resolve() // Continue even on error
          );
        })
      );
    }

    Promise.all(loadPromises).then(() => {
      imageTextures = imageTextures.filter((texture) => texture !== undefined);
      if (imageTextures.length > 0) {
        initializeSequences();
        initMaterial();
        startImageTransition();
        resolve();
      } else {
        reject(new Error("Failed to load textures."));
      }
    });
  });
}

function startImageTransition() {
  if (!material || !material.uniforms) return;

  const nextIndex = (currentIndex + 1) % TOTAL_IMAGES;

  material.uniforms.dispMap.value = imageTextures[currentSequence[nextIndex]];
  material.uniforms.textureA.value =
    imageTextures[currentSequence[currentIndex]];
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
    ease: "power2.inOut",
  });

  gsap.to(material.uniforms.dispFactor, {
    value: 1,
    duration: 1.0,
    ease: "power2.inOut",
    onUpdate: requestRender,
    onComplete: () => {
      material.uniforms.textureA.value = material.uniforms.textureB.value;
      material.uniforms.dispFactor.value = 0;

      currentIndex = nextIndex;

      gsap.to(material.uniforms.chromaticAberration, {
        value: 0,
        duration: 1.0,
        ease: "power2.inOut",
        onUpdate: requestRender,
        onComplete: () => {
          setTimeout(startImageTransition, IMAGE_DURATION);
        },
      });
    },
  });
}

function animateTopBackground() {
  if (!renderRequested) return;

  renderRequested = false;

  const rect = renderer.domElement.getBoundingClientRect();
  if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animateTopBackground);
}

function requestRender() {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(animateTopBackground);
  }
}

function enableGPUAcceleration() {
  const elements = document.querySelectorAll(
    ".section-background, #background-canvas, #blur-overlay"
  );
  elements.forEach((el) => {
    el.style.transform = "translateZ(0)";
    el.style.willChange = "transform, opacity";
  });
}

function updateBlurThresholds() {
  blurStartThreshold = window.innerHeight * 0.2;
  blurEndThreshold = window.innerHeight * 0.8;
  transitionEnd = window.innerHeight * 1.2;
}

function updateBlurEffect(scrollPosition) {
  if (isTransitioning) return;

  let blurAmount = 0;
  let saturationAmount = 1;
  let brightnessAmount = 1;

  if (
    scrollPosition > blurStartThreshold &&
    scrollPosition <= blurEndThreshold
  ) {
    const progress = easeInOutQuad(
      (scrollPosition - blurStartThreshold) /
        (blurEndThreshold - blurStartThreshold)
    );
    blurAmount = progress * MAX_BLUR;
    saturationAmount = 1 + progress * (MAX_SATURATION - 1);
    brightnessAmount = 1 + progress * (MAX_BRIGHTNESS - 1);
  } else if (scrollPosition > blurEndThreshold) {
    blurAmount = MAX_BLUR;
    saturationAmount = MAX_SATURATION;
    brightnessAmount = MAX_BRIGHTNESS;
  }

  requestAnimationFrame(() => {
    const filterValue = `blur(${blurAmount.toFixed(2)}px)`;
    blurOverlay.style.backdropFilter = filterValue;
    blurOverlay.style.webkitBackdropFilter = filterValue;

    if (backgroundCanvas) {
      backgroundCanvas.style.filter = `saturate(${saturationAmount.toFixed(
        2
      )}) brightness(${brightnessAmount.toFixed(2)})`;
    }
  });
}

function initProjectBackgrounds() {
  backgrounds.forEach((bg, index) => {
    bg.style.backgroundColor = backgroundColors[index];
    bg.style.opacity = 0;
  });
}

function updateProjectBackground(newIndex) {
  if (newIndex === currentBackgroundIndex || isTransitioning) return;

  isTransitioning = true;

  const currentBg =
    currentBackgroundIndex >= 0 ? backgrounds[currentBackgroundIndex] : null;
  const newBg = newIndex >= 0 ? backgrounds[newIndex] : null;

  const transitionDuration = TRANSITION_DURATION * 1000;

  if (newIndex === -1 || newIndex === 10) {
    gsap.to(backgroundCanvas, {
      opacity: 1,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: requestRender,
      onComplete: () => {
        isTransitioning = false;
        requestRender();
      },
    });
    if (currentBg) {
      gsap.to(currentBg, {
        opacity: 0,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
        onUpdate: requestRender,
      });
    }
  } else {
    gsap.to(backgroundCanvas, {
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: requestRender,
    });

    if (currentBg && currentBg !== newBg) {
      gsap.to(currentBg, {
        opacity: 0,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
        onUpdate: requestRender,
      });
    }

    gsap.to(newBg, {
      opacity: 1,
      duration: TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: requestRender,
      onComplete: () => {
        isTransitioning = false;
        requestRender();
      },
    });
  }

  currentBackgroundIndex = newIndex;

  setTimeout(() => {
    isTransitioning = false;
  }, transitionDuration);
}

function changeProjectBackground(scrollPosition) {
  const windowHeight = window.innerHeight;

  if (scrollPosition < windowHeight * 0.5) {
    updateProjectBackground(-1);
    return;
  }

  projects.forEach((project, index) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateProjectBackground(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(project);
  });
}

function onWindowResize() {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateBlurThresholds();
    changeProjectBackground(window.scrollY);
    requestRender();
  }
}

function onScroll() {
  const scrollPosition = window.scrollY;
  requestAnimationFrame(() => {
    updateBlurEffect(scrollPosition);
    changeProjectBackground(scrollPosition);
  });
}

function initBackgroundEffect() {
  projects = document.querySelectorAll(".feature");
  backgrounds = document.querySelectorAll(".section-background");
  backgroundCanvas = document.getElementById("background-canvas");
  blurOverlay = document.getElementById("blur-overlay");

  enableGPUAcceleration();

  if (!backgroundCanvas || !blurOverlay) {
    console.error("Required DOM elements not found");
    return;
  }

  if (backgroundCanvas) {
    backgroundCanvas.style.transition = "filter 0.3s ease";
  }

  initTopBackground()
    .then(() => {
      animateTopBackground();
      initProjectBackgrounds();
      updateBlurThresholds();

      onScroll();

      window.addEventListener("scroll", throttle(onScroll, 16), {
        passive: true,
      });

      window.addEventListener("resize", debounce(onWindowResize, 250));
    })
    .catch((error) => {
      console.error("Failed to initialize top background:", error);
    });
}

// Utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateSequence() {
  let sequence = Array.from({ length: TOTAL_IMAGES }, (_, i) => i);
  shuffleArray(sequence);
  return sequence;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function initializeSequences() {
  currentSequence = generateSequence();
}

function initMaterial() {
  if (material && material.uniforms) {
    material.uniforms.textureA.value =
      imageTextures[currentSequence[currentIndex]];
    material.uniforms.textureB.value =
      imageTextures[currentSequence[(currentIndex + 1) % TOTAL_IMAGES]];
    material.uniforms.dispMap.value = new THREE.TextureLoader().load(
      "assets/displacement/5.jpg",
      requestRender
    );
  }
}

function logDebugInfo() {
  console.log("Debug Info:");
  console.log("Scroll position:", window.scrollY);
  console.log("Blur start threshold:", blurStartThreshold);
  console.log("Blur end threshold:", blurEndThreshold);
  console.log("Transition end:", transitionEnd);
  console.log("Blur overlay style:", blurOverlay.style.backdropFilter);
  console.log(
    "Computed style:",
    window.getComputedStyle(blurOverlay).backdropFilter
  );
}

// Export the initialization function
window.initBackgroundEffect = initBackgroundEffect;

// Debug logging (comment out in production)
// setInterval(logDebugInfo, 5000);

// Set up event listeners
const throttledScroll = throttle(onScroll, 16); // Approximately 60fps
window.addEventListener("scroll", throttledScroll, { passive: true });
window.addEventListener("resize", debounce(onWindowResize, 250));
