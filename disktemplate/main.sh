#!/bin/bash
docker build --platform linux/i386 -t nestdocker .
docker run -d -it --name nestdocker nestdocker
docker export nestdocker > output.tar
truncate -s 1G ../public/disk
truncate -s +200M ../public/disk
mkfs.ext4 ../public/disk
MOUNT_DIR=$(mktemp -d)
sudo mount ../public/disk "$MOUNT_DIR"
sudo tar -C "$MOUNT_DIR" -xvf output.tar
#make -C .. docker
sudo cp -rvf ../out/nest-client "${MOUNT_DIR}"/bin/nest-client
sudo chown 0:0 "${MOUNT_DIR}"/bin/nest-client
sudo setcap "cap_sys_admin=ep" "$MOUNT_DIR"/bin/nest-client 
sudo cp ./run_as_nc.sh "${MOUNT_DIR}"/run_as_nc.sh
sudo umount "$MOUNT_DIR"

echo "Compressing disk"
cat ../public/disk | pv | gzip > ../public/disk.gz
