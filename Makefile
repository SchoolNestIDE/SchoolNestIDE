SRCS_C=nest_client/main.cc
SRCS_PROTO=nest_client/nest_client.proto
SRCS_PROTO_C=$(addprefix gen/,$(SRCS_PROTO:.proto=.pb.cc))
INCLUDE_DIRS=-Igen/
run: 
	npm run dev
download-linux-kernel:
	wget https://storage.googleapis.com/munydev.appspot.com/vmlinuz-virt -O public/vmlinuz-virt
prepare: download-linux-kernel
	mkdir -p gen
	mkdir -p out
	protoc $(SRCS_PROTO) --cpp_out=gen --js_out=import_style=commonjs,binary:gen 

compile: prepare
	i686-linux-gnu-g++ -static $(INCLUDE_DIRS) $(SRCS_C) $(SRCS_PROTO_C) -lprotobuf  -o out/nest-client
docker:
	docker build -t nest_client .
	docker run --privileged --rm -v $(shell pwd):/app nest_client make -C /app -f Makefile compile
disk: docker
	cd disktemplate && bash main.sh
	@echo "Created disk"
	cd ..
clean-disk:
	rm public/disk
	rm public/disk.gz
	rm disktemplate/output.tar
clean: clean-disk
