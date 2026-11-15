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
                next: 'Next word',
                restart: 'Play again',
            },
            prompts: {
                start: 'Tap the gold key ({key}). No Thai keyboard needed.',
                newWord: 'New word. Start with {key}',
                wrong: 'Try this key: {key}',
                nextLetter: 'Now type {key}',
                complete: 'Word complete. Ready for the next word?',
                finishedAll: 'Mini lesson complete! You typed three Thai words.',
                finished: 'You reached the end of the mini lesson.',
            },
        },
        fr: {
            meanings: { come: 'venir', good: 'bon', crow: 'corbeau' },
            progress: (current, total) => `Mot ${current} sur ${total}`,
            actions: {
                skip: 'Passer ce mot',
                next: 'Mot suivant',
                restart: 'Rejouer',
            },
            prompts: {
                start: 'Touchez la touche dorée ({key}). Aucun clavier thaï nécessaire.',
                newWord: 'Nouveau mot. Commencez par la touche {key}',
                wrong: 'Essayez cette touche : {key}',
                nextLetter: 'Tapez maintenant {key}',
                complete: 'Mot terminé. Prêt pour le mot suivant ?',
                finishedAll: 'Mini-leçon terminée ! Vous avez tapé trois mots en thaï.',
                finished: 'Vous êtes à la fin de la mini-leçon.',
            },
        },
        ja: {
            meanings: { come: '来る', good: '良い', crow: 'カラス' },
            progress: (current, total) => `${total}語中${current}語目`,
            actions: {
                skip: 'この単語をスキップ',
                next: '次の単語',
                restart: 'もう一度',
            },
            prompts: {
                start: '金色のキー「{key}」を押してください。タイ語キーボードは不要です。',
                newWord: '新しい単語です。まず「{key}」を入力してください。',
                wrong: '「{key}」キーを押してください。',
                nextLetter: '次は「{key}」を入力してください。',
                complete: '入力できました。次の単語に進みましょう。',
                finishedAll: 'ミニレッスン完了！タイ語の単語を3つ入力できました。',
                finished: 'ミニレッスンの最後まで進みました。',
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
    const launch = demo.querySelector('[data-demo-launch]');
    const board = demo.querySelector('[data-demo-board]');
    const keys = new Map(Array.from(board.querySelectorAll('[data-demo-key]'), (key) => [key.value, key]));

    let wordIndex = 0;
    let letterIndex = 0;
    let typedWords = 0;
    let roundFinished = false;
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
        const wordAction = letterIndex === letters.length ? 'next' : 'skip';
        next.textContent = text.actions[roundFinished ? 'restart' : wordAction];
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
        demo.classList.remove('is-complete', 'is-finished');
        launch.hidden = true;
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
            key.disabled = false;
            key.classList.remove('is-used');
            key.classList.toggle('is-target', letter === letters[0]);
        });
        announce(animate ? 'newWord' : 'start');
    }

    function showCompletion(message, keyboard) {
        keys.forEach((key) => {
            key.disabled = true;
            key.classList.remove('is-target');
        });
        renderLabels();
        announce(message);
        next.focus({ preventScroll: !keyboard });
    }

    function finishDemo(keyboard) {
        clearMistake();
        roundFinished = true;
        demo.classList.add('is-finished');
        launch.hidden = false;
        showCompletion(typedWords === words.length ? 'finishedAll' : 'finished', keyboard);
    }

    function typeKey(key, keyboard) {
        if (roundFinished || letterIndex === letters.length) return;

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
            const nextKey = keys.get(letters[letterIndex]);
            nextKey.classList.add('is-target');
            announce('nextLetter');
            if (keyboard) nextKey.focus();
            return;
        }

        demo.classList.add('is-complete');
        typedWords += 1;
        if (isLastWord()) finishDemo(keyboard);
        else showCompletion('complete', keyboard);
    }

    keys.forEach((key) => {
        key.addEventListener('click', (event) => typeKey(key, event.detail === 0));
    });
    next.disabled = false;
    next.hidden = false;
    next.addEventListener('click', (event) => {
        const keyboard = event.detail === 0;
        if (roundFinished) {
            roundFinished = false;
            typedWords = 0;
            wordIndex = 0;
        } else if (isLastWord()) {
            finishDemo(keyboard);
            return;
        } else {
            wordIndex += 1;
        }
        showWord(true);
        keys.get(letters[0]).focus({ preventScroll: !keyboard });
    });
    demo.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
        if (event.target.isContentEditable || event.target.closest('input, textarea, select')) return;

        const key = keys.get(event.key);
        if (!key || key.disabled) return;

        event.preventDefault();
        typeKey(key, true);
    });

    showWord();
    document.addEventListener('maa:languagechange', () => {
        renderLabels();
        announce();
    });
}

const demo = document.querySelector('#demo');
if (demo) setupDemo(demo);
