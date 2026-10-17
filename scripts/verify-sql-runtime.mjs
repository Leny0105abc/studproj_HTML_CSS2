import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import assert from 'node:assert/strict';
import { executeSql } from '../resources/js/sql-engine.js';
import { limitVirtualFiles } from '../resources/js/sql-files.js';

const require = createRequire(import.meta.url);
const SQL = await require('../storage/app/private/sql-runtime/loader.cjs')({
    wasmBinary: new Uint8Array(
        await readFile('public/sql-runtime/sql-wasm.wasm'),
    ),
});
const resetLimits = limitVirtualFiles(SQL);
if (!isMainThread) {
    parentPort.postMessage('ready');
    executeSql(
        SQL,
        'WITH RECURSIVE n(x) AS(SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT SUM(x) FROM n;',
    );
} else {
    const lessons = JSON.parse(
        await readFile('database/data/sql-course.json', 'utf8'),
    );
    for (const lesson of lessons) {
        resetLimits();
        const result = executeSql(SQL, lesson.example_sql, lesson.sql_seed);
        assert.deepEqual(
            result.results.map(({ columns, values }) => ({ columns, values })),
            lesson.validation_rules.sql.expected_results,
        );
        console.log(`PASS ${lesson.position}: ${lesson.title}`);
    }
    const seed = lessons[0].sql_seed;
    const run = (code, input = '') => {
        resetLimits();
        return executeSql(SQL, code, seed, input);
    };
    assert.deepEqual(
        run('SELECT first_name FROM students WHERE id=:id;', '{":id":2}')
            .results[0].values,
        [['Ben']],
    );
    assert.deepEqual(
        run(
            'SELECT first_name FROM students WHERE first_name=:name;',
            JSON.stringify({ ':name': "Ana'; DROP TABLE students; --" }),
        ).results[0].values,
        [],
    );
    assert.equal(
        run('SELECT COUNT(*) FROM students;').results[0].values[0][0],
        5,
    );
    assert.throws(
        () => run("INSERT INTO enrollments VALUES(99,1,'2026-06-01');"),
        /FOREIGN KEY/,
    );
    assert.throws(() => run('UPDATE grades SET score=101;'), /CHECK/);
    assert.throws(
        () => run("INSERT INTO enrollments VALUES(1,1,'2026-06-01');"),
        /UNIQUE/,
    );
    assert.throws(() => run('SELECT * FROM users;'), /no such table/);
    assert.throws(
        () => run("SELECT load_extension('evil');"),
        /not authorized|no such function/,
    );
    assert.throws(
        () =>
            run(
                "SELECT readfile('C:/Users/Leny/Herd/studproj_html_css/.env');",
            ),
        /no such function/,
    );
    assert.throws(
        () => run("SELECT writefile('/host/file','bad');"),
        /no such function/,
    );
    assert.throws(
        () => run('CREATE PROCEDURE demo() SELECT 1;'),
        /syntax error/,
    );
    assert.throws(
        () => run('GRANT SELECT ON students TO reader;'),
        /syntax error/,
    );
    assert.throws(() => run('SELECT 1;', '[]'), /JSON object/);
    assert.throws(() => run('SELECT 1;', '{"id":2}'), /named parameters/);
    assert.throws(() => run('SELECT 1;', '{'), /JSON/);
    const bounded = run(
        'WITH RECURSIVE n(x) AS(SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<500) SELECT x FROM n;',
    );
    assert.equal(bounded.results[0].values.length, 200);
    assert.equal(bounded.results[0].truncated, true);
    assert.throws(() => run("SELECT printf('%2000s','x');"), /cell exceeds/);
    assert.throws(
        () => run(Array(101).fill('PRAGMA foreign_keys=ON;').join('\n')),
        /100 statements/,
    );
    assert.throws(
        () => run(Array(21).fill('SELECT 1;').join('\n')),
        /20 result tables/,
    );
    assert.throws(
        () => run('SELECT ' + Array(31).fill('1').join(',') + ';'),
        /30 result columns/,
    );
    assert.throws(
        () =>
            run(
                "WITH RECURSIVE n(x) AS(SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<100) SELECT x,printf('%900s','x') FROM n;",
            ),
        /64 KiB/,
    );
    run('DROP TABLE grades;');
    assert.equal(
        run('SELECT COUNT(*) FROM grades;').results[0].values[0][0],
        6,
    );
    assert.deepEqual(
        run(
            "CREATE TABLE t(x TEXT); INSERT INTO t VALUES('text; with semicolon'); SELECT x FROM t;",
        ).results[0].values,
        [['text; with semicolon']],
    );
    const db = new SQL.Database();
    assert.equal(
        db.exec('SELECT sqlite_version()')[0].values[0][0].startsWith('3.'),
        true,
    );
    db.close();
    // Virtual filesystem hooks cover file growth, including attached databases.
    assert.throws(
        () =>
            run(
                "ATTACH DATABASE 'extra' AS extra; CREATE TABLE extra.big(x); INSERT INTO extra.big VALUES(zeroblob(5000000));",
            ),
        /4 MiB|memory|disk/i,
    );
    SQL.codelabVirtualFiles.FS.writeFile('/oversized', new Uint8Array());
    assert.throws(
        () => SQL.codelabVirtualFiles.FS.truncate('/oversized', 5000000),
        /4 MiB/,
    );
    assert.deepEqual(
        run('SELECT 9223372036854775807 AS large_integer;').results[0].values,
        [['9223372036854775807']],
    );
    assert.throws(
        () => run('SELECT :id;', '{":id":9007199254740992}'),
        /named parameters/,
    );
    const wasm = new Uint8Array(
        await readFile('public/sql-runtime/sql-wasm.wasm'),
    );
    const cursor = { p: 8 };
    const read = (c) => {
        let v = 0,
            s = 0,
            b;
        do {
            b = wasm[c.p++];
            v |= (b & 127) << s;
            s += 7;
        } while (b & 128);
        return v >>> 0;
    };
    let maximum;
    while (cursor.p < wasm.length) {
        const id = wasm[cursor.p++],
            size = read(cursor),
            start = cursor.p;
        cursor.p += size;
        if (id === 5) {
            const c = { p: start };
            assert.equal(read(c), 1);
            assert.equal(read(c), 1);
            read(c);
            maximum = read(c);
        }
    }
    assert.equal(maximum, 1024);
    const memory = new WebAssembly.Memory({ initial: 1024, maximum });
    assert.throws(() => memory.grow(1), RangeError);
    const worker = new Worker(new URL(import.meta.url));
    await new Promise((resolve, reject) => {
        worker.once('error', reject);
        worker.once('message', () =>
            setTimeout(async () => {
                await worker.terminate();
                resolve();
            }, 5000),
        );
        worker.once('exit', (code) => {
            if (code === 0)
                reject(Error('Infinite query unexpectedly completed'));
        });
    });
    console.log(
        'PASS SQL runtime: all 30 examples, bound values, integrity, parser, fresh databases, unsupported dialect errors, output/file/memory limits, and worker termination.',
    );
}
