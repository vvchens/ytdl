#!/bin/sh
docker stop you2mp3
docker rm you2mp3
docker run -v ./raw:/root/you2mp3/raw -v ./tmp:/root/you2mp3/tmp -v ./mp3:/root/you2mp3/mp3 -d -p 8889:8889 --restart=on-failure --name you2mp3 -w /root/you2mp3 --entrypoint npm vvchens/nodeserver:1.0.1 start
