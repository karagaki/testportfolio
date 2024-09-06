document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('project8-video');
    const playButton = document.getElementById('project8-play-button');
    const audioButton = document.getElementById('project8-audio-button');
    const videoContainer = document.getElementById('project8-video-container');

    function debugLog(message) {
        console.log(`[DEBUG] ${message}`);
    }

    function togglePlay(event) {
        event.stopPropagation();
        debugLog('Play button clicked');
        if (video.paused) {
            video.play();
            playButton.querySelector('img').src = 'assets/pr_8/webp/stop.webp';
        } else {
            video.pause();
            playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
        }
    }

    function toggleAudio(event) {
        event.stopPropagation();
        debugLog('Audio button clicked');
        video.muted = !video.muted;
        audioButton.querySelector('img').src = video.muted ? 'assets/pr_8/webp/off.webp' : 'assets/pr_8/webp/on.webp';
    }

    function handleVideoClick(event) {
        if (event.target === video) {
            debugLog('Video clicked');
            togglePlay(event);
        }
    }

    playButton.addEventListener('click', togglePlay);
    audioButton.addEventListener('click', toggleAudio);
    videoContainer.addEventListener('click', handleVideoClick);

    video.addEventListener('play', () => debugLog('Video started playing'));
    video.addEventListener('pause', () => debugLog('Video paused'));
    video.addEventListener('ended', () => {
        debugLog('Video ended');
        playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
    });

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                debugLog('Video container is visible');
            } else {
                debugLog('Video container is not visible');
                video.pause();
                playButton.querySelector('img').src = 'assets/pr_8/webp/play.webp';
            }
        });
    }, { threshold: 0.5 });

    observer.observe(videoContainer);

    // Initial setup
    ideo.muted = false;
    audioButton.querySelector('img').src = 'assets/pr_8/webp/on.webp';
    debugLog('Initial setup complete');
});