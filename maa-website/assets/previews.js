(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = typeof IntersectionObserver === 'function';
  const playbackThreshold = 0.4;

  document.querySelectorAll('[data-app-preview]').forEach((figure) => {
    const video = figure.querySelector('video');
    const button = figure.querySelector('[data-preview-toggle]');
    const name = video.dataset.previewName;

    let mode = 'automatic';
    let inView = !canObserve;
    let enoughInView = false;
    let pendingPlay = null;

    function updateButton() {
      if (button.disabled) return;
      const action = pendingPlay || !video.paused ? 'Pause' : 'Play';
      button.dataset.previewToggle = action.toLowerCase();
      button.title = `${action} ${name} preview`;
      button.setAttribute('aria-label', button.title);
    }

    async function play() {
      if (button.disabled || pendingPlay || !video.paused) return;
      const request = {};
      pendingPlay = request;
      updateButton();

      try {
        await video.play();
      } catch {
        if (pendingPlay === request) mode = 'paused';
      } finally {
        if (pendingPlay === request) {
          pendingPlay = null;
          updateButton();
        }
      }
    }

    function pause() {
      // Ignore a pending request's result if playback has since stopped or restarted.
      pendingPlay = null;
      video.pause();
      updateButton();
    }

    function syncPlayback() {
      const shouldPlay = !document.hidden && (
        (mode === 'manual' && inView) ||
        (mode === 'automatic' && enoughInView && !reducedMotion.matches)
      );
      if (shouldPlay) {
        void play();
      } else {
        pause();
      }
    }

    function showUnavailable() {
      mode = 'paused';
      pause();
      button.disabled = true;
      button.dataset.previewToggle = 'unavailable';
      button.title = `${name} preview unavailable`;
      button.setAttribute('aria-label', button.title);
    }

    button.addEventListener('click', () => {
      if (pendingPlay || !video.paused) {
        mode = 'paused';
        pause();
      } else {
        mode = 'manual';
        void play();
      }
    });

    video.addEventListener('play', updateButton);
    video.addEventListener('pause', updateButton);
    video.addEventListener('error', showUnavailable);
    video.querySelector('source:last-of-type')?.addEventListener('error', showUnavailable);
    document.addEventListener('visibilitychange', syncPlayback);
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', syncPlayback);
    } else {
      reducedMotion.addListener(syncPlayback);
    }

    video.muted = true;
    video.controls = false;
    button.hidden = false;
    if (video.error) showUnavailable();

    if (canObserve) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        inView = entry.isIntersecting;
        enoughInView = inView && entry.intersectionRatio >= playbackThreshold;
        syncPlayback();
      }, { threshold: [0, playbackThreshold] });
      observer.observe(figure);
    }
  });
})();
