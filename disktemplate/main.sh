#!/bin/bash
docker build -t nestdocker .
docker run -d -it --name nestdocker nestdocker
docker export nestdocker > output.tar
truncate -s 1G ../public/disk
truncate -s +200M ../public/disk
mkfs.ext4 ../public/disk
MOUNT_DIR=$(mktemp -d)
sudo mount ../public/disk "$MOUNT_DIR"
sudo tar -C "$MOUNT_DIR" -xvf output.tar
sudo g++ -m32 -static ../nest_client/*.cc -o "${MOUNT_DIR}/usr/bin/nest_client"
sudo umount "$MOUNT_DIR"

echo "Compressing disk"
cat ../public/disk | pv | gzip > ../public/disk.gz
