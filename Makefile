SRCS_C=nest_client/main.cc
SRCS_PROTO=nest_client/nest_client.proto
SRCS_PROTO_C=$(addprefix gen/,$(SRCS_PROTO:.proto=.pb.cc))
INCLUDE_DIRS=-Igen/
run: 
	npm run dev

prepare:
	mkdir -p gen
	protoc $(SRCS_PROTO) --cpp_out=gen --js_out=import_style=commonjs,binary:gen 

compile: prepare
	g++ -static $(INCLUDE_DIRS) $(SRCS_C) $(SRCS_PROTO_C) -lprotobuf  -o md
