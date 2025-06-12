FROM i386/alpine
RUN apk update
RUN apk add util-linux pv squashfs-tools nodejs python3 bash py3-pip py3-virtualenv openjdk8 gcc g++ sudo xvfb-run fluxbox
COPY ./init /init
RUN chmod +x /init