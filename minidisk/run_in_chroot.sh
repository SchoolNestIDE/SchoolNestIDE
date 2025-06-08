#!/bin/sh
set +x
DIR_TO_BINDMOUNT=${PWD}
cp /in_chroot.sh /tmp/new-chroot/tmp/.

unshare -Ur -R /tmp/new-chroot env - LD_LIBRARY_PATH=/tmp/jdk/lib  PATH=$PATH:/tmp/jdk/bin  /tmp/jdk/bin/$@
