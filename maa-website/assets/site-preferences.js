(() => {
    const root = document.documentElement;
    const languageKey = 'maa-site-language';
    const themeKey = 'maa-site-theme';
    const languages = ['en', 'fr', 'ja'];
    const themes = ['light', 'dark'];
    const themeColors = Array.from(document.querySelectorAll('[data-theme-color]'), (tag) => ({
        tag,
        theme: tag.dataset.themeColor,
        color: tag.content,
    }));

    function readPreference(key, choices, fallback) {
        try {
            const value = localStorage.getItem(key);
            if (choices.includes(value)) return value;
        } catch { /* Settings still work when storage is unavailable. */ }
        return fallback;
    }

    function savePreference(key, value, fallback) {
        try {
            if (value === fallback) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch { /* Keep the selection for the current page. */ }
    }

    function browserLanguage() {
        const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
        for (const tag of preferred) {
            const language = tag?.toLowerCase().split('-')[0];
            if (languages.includes(language)) return language;
        }
        return 'en';
    }

    function applyTheme(theme) {
        if (theme === 'system') delete root.dataset.theme;
        else root.dataset.theme = theme;
        const override = themeColors.find((entry) => entry.theme === theme);
        for (const { tag, color } of themeColors) tag.content = override?.color ?? color;
    }

    let language = readPreference(languageKey, languages, 'auto');
    let theme = readPreference(themeKey, themes, 'system');
    root.lang = language === 'auto' ? browserLanguage() : language;
    applyTheme(theme);

    function textBinding(element) {
        const slots = Array.from(element.children);
        const original = Array.from(element.childNodes, (node) => {
            return node.nodeType === Node.ELEMENT_NODE ? `{${slots.indexOf(node)}}` : node.textContent;
        }).join('');
        return {
            key: element.dataset.i18n,
            original,
            write(value) {
                if (!slots.length) element.textContent = value;
                else {
                    // Reuse existing links and emphasis when a translation changes the word order.
                    const nodes = value.split(/\{(\d+)\}/).map((part, index) => {
                        return index % 2 ? slots[Number(part)] ?? `{${part}}` : part;
                    });
                    element.replaceChildren(...nodes);
                }
            },
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        const languageControl = document.querySelector('[data-site-language]');
        const themeControl = document.querySelector('[data-site-theme]');
        const bindings = Array.from(document.querySelectorAll('[data-i18n]'), textBinding);
        for (const attribute of ['aria-label', 'content', 'href']) {
            for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
                bindings.push({
                    key: element.getAttribute(`data-i18n-${attribute}`),
                    original: element.getAttribute(attribute),
                    write: (value) => element.setAttribute(attribute, value),
                });
            }
        }

        let displayedLanguage;
        function applyLanguage() {
            const requested = language === 'auto' ? browserLanguage() : language;
            const copy = window.maaSiteCopy?.[requested];
            const next = copy ? requested : 'en';
            if (next === displayedLanguage) return;
            root.lang = next;
            for (const { key, original, write } of bindings) write(copy?.[key] ?? original);
            displayedLanguage = next;
            document.dispatchEvent(new Event('maa:languagechange'));
        }

        languageControl.value = language;
        themeControl.value = theme;
        applyLanguage();
        languageControl.closest('.site-preferences').hidden = false;

        languageControl.addEventListener('change', () => {
            language = languageControl.value;
            savePreference(languageKey, language, 'auto');
            applyLanguage();
        });

        themeControl.addEventListener('change', () => {
            theme = themeControl.value;
            savePreference(themeKey, theme, 'system');
            applyTheme(theme);
        });

        window.addEventListener('languagechange', applyLanguage);
    }, { once: true });
})();
