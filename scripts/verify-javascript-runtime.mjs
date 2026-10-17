import { readFile } from 'node:fs/promises';
import {
    newQuickJSWASMModuleFromVariant,
    newVariant,
} from 'quickjs-emscripten-core';
import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';
import assert from 'node:assert/strict';
import { createJavascriptEngine } from '../resources/js/javascript-engine.js';
const memory = new WebAssembly.Memory({ initial: 256, maximum: 2048 });
const QuickJS = await newQuickJSWASMModuleFromVariant(
    newVariant(RELEASE_SYNC, {
        wasmBinary: await readFile('public/javascript-runtime/quickjs.wasm'),
        wasmMemory: memory,
    }),
);
assert.equal(QuickJS.getWasmMemory(), memory);
const dom = await readFile('public/javascript-runtime/dom.js', 'utf8');
const lessons = JSON.parse(
    await readFile('database/data/javascript-course.json', 'utf8'),
);
const run = (code, options = {}) => {
    const engine = createJavascriptEngine(QuickJS, dom, {
        code,
        html: '<main><div id="output"></div></main>',
        ...options,
    });
    try {
        return engine.snapshot();
    } finally {
        engine.dispose();
    }
};
for (const lesson of lessons) {
    const result = run(lesson.example_javascript, {
        html: lesson.example_html,
        css: lesson.example_css,
        input: lesson.validation_rules.javascript.sample_input,
        rules: lesson.validation_rules.javascript,
    });
    assert.equal(
        result.output,
        lesson.validation_rules.javascript.expected_output,
    );
    console.log(`PASS ${lesson.position}: ${lesson.title}`);
}
assert.equal(
    run(
        'console.log(typeof process,typeof require,typeof postMessage,typeof Worker,typeof WebAssembly,typeof document.cookie,typeof parent);',
    ).output,
    'undefined undefined undefined undefined undefined undefined undefined\n',
);
assert.equal(
    run('console.log(__emit.constructor("return typeof process")());').output,
    'undefined\n',
);
assert.equal(run('console.log(window===globalThis);').output, 'true\n');
assert.equal(
    run('prompt("Name");alert("Hello");', { input: '{"prompts":["Maria"]}' })
        .output,
    '[prompt] Name\n[alert] Hello\n',
);
assert.equal(
    run(
        'localStorage.setItem("x","secret");console.log(localStorage.getItem("x"));',
    ).output,
    'secret\n',
);
assert.equal(run('console.log(localStorage.getItem("x"));').output, 'null\n');
assert.equal(
    run(
        'fetch("https://example.com/private").catch(e=>console.log(e.message));',
    ).output.startsWith('Network is disabled.'),
    true,
);
assert.equal(
    run(
        'fetch("/api/test").then(r=>r.json()).then(data=>console.log(data.name));',
        {
            input: '{"fixtures":{"/api/test":{"status":200,"data":{"name":"Ana"}}}}',
        },
    ).output,
    'Ana\n',
);
assert.equal(
    run('import {value} from "./test.js";console.log(value);', {
        rules: { module: true },
        input: '{"modules":{"./test.js":"export const value=42;"}}',
    }).output,
    '42\n',
);
assert.throws(
    () =>
        run('import "https://example.com/code.js";', {
            rules: { module: true },
        }),
    /Module not provided/,
);
assert.equal(
    run(
        'console.log("first");setTimeout(()=>console.log("timer"),100);Promise.resolve().then(()=>console.log("promise"));console.log("last");',
    ).output,
    'first\nlast\npromise\ntimer\n',
);
assert.throws(() => run('while(true){}'), /interrupted/);
assert.throws(
    () => run('function recur(){return 1+recur();}recur();'),
    /stack|recursion/i,
);
assert.throws(
    () => run('const huge=new Array(10000000).fill("x");'),
    /memory|allocation|null|runtime/i,
);
assert.throws(() => run('console.log("x".repeat(70000));'), /64 KiB/);
assert.throws(() => run('setInterval(()=>{},1);'), /Timer limit/);
assert.throws(
    () => run('document.body.innerHTML="<p>x</p>".repeat(600);'),
    /500 elements/,
);
assert.throws(() => run('__labSnapshot=()=>"x".repeat(70000);'), /64 KiB/);
assert.throws(() => run('console.log(1);', { input: '[]' }), /JSON object/);
const project = lessons[5];
const engine = createJavascriptEngine(QuickJS, dom, {
    code: project.example_javascript,
    html: project.example_html,
    css: project.example_css,
});
try {
    const initial = engine.snapshot();
    assert.match(initial.html, /Average: 90.00/);
    const key = (id) => {
        const match = initial.html.match(
            new RegExp('<[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(match);
        return match[0].match(/data-codelab-key="(\d+)"/)[1];
    };
    const edited = engine.event({
        type: 'submit',
        key: key('grade-form'),
        fields: [
            { key: key('student-name'), value: 'Jose' },
            { key: key('grades'), value: '60,70' },
        ],
    });
    assert.match(edited.html, /Jose/);
    assert.match(edited.html, /Average: 65.00/);
    assert.match(edited.html, /Failed/);
    const invalid = engine.event({
        type: 'submit',
        key: key('grade-form'),
        fields: [
            { key: key('student-name'), value: 'Jose' },
            { key: key('grades'), value: '101' },
        ],
    });
    assert.match(invalid.html, /Enter grades from 0 to 100/);
} finally {
    engine.dispose();
}
assert.throws(() => memory.grow(2048), RangeError);
console.log(
    'PASS all 18 examples; events/forms; virtual APIs/storage/timers/modules; no host globals; constructor escape; CPU/stack/heap/WASM/output/DOM limits.',
);
