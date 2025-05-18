#!/bin/bash
truncate -s 1G ../public/disk
truncate -s +200M ../public/disk
sed  "s/((SIZE))/$(stat -c"%s" ../public/disk)/" init_template > ./init
mkfs.ext4 ../public/disk
docker build --platform linux/i386 -t nestdocker .
docker run -d -it --name nestdocker nestdocker
docker export nestdocker > output.tar
MOUNT_DIR=$(mktemp -d)
mount ../public/disk "$MOUNT_DIR"
tar -C "$MOUNT_DIR" -xvf output.tar
#make -C .. docker
cp -rvf ../out/nest-client "${MOUNT_DIR}"/bin/nest-client
chown 0:0 "${MOUNT_DIR}"/bin/nest-client
setcap "cap_sys_admin=ep" "$MOUNT_DIR"/bin/nest-client 
cp ./run_as_nc.sh "${MOUNT_DIR}"/run_as_nc.sh
umount "$MOUNT_DIR"

echo "Compressing disk"
pv ../public/disk | gzip > ../public/disk.gz
