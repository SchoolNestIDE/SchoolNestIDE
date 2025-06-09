#!/bin/sh
set +x
/tmp/new-chroot/lib/ld-linux.so.2 --inhibit-cache --library-path /tmp/new-chroot/lib/i386-linux-gnu:/tmp/new-chroot/usr/lib/i386-linux-gnu /tmp/new-chroot/tmp/jdk/bin/$@