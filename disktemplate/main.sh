#!/bin/bash
DOCKER_BUILDKIT=1 docker build --platform linux/i386 -t nestdocker .
docker run -d -it --name nestdocker nestdocker
docker export nestdocker > output.tar
truncate -s 1G ../public/disk
truncate -s +200M ../public/disk
mkfs.ext4 ../public/disk
MOUNT_DIR=$(mktemp -d)
sudo mount ../public/disk "$MOUNT_DIR"
sudo tar -C "$MOUNT_DIR" -xvf output.tar
make -C .. docker
sudo umount "$MOUNT_DIR"

echo "Compressing disk"
cat ../public/disk | pv | gzip > ../public/disk.gz
