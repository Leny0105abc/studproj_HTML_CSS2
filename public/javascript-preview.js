(() => {
    const root = document.getElementById('preview-root'),
        style = document.getElementById('preview-style');
    let port;
    addEventListener('message', (event) => {
        if (
            event.source !== parent ||
            port ||
            event.data?.type !== 'javascript-preview-connect' ||
            !event.ports[0]
        )
            return;
        port = event.ports[0];
        port.onmessage = ({ data }) => {
            if (
                typeof data.html !== 'string' ||
                data.html.length > 65536 ||
                typeof data.css !== 'string' ||
                data.css.length > 50000
            )
                return;
            const focused =
                    document.activeElement?.getAttribute('data-codelab-key'),
                start = document.activeElement?.selectionStart,
                end = document.activeElement?.selectionEnd;
            const template = document.createElement('template');
            template.innerHTML = data.html;
            template.content
                .querySelectorAll('script,iframe,object,embed,meta,link,base')
                .forEach((node) => node.remove());
            template.content.querySelectorAll('*').forEach((node) => {
                for (const attribute of [...node.attributes])
                    if (
                        attribute.name.startsWith('on') ||
                        ['srcdoc', 'formaction', 'action'].includes(
                            attribute.name,
                        )
                    )
                        node.removeAttribute(attribute.name);
            });
            if (template.content.querySelectorAll('*').length > 500) {
                root.textContent = 'Preview exceeds 500 elements.';
                return;
            }
            root.replaceChildren(template.content);
            style.textContent = data.css;
            if (focused) {
                const node = [
                    ...root.querySelectorAll('[data-codelab-key]'),
                ].find((n) => n.getAttribute('data-codelab-key') === focused);
                node?.focus();
                try {
                    node?.setSelectionRange(start, end);
                } catch {}
            }
        };
    });
    for (const type of ['click', 'input', 'change', 'submit'])
        root.addEventListener(type, (event) => {
            if (type === 'submit' || event.target.closest('a'))
                event.preventDefault();
            if (!port) return;
            const fields = [...root.querySelectorAll('input,select,textarea')]
                .slice(0, 100)
                .map((node) => ({
                    key: node.getAttribute('data-codelab-key'),
                    value: String(node.value ?? '').slice(0, 2000),
                    checked: !!node.checked,
                }));
            port.postMessage({
                type,
                key: event.target.getAttribute('data-codelab-key'),
                fields,
            });
        });
})();
