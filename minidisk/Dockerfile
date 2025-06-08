FROM i386/alpine
RUN apk update
RUN apk add util-linux pv squashfs-tools python3 py3-pip py3-virtualenv openjdk8 clang sudo
COPY ./init /init
RUN chmod +x /init