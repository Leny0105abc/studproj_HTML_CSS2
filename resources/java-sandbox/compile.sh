#!/bin/bash
set -eu
if [ "${1:-}" != "bounded" ]; then
    exec timeout -k 1s 15s bash "$0" bounded
fi
mkdir -p guardclasses classes
timeout -k 1s 15s /usr/local/jdk17/bin/javac -J-Xmx96m -J-XX:ActiveProcessorCount=1 -proc:none -d guardclasses Guard.java
/usr/local/jdk17/bin/jar --create --file guard.jar -C guardclasses .
timeout -k 1s 15s /usr/local/jdk17/bin/javac -J-Xmx96m -J-XX:ActiveProcessorCount=1 -proc:none --release 17 -cp h2.jar:gson.jar -d classes Main.java
if [ "$(find classes -type f | wc -l)" -gt 256 ]; then
    printf 'Too many compiled classes (maximum 256).\n' >&2
    exit 1
fi
