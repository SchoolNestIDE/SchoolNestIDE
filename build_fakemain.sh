#!/bin/bash
apt-get update --allow-insecure-repositories && apt-get install openjdk-17-jdk-headless --no-install-recommends -y && javac /mnt/jcomp/FakeMain.java