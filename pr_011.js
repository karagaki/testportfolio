function createProject11Animation(options = {}) {
    const overlay = document.querySelector('.web-portfolio-description-overlay');
    if (!overlay) {
        console.error('Web portfolio description overlay not found');
        return;
    }

    const settings = {
        cols: 8,
        rows: 6,
        staggerDelay: options.staggerDelay || 54,
        placementSpeed: options.placementSpeed || 500,
        expandSpeed: options.expandSpeed || 1300,
        cornerAnimationDelay: options.cornerAnimationDelay || 100
    };

    let tileContainer = overlay.querySelector('.pr_11-tile-container');
    if (!tileContainer) {
        tileContainer = document.createElement('div');
        tileContainer.className = 'pr_11-tile-container';
        overlay.insertBefore(tileContainer, overlay.firstChild);
    }

    function createTiles() {
        const overlayRect = overlay.getBoundingClientRect();
        const tileWidth = overlayRect.width / settings.cols;
        const tileHeight = overlayRect.height / settings.rows;

        tileContainer.innerHTML = '';
        tileContainer.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
        tileContainer.style.gridTemplateRows = `repeat(${settings.rows}, 1fr)`;

        const totalTiles = settings.cols * settings.rows;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'pr_11-tile';
            fragment.appendChild(tile);
        }

        tileContainer.appendChild(fragment);
    }

    function animateTiles() {
        const tiles = tileContainer.children;
        Array.from(tiles).forEach((tile, index) => {
            const row = Math.floor(index / settings.cols);
            const col = index % settings.cols;
            const delay = (row + col) * settings.staggerDelay;
            
            tile.style.transitionDelay = `${delay}ms`;
            tile.style.transitionDuration = `${settings.placementSpeed}ms`;
            
            tile.style.transform = 'scale(0.8)';
            tile.style.borderRadius = '20%';
            
            setTimeout(() => {
                tile.classList.add('appear');
                
                tile.style.transitionDuration = `${settings.expandSpeed}ms`;
                tile.style.transform = 'scale(1)';

                setTimeout(() => {
                    tile.style.transitionProperty = 'transform, opacity, border-radius';
                    tile.style.transitionDuration = `${settings.expandSpeed}ms`;
                    tile.style.borderRadius = '0%';
                }, settings.expandSpeed + settings.cornerAnimationDelay);
            }, delay + settings.placementSpeed);
        });
    }

    function resetTiles() {
        Array.from(tileContainer.children).forEach(tile => {
            tile.classList.remove('appear');
            tile.style.transform = 'scale(0.8)';
            tile.style.borderRadius = '20%';
        });
    }

    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const currentTiles = Array.from(tileContainer.children);
            const currentState = currentTiles.map(tile => ({
                opacity: tile.style.opacity,
                transform: tile.style.transform,
                borderRadius: tile.style.borderRadius
            }));

            createTiles();

            const newTiles = Array.from(tileContainer.children);
            newTiles.forEach((tile, index) => {
                if (currentState[index]) {
                    tile.style.opacity = currentState[index].opacity;
                    tile.style.transform = currentState[index].transform;
                    tile.style.borderRadius = currentState[index].borderRadius;
                    if (currentState[index].opacity !== '0') {
                        tile.classList.add('appear');
                    }
                }
            });
        }, 250);
    }

    createTiles();
    animateTiles();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTiles();
            } else {
                resetTiles();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(overlay);

    window.addEventListener('resize', handleResize);

    return {
        updateSettings: function(newSettings) {
            Object.assign(settings, newSettings);
            createTiles();
            animateTiles();
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const animation = createProject11Animation({
        staggerDelay: 54,
        placementSpeed: 500,
        expandSpeed: 890,
        cornerAnimationDelay: 100
    });
});