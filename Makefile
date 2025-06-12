SRCS_C=nest_client/main.cc
SRCS_PROTO=nest_client/nest_client.proto
SRCS_PROTO_C=$(addprefix gen/,$(SRCS_PROTO:.proto=.pb.cc))
INCLUDE_DIRS=-Igen/
VSCODE_COMMIT=848b80aeb52026648a8ff9f7c45a9b0a80641e2e
VSCODE_QUALITY=stable
HOST=localhost:3000
URL=https://update.code.visualstudio.com/commit:$(VSCODE_COMMIT)/web-standalone/$(VSCODE_QUALITY)
run: 
	npm run dev
disk-only:
	cd minidisk && bash main.sh	
prepare:
	mkdir -p gen
	mkdir -p out

compile: prepare
	echo "not using protobuf"
docker:
	docker build -t nest_client .
	docker run --privileged --rm -v $(shell pwd):/app nest_client make -C /app -f Makefile compile
larger-disk:
	cd highlyminimaljava && bash main.sh
	@echo "Crafted larger disk, stored in compressed tar"
disk: build_jcompserver docker
	cd minidisk && bash main.sh
	@echo "Created disk"
	cd ..
clean-disk:
	rm -f public/disk || :
	rm -f public/disk.gz || :
	rm -f minidisk/output.tar || :
	rm -f highlyminimaljava/output.tar || :
	rm -f public/output.tar.gz || :
	rm -f public/disk.larger* || :
	docker container stop -t 0 nestdocker_larger  && docker rm nestdocker_larger || :
	docker rmi nestdocker_larger || :
	docker container stop -t 0 nestdocker  && docker rm nestdocker || :
	docker rmi nestdocker || :
build_jcompserver:
	 docker run -v .:/mnt -it --rm i386/debian:bullseye-slim /mnt/build_fakemain.sh
clean: clean-disk
public/vscode:
	wget "$(URL)" -O /tmp/vsc.zip
	7z x /tmp/vsc.zip 
clean-full: clean
	sudo rm -rf gen/
	sudo rm -rf out/
	sudo rm -rf node_modules/

cleanFull: clean-full
