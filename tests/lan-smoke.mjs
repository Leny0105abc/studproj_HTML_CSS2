// Exercise the actual LAN listener, built assets, database-backed auth and cookies.
// No account is created or reset. An intentionally nonexistent login is submitted.
import assert from 'node:assert/strict';

const base = new URL(process.argv[2]);
assert.equal(base.protocol, 'http:');
const login = await fetch(new URL('/login', base));
assert.equal(login.status, 200, 'Login must load through the LAN address');
const html = await login.text();
assert.match(html, /CodeLab/);
assert.doesNotMatch(
    html,
    /https?:\/\/(localhost|127\.0\.0\.1|studproj_html_css\.test)(:|\/)/,
    'Client HTML must not point back to localhost/Herd',
);
const cookies = login.headers.getSetCookie();
assert(
    cookies.some((c) => c.startsWith('codelab_lan_')),
    'LAN cookie must be separate from Herd',
);
assert(
    !cookies.some((c) => /;\s*(domain=|secure(?:;|$))/i.test(c)),
    'HTTP LAN cookies must be host-only and usable over HTTP',
);
const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
const xsrf = cookies.find((c) => c.startsWith('XSRF-TOKEN='));
assert(xsrf, 'Laravel must issue a CSRF cookie');
const xsrfValue = decodeURIComponent(
    xsrf.split(';')[0].slice('XSRF-TOKEN='.length),
);
const invalidLogin = await fetch(new URL('/login', base), {
    method: 'POST',
    redirect: 'manual',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: cookie,
        'X-XSRF-TOKEN': xsrfValue,
    },
    body: JSON.stringify({
        username: 'lan.smoke.nonexistent.' + Date.now(),
        password: 'IntentionalInvalidTest!2026',
    }),
});
assert.equal(
    invalidLogin.status,
    422,
    'Valid CSRF/session must reach database authentication, rather than return 419/500',
);
const validation = await invalidLogin.json();
assert(
    validation.errors?.username,
    'The response must be an authentication validation error',
);
const dashboard = await fetch(new URL('/dashboard', base), {
    redirect: 'manual',
});
assert([302, 303].includes(dashboard.status));
assert.equal(
    new URL(dashboard.headers.get('location'), base).origin,
    base.origin,
);
const assets = [
    ...new Set(
        [
            ...html.matchAll(
                /(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g,
            ),
        ].map((match) => new URL(match[1], base).href),
    ),
];
assert(assets.length >= 2, 'Built JavaScript and CSS must be linked');
for (const url of assets) {
    assert.equal(new URL(url).origin, base.origin);
    assert.equal(
        (await fetch(url)).status,
        200,
        'Built asset must load: ' + url,
    );
}
for (const path of [
    '/.env',
    '/.git/config',
    '/database/database.sqlite',
    '/storage/app/private/lan/server.json',
]) {
    assert.equal(
        (await fetch(new URL(path, base))).status,
        404,
        'Private project path must not be served',
    );
}
console.log(
    JSON.stringify({
        result: 'passed',
        base: base.origin,
        checks: [
            'login HTML',
            'LAN-only asset URLs',
            'host-only session cookies',
            'CSRF + database authentication',
            'protected dashboard redirect',
            `${assets.length} built assets`,
            'private paths denied',
        ],
    }),
);
