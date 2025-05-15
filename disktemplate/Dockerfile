FROM i386/alpine
RUN apk update
RUN apk add --no-cache util-linux clang-extra-tools \
    wget openrc sudo nano vim g++ gcc \
    python3 py3-pip py3-virtualenv clang \
    nodejs git bash curl e2fsprogs
#RUN pip3 install venv
RUN adduser -D nest
WORKDIR /home/nest
#RUN git clone https://github.com/clangd/clangd
RUN echo 'nest:pass' | chpasswd 
COPY ./init /init
RUN chmod +x /init

CMD ["bash"]
