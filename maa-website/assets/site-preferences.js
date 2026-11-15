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

    function automaticLanguage() {
        let timeZone;
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch { /* Browser language is still available. */ }
        if (timeZone === 'Europe/Paris') return 'fr';
        if (timeZone === 'Asia/Tokyo' || timeZone === 'Japan') return 'ja';
        return browserLanguage();
    }

    function applyTheme(theme) {
        if (theme === 'system') delete root.dataset.theme;
        else root.dataset.theme = theme;
        const override = themeColors.find((entry) => entry.theme === theme);
        for (const { tag, color } of themeColors) tag.content = override?.color ?? color;
    }

    let language = readPreference(languageKey, languages, 'auto');
    let theme = readPreference(themeKey, themes, 'system');
    root.lang = language === 'auto' ? automaticLanguage() : language;
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

    function setupHeader() {
        const header = document.querySelector('.site-header');
        const mobile = window.matchMedia('(max-width: 44rem)');
        let expanded = null;

        function closePanel(returnFocus = false) {
            if (!expanded) return;
            const { trigger, panel } = expanded;
            expanded = null;
            trigger.setAttribute('aria-expanded', 'false');
            panel.removeAttribute('data-open');
            if (returnFocus) trigger.focus();
        }

        for (const trigger of header.querySelectorAll('[data-header-toggle]')) {
            const panel = document.getElementById(trigger.getAttribute('aria-controls'));
            trigger.addEventListener('click', () => {
                const wasOpen = expanded?.trigger === trigger;
                closePanel();
                if (wasOpen) return;
                expanded = { trigger, panel };
                trigger.setAttribute('aria-expanded', 'true');
                panel.setAttribute('data-open', '');
                panel.querySelector('input:checked, a[href]')?.focus();
            });
        }

        function closeOnExit(event) {
            if (expanded && !expanded.panel.contains(event.target) && !expanded.trigger.contains(event.target)) {
                closePanel();
            }
        }

        document.addEventListener('pointerdown', closeOnExit);
        document.addEventListener('focusin', closeOnExit);
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || !expanded) return;
            event.preventDefault();
            closePanel(true);
        });
        header.querySelector('.site-nav').addEventListener('click', (event) => {
            if (event.target.closest('a')) closePanel();
        });
        mobile.addEventListener('change', () => closePanel());
        header.dataset.ready = '';
        header.querySelector('.header-actions').hidden = false;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const languageControl = document.querySelector('[data-site-language]');
        const themeToggle = document.querySelector('[data-site-theme]');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
        const bindings = Array.from(document.querySelectorAll('[data-i18n]'), textBinding);
        for (const attribute of ['aria-label', 'content', 'href', 'title']) {
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
            const requested = language === 'auto' ? automaticLanguage() : language;
            const copy = window.maaSiteCopy?.[requested];
            const next = copy ? requested : 'en';
            if (next === displayedLanguage) return;
            root.lang = next;
            for (const { key, original, write } of bindings) write(copy?.[key] ?? original);
            displayedLanguage = next;
            document.dispatchEvent(new Event('maa:languagechange'));
        }

        function isDarkTheme() {
            return theme === 'dark' || (theme === 'system' && systemTheme.matches);
        }

        function updateThemeToggle() {
            themeToggle.setAttribute('aria-pressed', String(isDarkTheme()));
        }

        languageControl.querySelector(`input[value="${language}"]`).checked = true;
        updateThemeToggle();
        applyLanguage();
        setupHeader();

        languageControl.addEventListener('change', (event) => {
            language = event.target.value;
            savePreference(languageKey, language, 'auto');
            applyLanguage();
        });

        themeToggle.addEventListener('click', () => {
            theme = isDarkTheme() ? 'light' : 'dark';
            savePreference(themeKey, theme, 'system');
            applyTheme(theme);
            updateThemeToggle();
        });

        systemTheme.addEventListener('change', updateThemeToggle);
        window.addEventListener('languagechange', applyLanguage);
    }, { once: true });
})();
