(function() {
  const IMAGES = [
  's7_a1.webp', 's7_a2.webp', 's7_a3.webp', 's7_a4.webp', 's7_a5.webp', 's7_a6.webp', 's7_a7.webp', 
  's7_a8.webp', 's7_a9.webp', 's7_a10.webp', 's7_a11.webp', 's7_a12.webp', 's7_a13.webp', 's7_a14.webp', 
  's7_a15.webp', 's7_a16.webp', 's7_a17.webp', 's7_a18.webp', 's7_a19.webp', 's7_a20.webp', 's7_a21.webp', 
  's7_a22.webp', 's7_a23.webp', 's7_a24.webp', 's7_a25.webp', 's7_a26.webp', 's7_a27.webp'
];

  const COLUMNS = 5; // 列の数を5に変更
  const ROWS_PER_COLUMN = 4;
  const TOTAL_IMAGES = COLUMNS * ROWS_PER_COLUMN;
  const IMAGE_WIDTH = 200;
  const IMAGE_HEIGHT = 200;
  const COLUMN_GAP = 20; // 列間の隙間を狭くする
  const ROW_GAP = 10;
  const ANIMATION_SPEED = 40; // アニメーション速度を上げる
  const BOUNCE_AMPLITUDE = 1;
  const BOUNCE_FREQUENCY = 1;

  class Project7Animation {
    constructor() {
      this.container = document.getElementById('project7-image-wrapper');
      this.images = [];
      this.lastTime = null;
      this.columnDirections = [1, -1, 1, -1, 1, -1]; // 5列分の方向を設定
      this.isAnimating = false;
    }

    init() {
      if (!this.container) {
        console.error('Container element not found');
        return;
      }
      this.createAndPositionImages();
      this.startAnimationLoop();
      this.startSwapInterval();
      this.addClickListener();
    }

    createAndPositionImages() {
      this.images = [];
      this.container.innerHTML = '';

      const shuffledImages = this.shuffleArray([...IMAGES]);
      const selectedImages = shuffledImages.slice(0, TOTAL_IMAGES);

      let index = 0;
      for (let col = 0; col < COLUMNS; col++) {
        const columnImages = [];
        for (let row = 0; row < ROWS_PER_COLUMN * 2; row++) {
          const imgSrc = selectedImages[index % TOTAL_IMAGES];

          const img = document.createElement('img');
          img.src = `assets/pr_7/webp/${imgSrc}`;
          img.className = 'project7-image';
          img.setAttribute('data-webm', imgSrc.replace('.webp', '.webm'));
          this.container.appendChild(img);
          const imageData = {
            element: img,
            x: 0,
            y: 0,
            column: col,
            bounceOffset: 0,
            bouncePhase: Math.random() * Math.PI * 2
          };
          this.images.push(imageData);
          columnImages.push(imageData);
          index++;
        }
        this.positionColumnImages(columnImages, col);
      }
    }

    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    positionColumnImages(columnImages, col) {
      const containerWidth = this.container.offsetWidth;
      const containerHeight = this.container.offsetHeight;

      const totalColumnWidth = containerWidth - COLUMN_GAP * (COLUMNS - 1);
      const colWidth = totalColumnWidth / COLUMNS;

      const x = (colWidth + COLUMN_GAP) * col + colWidth / 2;
      const totalHeight = containerHeight * 2 + ROW_GAP * (ROWS_PER_COLUMN * 2 - 1);
      const imageSpacing = (totalHeight - ROW_GAP * (ROWS_PER_COLUMN * 2 - 1)) / (ROWS_PER_COLUMN * 2);

      columnImages.forEach((img, index) => {
        const y = index * (imageSpacing + ROW_GAP);

        img.element.style.width = `${IMAGE_WIDTH}px`;
        img.element.style.height = `${IMAGE_HEIGHT}px`;
        img.x = x;
        img.y = y;
        img.element.style.transform = `translate(-50%, -50%)`;
        img.element.style.left = `${img.x}px`;
        img.element.style.top = `${img.y}px`;
      });
    }

    startAnimationLoop() {
      const animate = (currentTime) => {
        if (this.lastTime === null) {
          this.lastTime = currentTime;
        }
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.updateImagePositions(deltaTime);
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }

    updateImagePositions(deltaTime) {
      const containerHeight = this.container.offsetHeight;
      const totalHeight = containerHeight * 2 + ROW_GAP * (ROWS_PER_COLUMN * 2 - 1);

      for (let col = 0; col < COLUMNS; col++) {
        const columnImages = this.images.filter(img => img.column === col);
        const direction = this.columnDirections[col];
        const moveAmount = ANIMATION_SPEED * deltaTime * direction;

        columnImages.forEach(img => {
          img.y += moveAmount;
          img.bouncePhase += BOUNCE_FREQUENCY * Math.PI * 2 * deltaTime;
          img.bounceOffset = Math.sin(img.bouncePhase) * BOUNCE_AMPLITUDE;

          // 画像が画面外に出る前に位置をリセット
          if (direction > 0 && img.y > containerHeight + IMAGE_HEIGHT) {
            img.y -= totalHeight;
          } else if (direction < 0 && img.y < -IMAGE_HEIGHT) {
            img.y += totalHeight;
          }

          const totalOffset = img.y + img.bounceOffset;
          img.element.style.transform = `translate(-50%, -50%) translateY(${img.bounceOffset}px)`;
          img.element.style.top = `${totalOffset}px`;
        });
      }
    }

    startSwapInterval() {
      setInterval(() => {
        if (!this.isAnimating) {
          const swapType = Math.random() < 0.5 ? 'pairs' : 'rotate';
          if (swapType === 'pairs') {
            this.swapImagePairs();
          } else {
            this.rotateImages();
          }
        }
      }, 5000);
    }
    
    

    swapImagePairs() {
      this.isAnimating = true;
      const pairCount = Math.random() < 0.5 ? 2 : 4;
      const indices = new Array(this.images.length).fill().map((_, i) => i);
      const pairs = [];

      for (let i = 0; i < pairCount; i++) {
        const index1 = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
        const index2 = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
        pairs.push([this.images[index1], this.images[index2]]);
      }

      this.animateSwap(pairs, 0);
    }

    animateSwap(pairs, index) {
      if (index >= pairs.length) {
        this.isAnimating = false;
        return;
      }

      const [img1, img2] = pairs[index];
      const temp = img1.element.src;

      this.animateImage(img1, img2.element.src, () => {
        this.animateImage(img2, temp, () => {
          this.animateSwap(pairs, index + 1);
        });
      });
    }

    animateImage(img, newSrc, callback) {
      const duration = 500; // アニメーション時間（ミリ秒）
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // イージング関数（ease-in-out）
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const scale = 1 - 0.5 * easeProgress;
        const opacity = 1 - easeProgress;

        img.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
        img.element.style.opacity = opacity;

        if (progress < 0.5) {
          requestAnimationFrame(animate);
        } else if (progress === 0.5) {
          img.element.src = newSrc;
          requestAnimationFrame(animate);
        } else if (progress < 1) {
          const reverseProgress = 1 - (progress - 0.5) * 2;
          const reverseScale = 1 - 0.5 * reverseProgress;
          const reverseOpacity = 1 - reverseProgress;

          img.element.style.transform = `translate(-50%, -50%) scale(${reverseScale})`;
          img.element.style.opacity = reverseOpacity;

          requestAnimationFrame(animate);
        } else {
          img.element.style.transform = 'translate(-50%, -50%) scale(1)';
          img.element.style.opacity = 1;
          callback();
        }
      };

      requestAnimationFrame(animate);
    }

    rotateImages() {
      this.isAnimating = true;
      const rotationCount = Math.floor(Math.random() * 3) + 1;
      const randomIndex = Math.floor(Math.random() * this.images.length);
      const imagesToRotate = this.images.slice(randomIndex, randomIndex + rotationCount + 1);
      
      if (imagesToRotate.length < rotationCount + 1) {
        imagesToRotate.push(...this.images.slice(0, rotationCount + 1 - imagesToRotate.length));
      }

      this.animateRotation(imagesToRotate, 0);
    }

    animateRotation(images, index) {
      if (index >= images.length - 1) {
        this.isAnimating = false;
        return;
      }

      const currentImg = images[index];
      const nextImg = images[index + 1];
      const nextSrc = nextImg.element.src;

      this.animateImage(currentImg, nextSrc, () => {
        this.animateRotation(images, index + 1);
      });
    }

    addClickListener() {
      this.container.addEventListener('click', (event) => {
        if (event.target.classList.contains('project7-image')) {
          const webmFile = event.target.getAttribute('data-webm');
          if (webmFile) {
            this.createWalkingCharacter(webmFile);
          }
        }
      });
    }

    createWalkingCharacter() {
      // ここに歩くキャラクターを作成するコードを追加
      console.log('歩くキャラクターを作成');
      // 既存の createWalkingCharacter 関数の内容をここに移動
    }
  }

  window.Project7Animation = Project7Animation;
  console.log('pr_7-anime.js loaded and Project7Animation class defined');
})();