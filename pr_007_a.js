class Project7Animation {
    constructor() {
        this.images = [
            's7_a1.webp', 's7_a2.webp', 's7_a3.webp', 's7_a4.webp', 's7_a5.webp',
            's7_a6.webp', 's7_a7.webp', 's7_a8.webp', 's7_a9.webp', 's7_a10.webp',
            's7_a11.webp', 's7_a12.webp', 's7_a13.webp', 's7_a14.webp', 's7_a15.webp',
            's7_a16.webp', 's7_a17.webp', 's7_a18.webp', 's7_a19.webp', 's7_a20.webp',
            's7_a21.webp', 's7_a22.webp', 's7_a23.webp', 's7_a24.webp', 's7_a25.webp',
            's7_a26.webp', 's7_a27.webp'
        ];
        this.columns = 5;
        this.rows = 7;
        this.container = null;
        this.imageElements = [];
        this.baseAnimationSpeed = 0.04;
        this.columnSpeeds = [3, 0.7, 3, 0.7, 3];
        this.wobbleAmplitude = 2;
        this.wobbleFrequency = 0.05;
        this.maskPadding = 70;
        this.horizontalOffset = 10.3;
        this.imagePool = [...this.images];
        this.calculateSpacing();
    }

    calculateSpacing() {
        this.spacing = 100 / this.rows;
        this.totalHeight = 100 + (2 * this.maskPadding);
        this.totalSpaces = this.rows + 1;
        this.adjustedSpacing = this.totalHeight / this.totalSpaces;
    }

    init() {
        this.container = document.getElementById('project7-image-wrapper');
        if (!this.container) {
            console.error('Container not found');
            return;
        }
        this.createImageGrid();
        this.startAnimation();
    }

    createImageGrid() {
        this.shuffleArray(this.imagePool);
        for (let col = 0; col < this.columns; col++) {
            for (let row = 0; row < this.rows + 1; row++) {
                const imgSrc = this.getNextImage();
                const img = document.createElement('img');
                img.src = `assets/pr_7/webp/${imgSrc}`;
                img.className = 'project7-image';
                img.style.position = 'absolute';
                const horizontalPosition = (col / this.columns) * 100 + this.horizontalOffset;
                img.style.left = `${horizontalPosition}%`;
                img.style.width = `${140 / this.columns}%`;
                img.style.height = 'auto';
                img.setAttribute('data-webm', imgSrc.replace('.webp', '.webm'));
                this.container.appendChild(img);
                this.imageElements.push({
                    element: img,
                    column: col,
                    row: row,
                    x: horizontalPosition,
                    y: (row * this.adjustedSpacing) - this.maskPadding - (col % 2 === 0 ? 0 : this.adjustedSpacing),
                    wobbleOffset: Math.random() * Math.PI * 2,
                    wobbleSpeed: (Math.random() * 0.03) + 0.02,
                    rotation: 0,
                    isRotating: false,
                    webpSrc: imgSrc,
                    webmSrc: imgSrc.replace('.webp', '.webm')
                });
            }
        }
        this.addClickListener();
    }

    addClickListener() {
        this.container.addEventListener('click', (event) => {
            if (event.target.classList.contains('project7-image')) {
                const rect = event.target.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                if (this.isPixelClicked(event.target, x, y)) {
                    const imgData = this.imageElements.find(img => img.element === event.target);
                    if (imgData) {
                        this.createWalkingCharacter(imgData.webmSrc);
                        if (!imgData.isRotating) {
                            this.rotateImage(imgData);
                        }
                    }
                }
            }
        });
    }
    
    isPixelClicked(img, x, y) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        return pixelData[3] !== 0; // Check alpha channel
    }
    
    rotateImage(imgData) {
        imgData.isRotating = true;
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const startRotation = imgData.rotation;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const rotation = startRotation + easeProgress * 360;
            imgData.rotation = rotation % 360;

            imgData.element.style.transform = `translate(-50%, -50%) rotate(${imgData.rotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                imgData.isRotating = false;
            }
        };

        requestAnimationFrame(animate);
    }
    
    createWalkingCharacter(webmFile) {
        console.log(`Creating walking character with ${webmFile}`);
        // Implement the walking character creation logic here
        // This could involve creating a new video element, setting its source to the webm file,
        // and animating it across the screen
    }

    getNextImage() {
        if (this.imagePool.length === 0) {
            this.imagePool = [...this.images];
            this.shuffleArray(this.imagePool);
        }
        return this.imagePool.pop();
    }

    startAnimation() {
        let lastTime = 0;
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            this.updateImagePositions(deltaTime);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    updateImagePositions(deltaTime) {
        this.imageElements.forEach(img => {
            const direction = img.column % 2 === 0 ? 1 : -1;
            const columnSpeed = this.columnSpeeds[img.column] * this.baseAnimationSpeed;
            img.y += columnSpeed * direction * deltaTime * 60;

            img.wobbleOffset += img.wobbleSpeed * deltaTime * 60;
            const wobble = Math.sin(img.wobbleOffset) * this.wobbleAmplitude;

            if (direction === 1 && img.y > 100 + this.maskPadding) {
                img.y -= this.totalHeight;
                this.updateImage(img);
            } else if (direction === -1 && img.y < -this.maskPadding) {
                img.y += this.totalHeight;
                this.updateImage(img);
            }

            // Apply transform considering rotation
            img.element.style.transform = `translate(-50%, -50%) translateY(${wobble}%) rotate(${img.rotation}deg)`;
            img.element.style.top = `${img.y}%`;
            img.element.style.left = `${img.x}%`;
        });
    }

    updateImage(img) {
        const newImageSrc = this.getNextImage();
        img.element.src = `assets/pr_7/webp/${newImageSrc}`;
        img.webpSrc = newImageSrc;
        img.webmSrc = newImageSrc.replace('.webp', '.webm');
        img.element.setAttribute('data-webm', img.webmSrc);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize the animation when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const animation = new Project7Animation();
    animation.init();
});