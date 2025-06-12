#!/bin/bash
LP="$(echo -ne "$PWD" | base64);"
for arg in "$@"
do
    LP+="$(echo -ne "$arg" | base64);"
done
SRVSTREAM_PATH=/tmp/srvStream
if [ ! -e "$SRVSTREAM_PATH" ]
then
    SRVSTREAM_PATH=./srvstream
fi
exec 3>${SRVSTREAM_PATH}
echo "$LP" >&3
exec 3>&-
cat ${SRVSTREAM_PATH}
