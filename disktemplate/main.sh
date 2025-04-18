#!/bin/bash
docker build -t nestdocker .
docker export nestdocker > output.tar
truncate -s 1G ../public/disk
truncate -s +200M ../public/disk
mkfs.ext4 ../public/disk
MOUNT_DIR=$(mktemp -d)
sudo mount ../public/disk "$MOUNT_DIR"
sudo tar -C "$MOUNT_DIR" -xvf output.tar
sudo umount "$MOUNT_DIR"

echo "Compressing disk"
cat ../public/disk | pv | gzip > ../public/disk.gz
