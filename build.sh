#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

CONFIG_DIR="${DIR}/src/config"
PERSIST_DIR="${DIR}/src/persisted"
IMAGE="henchman-discord-bot"
NAME="henchman-discord-bot"
PARENT=`ip route show | grep docker0 | awk '{print \$9}'`

if [ ! -d "$CONFIG_DIR" ]; then
    sudo mkdir -p "$CONFIG_DIR"
    sudo chmod 777 "$CONFIG_DIR"
    sudo chown $USER "$CONFIG_DIR"
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
	--restart unless-stopped \
	--name "${NAME}" \
	--add-host parent:${PARENT} \
	-v ${CONFIG_DIR}:/code/henchman-discord-bot/bot/config \
	-v ${PERSIST_DIR}:/code/henchman-discord-bot/bot/persisted \
	-tdi \
	"${IMAGE}"
