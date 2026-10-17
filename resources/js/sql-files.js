// These are Emscripten memory files only, never mounted application or host files.
export function limitVirtualFiles(SQL) {
    const { FS, MEMFS } = SQL.codelabVirtualFiles ?? {};
    if (!FS || !MEMFS)
        throw Error('SQLite virtual file limits are unavailable.');
    const allocations = new Map();
    let total = 0,
        writes = 0;
    const reserve = (node, size) => {
        if (!Number.isSafeInteger(size) || size < 0 || size > 4194304)
            throw Error('Practice virtual file exceeds 4 MiB.');
        if (!allocations.has(node) && allocations.size >= 128)
            throw Error('Too many practice virtual files.');
        const old = allocations.get(node) ?? 0;
        const extra = Math.max(0, size - old);
        if (total + extra > 16777216)
            throw Error('Practice virtual file growth exceeds 16 MiB.');
        total += extra;
        allocations.set(node, Math.max(old, size));
    };
    for (const key of ['expandFileStorage', 'resizeFileStorage']) {
        const original = MEMFS[key];
        MEMFS[key] = (node, size) => {
            reserve(node, size);
            return original(node, size);
        };
    }
    const original = MEMFS.stream_ops.write;
    MEMFS.stream_ops.write = (
        stream,
        buffer,
        offset,
        length,
        position,
        canOwn,
    ) => {
        if (++writes > 20000) throw Error('Too many virtual file writes.');
        reserve(stream.node, position + length);
        return original(stream, buffer, offset, length, position, canOwn);
    };
    // Verification reuses a module for speed. Browser Runs always use new workers.
    return () => {
        allocations.clear();
        total = 0;
        writes = 0;
    };
}
