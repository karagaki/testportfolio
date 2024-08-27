document.addEventListener('DOMContentLoaded', () => {
    const imageWrapper = document.getElementById('project6-image-wrapper');
    const contentGroup = document.createElement('div');
    contentGroup.id = 'contentGroup';
    imageWrapper.appendChild(contentGroup);

    let contentGroupWidth;
    const backgroundImage = new Image();
    backgroundImage.src = 'assets/pr_6/webp/s6_a1.webp';
    backgroundImage.onload = () => {
        const aspectRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
        contentGroupWidth = aspectRatio * 630; // 630px is the fixed height
        contentGroup.style.width = `${contentGroupWidth}px`;
        contentGroup.style.height = '630px';
        initializeStickers();
        adjustContentPosition();
        centerContentInitially();
    };

    contentGroup.style.backgroundImage = `url('assets/pr_6/webp/s6_a1.webp')`;
    contentGroup.style.backgroundSize = 'cover';
    contentGroup.style.position = 'absolute';
    contentGroup.style.top = '0';
    contentGroup.style.left = '0';

    const stickerImages = [
        's6_a2.webp', 's6_a3.webp', 's6_a4.webp', 's6_a5.webp', 's6_a6.webp',
        's6_a7.webp', 's6_a8.webp', 's6_a9.webp', 's6_a10.webp', 's6_a11.webp', 's6_a12.webp',
        's6_a13.webp', 's6_a14.webp', 's6_a15.webp', 's6_a16.webp', 's6_a17.webp',
        's6_a18.webp', 's6_a19.webp', 's6_a20.webp', 's6_a21.webp', 's6_a22.webp',
        's6_a23.webp', 's6_a24.webp', 's6_a25.webp', 's6_a26.webp'
    ];

    const stickerPositions = [
        { left: 18, top: 193 }, { left: 15.5, top: 12 }, { left: 215, top: 376 },
        { left: 557, top: 460 }, { left: 721, top: 321 }, { left: 928, top: 428 },
        { left: 827, top: 142 }, { left: 972, top: 151 }, { left: 854, top: 13 },
        { left: 437, top: 14 }, { left: 280, top: 28 }, { left: 15, top: 140 },
        { left: 170, top: 27 }, { left: 10, top: 400 }, { left: 193, top: 391 },
        { left: 57, top: 480 }, { left: 268, top: 170 }, { left: 445, top: 408 },
        { left: 614, top: 47 }, { left: 713, top: 15 }, { left: 718, top: 143 },
        { left: 720, top: 270 }, { left: 1028, top: 15 }, { left: 963, top: 320 },
        { left: 1070, top: 310 }
    ];

    function initializeStickers() {
        stickerImages.forEach((src, index) => {
            const stickerB = document.createElement('img');
            stickerB.src = `assets/pr_6/webp/s6_b${index + 2}.webp`;
            stickerB.alt = `ステッカーB${index + 2}`;
            stickerB.className = 'sticker sticker-b';
            stickerB.id = `stickerB${index + 2}`;
            stickerB.style.position = 'absolute';
            stickerB.style.left = `${stickerPositions[index].left}px`;
            stickerB.style.top = `${stickerPositions[index].top}px`;
            stickerB.style.opacity = '1';
            contentGroup.appendChild(stickerB);

            const stickerA = document.createElement('img');
            stickerA.src = `assets/pr_6/webp/${src}`;
            stickerA.alt = `ステッカーA${index + 2}`;
            stickerA.className = 'sticker sticker-a';
            stickerA.id = `stickerA${index + 2}`;
            stickerA.style.position = 'absolute';
            stickerA.style.left = `${stickerPositions[index].left}px`;
            stickerA.style.top = `${stickerPositions[index].top}px`;
            stickerA.style.opacity = '0';
            stickerA.style.transform = 'scale(0.5)';
            stickerA.dataset.animated = 'false';
            stickerA.style.transformOrigin = 'center center';
            contentGroup.appendChild(stickerA);

            stickerA.onload = () => {
                stickerPositions[index].width = stickerA.width;
                stickerPositions[index].height = stickerA.height;
            };
        });
    }

    function centerContentInitially() {
        const imageWrapperWidth = imageWrapper.clientWidth;
        const centerPosition = (imageWrapperWidth - contentGroupWidth) / 2;
        contentGroup.style.left = `${centerPosition}px`;
    }

    function adjustContentPosition() {
        const imageWrapperWidth = imageWrapper.clientWidth;
        const currentLeft = parseInt(contentGroup.style.left) || 0;
        const maxLeft = imageWrapperWidth - contentGroupWidth;
        
        if (currentLeft < maxLeft) {
            contentGroup.style.left = `${maxLeft}px`;
        } else if (currentLeft > 0) {
            contentGroup.style.left = '0px';
        }
        
        if (contentGroupWidth < imageWrapperWidth) {
            centerContentInitially();
        }
    }

    
    let animatedStickersCount = 0;
    const totalStickers = stickerImages.length;
    let isAnimationCycleActive = false;

    function checkAllStickersAnimated() {
        animatedStickersCount++;
        if (animatedStickersCount === totalStickers && !isAnimationCycleActive) {
            isAnimationCycleActive = true;
            setTimeout(startJumpingAnimation, 500);
        }
    }

    function resetAnimationCycle() {
        animatedStickersCount = 0;
        isAnimationCycleActive = false;
        const stickersA = contentGroup.querySelectorAll('.sticker-a');
        stickersA.forEach((stickerA) => {
            stickerA.dataset.animated = 'false';
        });
    }

    function startJumpingAnimation() {
        if (!isAnimationCycleActive) return;
        
        const stickersA = contentGroup.querySelectorAll('.sticker-a');
        let jumpingStickersCount = 0;

        stickersA.forEach((stickerA, index) => {
            stickerA.style.transition = 'transform 0.3s cubic-bezier(0.28, 0.84, 0.42, 1)';
            let jumpCount = 0;
            setTimeout(() => {
                const jumpInterval = setInterval(() => {
                    if (jumpCount % 2 === 0) {
                        stickerA.style.transform = 'translateY(-15px) scale(1.05)';
                    } else {
                        stickerA.style.transform = 'translateY(0px) scale(1)';
                    }
                    jumpCount++;
                    if (jumpCount >= 4) {
                        clearInterval(jumpInterval);
                        jumpingStickersCount++;
                        if (jumpingStickersCount === totalStickers) {
                            startSwayingAnimationForAll();
                        }
                    }
                }, 300);
            }, index * 50);
        });
    }
    
    
    function startSwayingAnimationForAll() {
        if (!isAnimationCycleActive) return;

        const stickersA = contentGroup.querySelectorAll('.sticker-a');
        stickersA.forEach(startSwayingAnimation);
    }

    function startSwayingAnimation(sticker) {
        let startTime;
        const animationDuration = 2000;
        const maxRotation = 3;
        let animationFrame;

        function easeInOutSine(t) {
            return -(Math.cos(Math.PI * t) - 1) / 2;
        }

        function animateSwaying(currentTime) {
            if (!isAnimationCycleActive) {
                cancelAnimationFrame(animationFrame);
                return;
            }

            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = (elapsed % animationDuration) / animationDuration;

            const rotationAngle = maxRotation * Math.sin(progress * 2 * Math.PI);
            sticker.style.transform = `rotate(${rotationAngle}deg)`;

            if (elapsed < 7000) {
                animationFrame = requestAnimationFrame(animateSwaying);
            } else {
                cancelAnimationFrame(animationFrame);
                fadeOutSticker(sticker);
            }
        }

        animationFrame = requestAnimationFrame(animateSwaying);
    }

    function fadeOutSticker(stickerA) {
        if (!isAnimationCycleActive) return;

        const index = parseInt(stickerA.id.replace('stickerA', '')) - 2;
        const stickerB = document.getElementById(`stickerB${index + 2}`);
        stickerB.style.opacity = '1';
        
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            if (!isAnimationCycleActive) {
                clearInterval(fadeInterval);
                return;
            }

            opacity -= 0.05;
            stickerA.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                resetSticker(stickerA, stickerB);
            }
        }, 50);
    }

    function resetSticker(stickerA, stickerB) {
        stickerA.style.opacity = '0';
        stickerA.style.transform = 'scale(0.5)';
        stickerA.dataset.animated = 'false';
        stickerB.style.opacity = '1';
        
        const allStickersReset = Array.from(contentGroup.querySelectorAll('.sticker-a'))
            .every(sticker => sticker.dataset.animated === 'false');
        
        if (allStickersReset) {
            resetAnimationCycle();
        }
    }

    function animateSticker(stickerA, stickerB) {
        if (stickerA.dataset.animated === 'false' && !isAnimationCycleActive) {
            stickerA.style.opacity = '1';
            stickerA.style.transform = 'scale(1)';
            
            setTimeout(() => {
                stickerA.style.transform = 'scale(1.1)';
            }, 150);

            setTimeout(() => {
                stickerA.style.transform = 'scale(1)';
                stickerB.style.opacity = '0';
            }, 300);

            stickerA.dataset.animated = 'true';
            checkAllStickersAnimated();
        }
    }

    const scrollSpeed = 3;
    let isScrolling = false;
    let scrollDirection = 0;
    let scrollInterval;
    let isCenteringContent = false;

    function startScroll(direction) {
        if (!isScrolling && !isCenteringContent) {
            isScrolling = true;
            scrollDirection = direction;
            scrollInterval = setInterval(autoScroll, 16);
        }
    }

    function stopScroll() {
        if (isScrolling) {
            isScrolling = false;
            scrollDirection = 0;
            clearInterval(scrollInterval);
        }
    }

    function autoScroll() {
        const currentLeft = parseInt(contentGroup.style.left) || 0;
        const newLeft = currentLeft + scrollDirection * scrollSpeed;
        const maxScroll = imageWrapper.clientWidth - contentGroupWidth;

        if (newLeft <= 0 && newLeft >= maxScroll) {
            contentGroup.style.left = `${newLeft}px`;
        } else {
            stopScroll();
        }
    }

    function centerContentGroup() {
        if (isCenteringContent) return;
        
        isCenteringContent = true;
        const imageWrapperWidth = imageWrapper.clientWidth;
        const currentLeft = parseInt(contentGroup.style.left) || 0;
        const centerPosition = (imageWrapperWidth - contentGroupWidth) / 2;
        const distance = centerPosition - currentLeft;
        const duration = Math.abs(distance / scrollSpeed) * 16;

        let startTime = null;

        function animateCenter(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            
            const newLeft = currentLeft + distance * easedProgress;
            contentGroup.style.left = `${newLeft}px`;

            if (progress < 1) {
                requestAnimationFrame(animateCenter);
            } else {
                isCenteringContent = false;
            }
        }

        requestAnimationFrame(animateCenter);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    imageWrapper.addEventListener('mousemove', (e) => {
        const wrapperRect = imageWrapper.getBoundingClientRect();
        const mouseX = e.clientX - wrapperRect.left;
        const wrapperWidth = wrapperRect.width;
        const centerAreaStart = (wrapperWidth / 2) - 50;
        const centerAreaEnd = (wrapperWidth / 2) + 50;

        if (mouseX >= centerAreaStart && mouseX <= centerAreaEnd) {
            stopScroll();
            centerContentGroup();
            imageWrapper.style.cursor = 'default';
        } else if (mouseX < wrapperWidth * 0.4) {
            startScroll(1);
            imageWrapper.style.cursor = 'w-resize';
        } else if (mouseX > wrapperWidth * 0.6) {
            startScroll(-1);
            imageWrapper.style.cursor = 'e-resize';
        } else {
            stopScroll();
            imageWrapper.style.cursor = 'default';
        }
    });

    imageWrapper.addEventListener('mouseleave', () => {
        stopScroll();
        imageWrapper.style.cursor = 'default';
    });

    window.addEventListener('resize', adjustContentPosition);

    contentGroup.addEventListener('mousemove', (e) => {
        const rect = contentGroup.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const stickersA = contentGroup.querySelectorAll('.sticker-a');
        stickersA.forEach((stickerA, index) => {
            const stickerLeft = stickerPositions[index].left;
            const stickerTop = stickerPositions[index].top;
            const stickerWidth = stickerPositions[index].width || 0;
            const stickerHeight = stickerPositions[index].height || 0;
            const extensionRange = 125; //カーソル影響

            const stickerCenterX = stickerLeft + stickerWidth / 2;
            const stickerCenterY = stickerTop + stickerHeight / 2;

            if (Math.abs(x - stickerCenterX) < extensionRange && Math.abs(y - stickerCenterY) < extensionRange) {
                const stickerB = document.getElementById(`stickerB${index + 2}`);
                if (stickerA.dataset.animated === 'false') {
                    animateSticker(stickerA, stickerB);
                }
            }
        });
    });
});