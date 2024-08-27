document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('project8-video');
    const playButton = document.getElementById('project8-play-button');
    const audioButton = document.getElementById('project8-audio-button');
    const videoContainer = document.getElementById('project8-video-container');
    const imageWrapper = document.querySelector('#project-8 .image-wrapper');
    const maskAnimation = document.querySelector('#project-8 .mask-animation');

    function adjustVideoSize() {
        const containerAspect = videoContainer.offsetWidth / videoContainer.offsetHeight;
        const videoAspect = video.videoWidth / video.videoHeight;

        if (videoAspect > containerAspect) {
            video.style.width = '100%';
            video.style.height = 'auto';
        } else {
            video.style.width = 'auto';
            video.style.height = '100%';
        }
    }

    function animateButton(button) {
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 300);
    }

    function togglePlayPause() {
        animateButton(playButton);
        setTimeout(() => {
            if (video.paused) {
                video.play();
                playButton.querySelector('img').src = 'assets/pr_8/webp/stop.webp';
            } else {
                video.pause();
                playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
            }
        }, 150);
    }

    function toggleAudio() {
        animateButton(audioButton);
        setTimeout(() => {
            video.muted = !video.muted;
            updateAudioButtonState();
        }, 150);
    }

    function updateAudioButtonState() {
        audioButton.querySelector('img').src = video.muted ? 'assets/pr_8/webp/off.webp' : 'assets/pr_8/webp/on.webp';
    }

    video.addEventListener('loadedmetadata', () => {
        adjustVideoSize();
        updateAudioButtonState();
        video.muted = true;
    });
    window.addEventListener('resize', adjustVideoSize);
    
    maskAnimation.addEventListener('click', (event) => {
        if (!event.target.closest('#project8-audio-button')) {
            togglePlayPause();
        }
    });

    audioButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleAudio();
    });

    video.addEventListener('volumechange', updateAudioButtonState);

    video.addEventListener('ended', () => {
        playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                imageWrapper.classList.add('animated');
            } else {
                imageWrapper.classList.remove('animated');
                video.pause();
                playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
            }
        });
    }, { threshold: 0.5 });

    observer.observe(document.getElementById('project-8'));

    updateAudioButtonState();
});