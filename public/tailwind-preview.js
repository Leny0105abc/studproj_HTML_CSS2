(() => {
    const root = document.getElementById('preview-root'),
        style = document.getElementById('preview-style');
    let port,
        worker,
        workerUrl,
        loading,
        timer,
        sequence = 0,
        compiledKey = '',
        lastStructure = '',
        returnFocusKey;
    const dialog = () =>
        [...root.querySelectorAll('[role="dialog"][aria-modal="true"]')].find(
            (node) => !node.hidden,
        );
    const focusables = (node) =>
        [
            ...node.querySelectorAll(
                'button,a[href],input,select,textarea,[tabindex="0"]',
            ),
        ].filter((item) => !item.disabled && !item.closest('[hidden]'));
    const clean = (html) => {
        const template = document.createElement('template');
        template.innerHTML = html;
        template.content
            .querySelectorAll('script,iframe,object,embed,meta,link,base,style')
            .forEach((node) => node.remove());
        for (const node of template.content.querySelectorAll('*'))
            for (const attribute of [...node.attributes])
                if (
                    attribute.name.toLowerCase().startsWith('on') ||
                    ['srcdoc', 'action', 'formaction'].includes(attribute.name)
                )
                    node.removeAttribute(attribute.name);
        if (template.content.querySelectorAll('*').length > 500)
            throw Error('Preview exceeds 500 elements.');
        return template.content;
    };
    const fields = (fragment) => {
        for (const incoming of fragment.querySelectorAll(
            'input,select,textarea',
        )) {
            const key = incoming.getAttribute('data-codelab-key');
            const node = [
                ...root.querySelectorAll('input,select,textarea'),
            ].find((n) => n.getAttribute('data-codelab-key') === key);
            if (!node || node === document.activeElement) continue;
            node.value = incoming.getAttribute('value') ?? incoming.value ?? '';
            if ('checked' in node)
                node.checked = incoming.hasAttribute('checked');
        }
    };
    const structure = (fragment) => {
        const copy = document.createElement('div');
        copy.append(fragment.cloneNode(true));
        for (const node of copy.querySelectorAll(
            'input,select,textarea,option',
        )) {
            for (const name of ['value', 'checked', 'selected'])
                node.removeAttribute(name);
            if (node.tagName === 'TEXTAREA') node.textContent = '';
        }
        return copy.innerHTML;
    };
    const fail = (message) => {
        sequence++;
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        if (workerUrl) URL.revokeObjectURL(workerUrl);
        workerUrl = null;
        compiledKey = '';
        port.postMessage({ type: 'preview-error', message });
    };
    const compiler = async () => {
        if (worker) return;
        if (loading) return loading;
        loading = (async () => {
            const version = await fetch(
                '/tailwind-runtime-assets/version.json',
                { credentials: 'omit' },
            ).then((r) => {
                if (!r.ok) throw Error('Cannot load Tailwind version.');
                return r.json();
            });
            const source = await fetch(
                '/tailwind-runtime-assets/compiler.js?v=' + version.worker,
                { credentials: 'omit' },
            ).then((r) => {
                if (!r.ok) throw Error('Cannot load Tailwind compiler.');
                return r.text();
            });
            workerUrl = URL.createObjectURL(
                new Blob([source], { type: 'text/javascript' }),
            );
            worker = new Worker(workerUrl);
            worker.onmessage = ({ data }) => {
                if (data.id !== sequence) return;
                clearTimeout(timer);
                if (data.error) {
                    fail(data.error);
                    return;
                }
                style.textContent = data.css;
                port.postMessage({ type: 'preview-ready' });
            };
            worker.onerror = () =>
                fail(
                    'Tailwind compiler failed. Simplify the page and Run again.',
                );
        })();
        try {
            await loading;
        } finally {
            loading = null;
        }
    };
    addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            port ||
            event.data?.type !== 'tailwind-preview-connect' ||
            !event.ports[0]
        )
            return;
        port = event.ports[0];
        port.onmessage = async ({ data }) => {
            if (
                typeof data.html !== 'string' ||
                data.html.length > 65536 ||
                typeof data.css !== 'string' ||
                data.css.length > 50000
            )
                return;
            try {
                const fragment = clean(data.html),
                    next = structure(fragment);
                if (next !== lastStructure) {
                    const oldDialog = dialog()?.id,
                        key =
                            document.activeElement?.getAttribute(
                                'data-codelab-key',
                            ),
                        start = document.activeElement?.selectionStart,
                        end = document.activeElement?.selectionEnd;
                    root.replaceChildren(fragment);
                    lastStructure = next;
                    fields(root);
                    if (key) {
                        const node = [
                            ...root.querySelectorAll('[data-codelab-key]'),
                        ].find(
                            (n) => n.getAttribute('data-codelab-key') === key,
                        );
                        node?.focus();
                        try {
                            node?.setSelectionRange(start, end);
                        } catch {}
                    }
                    const opened = dialog();
                    if (opened && !oldDialog) {
                        returnFocusKey = key;
                        (focusables(opened)[0] ?? opened).focus();
                    } else if (!opened && oldDialog && returnFocusKey) {
                        const target = [
                            ...root.querySelectorAll('[data-codelab-key]'),
                        ].find(
                            (n) =>
                                n.getAttribute('data-codelab-key') ===
                                returnFocusKey,
                        );
                        const eligible =
                            target && !target.closest('[hidden]')
                                ? target
                                : null;
                        (
                            eligible ??
                            root.querySelector('input[type="search"]') ??
                            focusables(root)[0]
                        )?.focus();
                        returnFocusKey = null;
                    }
                } else fields(fragment);
                const classes = [...root.querySelectorAll('[class]')]
                        .map((n) => n.getAttribute('class'))
                        .join(' '),
                    key =
                        data.css + '\n' + (data.source ?? '') + '\n' + classes;
                if (key === compiledKey) return;
                compiledKey = key;
                const id = ++sequence;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (id === sequence)
                        fail(
                            'Tailwind compilation timed out. Simplify the page and Run again.',
                        );
                }, 10000);
                await compiler();
                if (id !== sequence) return;
                worker.postMessage({
                    id,
                    html: data.html,
                    source: data.source ?? '',
                    css: data.css,
                });
            } catch (error) {
                fail(String(error.message).slice(0, 2000));
            }
        };
    });
    for (const type of ['click', 'input', 'change', 'submit', 'keydown'])
        root.addEventListener(type, (event) => {
            if (type === 'submit') event.preventDefault();
            const link = event.target.closest('a');
            if (link) {
                const href = link.getAttribute('href') ?? '';
                const target = /^#[\w:.-]+$/.test(href)
                    ? document.getElementById(href.slice(1))
                    : null;
                if (!target || !root.contains(target)) event.preventDefault();
            }
            if (!port) return;
            if (type === 'keydown' && event.key === 'Tab' && dialog()) {
                const available = focusables(dialog());
                if (available.length) {
                    const position = available.indexOf(document.activeElement);
                    event.preventDefault();
                    available[
                        (position +
                            (event.shiftKey ? -1 : 1) +
                            available.length) %
                            available.length
                    ].focus();
                }
                return;
            }
            if (
                type === 'keydown' &&
                !['Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                    event.key,
                )
            )
                return;
            const node = event.target.closest('[data-codelab-key]');
            if (!node) return;
            const values = [...root.querySelectorAll('input,select,textarea')]
                .slice(0, 100)
                .map((n) => ({
                    key: n.getAttribute('data-codelab-key'),
                    value: String(n.value ?? '').slice(0, 2000),
                    checked: !!n.checked,
                }));
            port.postMessage({
                type,
                key: node.getAttribute('data-codelab-key'),
                keyboardKey: type === 'keydown' ? event.key : undefined,
                fields: values,
            });
        });
})();
