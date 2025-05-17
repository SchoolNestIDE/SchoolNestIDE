FROM debian:stable

RUN apt-get update && echo dpkg --add-architecture x86_64 &&\ 
    apt-get update && \
    apt-get install pv gcc-x86-64-linux-gnu gcc-i686-linux-gnu protobuf-compiler bash sudo\
    p7zip-full wget g++-x86-64-linux-gnu g++-i686-linux-gnu gcc-multilib-i686-linux-gnu g++-multilib-i686-linux-gnu make -y
RUN dpkg --add-architecture i386 && apt-get update && apt-get install libprotobuf-dev:i386 -y
RUN mkdir /protobuf && wget -O /protobuf/protobuf.zip https://github.com/protocolbuffers/protobuf-javascript/releases/download/v3.21.4/protobuf-javascript-3.21.4-linux-$(arch).zip
RUN cd /protobuf && 7z x protobuf.zip && cp bin/protoc-gen-js /bin && chmod +x /bin/protoc-gen-js
WORKDIR /mnt

