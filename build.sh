#!/bin/bash

CONFIG_DIR="/var/discordbot"
IMAGE="henchman-discord-bot"
NAME="henchman-discord-bot"
PARENT=`ip route show | grep docker0 | awk '{print \$9}'`

if [ ! -d "$CONFIG_DIR" ]; then
    sudo mkdir -p "$CONFIG_DIR"
    sudo chmod 777 "$CONFIG_DIR"
    sudo chown $USER "$CONFIG_DIR"
fi

# In case you don't have volumes set up
if [[ "$1" == "rebuild" ]] || [[ "$1" == "rebuildall" ]]; then
	docker cp ${NAME}:/code/henchman-discord-bot/bot/owed.json .
	docker cp ${NAME}:/code/henchman-discord-bot/bot/owes.json .
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

cp -r ./src/* "$CONFIG_DIR/bot"

docker run \
	--restart unless-stopped \
	--name "${NAME}" \
	--add-host parent:${PARENT} \
	-v ${CONFIG_DIR}:/code/henchman-builder-bot \
	-tdi \
	"${IMAGE}" "$2"
