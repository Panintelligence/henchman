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
if [[ "$2" == "backup" ]]; then
	rm -rf backup-persisted
	docker cp ${NAME}:/code/henchman-discord-bot/bot/persisted .
	mv persisted/* backup-persisted
	rm -rf persisted
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
	"${IMAGE}"

if [[ "$2" == "backup" ]]; then
	cd backup-persisted
	docker exec ${NAME} mkdir -p /code/henchman-discord-bot/bot/persisted
	docker cp * ${NAME}:/code/henchman-discord-bot/bot/persisted
	docker restart ${NAME}
	cd ..
fi