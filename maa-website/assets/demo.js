function setupDemo(demo) {
    const words = [
        { thai: 'มา', pronunciation: 'māa', meaning: 'come' },
        { thai: 'ดี', pronunciation: 'dīi', meaning: 'good' },
        { thai: 'กา', pronunciation: 'gāa', meaning: 'crow' },
    ];
    const translations = {
        en: {
            meanings: { come: 'to come', good: 'good', crow: 'crow' },
            progress: (current, total) => `Word ${current} of ${total}`,
            actions: {
                skip: 'Skip word',
                skipLast: 'Skip and start again',
                next: 'Next word',
                restart: 'Start again',
            },
            prompts: {
                start: 'Start with {key}',
                newWord: 'New word. Start with {key}',
                wrong: 'Try this key: {key}',
                nextLetter: 'Now type {key}',
                complete: 'Word complete. Ready for the next word?',
                completeLast: 'Word complete. Start again to replay.',
            },
        },
        fr: {
            meanings: { come: 'venir', good: 'bon', crow: 'corbeau' },
            progress: (current, total) => `Mot ${current} sur ${total}`,
            actions: {
                skip: 'Passer ce mot',
                skipLast: 'Passer et recommencer',
                next: 'Mot suivant',
                restart: 'Recommencer',
            },
            prompts: {
                start: 'Commencez par la touche {key}',
                newWord: 'Nouveau mot. Commencez par la touche {key}',
                wrong: 'Essayez cette touche : {key}',
                nextLetter: 'Tapez maintenant {key}',
                complete: 'Mot terminé. Prêt pour le mot suivant ?',
                completeLast: 'Mot terminé. Choisissez « Recommencer » pour rejouer.',
            },
        },
        ja: {
            meanings: { come: '来る', good: '良い', crow: 'カラス' },
            progress: (current, total) => `${total}語中${current}語目`,
            actions: {
                skip: 'この単語をスキップ',
                skipLast: 'スキップして最初から',
                next: '次の単語',
                restart: '最初から',
            },
            prompts: {
                start: 'まず「{key}」を入力してください。',
                newWord: '新しい単語です。まず「{key}」を入力してください。',
                wrong: '「{key}」キーを押してください。',
                nextLetter: '次は「{key}」を入力してください。',
                complete: '入力できました。次の単語に進みましょう。',
                completeLast: '入力できました。もう一度練習するには「最初から」を選んでください。',
            },
        },
    };
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
    let prompt = 'start';
    let mistakenKey;
    let mistakeTimer;

    function visibleLetter(letter) {
        return letter === 'ี' ? '◌ี' : letter;
    }

    function copy() {
        const language = document.documentElement.lang;
        return Object.hasOwn(translations, language) ? translations[language] : translations.en;
    }

    function isLastWord() {
        return wordIndex === words.length - 1;
    }

    function renderLabels() {
        const text = copy();
        meaning.textContent = text.meanings[words[wordIndex].meaning];
        progress.textContent = text.progress(wordIndex + 1, words.length);
        if (letterIndex === letters.length) {
            next.textContent = isLastWord() ? text.actions.restart : text.actions.next;
        } else {
            next.textContent = isLastWord() ? text.actions.skipLast : text.actions.skip;
        }
    }

    function announce(message = prompt) {
        prompt = message;
        const [before, after] = copy().prompts[prompt].split('{key}');
        status.textContent = before;
        if (after !== undefined) {
            const thai = document.createElement('span');
            thai.lang = 'th';
            thai.textContent = visibleLetter(letters[letterIndex]);
            status.append(thai, after);
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
        renderLabels();

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
        announce(animate ? 'newWord' : 'start');
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
            announce('wrong');
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
            announce('nextLetter');
            return;
        }

        demo.classList.add('is-complete');
        keys.forEach((letterKey) => letterKey.setAttribute('aria-disabled', 'true'));
        renderLabels();
        announce(isLastWord() ? 'completeLast' : 'complete');
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
    document.addEventListener('maa:languagechange', () => {
        renderLabels();
        announce();
    });
}

const demo = document.querySelector('#demo');
if (demo) setupDemo(demo);
