# SchoolNestIDE build process
The schoolnest build process is all done in the Makefile. To run the makefile, make sure to have docker and WSL(Windows SubSystem for Linux) installed. Do not use any npm commands direclty to build the software, instead use the commands below.

## Commands
Run
- npm i
- make clean disk disk-larger run
You do not need root for any of these commands. If there are any errors the process, please create a github issue.

## Storage bucket integration
You may choose to use r2 integration. For this, you will (currently) need to go to /public/env.json and modify the baseUri property. 