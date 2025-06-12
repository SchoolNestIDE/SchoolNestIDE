#!/bin/bash
set -e
sed  "s/((SIZE))/$(stat -c"%s" ../public/disk)/" init_template > ./init
docker build --platform linux/i386 -t nestdocker_larger .
docker run -d -it --name nestdocker_larger nestdocker_larger
docker export nestdocker_larger > output.tar
MOUNT_DIR=$(mktemp -d)

tar2sqfs --compressor zstd  ../public/disk.larger < output.tar
