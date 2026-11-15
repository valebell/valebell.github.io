(() => {
    const word = document.querySelector('[data-hero-typing]');
    const text = word?.querySelector('[data-hero-typing-text]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!text || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    // Show the consonants and combining marks in the order they are typed.
    const frames = ['พ', 'พิ', 'พิม', 'พิมพ', 'พิมพ์'];
    const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    let startTimer;

    async function animate() {
        if (reducedMotion.matches) return;
        word.dataset.typing = '';
        await wait(200);
        for (const frame of frames) {
            text.textContent = frame;
            await wait(145);
        }
        word.dataset.typing = 'holding';
        await wait(1050);
        delete word.dataset.typing;
    }

    const observer = new IntersectionObserver(([entry]) => {
        clearTimeout(startTimer);
        if (entry.intersectionRatio < .75) return;
        startTimer = setTimeout(() => {
            observer.disconnect();
            animate();
        }, 1250);
    }, { threshold: .75 });
    observer.observe(word);
})();
