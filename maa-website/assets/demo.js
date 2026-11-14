function setupDemo(demo) {
    const words = [
        { thai: 'มา', pronunciation: 'māa', meaning: 'to come' },
        { thai: 'ดี', pronunciation: 'dīi', meaning: 'good' },
        { thai: 'กา', pronunciation: 'gāa', meaning: 'crow' },
    ];
    const word = demo.querySelector('[data-demo-word]');
    const reading = demo.querySelector('[data-demo-reading]');
    const meaning = demo.querySelector('[data-demo-meaning]');
    const slots = demo.querySelector('[data-demo-slots]');
    const status = demo.querySelector('[data-demo-status]');
    const progress = demo.querySelector('[data-demo-progress]');
    const next = demo.querySelector('[data-demo-next]');
    const board = demo.querySelector('[data-demo-board]');
    const keys = new Map(Array.from(board.querySelectorAll('[data-demo-key]'), (key) => [key.value, key]));

    let wordIndex = 0;
    let letterIndex = 0;
    let letters = [];
    let mistakenKey;
    let mistakeTimer;

    function visibleLetter(letter) {
        return letter === 'ี' ? '◌ี' : letter;
    }

    function announce(message, hint) {
        status.textContent = message;
        if (hint) {
            const thai = document.createElement('span');
            thai.lang = 'th';
            thai.textContent = visibleLetter(hint);
            status.append(' ', thai);
        }
    }

    function clearMistake() {
        clearTimeout(mistakeTimer);
        mistakenKey?.classList.remove('is-wrong');
        demo.classList.remove('is-wrong');
    }

    function showWord(animate = false) {
        const current = words[wordIndex];
        letters = Array.from(current.thai);
        letterIndex = 0;
        clearMistake();
        demo.classList.remove('is-complete');
        word.classList.remove('is-new');
        word.textContent = current.thai;
        if (animate) {
            void word.offsetWidth;
            word.classList.add('is-new');
        }
        reading.textContent = current.pronunciation;
        meaning.textContent = current.meaning;
        progress.textContent = `Word ${wordIndex + 1} of ${words.length}`;
        next.textContent = wordIndex === words.length - 1 ? 'Skip and start again' : 'Skip word';

        slots.replaceChildren(...letters.map(() => {
            const slot = document.createElement('span');
            slot.className = 'demo-slot';
            slot.lang = 'th';
            slot.setAttribute('aria-hidden', 'true');
            return slot;
        }));
        keys.forEach((key, letter) => {
            key.removeAttribute('aria-disabled');
            key.classList.remove('is-used');
            key.classList.toggle('is-target', letter === letters[0]);
        });
        announce(animate ? 'New word. Start with' : 'Start with', letters[0]);
    }

    function typeKey(key) {
        if (letterIndex === letters.length) return;

        clearMistake();
        const expected = letters[letterIndex];
        if (key.value !== expected) {
            mistakenKey = key;
            // Restart the CSS animation when the same key is tapped twice.
            void demo.offsetWidth;
            demo.classList.add('is-wrong');
            key.classList.add('is-wrong');
            mistakeTimer = setTimeout(clearMistake, 450);
            announce('Try this key:', expected);
            return;
        }

        const slot = slots.children[letterIndex];
        slot.textContent = visibleLetter(expected);
        slot.classList.add('is-filled');
        key.classList.remove('is-target');
        key.classList.add('is-used');
        letterIndex += 1;

        if (letterIndex < letters.length) {
            keys.get(letters[letterIndex]).classList.add('is-target');
            announce('Now type', letters[letterIndex]);
            return;
        }

        demo.classList.add('is-complete');
        keys.forEach((letterKey) => letterKey.setAttribute('aria-disabled', 'true'));
        const isLastWord = wordIndex === words.length - 1;
        next.textContent = isLastWord ? 'Start again' : 'Next word';
        announce(isLastWord ? 'Word complete. Start again to replay.' : 'Word complete. Ready for the next word?');
    }

    keys.forEach((key) => {
        key.disabled = false;
        key.addEventListener('click', () => typeKey(key));
    });
    next.disabled = false;
    next.addEventListener('click', () => {
        wordIndex = (wordIndex + 1) % words.length;
        showWord(true);
    });
    demo.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
        if (event.target.isContentEditable || event.target.closest('input, textarea, select')) return;

        const key = keys.get(event.key);
        if (!key || letterIndex === letters.length) return;

        event.preventDefault();
        typeKey(key);
    });

    showWord();
}

const demo = document.querySelector('#demo');
if (demo) setupDemo(demo);
