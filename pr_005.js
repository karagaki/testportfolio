// pr_005.js

(function (window) {
  if (window.Project5SliderInitialized) {
    console.warn(
      "Project5Slider has already been initialized. Skipping re-initialization."
    );
    return;
  }

  window.Project5SliderInitialized = true;

  if (!window.Project5Text) {
    console.error(
      "Project5Text is not initialized. Make sure pr_005_text.js is loaded before pr_005.js"
    );
    return;
  }

  const { displayTextInfo, getTextInfo, adjustLetterSpacing } =
    window.Project5Text;

  window.Project5Slider = (function () {
    let scene, camera, renderer, container;
    let whiteCircleScene, whiteCircleCamera;
    let backgroundScene, backgroundCamera;
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
    const MAX_SLIDE_WIDTH_PERCENTAGE = 0.01;
    const MAX_SLIDE_HEIGHT_PERCENTAGE = 0.04;
    const SLIDE_SPACING_FACTOR = 0.2;
    const DEPTH_STEP = 3;
    let isTransitioning = false;
    let backgroundPlane, backgroundMaterial;

    const images = [
      "s5_a1.webp",
      "s5_a2.webp",
      "s5_a3.webp",
      "s5_a4.webp",
      "s5_a5.webp",
      "s5_a6.webp",
      "s5_a7.webp",
      "s5_a8.webp",
      "s5_a9.webp",
      "s5_a10.webp",
      "s5_a11.webp",
      "s5_a12.webp",
      "s5_a13.webp",
      "s5_a14.webp",
      "s5_a15.webp",
      "s5_a16.webp",
      "s5_a17.webp",
      "s5_a18.webp",
      "s5_a19.webp",
      "s5_a20.webp",
      "s5_a21.webp",
    ];

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x202020);

      whiteCircleScene = new THREE.Scene();
      whiteCircleCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      whiteCircleCamera.position.z = 1;

      const aspect = container.clientWidth / container.clientHeight;
      camera = new THREE.PerspectiveCamera(25, aspect, 0.1, 1000);
      camera.position.z = 17;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });

      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.gammaFactor = 2.2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      container.appendChild(renderer.domElement);

      const geometry = new THREE.CircleGeometry(1, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xdfdfbd,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      whiteCircle = new THREE.Mesh(geometry, material);
      whiteCircle.scale.set(2, 0, 1);
      whiteCircle.visible = false;
      whiteCircleScene.add(whiteCircle);
      scene.add(whiteCircle);

      // 背景用の別のシーンとカメラを作成
      backgroundScene = new THREE.Scene();
      backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      backgroundMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffcc) },
          opacity: { value: 0 },
        },
        vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(color, opacity);
      }
    `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const backgroundPlaneGeometry = new THREE.PlaneGeometry(2, 2);
      backgroundPlane = new THREE.Mesh(
        backgroundPlaneGeometry,
        backgroundMaterial
      );
      backgroundScene.add(backgroundPlane);

      const blackFilterGeometry = new THREE.PlaneGeometry(2, 2);
      const blackFilterMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      });
      blackFilter = new THREE.Mesh(blackFilterGeometry, blackFilterMaterial);
      scene.add(blackFilter);

      calculateSlideDimensions();
    }

    function selectSlide(index) {
      return new Promise((resolve) => {
        isAnimating = true;
        isSelected = true;
        const selectedSlide = slides[index];
        const centerX = 0;
        const offset = centerX - selectedSlide.original.position.x;

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

        animateWhiteCircle(index).then(() => {
          gsap.to(whiteCircle.material, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
              whiteCircle.visible = false;
            },
          });
          gsap.to(backgroundPlane.material, {
            duration: 0.5,
            opacity: 0.5, // 0.8から0.5に変更
            ease: "power2.out",
            onComplete: () => {
              displayTextInfo(index);
              isAnimating = false;
              resolve();
            },
          });
        });
      });
    }

    function animateWhiteCircle(index) {
      return new Promise((resolve) => {
        whiteCircle.visible = true;
        const maskSize =
          Math.max(container.clientWidth, container.clientHeight) * 2;
        gsap.to(whiteCircle.scale, {
          duration: 1,
          x: maskSize,
          y: maskSize,
          ease: "power2.out",
          onComplete: resolve,
        });
        gsap.to(whiteCircle.material, {
          duration: 1,
          opacity: 0.9,
          ease: "power2.out",
        });
      });
    }

    function resetSlides() {
      return new Promise((resolve) => {
        isTransitioning = true;
        isSelected = false;
        isAnimating = true;

        if (window.textElement) {
          gsap.to(window.textElement, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.in",
            onComplete: () => {
              if (window.textElement) {
                window.textElement.remove();
                window.textElement = null;
              }
            },
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
          onComplete: () => {
            whiteCircle.visible = false;
          },
        });

        gsap.to(backgroundMaterial.uniforms.opacity, {
          duration: 0.5,
          value: 0,
          ease: "power2.in",
          onUpdate: () => {
            backgroundMaterial.needsUpdate = true;
          },
        });
        gsap.to(blackFilter.material, {
          duration: 0.5,
          opacity: 0,
          ease: "power2.in",
        });

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
              onComplete: resolveSlide,
            });
          });
        });

        Promise.all(parallelPromises).then(() => {
          updateSlidesPosition(currentIndex, true).then(() => {
            isTransitioning = false;
            isAnimating = false;
            enableGlowEffect();
            resolve();
          });
        });
      });
    }

    function onSlideClick(event) {
      if (isAnimating) return;

      const rect = container.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const containerWidth = rect.width;

      const margin = containerWidth * 0.1;
      const effectiveWidth = containerWidth - 2 * margin;

      let normalizedX = (clickX - margin) / effectiveWidth;
      normalizedX = Math.max(0, Math.min(1, normalizedX));

      const clickedIndex = Math.round((slides.length - 1) * normalizedX);

      if (!isSelected && clickedIndex === Math.round(currentIndex)) {
        selectSlide(clickedIndex);
      } else if (isSelected) {
        resetSlides();
      }
    }

    function onWindowResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      calculateSlideDimensions();
      updateAllSlides();

      // スライドの位置を再計算
      recalculateSlidePositions();

      if (isSelected) {
        const selectedIndex = Math.round(currentIndex);
        updateSelectedSlidePosition(selectedIndex);
      } else {
        updateSlidesPosition(currentIndex, false);
      }

      renderer.render(scene, camera);
    }

    function updateSelectedSlidePosition(index) {
      const selectedSlide = slides[index];
      const centerX = 0;
      const offset = centerX - selectedSlide.original.position.x;

      slides.forEach((slide, i) => {
        slide.original.position.x += offset;
        slide.glow.position.x += offset;

        if (i !== index) {
          slide.original.position.z = -2;
          slide.original.scale.set(0.4, 0.4, 1);
          slide.original.material.opacity = 0.1;
        } else {
          slide.original.position.z = 2;
          slide.original.scale.set(1.12, 1.12, 1);
          slide.original.material.opacity = 1;
        }
      });
    }

    function recalculateSlidePositions() {
      const totalSlides = slides.length;
      slides.forEach((slide, index) => {
        updateSlidePosition(slide.original, index, totalSlides);
        updateSlidePosition(slide.glow, index, totalSlides);
      });
    }

    function initProject5Slider() {
      if (typeof THREE === "undefined") {
        console.error(
          "THREE is not defined. Make sure Three.js is loaded before this script."
        );
        return;
      }
      if (typeof gsap === "undefined") {
        console.error(
          "GSAP is not defined. Make sure GSAP is loaded before this script."
        );
        return;
      }

      container = document.getElementById("project5-image-wrapper");
      if (!container) {
        console.error("Container element not found");
        return;
      }

      window.container = container;

      init();
      loadTextures().then(createSlides);

      window.addEventListener("resize", onWindowResize);
      container.addEventListener("mousemove", throttle(onMouseMove, 50));
      container.addEventListener("click", onSlideClick);
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

    function calculateSlideDimensions() {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const containerAspect = containerWidth / containerHeight;

      if (containerAspect > SLIDE_ASPECT_RATIO) {
        slideHeight = containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE;
        slideWidth = slideHeight * SLIDE_ASPECT_RATIO;

        if (slideWidth > containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE) {
          slideWidth = containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE;
          slideHeight = slideWidth / SLIDE_ASPECT_RATIO;
        }
      } else {
        slideWidth = containerWidth * MAX_SLIDE_WIDTH_PERCENTAGE;
        slideHeight = slideWidth / SLIDE_ASPECT_RATIO;

        if (slideHeight > containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE) {
          slideHeight = containerHeight * MAX_SLIDE_HEIGHT_PERCENTAGE;
          slideWidth = slideHeight * SLIDE_ASPECT_RATIO;
        }
      }
    }

    function loadTextures() {
      const textureLoader = new THREE.TextureLoader();
      return Promise.all(
        images.map(
          (img) =>
            new Promise((resolve, reject) => {
              const fullPath = `assets/pr_5/webp/${img}`;
              console.log(`Attempting to load texture: ${fullPath}`);
              textureLoader.load(
                fullPath,
                (texture) => {
                  texture.minFilter = THREE.LinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  texture.encoding = THREE.sRGBEncoding;
                  console.log(`Texture loaded successfully: ${img}`);
                  resolve(texture);
                },
                undefined,
                (error) => {
                  console.error(`Error loading texture ${img}:`, error);
                  console.error(`Full path: ${fullPath}`);
                  resolve(null);
                }
              );
            })
        )
      ).then((textures) => textures.filter((texture) => texture !== null));
    }

    function createBehindGlowMaterial(texture) {
      return new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: texture },
          glowColor: { value: new THREE.Color(0xf3f2ff) },
          glowStrength: { value: 3.5 },
          glowWidth: { value: 0.001 },
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
            
            float blur = 0.0;
            for (int i = -5; i <= 5; i++) {
              for (int j = -5; j <= 5; j++) {
                vec2 offset = vec2(float(i), float(j)) * glowWidth;
                blur += getAlpha(vUv + offset);
              }
            }
            blur /= 121.0;
            
            float glowAlpha = (1.0 - alpha) * blur * glowStrength;
            
            gl_FragColor = vec4(glowColor, glowAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    }

    function createSlides(textures) {
      calculateSlideDimensions();
      const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight);

      textures.forEach((texture, index) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.premultiplyAlpha = true;

        const glowMaterial = createBehindGlowMaterial(texture);
        const glowMesh = new THREE.Mesh(geometry, glowMaterial);
        updateSlidePosition(glowMesh, index, textures.length);
        glowMesh.visible = false;
        scene.add(glowMesh);

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        });
        const mesh = new THREE.Mesh(geometry, material);
        updateSlidePosition(mesh, index, textures.length);
        mesh.position.z += 0.01;
        scene.add(mesh);

        slides.push({ original: mesh, glow: glowMesh });
      });
      updateSlidesPosition(currentIndex);
      enableGlowEffect();
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

      if (
        !isSelected &&
        !isAnimating &&
        !isTransitioning &&
        Math.abs(targetIndex - currentIndex) > 0.001
      ) {
        currentIndex += (targetIndex - currentIndex) * 0.1;
        updateSlidesPosition(currentIndex).then(() => {
          enableGlowEffect();
        });
      }

      if (isSelected || isTransitioning) {
        backgroundMaterial.uniforms.opacity.value = Math.max(
          0,
          Math.min(backgroundMaterial.uniforms.opacity.value, 0.5)
        );
      } else {
        backgroundMaterial.uniforms.opacity.value = 0;
      }

      renderer.setRenderTarget(null);
      renderer.render(backgroundScene, backgroundCamera);
      renderer.render(scene, camera);

      lastTime = currentTime;
    }

    function stopAnimation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    function updateAllSlides() {
      slides.forEach((slide, index) => {
        if (slide.original && slide.original.geometry) {
          slide.original.geometry.dispose();
          slide.original.geometry = new THREE.PlaneGeometry(
            slideWidth,
            slideHeight
          );
        }
        if (slide.glow && slide.glow.geometry) {
          slide.glow.geometry.dispose();
          slide.glow.geometry = new THREE.PlaneGeometry(
            slideWidth,
            slideHeight
          );
        }
        updateSlidePosition(slide.original, index, slides.length);
        updateSlidePosition(slide.glow, index, slides.length);
      });
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
              onComplete: resolveSlide,
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

    function throttle(func, limit) {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    }

    return {
      init: initProject5Slider,
    };
  })();

  console.log("pr_005.js loaded and initialized");
})(window);
