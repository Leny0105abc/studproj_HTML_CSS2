// SQLite receives SQL as data. No JavaScript UDF, host filesystem, or network bridge is registered.
export function executeSql(SQL, code, seed = '', input = '') {
    if (
        typeof code !== 'string' ||
        code.length > 200000 ||
        seed.length > 200000
    )
        throw Error('SQL script exceeds 200,000 characters.');
    if (input.length > 20000)
        throw Error('Parameters exceed 20,000 characters.');
    const parameters = input.trim() ? JSON.parse(input) : {};
    if (
        !parameters ||
        Array.isArray(parameters) ||
        typeof parameters !== 'object'
    )
        throw Error(
            'Parameters must be a JSON object, for example {":id": 1}.',
        );
    if (Object.keys(parameters).length > 100)
        throw Error('Too many parameters.');
    for (const [key, value] of Object.entries(parameters)) {
        if (
            !/^[:@$][A-Za-z_][A-Za-z0-9_]{0,63}$/.test(key) ||
            !(
                value === null ||
                typeof value === 'boolean' ||
                (typeof value === 'number' &&
                    Number.isFinite(value) &&
                    (!Number.isInteger(value) ||
                        Number.isSafeInteger(value))) ||
                (typeof value === 'string' && value.length <= 2000)
            )
        )
            throw Error(
                'Use named parameters with short string, number, boolean, or null values.',
            );
    }
    const db = new SQL.Database();
    const results = [];
    let statements = 0,
        bytes = 0;
    const bound = (value) => {
        const cell =
            value instanceof Uint8Array
                ? `[BLOB: ${value.length} bytes]`
                : typeof value === 'bigint'
                  ? value >= BigInt(Number.MIN_SAFE_INTEGER) &&
                    value <= BigInt(Number.MAX_SAFE_INTEGER)
                      ? Number(value)
                      : value.toString()
                  : value;
        const text = String(cell ?? '');
        if (text.length > 1000)
            throw Error('A result cell exceeds 1,000 characters.');
        bytes += new TextEncoder().encode(text).length + 16;
        if (bytes > 65536) throw Error('Result output exceeded 64 KiB.');
        return cell;
    };
    try {
        db.run('PRAGMA foreign_keys=ON;');
        db.run(seed);
        // SQLite's parser handles semicolons in strings and trigger bodies correctly.
        const iterator = db.iterateStatements(code);
        try {
            for (const statement of iterator) {
                if (++statements > 100)
                    throw Error('Limit: 100 statements per Run.');
                statement.bind(parameters);
                const columns = statement.getColumnNames().map(bound);
                if (columns.length > 30)
                    throw Error('Limit: 30 result columns.');
                const values = [];
                let truncated = false;
                while (statement.step()) {
                    if (values.length === 200) {
                        truncated = true;
                        break;
                    }
                    values.push(
                        statement.get(null, { useBigInt: true }).map(bound),
                    );
                }
                if (columns.length) {
                    if (results.length === 20)
                        throw Error('Limit: 20 result tables.');
                    results.push({ columns, values, truncated });
                }
            }
        } finally {
            // sql.js StatementIterator has no return(); drain remaining parsed
            // statements without executing them so its SQL buffer is released.
            for (let next = iterator.next(); !next.done; next = iterator.next())
                next.value.free();
        }
        const schema = db.exec(
            "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name LIMIT 51",
        )[0];
        if (schema?.values.length > 50)
            throw Error('Limit: 50 schema objects.');
        const objects = (schema?.values ?? []).map(([type, name, sql]) => ({
            type: bound(type),
            name: bound(name),
            sql: bound(sql),
        }));
        if (db.export().length > 4194304)
            throw Error('Practice database exceeds 4 MiB.');
        return { results, objects, statements };
    } finally {
        db.close();
    }
}
