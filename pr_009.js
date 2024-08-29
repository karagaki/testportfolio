// pr_009.js

class MirroredSeamlessScrollGrid {
    constructor(options = {}) {
        this.container = document.getElementById('project9-image-wrapper');
        this.images = ['s9_a1.webp', 's9_a2.webp', 's9_a3.webp', 's9_a4.webp', 's9_a5.webp', 's9_a6.webp'];
        this.gridElement = null;
        this.cameraPosition = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        this.scrollSpeed = options.scrollSpeed || 0.5;
        this.autoScrollSpeed = options.autoScrollSpeed || 0.2;
        this.imageWidth = 1800;
        this.imageHeight = 180;
        this.baseGridSize = { width: this.imageWidth * 3, height: this.imageHeight * 6 };
        this.rowScrollOffsets = [];

        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.initializeRowScrollOffsets();
        this.animate();
    }

    createGrid() {
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'scroll-grid';
        this.container.appendChild(this.gridElement);

        // Create 3x3 grid of base images
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                const baseGrid = this.createBaseGrid();
                baseGrid.style.transform = `translate(${x * this.baseGridSize.width}px, ${y * this.baseGridSize.height}px)`;
                this.gridElement.appendChild(baseGrid);
            }
        }
    }

    createBaseGrid() {
        const baseGrid = document.createElement('div');
        baseGrid.className = 'base-grid';

        for (let i = 0; i < this.images.length; i++) {
            const row = document.createElement('div');
            row.className = 'image-row';

            // Add 5 images to each row to ensure seamless scrolling
            for (let j = 0; j < 5; j++) {
                const img = document.createElement('img');
                img.src = `assets/pr_9/webp/${this.images[i]}`;
                img.style.width = `${this.imageWidth}px`;
                img.style.height = `${this.imageHeight}px`;
                row.appendChild(img);
            }

            baseGrid.appendChild(row);
        }

        return baseGrid;
    }

    initializeRowScrollOffsets() {
        for (let i = 0; i < this.images.length; i++) {
            this.rowScrollOffsets.push(0);
        }
    }

    setupEventListeners() {
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseleave', () => this.resetMousePosition());
    }

    handleMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mousePosition.x = (e.clientX - rect.left) / rect.width - 0.5;
        this.mousePosition.y = (e.clientY - rect.top) / rect.height - 0.5;
    }

    resetMousePosition() {
        this.mousePosition.x = 0;
        this.mousePosition.y = 0;
    }

    updateGrid() {
        // Update camera position based on mouse movement (vertical only)
        this.cameraPosition.y -= this.mousePosition.y * this.scrollSpeed;

        // Ensure camera position stays within bounds
        this.cameraPosition.y = (this.cameraPosition.y + this.baseGridSize.height) % this.baseGridSize.height;

        // Update row scroll offsets (automatic horizontal scrolling)
        for (let i = 0; i < this.rowScrollOffsets.length; i++) {
            const direction = i % 2 === 0 ? 1 : -1;
            this.rowScrollOffsets[i] += direction * this.autoScrollSpeed;
            this.rowScrollOffsets[i] = (this.rowScrollOffsets[i] + this.imageWidth * 5) % (this.imageWidth * 5);
        }

        // Apply camera position to grid
        const gridX = -this.cameraPosition.x;
        const gridY = -this.cameraPosition.y;
        this.gridElement.style.transform = `translate(${gridX}px, ${gridY}px)`;

        // Update row positions
        const rows = this.gridElement.querySelectorAll('.image-row');
        rows.forEach((row, index) => {
            const offset = -this.rowScrollOffsets[index % this.images.length];
            row.style.transform = `translateX(${offset}px)`;
        });
    }

    animate() {
        this.updateGrid();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MirroredSeamlessScrollGrid({
        scrollSpeed: 2,
        autoScrollSpeed: 0.5
    });
});