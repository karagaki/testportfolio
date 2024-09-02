// pr_007.js

// 必要な要素と変数の初期化
const animationContainer = document.getElementById('walking-animation-container');
let animationSpeed = 0.5;
let maxCharacters = 1000;
let activeCharacters = 0;
let characters = [];
let project7AnimationInitialized = false;



document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('project7-image-wrapper') && !project7AnimationInitialized) {
                loadProject7Animation();
        const script = document.createElement('script');
        script.src = 'pr_7-anime.js';
        script.onload = () => {
            console.log('pr_7-anime.js loaded successfully');
            if (typeof window.Project7Animation === 'function') {
                const project7Animation = new window.Project7Animation();
                project7Animation.init();
                initializeImageClickHandlers();
            } else {
                console.error('Project7Animation class not found');
            }
        };
        script.onerror = () => {
            console.error('Failed to load pr_7-anime.js');
        };
        document.body.appendChild(script);
    } else {
        console.error('project7-image-wrapper element not found');
    }
});



function loadProject7Animation() {
    const script = document.createElement('script');
    script.src = 'pr_7-anime.js';
    script.onload = () => {
        console.log('pr_7-anime.js loaded successfully');
        if (typeof window.Project7Animation === 'function' && !project7AnimationInitialized) {
            const project7Animation = new window.Project7Animation();
            project7Animation.init();
            initializeImageClickHandlers();
            project7AnimationInitialized = true;
        } else if (project7AnimationInitialized) {
            console.log('Project7Animation already initialized');
        } else {
            console.error('Project7Animation class not found');
        }
    };
    script.onerror = () => {
        console.error('Failed to load pr_7-anime.js');
    };
    document.body.appendChild(script);
}





function initializeImageClickHandlers() {
    const container = document.getElementById('project7-image-wrapper');
    if (container) {
        // Remove any existing click event listeners
        container.removeEventListener('click', containerClickHandler);
        // Add the new click event listener
        container.addEventListener('click', containerClickHandler);
    }
}

function containerClickHandler(event) {
    if (event.target.classList.contains('project7-image')) {
        event.preventDefault();
        event.stopPropagation();
        const webmFile = event.target.getAttribute('data-webm');
        if (webmFile && activeCharacters < maxCharacters) {
            createWalkingCharacter(webmFile);
        }
    }
}

function createWalkingCharacter(webmFile) {
    const character = document.createElement('video');
    character.src = `assets/pr_7/webm/${webmFile}`;
    character.classList.add('walking-character');
    character.autoplay = true;
    character.loop = true;
    character.muted = true;
    character.playsInline = true;

    const startY = Math.random() * (window.innerHeight - 100);
    character.style.position = 'absolute';
    character.style.right = '-280px';
    character.style.top = `${startY}px`;
    
    const animationContainer = document.getElementById('walking-animation-container');
    animationContainer.appendChild(character);
    activeCharacters++;

    const totalDistance = window.innerWidth + 400;
    const isTurtle = webmFile.includes('s7_a02'); // ファイル名でカメを識別
    const characterSpeed = isTurtle ? animationSpeed / 10 : animationSpeed;
    const duration = totalDistance / (characterSpeed * 60);
    let progress = 0;
    let lastTime = null;

    const amplitudeY = Math.random() * 10 + 5;
    const frequencyY = Math.random() * 1.5 + 0.5;

    const characterData = {
        element: character,
        x: -100,
        y: startY,
        vy: 0,
        isTurtle: isTurtle
    };

    characters.push(characterData);

    character.addEventListener('loadedmetadata', () => {
        character.play().catch(e => console.error('Video playback failed:', e));
    });

    function animate(currentTime) {
        if (lastTime === null) {
            lastTime = currentTime;
        }
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        progress += deltaTime / duration;

        if (progress >= 1) {
            character.remove();
            activeCharacters--;
            characters = characters.filter(c => c !== characterData);
            return;
        }

        const avoidanceForce = avoidCollision(characterData);
        characterData.vy += avoidanceForce.y * deltaTime;
        characterData.vy = Math.max(Math.min(characterData.vy, 0.5), -0.5);

        characterData.y += characterData.vy * characterSpeed * 60 * deltaTime;

        const baseX = totalDistance * progress;
        const x = baseX;
        const y = characterData.y + Math.sin(progress * Math.PI * frequencyY) * amplitudeY;

        character.style.transform = `translate(${-x}px, ${y - startY}px)`;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function avoidCollision(character) {
    let avoidanceY = 0;
    const avoidanceDistance = 250;

    characters.forEach(other => {
        if (other === character) return;

        const dx = character.x - other.x;
        const dy = character.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < avoidanceDistance) {
            avoidanceY += dy / distance;
        }
    });

    return { y: avoidanceY };
}

function setAnimationSpeed(speed) {
    animationSpeed = speed;
}

function setMaxCharacters(max) {
    maxCharacters = max;
}

window.initAfterEffectsAnimation = initializeImageClickHandlers;
window.setAnimationSpeed = setAnimationSpeed;
window.setMaxCharacters = setMaxCharacters;