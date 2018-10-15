#!/bin/bash

CONFIG_DIR="/var/discordbot"
IMAGE="discord-builder-bot"
NAME="discord-builder-bot"
PARENT=`ip route show | grep docker0 | awk '{print \$9}'`

if [ ! -d "$CONFIG_DIR" ]; then
    sudo mkdir -p "$CONFIG_DIR"
fi

if [[ "$1" == "rebuild" ]]; then
  docker stop "${NAME}" && docker rm "${NAME}"
fi

if [[ "$1" == "rebuildall" ]]; then
  docker stop "${NAME}" && docker rm "${NAME}"
  docker rmi "${IMAGE}"
fi

HAS_IMAGE=`docker images | grep ${IMAGE}`
if [[ "$HAS_IMAGE" == "" ]]; then
	docker build -t ${IMAGE} .
fi

docker run \
	--name "${NAME}" \
	--add-host parent:${PARENT} \
	-v ${CONFIG_DIR}:/code/discord-builder-bot \
	-tdi \
	"${IMAGE}" "$2"
