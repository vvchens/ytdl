#!/bin/sh
npm i
version=`node -e "console.log(JSON.parse(fs.readFileSync('package.json').toString()).version)"`
docker build . -t vvchens/nodeserver:$version
docker push -a vvchens/nodeserver