#!/bin/bash

sed  "s/((SIZE))/$(200)/" init_template > ./init
mkfs.ext4 ../public/disk
docker build --platform linux/i386 -t nestdocker --no-cache . 
docker run -d -it --name nestdocker nestdocker
docker export nestdocker > output.tar
MOUNT_DIR=$(mktemp -d)
if [ -z "$MOUNT_DIR" ]
then
    exit 0;
fi
sudo tar -C "$MOUNT_DIR" -xf output.tar

#make -C .. docker
sudo cp ./init "${MOUNT_DIR}"/init
sudo chmod +x "${MOUNT_DIR}"/init
sudo setcap "cap_sys_admin=ep" "$MOUNT_DIR"/bin/nest-client 
sudo cp ./run_as_nc.sh "${MOUNT_DIR}"/run_as_nc.sh
sudo cp ./run_in_chroot.sh "${MOUNT_DIR}"/bin/j17
sudo chmod +x "$MOUNT_DIR"/bin/j17
sudo cp ../jcomp/Main.sh "${MOUNT_DIR}"/usr/bin/j17_optimized
sudo chmod +x "${MOUNT_DIR}"/usr/bin/j17_optimized
sudo cp -v ../jcomp/FakeMain.class "${MOUNT_DIR}"/.
SUODERS="nest ALL=(ALL:ALL) ALL"
echo "$SUDOERS" | sudo tee -a "${MOUNT_DIR}"/etc/sudoers
echo "RUNNING SQUASHFS ${MOUNT_DIR}"
sudo mksquashfs "${MOUNT_DIR}"/ ../public/disk
sudo chmod +rwx ../public/disk
sudo rm -rf "${MOUNT_DIR}"
