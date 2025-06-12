#!/bin/bash

# <port> <command>
run_as_nc(){
    busybox nc -lk -p "$1" -e $2
}