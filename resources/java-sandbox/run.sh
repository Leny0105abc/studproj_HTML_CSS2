#!/bin/bash
set -eu
# Judge0/isolate enforces total CPU, memory, PID and file/output limits.
# An additional wall deadline also applies to the JVM.
exec timeout -k 1s 5s /usr/local/jdk17/bin/java -Xmx96m -XX:MaxMetaspaceSize=64m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:ActiveProcessorCount=1 -Djava.security.manager=codelab.Guard -Djava.security.policy==sandbox.policy -cp guard.jar:classes:h2.jar:gson.jar Main
