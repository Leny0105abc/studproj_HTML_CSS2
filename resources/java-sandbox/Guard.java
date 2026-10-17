package codelab;

import java.io.File;
import java.io.FileDescriptor;
import java.nio.file.*;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.HashSet;
import java.util.Set;

// Java 17 defense in depth inside Judge0's OS sandbox, not a replacement for it.
// Kept in its own trusted jar, first on the classpath and immutable at runtime.
@SuppressWarnings("removal")
public final class Guard extends SecurityManager {
    private static final String ROOT = new File(System.getProperty("user.dir")).getAbsolutePath();
    private static final Set<String> WRITTEN = new HashSet<>();
    private static final Set<String> LOCKED = Set.of("Main.java", "Guard.java", "guard.jar", "sandbox.policy", "compile.sh", "run.sh", "h2.jar", "gson.jar");

    public Guard() {
        super();
        try (var files = Files.walk(Path.of(ROOT))) {
            long size = files.filter(Files::isRegularFile).mapToLong(path -> {
                try { return Files.size(path); } catch (java.io.IOException error) { throw new SecurityException("Invalid workspace."); }
            }).sum();
            // Initial immutable sources/libraries/classes <=8 MiB, then at most
            // 128 writable paths *64 KiB enforced by isolate: <=16 MiB total.
            if (size > 8L * 1024 * 1024) throw new SecurityException("Initial workspace exceeds 8 MiB.");
        } catch (java.io.IOException error) { throw new SecurityException("Cannot inspect temporary workspace."); }
    }

    private static synchronized void writable(String file) {
        AccessController.doPrivileged((PrivilegedAction<Void>) () -> {
            try {
                String canonical = new File(file).getCanonicalPath();
                if (!canonical.startsWith(ROOT + File.separator)) throw new SecurityException("Files must stay in the temporary workspace.");
                String relative = canonical.substring(ROOT.length() + 1);
                String first = relative.split("/", 2)[0];
                if (LOCKED.contains(first) || first.equals("classes") || first.equals("guardclasses")) throw new SecurityException("Runtime and source files are read-only during execution.");
                if (!WRITTEN.contains(canonical) && WRITTEN.size() >= 128) throw new SecurityException("Temporary file creation limit exceeded (128 paths).");
                WRITTEN.add(canonical);
                return null;
            } catch (java.io.IOException error) {
                throw new SecurityException("Invalid temporary path.");
            }
        });
    }

    @Override public void checkWrite(String file) { super.checkWrite(file); writable(file); }
    @Override public void checkDelete(String file) { super.checkDelete(file); writable(file); }
    @Override public void checkExec(String command) { throw new SecurityException("Shell and child processes are disabled."); }
    @Override public void checkLink(String library) { throw new SecurityException("Loading native libraries is disabled."); }
    @Override public void checkConnect(String host, int port) { throw new SecurityException("External networking is disabled."); }
    @Override public void checkConnect(String host, int port, Object context) { throw new SecurityException("External networking is disabled."); }
    @Override public void checkListen(int port) { throw new SecurityException("Network servers are disabled."); }
    @Override public void checkAccept(String host, int port) { throw new SecurityException("External networking is disabled."); }
}
