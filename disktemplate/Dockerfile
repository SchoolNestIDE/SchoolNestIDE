FROM i386/debian
RUN apt-get update
RUN apt-get install  util-linux clangd wget openrc busybox clang clang python3 \
    openjdk-17-jdk sudo iproute2 p7zip-full -y
#RUN pip3 install venv
RUN useradd -ms /bin/bash nest
WORKDIR /home/nest
#RUN git clone https://github.com/clangd/clangd
RUN echo 'nest:pass' | chpasswd 
COPY ./init /init
RUN chmod +x /init

CMD ["bash"]
